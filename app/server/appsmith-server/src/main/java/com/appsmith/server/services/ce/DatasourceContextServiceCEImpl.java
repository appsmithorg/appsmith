package com.appsmith.server.services.ce;

import com.appsmith.external.constants.PluginConstants;
import com.appsmith.external.dtos.ExecutePluginDTO;
import com.appsmith.external.dtos.RemoteDatasourceDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.UpdatableConnection;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.DatasourceContext;
import com.appsmith.server.domains.DatasourceContextIdentifier;
import com.appsmith.server.domains.DatasourcePluginContext;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.solutions.DatasourcePermission;
import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.google.common.cache.RemovalListener;
import com.google.common.cache.RemovalNotification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
public class DatasourceContextServiceCEImpl implements DatasourceContextServiceCE {

    // DatasourceContextIdentifier contains datasourceId & environmentId which is mapped to DatasourceContext
    protected final Map<DatasourceContextIdentifier, Mono<DatasourceContext<Object>>> datasourceContextMonoMap;
    protected final Map<DatasourceContextIdentifier, Object> datasourceContextSynchronizationMonitorMap;
    protected final Map<DatasourceContextIdentifier, DatasourceContext<?>> datasourceContextMap;

    /**
     * This cache is used to store the datasource context for a limited time and then destroy the least recently used
     * connection.The cleanup process is performed after every 2 hours.
     * The purpose of this is to prevent the large number of open dangling connections to the movies mockDB.
     * The removalListener method is called when the connection is removed from the cache.
     */
    protected final Cache<DatasourceContextIdentifier, DatasourcePluginContext> datasourcePluginContextMapLRUCache =
            CacheBuilder.newBuilder()
                    .removalListener(createRemovalListener())
                    .expireAfterAccess(2, TimeUnit.HOURS)
                    .build();

    private final DatasourceService datasourceService;
    private final DatasourceStorageService datasourceStorageService;
    private final PluginService pluginService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final ConfigService configService;
    private final DatasourcePermission datasourcePermission;

    private final AppsmithException TOO_MANY_REQUESTS_EXCEPTION =
            new AppsmithException(AppsmithError.TOO_MANY_FAILED_DATASOURCE_CONNECTION_REQUESTS);

    @Autowired
    public DatasourceContextServiceCEImpl(
            @Lazy DatasourceService datasourceService,
            DatasourceStorageService datasourceStorageService,
            PluginService pluginService,
            PluginExecutorHelper pluginExecutorHelper,
            ConfigService configService,
            DatasourcePermission datasourcePermission) {
        this.datasourceService = datasourceService;
        this.datasourceStorageService = datasourceStorageService;
        this.pluginService = pluginService;
        this.pluginExecutorHelper = pluginExecutorHelper;
        this.datasourceContextMap = new ConcurrentHashMap<>();
        this.datasourceContextMonoMap = new ConcurrentHashMap<>();
        this.datasourceContextSynchronizationMonitorMap = new ConcurrentHashMap<>();
        this.configService = configService;
        this.datasourcePermission = datasourcePermission;
    }

    private RemovalListener<DatasourceContextIdentifier, DatasourcePluginContext> createRemovalListener() {
        return (RemovalNotification<DatasourceContextIdentifier, DatasourcePluginContext> removalNotification) -> {
            handleRemoval(removalNotification);
        };
    }

    private void handleRemoval(
            RemovalNotification<DatasourceContextIdentifier, DatasourcePluginContext> removalNotification) {
        final DatasourceContextIdentifier datasourceContextIdentifier = removalNotification.getKey();
        final DatasourcePluginContext datasourcePluginContext = removalNotification.getValue();

        log.debug(
                "Removing Datasource Context from cache and closing the open connection for DatasourceId: {} and environmentId: {}",
                datasourceContextIdentifier.getDatasourceId(),
                datasourceContextIdentifier.getEnvironmentId());

        // Close connection and remove entry from both cache maps
        final Object connection =
                datasourceContextMap.get(datasourceContextIdentifier).getConnection();

        Mono<Plugin> pluginMono =
                pluginService.findById(datasourcePluginContext.getPluginId()).cache();
        if (connection != null) {
            try {
                pluginExecutorHelper
                        .getPluginExecutor(pluginMono)
                        .flatMap(
                                pluginExecutor -> Mono.fromRunnable(() -> pluginExecutor.datasourceDestroy(connection)))
                        .onErrorResume(e -> {
                            log.error("Error destroying stale datasource connection", e);
                            return Mono.empty();
                        })
                        .subscribe(); // Trigger the execution
            } catch (Exception e) {
                log.info(Thread.currentThread().getName() + ": Error destroying stale datasource connection", e);
            }
        }
        // Remove the entries from both maps
        datasourceContextMonoMap.remove(datasourceContextIdentifier);
        datasourceContextMap.remove(datasourceContextIdentifier);
    }

    private Mono<Boolean> checkIsMockMongoDatasource(Plugin plugin, DatasourceStorage datasourceStorage) {
        String datasourceId = datasourceStorage.getDatasourceId();
        if (datasourceId == null) {
            return Mono.just(FALSE);
        }

        return datasourceService
                .findById(datasourceId)
                .map(datasource -> {
                    if (datasource.getIsMock()
                            && PluginConstants.PackageName.MONGO_PLUGIN.equals(plugin.getPackageName())) {
                        log.info("Datasource is a mock mongo datasource");
                        return TRUE;
                    }
                    return FALSE;
                })
                .defaultIfEmpty(FALSE); // In case findById returns empty (i.e., no datasource found)
    }

    /**
     * This method defines a critical section that can be executed only by one thread at a time per datasource id - i
     * .e. if two threads want to create datasource for different datasource ids then they would not be synchronized.
     * Earlier multiple threads could subscribe to a publisher that created connection to a datasource - which
     * resulted in a data race condition resulting in multiple orphan connections.
     * Ref: https://github.com/appsmithorg/appsmith/issues/14117
     * This method caches the result from the source publisher and forces concurrent subscriptions to re-use the cached
     * value. Hence, even if multiple threads subscribe to the same source publisher they get the pre-computed cached
     * value instead of creating a new connection for each subscription of the source publisher.
     *
     * @param datasourceStorage           - datasource storage for which a new datasource context / connection needs to be created
     * @param plugin
     * @param pluginExecutor              - plugin executor associated with the datasource's plugin
     * @param monitor                     - unique monitor object per datasource id. Lock is acquired on this monitor object.
     * @param datasourceContextIdentifier - key for the datasourceContextMaps.
     * @return a cached source publisher which upon subscription produces / returns the latest datasource context /
     * connection.
     */
    public Mono<DatasourceContext<Object>> getCachedDatasourceContextMono(
            DatasourceStorage datasourceStorage,
            Plugin plugin,
            PluginExecutor<Object> pluginExecutor,
            Object monitor,
            DatasourceContextIdentifier datasourceContextIdentifier) {

        return Mono.fromCallable(() -> {
                    synchronized (monitor) {
                        /* Destroy any connection that is stale or in error state to free up resource */
                        final boolean isStale = getIsStale(datasourceStorage, datasourceContextIdentifier);
                        final boolean isInErrorState = getIsInErrorState(datasourceContextIdentifier);

                        if (isStale || isInErrorState) {
                            final Object connection = datasourceContextMap
                                    .get(datasourceContextIdentifier)
                                    .getConnection();
                            if (connection != null) {
                                try {
                                    // Basically remove entry from both cache maps
                                    pluginExecutor.datasourceDestroy(connection);
                                } catch (Exception e) {
                                    log.info(
                                            Thread.currentThread().getName()
                                                    + ": Error destroying stale datasource connection",
                                            e);
                                }
                            }
                            datasourceContextMonoMap.remove(datasourceContextIdentifier);
                            datasourceContextMap.remove(datasourceContextIdentifier);
                            log.info(
                                    "Invalidating the LRU cache entry for datasource id {}, environment id {} as the connection is stale or in error state",
                                    datasourceContextIdentifier.getDatasourceId(),
                                    datasourceContextIdentifier.getEnvironmentId());
                            datasourcePluginContextMapLRUCache.invalidate(datasourceContextIdentifier);
                        }

                        /*
                         * If a publisher with cached value already exists then return it. Please note that even if this publisher is
                         * evaluated multiple times the actual datasource creation will only happen once and get cached and the same
                         * value would directly be returned to further evaluations / subscriptions.
                         */
                        if (datasourceContextIdentifier.getDatasourceId() != null
                                && datasourceContextMonoMap.get(datasourceContextIdentifier) != null) {
                            log.debug(
                                    Thread.currentThread().getName()
                                            + ": Cached resource context mono exists for datasource id {}, environment id {}. Returning the same.",
                                    datasourceContextIdentifier.getDatasourceId(),
                                    datasourceContextIdentifier.getEnvironmentId());
                            log.debug("Accessing the LRU cache to update the last accessed time");
                            datasourcePluginContextMapLRUCache.getIfPresent(datasourceContextIdentifier);
                            return datasourceContextMonoMap.get(datasourceContextIdentifier);
                        }

                        /* Create a fresh datasource context */
                        DatasourceContext<Object> datasourceContext = new DatasourceContext<>();
                        Mono<Object> connectionMonoCache = pluginExecutor
                                .datasourceCreate(datasourceStorage.getDatasourceConfiguration())
                                .cache();

                        Mono<DatasourceContext<Object>> datasourceContextMonoCache = connectionMonoCache
                                .flatMap(connection ->
                                        updateDatasourceAndSetAuthentication(connection, datasourceStorage))
                                .map(connection -> {
                                    /* When a connection object exists and makes sense for the plugin, we put it in the
                                    context. Example, DB plugins. */
                                    datasourceContext.setConnection(connection);
                                    return datasourceContext;
                                })
                                .defaultIfEmpty(
                                        /* When a connection object doesn't make sense for the plugin, we get an empty mono
                                        and we just return the context object as is. */
                                        datasourceContext)
                                .cache(); /* Cache the value so that further evaluations don't result in new connections */

                        Mono<Boolean> checkIsMockMongoDatasourceMono =
                                checkIsMockMongoDatasource(plugin, datasourceStorage);
                        return Mono.zip(checkIsMockMongoDatasourceMono, connectionMonoCache)
                                .flatMap(tuple -> {
                                    Boolean isMockMongoDatasource = tuple.getT1();
                                    Object connection = tuple.getT2();
                                    datasourceContext.setConnection(connection);
                                    if (datasourceContextIdentifier.isKeyValid()
                                            && shouldCacheContextForThisPlugin(plugin)) {
                                        datasourceContextMap.put(datasourceContextIdentifier, datasourceContext);
                                        datasourceContextMonoMap.put(
                                                datasourceContextIdentifier, datasourceContextMonoCache);

                                        if (isMockMongoDatasource) {
                                            DatasourcePluginContext<Object> datasourcePluginContext =
                                                    new DatasourcePluginContext<>();
                                            datasourcePluginContext.setConnection(datasourceContext.getConnection());
                                            datasourcePluginContext.setPluginId(plugin.getId());
                                            datasourcePluginContextMapLRUCache.put(
                                                    datasourceContextIdentifier, datasourcePluginContext);
                                        }
                                    }
                                    return datasourceContextMonoCache;
                                });
                    }
                })
                .flatMap(obj -> obj)
                .subscribeOn(Schedulers.boundedElastic());
    }

    /**
     * determines whether we should cache context for given plugin
     * it gives false if plugin is rest-api or graph-ql
     * @param plugin
     * @return
     */
    public boolean shouldCacheContextForThisPlugin(Plugin plugin) {
        // !(a || b) => (!a) & (!b)
        return !PluginConstants.PackageName.REST_API_PLUGIN.equals(plugin.getPackageName())
                && !PluginConstants.PackageName.GRAPHQL_PLUGIN.equals(plugin.getPackageName());
    }

    public Mono<Object> updateDatasourceAndSetAuthentication(Object connection, DatasourceStorage datasourceStorage) {
        Mono<DatasourceStorage> datasourceStorageMono = Mono.just(datasourceStorage);
        if (connection instanceof UpdatableConnection updatableConnection) {
            datasourceStorage.setUpdatedAt(Instant.now());
            datasourceStorage
                    .getDatasourceConfiguration()
                    .setAuthentication(updatableConnection.getAuthenticationDTO(
                            datasourceStorage.getDatasourceConfiguration().getAuthentication()));
            datasourceStorageMono = datasourceStorageService.updateDatasourceStorage(
                    datasourceStorage, datasourceStorage.getEnvironmentId(), FALSE, false);
        }
        return datasourceStorageMono.thenReturn(connection);
    }

    protected Mono<DatasourceContext<Object>> createNewDatasourceContext(
            DatasourceStorage datasourceStorage, DatasourceContextIdentifier datasourceContextIdentifier) {
        log.debug("Datasource context doesn't exist. Creating connection.");
        Mono<Plugin> pluginMono =
                pluginService.findById(datasourceStorage.getPluginId()).cache();

        return pluginMono
                .zipWith(pluginExecutorHelper.getPluginExecutor(pluginMono))
                .flatMap(tuple2 -> {
                    Plugin plugin = tuple2.getT1();
                    PluginExecutor<Object> pluginExecutor = tuple2.getT2();

                    return getDatasourceContextMono(
                            datasourceStorage, datasourceContextIdentifier, plugin, pluginExecutor);
                });
    }

    private Mono<DatasourceContext<Object>> getDatasourceContextMono(
            DatasourceStorage datasourceStorage,
            DatasourceContextIdentifier datasourceContextIdentifier,
            Plugin plugin,
            PluginExecutor<Object> pluginExecutor) {

        return Mono.fromCallable(() -> {

                    /**
                     * Keep one monitor object against each datasource id. The synchronized method
                     * `getCachedDatasourceContextMono` would then acquire lock on the monitor object which is unique
                     * for each datasourceId hence ensuring that if competing threads want to create datasource context
                     * on different datasource id then they are not blocked on each other and can run concurrently.
                     * Only threads that want to create a new datasource context on the same datasource id would be
                     * synchronized.
                     */
                    Object monitor = new Object();
                    if (datasourceContextIdentifier.isKeyValid()) {
                        if (datasourceContextSynchronizationMonitorMap.get(datasourceContextIdentifier) == null) {
                            synchronized (this) {
                                log.debug(
                                        Thread.currentThread().getName()
                                                + ": Creating monitor for datasource id {}, environment id {}",
                                        datasourceContextIdentifier.getDatasourceId(),
                                        datasourceContextIdentifier.getEnvironmentId());
                                datasourceContextSynchronizationMonitorMap.computeIfAbsent(
                                        datasourceContextIdentifier, k -> new Object());
                            }
                        }

                        monitor = datasourceContextSynchronizationMonitorMap.get(datasourceContextIdentifier);
                    }

                    return getCachedDatasourceContextMono(
                            datasourceStorage, plugin, pluginExecutor, monitor, datasourceContextIdentifier);
                })
                .flatMap(obj -> obj)
                .subscribeOn(Schedulers.boundedElastic());
    }

    public boolean getIsStale(
            DatasourceStorage datasourceStorage, DatasourceContextIdentifier datasourceContextIdentifier) {
        String datasourceId = datasourceStorage.getDatasourceId();
        return datasourceId != null
                && datasourceContextMap.get(datasourceContextIdentifier) != null
                && datasourceStorage.getUpdatedAt() != null
                && datasourceStorage
                        .getUpdatedAt()
                        .isAfter(datasourceContextMap
                                .get(datasourceContextIdentifier)
                                .getCreationTime());
    }

    /**
     * This function checks if the cached datasource context mono is in error state
     *
     * @param datasourceContextIdentifier
     * @return boolean
     */
    private boolean getIsInErrorState(DatasourceContextIdentifier datasourceContextIdentifier) {
        return datasourceContextMonoMap.get(datasourceContextIdentifier) != null
                && datasourceContextMonoMap
                        .get(datasourceContextIdentifier)
                        .toFuture()
                        .isCompletedExceptionally();
    }

    public boolean isValidDatasourceContextAvailable(
            DatasourceStorage datasourceStorage, DatasourceContextIdentifier datasourceContextIdentifier) {
        boolean isStale = getIsStale(datasourceStorage, datasourceContextIdentifier);
        boolean isInErrorState = getIsInErrorState(datasourceContextIdentifier);
        return datasourceContextMap.get(datasourceContextIdentifier) != null
                // The following condition happens when there's a timeout in the middle of destroying a connection and
                // the reactive flow interrupts, resulting in the destroy operation not completing.
                && datasourceContextMap.get(datasourceContextIdentifier).getConnection() != null
                && !isStale
                && !isInErrorState;
    }

    @Override
    public Mono<DatasourceContext<?>> getDatasourceContext(DatasourceStorage datasourceStorage) {
        final String datasourceId = datasourceStorage.getDatasourceId();
        DatasourceContextIdentifier datasourceContextIdentifier =
                this.initializeDatasourceContextIdentifier(datasourceStorage);
        if (datasourceId == null) {
            log.debug(
                    "This is a dry run or an embedded datasourceStorage. The datasourceStorage context would not exist in this "
                            + "scenario");
        } else {
            if (isValidDatasourceContextAvailable(datasourceStorage, datasourceContextIdentifier)) {
                log.debug("Resource context exists. Returning the same.");
                log.debug("Accessing the LRU cache to update the last accessed time");
                datasourcePluginContextMapLRUCache.getIfPresent(datasourceContextIdentifier);
                return Mono.just(datasourceContextMap.get(datasourceContextIdentifier));
            }
        }

        // As per https://github.com/appsmithorg/appsmith/issues/27745, Rate Limiting needs to applied
        // on connection failure, otherwise brute force attacks may happen and our IP may get blocked
        // For connection creation, the assumption is that whenever connection creation fails error
        // is thrown by respective plugin, following plugins throw error: Postgres, Oracle, Mssql and Redshift
        // For other plugins like MySQL, SMTP, Elastic Search, ArangoDB, Redis, In createNewDatasourceContext,
        // Instead of connection, connection pool is created, connection is created when we query execution happens
        // Hence cannot add rate limiting for these plugins here. Rate limiting for plugins which create connection pool
        // should be handled separately, refer https://github.com/appsmithorg/appsmith/issues/28259

        // Note: Plugins that throw error may be using connection pool mechanism but in such cases, connection is
        // created
        // right away, where as for other plugins with connection pool, connection is created at a later time, when
        // query execution happens
        return datasourceService
                .isEndpointBlockedForConnectionRequest(datasourceStorage)
                .flatMap(isBlocked -> {
                    if (isBlocked) {
                        log.debug("Datasource is blocked for connection request");
                        return Mono.error(TOO_MANY_REQUESTS_EXCEPTION);
                    } else {
                        return createNewDatasourceContext(datasourceStorage, datasourceContextIdentifier)
                                .onErrorResume(AppsmithPluginException.class, error -> {
                                    return datasourceService
                                            .consumeTokenIfAvailable(datasourceStorage)
                                            .flatMap(wasTokenAvailable -> {
                                                if (!wasTokenAvailable) {
                                                    // This will block the datasource connection for next 5 minutes, as
                                                    // bucket has been exhausted, and return too many requests response
                                                    return datasourceService
                                                            .blockEndpointForConnectionRequest(datasourceStorage)
                                                            .flatMap(isAdded -> {
                                                                if (isAdded) {
                                                                    return Mono.error(TOO_MANY_REQUESTS_EXCEPTION);
                                                                } else {
                                                                    return Mono.error(
                                                                            new AppsmithException(
                                                                                    AppsmithError
                                                                                            .DATASOURCE_CONNECTION_RATE_LIMIT_BLOCKING_FAILED));
                                                                }
                                                            });
                                                }
                                                return Mono.error(error);
                                            });
                                });
                    }
                });
    }

    @Override
    public <T> Mono<T> retryOnce(DatasourceStorage datasourceStorage, Function<DatasourceContext<?>, Mono<T>> task) {

        final Mono<T> taskRunnerMono = Mono.justOrEmpty(datasourceStorage)
                .flatMap(this::getDatasourceContext)
                // Now that we have the context (connection details), call the task.
                .flatMap(task);

        return taskRunnerMono.onErrorResume(StaleConnectionException.class, error -> {
            log.info("Looks like the connection is stale. Retrying with a fresh context.");
            return deleteDatasourceContext(datasourceStorage).then(taskRunnerMono);
        });
    }

    /**
     * removes the datasource context entry from the contextMaps. may return an empty mono
     * @param datasourceStorage
     * @return removed datasourceContext
     */
    @Override
    public Mono<DatasourceContext<?>> deleteDatasourceContext(DatasourceStorage datasourceStorage) {

        DatasourceContextIdentifier datasourceContextIdentifier =
                initializeDatasourceContextIdentifier(datasourceStorage);
        if (!datasourceContextIdentifier.isKeyValid()) {
            return Mono.empty();
        }

        DatasourceContext<?> datasourceContext = datasourceContextMap.get(datasourceContextIdentifier);
        if (datasourceContext == null) {
            // No resource context exists for this resource. Return void.
            return Mono.empty();
        }
        return pluginExecutorHelper
                .getPluginExecutor(pluginService.findById(datasourceStorage.getPluginId()))
                .flatMap(pluginExecutor -> {
                    log.info("Clearing datasource context for datasource storage ID {}.", datasourceStorage.getId());
                    pluginExecutor.datasourceDestroy(datasourceContext.getConnection());
                    datasourceContextMonoMap.remove(datasourceContextIdentifier);
                    log.info(
                            "Invalidating the LRU cache entry for datasource id {}, environment id {} as delete datasource context is invoked",
                            datasourceContextIdentifier.getDatasourceId(),
                            datasourceContextIdentifier.getEnvironmentId());
                    datasourcePluginContextMapLRUCache.invalidate(datasourceContextIdentifier);
                    if (!datasourceContextMap.containsKey(datasourceContextIdentifier)) {
                        log.info(
                                "datasourceContextMap does not contain any entry for datasource storage with id: {} ",
                                datasourceStorage.getId());
                        return Mono.empty();
                    }

                    return Mono.just(datasourceContextMap.remove(datasourceContextIdentifier));
                });
    }

    /**
     * Provides datasource context for execution
     *
     * @param datasourceStorage
     * @param plugin
     * @return datasourceContextMono
     */
    @Override
    public Mono<DatasourceContext<?>> getDatasourceContext(DatasourceStorage datasourceStorage, Plugin plugin) {
        if (plugin.isRemotePlugin()) {
            return this.getRemoteDatasourceContext(plugin, datasourceStorage);
        }
        return this.getDatasourceContext(datasourceStorage);
    }

    // We can afford to make this call all the time since we already have all the info we need in context
    @Override
    public Mono<DatasourceContext<?>> getRemoteDatasourceContext(Plugin plugin, DatasourceStorage datasourceStorage) {
        final DatasourceContext<ExecutePluginDTO> datasourceContext = new DatasourceContext<>();

        return configService.getInstanceId().map(instanceId -> {
            ExecutePluginDTO executePluginDTO = new ExecutePluginDTO();
            executePluginDTO.setInstallationKey(instanceId);
            executePluginDTO.setPluginName(plugin.getPluginName());
            executePluginDTO.setPluginVersion(plugin.getVersion());
            executePluginDTO.setDatasource(new RemoteDatasourceDTO(
                    datasourceStorage.getDatasourceId(), datasourceStorage.getDatasourceConfiguration()));
            datasourceContext.setConnection(executePluginDTO);

            return datasourceContext;
        });
    }

    /**
     * Generates the custom key that is used in:
     * datasourceContextMap
     * datasourceContextMonoMap
     * datasourceContextSynchronizationMonitorMap
     *
     * @param datasourceStorage
     * @return an DatasourceContextIdentifier object
     */
    @Override
    public DatasourceContextIdentifier initializeDatasourceContextIdentifier(DatasourceStorage datasourceStorage) {
        return new DatasourceContextIdentifier(datasourceStorage.getDatasourceId(), FieldName.UNUSED_ENVIRONMENT_ID);
    }
}

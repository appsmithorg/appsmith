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
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.solutions.DatasourcePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

@Slf4j
public class DatasourceContextServiceCEImpl implements DatasourceContextServiceCE {

    // DatasourceContextIdentifier contains datasourceId & environmentId which is mapped to DatasourceContext
    protected final Map<DatasourceContextIdentifier, Mono<? extends DatasourceContext<?>>> datasourceContextMonoMap;
    protected final Map<DatasourceContextIdentifier, Object> datasourceContextSynchronizationMonitorMap;
    protected final Map<DatasourceContextIdentifier, DatasourceContext<?>> datasourceContextMap;
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
    public Mono<? extends DatasourceContext<?>> getCachedDatasourceContextMono(
            DatasourceStorage datasourceStorage,
            Plugin plugin,
            PluginExecutor<Object> pluginExecutor,
            Object monitor,
            DatasourceContextIdentifier datasourceContextIdentifier) {
        synchronized (monitor) {
            /* Destroy any connection that is stale or in error state to free up resource */
            final boolean isStale = getIsStale(datasourceStorage, datasourceContextIdentifier);
            final boolean isInErrorState = getIsInErrorState(datasourceContextIdentifier);

            if (isStale || isInErrorState) {
                final Object connection =
                        datasourceContextMap.get(datasourceContextIdentifier).getConnection();
                if (connection != null) {
                    try {
                        // Basically remove entry from both cache maps
                        pluginExecutor.datasourceDestroy(connection);
                    } catch (Exception e) {
                        log.info("Error destroying stale datasource connection", e);
                    }
                }
                datasourceContextMonoMap.remove(datasourceContextIdentifier);
                datasourceContextMap.remove(datasourceContextIdentifier);
            }

            /*
             * If a publisher with cached value already exists then return it. Please note that even if this publisher is
             * evaluated multiple times the actual datasource creation will only happen once and get cached and the same
             * value would directly be returned to further evaluations / subscriptions.
             */
            if (datasourceContextIdentifier.getDatasourceId() != null
                    && datasourceContextMonoMap.get(datasourceContextIdentifier) != null) {
                log.debug("Cached resource context mono exists. Returning the same.");
                return datasourceContextMonoMap.get(datasourceContextIdentifier);
            }

            /* Create a fresh datasource context */
            DatasourceContext<Object> datasourceContext = new DatasourceContext<>();
            if (datasourceContextIdentifier.isKeyValid() && shouldCacheContextForThisPlugin(plugin)) {
                /* For this datasource, either the context doesn't exist, or the context is stale. Replace (or add) with
                the new connection in the context map. */
                datasourceContextMap.put(datasourceContextIdentifier, datasourceContext);
            }

            Mono<Object> connectionMonoCache = pluginExecutor
                    .datasourceCreate(datasourceStorage.getDatasourceConfiguration())
                    .cache();

            Mono<DatasourceContext<Object>> datasourceContextMonoCache = connectionMonoCache
                    .flatMap(connection -> updateDatasourceAndSetAuthentication(connection, datasourceStorage))
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

            if (datasourceContextIdentifier.isKeyValid() && shouldCacheContextForThisPlugin(plugin)) {
                datasourceContextMonoMap.put(datasourceContextIdentifier, datasourceContextMonoCache);
            }
            return datasourceContextMonoCache;
        }
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
                && !PluginConstants.PackageName.GRAPH_QL_PLUGIN.equals(plugin.getPackageName());
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
                    datasourceStorage, datasourceStorage.getEnvironmentId(), Boolean.FALSE);
        }
        return datasourceStorageMono.thenReturn(connection);
    }

    protected Mono<DatasourceContext<?>> createNewDatasourceContext(
            DatasourceStorage datasourceStorage, DatasourceContextIdentifier datasourceContextIdentifier) {
        log.debug("Datasource context doesn't exist. Creating connection.");
        Mono<Plugin> pluginMono =
                pluginService.findById(datasourceStorage.getPluginId()).cache();

        return pluginMono
                .zipWith(pluginExecutorHelper.getPluginExecutor(pluginMono))
                .flatMap(tuple2 -> {
                    Plugin plugin = tuple2.getT1();
                    PluginExecutor<Object> pluginExecutor = tuple2.getT2();

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
                                datasourceContextSynchronizationMonitorMap.computeIfAbsent(
                                        datasourceContextIdentifier, k -> new Object());
                            }
                        }

                        monitor = datasourceContextSynchronizationMonitorMap.get(datasourceContextIdentifier);
                    }

                    return getCachedDatasourceContextMono(
                            datasourceStorage, plugin, pluginExecutor, monitor, datasourceContextIdentifier);
                });
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
                .map(pluginExecutor -> {
                    log.info("Clearing datasource context for datasource storage ID {}.", datasourceStorage.getId());
                    pluginExecutor.datasourceDestroy(datasourceContext.getConnection());
                    datasourceContextMonoMap.remove(datasourceContextIdentifier);
                    return datasourceContextMap.remove(datasourceContextIdentifier);
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

package com.appsmith.server.services.ce;

import com.appsmith.external.dtos.DatasourceDTO;
import com.appsmith.external.dtos.ExecutePluginDTO;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.UpdatableConnection;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.domains.DatasourceContext;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.PluginService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;

@Slf4j
public class DatasourceContextServiceCEImpl implements DatasourceContextServiceCE {

    //This is DatasourceId mapped to the DatasourceContext
    private final Map<String, Mono<? extends DatasourceContext<?>>> datasourceContextMonoMap;
    private final Map<String, Object> datasourceContextSynchronizationMonitorMap;
    private final Map<String, DatasourceContext<?>> datasourceContextMap;
    private final DatasourceService datasourceService;
    private final PluginService pluginService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final EncryptionService encryptionService;
    private final ConfigService configService;

    @Autowired
    public DatasourceContextServiceCEImpl(DatasourceService datasourceService,
                                          PluginService pluginService,
                                          PluginExecutorHelper pluginExecutorHelper,
                                          EncryptionService encryptionService,
                                          ConfigService configService) {
        this.datasourceService = datasourceService;
        this.pluginService = pluginService;
        this.pluginExecutorHelper = pluginExecutorHelper;
        this.encryptionService = encryptionService;
        this.datasourceContextMap = new ConcurrentHashMap<>();
        this.datasourceContextMonoMap = new ConcurrentHashMap<>();
        this.datasourceContextSynchronizationMonitorMap = new ConcurrentHashMap<>();
        this.configService = configService;
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
     * @param datasource - datasource for which a new datasource context / connection needs to be created
     * @param pluginExecutor - plugin executor associated with the datasource's plugin
     * @param monitor - unique monitor object per datasource id. Lock is acquired on this monitor object.
     * @return a cached source publisher which upon subscription produces / returns the latest datasource context /
     * connection.
     */
    public Mono<? extends DatasourceContext<?>> getCachedDatasourceContextMono(Datasource datasource,
                                                                  PluginExecutor<Object> pluginExecutor,
                                                                  Object monitor) {
        synchronized (monitor) {
            /* Destroy any stale connection to free up resource */
            String datasourceId = datasource.getId();
            final boolean isStale = getIsStale(datasource);
            if (isStale) {
                final Object connection = datasourceContextMap.get(datasourceId).getConnection();
                if (connection != null) {
                    try {
                        pluginExecutor.datasourceDestroy(connection);
                    } catch (Exception e) {
                        log.info("Error destroying stale datasource connection", e);
                    }
                }
            }

            /*
             * If a publisher with cached value already exists then return it. Please note that even if this publisher is
             * evaluated multiple times the actual datasource creation will only happen once and get cached and the same
             * value would directly be returned to further evaluations / subscriptions.
             */
            if (datasourceId != null && datasourceContextMonoMap.get(datasourceId) != null) {
                log.debug("Cached resource context mono exists. Returning the same.");
                return datasourceContextMonoMap.get(datasourceId);
            }

            /* Create a fresh datasource context */
            DatasourceContext<Object> datasourceContext = new DatasourceContext<Object>();
            if (datasourceId != null) {
            /* For this datasource, either the context doesn't exist, or the context is stale. Replace (or add) with
            the new connection in the context map. */
                datasourceContextMap.put(datasourceId, datasourceContext);
            }

            Mono<Object> connectionMono = pluginExecutor.datasourceCreate(datasource.getDatasourceConfiguration());
            Mono<DatasourceContext<Object>> datasourceContextMonoCache = connectionMono
                    .flatMap(connection -> {
                        Mono<Datasource> datasourceMono1 = Mono.just(datasource);
                        if (connection instanceof UpdatableConnection) {
                            datasource.setUpdatedAt(Instant.now());
                            datasource
                                    .getDatasourceConfiguration()
                                    .setAuthentication(
                                            ((UpdatableConnection) connection).getAuthenticationDTO(
                                                    datasource.getDatasourceConfiguration().getAuthentication()));
                            datasourceMono1 = datasourceService.update(datasource.getId(), datasource);
                        }
                        return datasourceMono1.thenReturn(connection);
                    })
                    .map(connection -> {
                        /* When a connection object exists and makes sense for the plugin, we put it in the
                         context. Example, DB plugins. */
                        datasourceContext.setConnection(connection);
                        return datasourceContext;
                    })
                    .defaultIfEmpty(
                        /* When a connection object doesn't make sense for the plugin, we get an empty mono and we
                        just return the context object as is. */
                            datasourceContext
                    )
                    .cache(); /* Cache the value so that further evaluations don't result in new connections */
            if (datasourceId != null) {
                datasourceContextMonoMap.put(datasourceId, datasourceContextMonoCache);
            }
            return datasourceContextMonoCache;
        }
    }

    Mono<DatasourceContext<?>> createNewDatasourceContext(Datasource datasource) {
        log.debug("Datasource context doesn't exist. Creating connection.");

        String datasourceId = datasource.getId();
        Mono<Datasource> datasourceMono;
        if (datasource.getId() != null) {
            datasourceMono = datasourceService.findById(datasourceId, EXECUTE_DATASOURCES);
        } else {
            datasourceMono = Mono.just(datasource);
        }

        return datasourceMono
                .zipWhen(datasource1 -> {
                    Mono<Plugin> pluginMono = datasourceMono
                            .flatMap(resource -> pluginService.findById(resource.getPluginId()));

                    // Datasource Context has not been created for this resource on this machine. Create one now.
                    return pluginExecutorHelper.getPluginExecutor(pluginMono);
                })
                .flatMap(objects -> {
                    Datasource datasource1 = objects.getT1();
                    PluginExecutor<Object> pluginExecutor = objects.getT2();

                    /**
                     * Keep one monitor object against each datasource id. The synchronized method
                     * `getCachedDatasourceContextMono` would then acquire lock on the monitor object which is unique
                     * for each datasourceId hence ensuring that if competing threads want to create datasource context
                     * on different datasource id then they are not blocked on each other and can run concurrently.
                     * Only threads that want to create a new datasource context on the same datasource id would be
                     * synchronized.
                     */
                    Object monitor = new Object();
                    if (datasourceId != null) {
                        if (datasourceContextSynchronizationMonitorMap.get(datasourceId) == null) {
                            synchronized (this) {
                                if (datasourceContextSynchronizationMonitorMap.get(datasourceId) == null) {
                                    datasourceContextSynchronizationMonitorMap.put(datasourceId, new Object());
                                }
                            }
                        }

                        monitor = datasourceContextSynchronizationMonitorMap.get(datasourceId);
                    }

                    return getCachedDatasourceContextMono(datasource1, pluginExecutor, monitor);
                });
    }

    public boolean getIsStale(Datasource datasource) {
        String datasourceId = datasource.getId();
        return datasourceId != null
                && datasourceContextMap.get(datasourceId) != null
                && datasource.getUpdatedAt() != null
                && datasource.getUpdatedAt().isAfter(datasourceContextMap.get(datasourceId).getCreationTime());
    }

    boolean isValidDatasourceContextAvailable(Datasource datasource) {
        String datasourceId = datasource.getId();
        boolean isStale = getIsStale(datasource);
        return datasourceContextMap.get(datasourceId) != null
                // The following condition happens when there's a timeout in the middle of destroying a connection and
                // the reactive flow interrupts, resulting in the destroy operation not completing.
                && datasourceContextMap.get(datasourceId).getConnection() != null
                && !isStale;
    }

    @Override
    public Mono<DatasourceContext<?>> getDatasourceContext(Datasource datasource) {
        String datasourceId = datasource.getId();
        if (datasourceId == null) {
            log.debug("This is a dry run or an embedded datasource. The datasource context would not exist in this " +
                    "scenario");
        } else if (isValidDatasourceContextAvailable(datasource)) {
            log.debug("Resource context exists. Returning the same.");
            return Mono.just(datasourceContextMap.get(datasourceId));
        }

        return createNewDatasourceContext(datasource);
    }

    @Override
    public <T> Mono<T> retryOnce(Datasource datasource, Function<DatasourceContext<?>, Mono<T>> task) {
        final Mono<T> taskRunnerMono = Mono.justOrEmpty(datasource)
                .flatMap(this::getDatasourceContext)
                // Now that we have the context (connection details), call the task.
                .flatMap(task);

        return taskRunnerMono
                .onErrorResume(StaleConnectionException.class, error -> {
                    log.info("Looks like the connection is stale. Retrying with a fresh context.");
                    return deleteDatasourceContext(datasource.getId())
                            .then(taskRunnerMono);
                });
    }

    @Override
    public Mono<DatasourceContext<?>> deleteDatasourceContext(String datasourceId) {
        if (datasourceId == null) {
            return Mono.empty();
        }

        DatasourceContext<?> datasourceContext = datasourceContextMap.get(datasourceId);
        if (datasourceContext == null) {
            // No resource context exists for this resource. Return void.
            return Mono.empty();
        }

        return datasourceService
                .findById(datasourceId, EXECUTE_DATASOURCES)
                .zipWhen(datasource1 ->
                        pluginExecutorHelper.getPluginExecutor(pluginService.findById(datasource1.getPluginId()))
                )
                .map(tuple -> {
                    final Datasource datasource = tuple.getT1();
                    final PluginExecutor<Object> pluginExecutor = tuple.getT2();
                    log.info("Clearing datasource context for datasource ID {}.", datasource.getId());
                    pluginExecutor.datasourceDestroy(datasourceContext.getConnection());
                    datasourceContextMonoMap.remove(datasourceId);
                    return datasourceContextMap.remove(datasourceId);
                });
    }

    // We can afford to make this call all the time since we already have all the info we need in context
    @Override
    public Mono<DatasourceContext<?>> getRemoteDatasourceContext(Plugin plugin, Datasource datasource) {
        final DatasourceContext<ExecutePluginDTO> datasourceContext = new DatasourceContext<>();

        return configService.getInstanceId()
                .map(instanceId -> {
                    ExecutePluginDTO executePluginDTO = new ExecutePluginDTO();
                    executePluginDTO.setInstallationKey(instanceId);
                    executePluginDTO.setPluginName(plugin.getPluginName());
                    executePluginDTO.setPluginVersion(plugin.getVersion());
                    executePluginDTO.setDatasource(new DatasourceDTO(datasource.getId(), datasource.getDatasourceConfiguration()));
                    datasourceContext.setConnection(executePluginDTO);

                    return datasourceContext;
                });
    }
}

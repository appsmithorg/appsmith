package com.appsmith.server.services.ce;

import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.UpdatableConnection;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.services.EncryptionService;
import com.appsmith.server.domains.DatasourceContext;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.helpers.PluginExecutorHelper;
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
    private final Map<String, DatasourceContext> datasourceContextMap;
    private final DatasourceService datasourceService;
    private final PluginService pluginService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final EncryptionService encryptionService;

    @Autowired
    public DatasourceContextServiceCEImpl(DatasourceService datasourceService,
                                          PluginService pluginService,
                                          PluginExecutorHelper pluginExecutorHelper,
                                          EncryptionService encryptionService) {
        this.datasourceService = datasourceService;
        this.pluginService = pluginService;
        this.pluginExecutorHelper = pluginExecutorHelper;
        this.encryptionService = encryptionService;
        this.datasourceContextMap = new ConcurrentHashMap<>();
    }

    @Override
    public Mono<DatasourceContext> getDatasourceContext(Datasource datasource) {
        String datasourceId = datasource.getId();

        // Lengthy redundant expression because we need this variable to be final, so it can be used in a reactive callback.
        final boolean isStale = datasourceId != null
                && datasourceContextMap.get(datasourceId) != null
                && datasource.getUpdatedAt() != null
                && datasource.getUpdatedAt().isAfter(datasourceContextMap.get(datasourceId).getCreationTime());

        if (datasourceId == null) {
            log.debug("This is a dry run or an embedded datasource. The datasource context would not exist in this scenario");

        } else if (datasourceContextMap.get(datasourceId) != null
                // The following condition happens when there's a timeout in the middle of destroying a connection and
                // the reactive flow interrupts, resulting in the destroy operation not completing.
                && datasourceContextMap.get(datasourceId).getConnection() != null
                && !isStale) {
            log.debug("Resource context exists. Returning the same.");
            return Mono.just(datasourceContextMap.get(datasourceId));
        }

        log.debug("Datasource context doesn't exist. Creating connection.");

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

                    DatasourceContext datasourceContext = new DatasourceContext();

                    if (datasource1.getId() != null) {
                        // For this datasource, either the context doesn't exist, or the context is stale. Replace (or add)
                        // with the new connection in the context map.
                        datasourceContextMap.put(datasourceId, datasourceContext);
                    }

                    Mono<Object> connectionMono = pluginExecutor.datasourceCreate(datasource1.getDatasourceConfiguration());
                    return connectionMono
                            .flatMap(connection -> {
                                Mono<Datasource> datasourceMono1 = Mono.just(datasource1);
                                if (connection instanceof UpdatableConnection) {
                                    datasource1.setUpdatedAt(Instant.now());
                                    datasource1
                                            .getDatasourceConfiguration()
                                            .setAuthentication(
                                                    ((UpdatableConnection) connection).getAuthenticationDTO(
                                                            datasource1.getDatasourceConfiguration().getAuthentication()));
                                    datasourceMono1 = datasourceService.update(datasource1.getId(), datasource1);
                                }
                                return datasourceMono1.thenReturn(connection);
                            })
                            .map(connection -> {
                                // When a connection object exists and makes sense for the plugin, we put it in the
                                // context. Example, DB plugins.
                                datasourceContext.setConnection(connection);
                                return datasourceContext;
                            })
                            .defaultIfEmpty(
                                    // When a connection object doesn't make sense for the plugin, we get an empty mono
                                    // and we just return the context object as is.
                                    datasourceContext
                            );
                });
    }

    @Override
    public <T> Mono<T> retryOnce(Datasource datasource, Function<DatasourceContext, Mono<T>> task) {
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
    public Mono<DatasourceContext> deleteDatasourceContext(String datasourceId) {
        if (datasourceId == null) {
            return Mono.empty();
        }

        DatasourceContext datasourceContext = datasourceContextMap.get(datasourceId);
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
                    return datasourceContextMap.remove(datasourceId);
                });
    }
}

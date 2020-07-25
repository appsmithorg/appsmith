package com.appsmith.server.services;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.DatasourceContext;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.helpers.PluginExecutorHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;

@Service
@Slf4j
public class DatasourceContextServiceImpl implements DatasourceContextService {

    //This is DatasourceId mapped to the DatasourceContext
    private final Map<String, DatasourceContext> datasourceContextMap;
    private final DatasourceService datasourceService;
    private final PluginService pluginService;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final EncryptionService encryptionService;

    @Autowired
    public DatasourceContextServiceImpl(DatasourceService datasourceService,
                                        PluginService pluginService,
                                        PluginExecutorHelper pluginExecutorHelper,
                                        EncryptionService encryptionService) {
        this.datasourceService = datasourceService;
        this.pluginService = pluginService;
        this.pluginExecutorHelper = pluginExecutorHelper;
        this.encryptionService = encryptionService;
        this.datasourceContextMap = new HashMap<>();
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

        } else if (datasourceContextMap.get(datasourceId) != null && !isStale) {
            log.debug("resource context exists. Returning the same.");
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

                    // If authentication exists for the datasource, decrypt the fields
                    if (datasource1.getDatasourceConfiguration() != null &&
                            datasource1.getDatasourceConfiguration().getAuthentication() != null) {
                        AuthenticationDTO authentication = datasource1.getDatasourceConfiguration().getAuthentication();
                        datasource1.getDatasourceConfiguration().setAuthentication(decryptSensitiveFields(authentication));
                    }

                    PluginExecutor pluginExecutor = objects.getT2();

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
    public Mono<DatasourceContext> deleteDatasourceContext(String datasourceId) {
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
                    final PluginExecutor pluginExecutor = tuple.getT2();
                    log.info("Clearing datasource context for datasource ID {}.", datasource.getId());
                    pluginExecutor.datasourceDestroy(datasourceContext.getConnection());
                    return datasourceContextMap.remove(datasourceId);
                });
    }

    @Override
    public AuthenticationDTO decryptSensitiveFields(AuthenticationDTO authenticationDTO) {
        if (authenticationDTO.getPassword() != null) {
            authenticationDTO.setPassword(encryptionService.decryptString(authenticationDTO.getPassword()));
        }
        return authenticationDTO;
    }
}

package com.appsmith.server.services;

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

@Service
@Slf4j
public class DatasourceContextServiceImpl implements DatasourceContextService {

    //This is DatasourceId mapped to the DatasourceContext
    Map<String, DatasourceContext> datasourceContextMap;
    private final DatasourceService datasourceService;
    private final PluginService pluginService;
    private final PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    public DatasourceContextServiceImpl(DatasourceService datasourceService,
                                        PluginService pluginService,
                                        PluginExecutorHelper pluginExecutorHelper) {
        this.datasourceService = datasourceService;
        this.pluginService = pluginService;
        this.pluginExecutorHelper = pluginExecutorHelper;
        this.datasourceContextMap = new HashMap<>();
    }

    @Override
    public Mono<DatasourceContext> getDatasourceContext(Datasource datasource) {
        String datasourceId = datasource.getId();
        if (datasourceId == null) {
            log.debug("This is a dry run or an embedded datasource. The datasource context would not exist in this scenario");
        } else if (datasourceContextMap.get(datasourceId) != null) {
            log.debug("resource context exists. Returning the same.");
            return Mono.just(datasourceContextMap.get(datasourceId));
        }
        log.debug("Datasource context doesn't exist. Creating connection");

        Mono<Datasource> datasourceMono;

        if (datasource.getId() != null) {
            datasourceMono = datasourceService.findById(datasourceId);
        } else {
            datasourceMono = Mono.just(datasource);
        }

        Mono<Plugin> pluginMono = datasourceMono
                .flatMap(resource -> pluginService.findById(resource.getPluginId()));

        // Datasource Context has not been created for this resource on this machine. Create one now.
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginMono);

        return Mono.zip(datasourceMono, pluginExecutorMono)
                .flatMap(objects -> {
                    Datasource datasource1 = objects.getT1();
                    PluginExecutor pluginExecutor = objects.getT2();

                    DatasourceContext datasourceContext = new DatasourceContext();

                    if (datasource1.getId() != null) {
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
            //No resource context exists for this resource. Return void;
            return Mono.empty();
        }

        Mono<Datasource> datasourceMono = datasourceService.findById(datasourceId);

        Mono<Plugin> pluginMono = datasourceMono
                .flatMap(datasource -> pluginService.findById(datasource.getPluginId()));

        //Datasource Context has not been created for this resource on this machine. Create one now.
        Mono<PluginExecutor> pluginExecutorMono = pluginExecutorHelper.getPluginExecutor(pluginMono);

        return Mono.zip(datasourceMono, pluginExecutorMono, ((datasource, pluginExecutor) -> {
            pluginExecutor.datasourceDestroy(datasourceContext.getConnection());
            datasourceContextMap.remove(datasourceId);
            return datasourceContext;
        }));
    }
}

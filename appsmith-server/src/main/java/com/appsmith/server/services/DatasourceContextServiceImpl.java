package com.appsmith.server.services;

import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.DatasourceContext;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.PluginManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class DatasourceContextServiceImpl implements DatasourceContextService {

    //This is DatasourceId mapped to the DatasourceContext
    Map<String, DatasourceContext> datasourceContextMap;
    private final DatasourceService datasourceService;
    private final PluginManager pluginManager;
    private final PluginService pluginService;

    @Autowired
    public DatasourceContextServiceImpl(DatasourceService datasourceService, PluginManager pluginManager, PluginService pluginService) {
        this.datasourceService = datasourceService;
        this.pluginManager = pluginManager;
        this.pluginService = pluginService;
        this.datasourceContextMap = new HashMap<>();
    }

    @Override
    public Mono<DatasourceContext> getDatasourceContext(Datasource datasource) {
        String datasourceId = datasource.getId();
        if (datasourceId == null) {
            log.debug("This is a dry run");
        } else if (datasourceContextMap.get(datasourceId) != null) {
            log.debug("resource context exists. Returning the same.");
            return Mono.just(datasourceContextMap.get(datasourceId));
        }
        log.debug("Datasource context doesn't exist. Creating connection");

        Mono<Datasource> datasourceMono;

        if (datasource.getId() != null) {
            datasourceMono= datasourceService.findById(datasourceId);
        } else {
            datasourceMono = Mono.just(datasource);
        }

        Mono<Plugin> pluginMono = datasourceMono
                                    .flatMap(resource -> pluginService.findById(resource.getPluginId()));

        //Datasource Context has not been created for this resource on this machine. Create one now.
        Mono<PluginExecutor> pluginExecutorMono = pluginMono.flatMap(plugin -> {
                    List<PluginExecutor> executorList = pluginManager.getExtensions(PluginExecutor.class, plugin.getExecutorClass());
                    if (executorList.isEmpty()) {
                        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "plugin", plugin.getExecutorClass()));
                    }
                    return Mono.just(executorList.get(0));
                }
        );

        return Mono.zip(datasourceMono, pluginExecutorMono, ((datasource1, pluginExecutor) -> {
                Object connection = pluginExecutor.datasourceCreate(datasource1.getDatasourceConfiguration());
                DatasourceContext datasourceContext = new DatasourceContext();
                datasourceContext.setConnection(connection);
                if (datasource1.getId() != null) {
                    datasourceContextMap.put(datasourceId, datasourceContext);
                }
                return datasourceContext;
        }));
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
        Mono<PluginExecutor> pluginExecutorMono = pluginMono.flatMap(plugin -> {
                    List<PluginExecutor> executorList = pluginManager.getExtensions(PluginExecutor.class, plugin.getExecutorClass());
                    if (executorList.isEmpty()) {
                        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "plugin", plugin.getExecutorClass()));
                    }
                    return Mono.just(executorList.get(0));
                }
        );

        return Mono.zip(datasourceMono, pluginExecutorMono, ((datasource, pluginExecutor) -> {
            pluginExecutor.datasourceDestroy(datasourceContext.getConnection());
            datasourceContextMap.remove(datasourceId);
            return datasourceContext;
        }));
    }
}

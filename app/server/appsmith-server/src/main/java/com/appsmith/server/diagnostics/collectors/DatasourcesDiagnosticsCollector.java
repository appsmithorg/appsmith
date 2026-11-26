package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PluginRepository;
import org.springframework.stereotype.Component;

@Component
public class DatasourcesDiagnosticsCollector extends DatasourcesDiagnosticsCollectorCE {

    public DatasourcesDiagnosticsCollector(
            DatasourceRepository datasourceRepository,
            NewActionRepository newActionRepository,
            PluginRepository pluginRepository) {
        super(datasourceRepository, newActionRepository, pluginRepository);
    }
}

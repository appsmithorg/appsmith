package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.McpKeyRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.OrganizationService;
import org.springframework.stereotype.Component;

@Component
public class AiMcpDiagnosticsCollector extends AiMcpDiagnosticsCollectorCE {

    public AiMcpDiagnosticsCollector(
            OrganizationService organizationService,
            DatasourceRepository datasourceRepository,
            PluginRepository pluginRepository,
            McpKeyRepository mcpKeyRepository,
            DiagnosticsLoopbackProbe loopbackProbe,
            CommonConfig commonConfig) {
        super(
                organizationService,
                datasourceRepository,
                pluginRepository,
                mcpKeyRepository,
                loopbackProbe,
                commonConfig);
    }
}

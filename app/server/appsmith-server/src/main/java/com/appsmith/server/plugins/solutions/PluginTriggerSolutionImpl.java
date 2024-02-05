package com.appsmith.server.plugins.solutions;

import com.appsmith.external.models.Property;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.solutions.DatasourceTriggerSolution;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;

import static com.appsmith.server.constants.FieldName.COOKIE;

@Component
public class PluginTriggerSolutionImpl extends PluginTriggerSolutionCEImpl implements PluginTriggerSolution {
    public PluginTriggerSolutionImpl(
            DatasourceTriggerSolution datasourceTriggerSolution,
            PluginExecutorHelper pluginExecutorHelper,
            PluginRepository pluginRepository,
            ConfigService configService,
            TenantService tenantService) {
        super(datasourceTriggerSolution, pluginExecutorHelper, pluginRepository, configService, tenantService);
    }

    @Override
    protected void setHeadersToTriggerRequest(
            Plugin plugin, HttpHeaders httpHeaders, TriggerRequestDTO triggerRequestDTO) {
        if (Boolean.TRUE.equals(plugin.getRequiresAppsmithUserContext())) {
            httpHeaders.forEach((key, value) -> {
                if (key.equalsIgnoreCase(COOKIE)) {
                    Property property = new Property(key, value.get(0));
                    triggerRequestDTO.getHeaders().add(property);
                }
            });
        }
    }
}

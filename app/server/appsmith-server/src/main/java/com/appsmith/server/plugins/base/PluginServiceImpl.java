package com.appsmith.server.plugins.base;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.plugins.solutions.PluginTransformationSolution;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.WorkspaceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.PluginManager;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class PluginServiceImpl extends PluginServiceCEImpl implements PluginService {

    public PluginServiceImpl(
            Validator validator,
            PluginRepository repository,
            AnalyticsService analyticsService,
            WorkspaceService workspaceService,
            PluginManager pluginManager,
            ObjectMapper objectMapper,
            CloudServicesConfig cloudServicesConfig,
            ConfigService configService,
            PluginTransformationSolution pluginTransformationSolution) {

        super(
                validator,
                repository,
                analyticsService,
                workspaceService,
                pluginManager,
                objectMapper,
                cloudServicesConfig,
                configService,
                pluginTransformationSolution);
    }
}

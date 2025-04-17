package com.appsmith.server.plugins.base;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.WorkspaceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.PluginManager;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
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
            ReactiveRedisTemplate<String, String> reactiveTemplate,
            ChannelTopic topic,
            ObjectMapper objectMapper,
            CloudServicesConfig cloudServicesConfig,
            ConfigService configService) {

        super(
                validator,
                repository,
                analyticsService,
                workspaceService,
                pluginManager,
                reactiveTemplate,
                topic,
                objectMapper,
                cloudServicesConfig,
                configService);
    }
}

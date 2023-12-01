package com.appsmith.server.plugins.base;

import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.PagePermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.PluginManager;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

@Slf4j
@Service
public class PluginServiceImpl extends PluginServiceCEImpl implements PluginService {

    public PluginServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            PluginRepository repository,
            AnalyticsService analyticsService,
            WorkspaceService workspaceService,
            ApplicationService applicationService,
            NewPageService newPageService,
            PagePermission pagePermission,
            PluginManager pluginManager,
            ReactiveRedisTemplate<String, String> reactiveTemplate,
            ChannelTopic topic,
            ObjectMapper objectMapper) {

        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService,
                workspaceService,
                applicationService,
                newPageService,
                pagePermission,
                pluginManager,
                reactiveTemplate,
                topic,
                objectMapper);
    }
}

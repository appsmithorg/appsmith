package com.appsmith.server.services;

import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ce.PluginServiceCEImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.PluginManager;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Slf4j
@Service
public class PluginServiceImpl extends PluginServiceCEImpl implements PluginService {

    public PluginServiceImpl(Scheduler scheduler,
                             Validator validator,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             PluginRepository repository,
                             AnalyticsService analyticsService,
                             OrganizationService organizationService,
                             PluginManager pluginManager,
                             ReactiveRedisTemplate<String,
                                     String> reactiveTemplate,
                             ChannelTopic topic,
                             ObjectMapper objectMapper) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService,
                organizationService, pluginManager, reactiveTemplate, topic, objectMapper);

    }
}

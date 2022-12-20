package com.appsmith.server.services;

import com.appsmith.server.repositories.CustomJSLibRepository;
import com.appsmith.server.services.ce.CustomJSLibServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
@Slf4j
public class CustomJSLibServiceImpl extends CustomJSLibServiceCEImpl implements CustomJSLibService {

    public CustomJSLibServiceImpl(Scheduler scheduler, Validator validator, MongoConverter mongoConverter,
                                  ReactiveMongoTemplate reactiveMongoTemplate, CustomJSLibRepository repository,
                                  ApplicationService applicationService, AnalyticsService analyticsService, FeatureFlagService featureFlagService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, applicationService, analyticsService, featureFlagService);
    }
}
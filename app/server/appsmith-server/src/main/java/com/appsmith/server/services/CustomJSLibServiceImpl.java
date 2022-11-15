package com.appsmith.server.services;

import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.services.ce.CustomJSLibServiceCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

public class CustomJSLibServiceImpl extends CustomJSLibServiceCEImpl implements CustomJSLibService {
    public CustomJSLibServiceImpl(Scheduler scheduler, Validator validator, MongoConverter mongoConverter,
                                  ReactiveMongoTemplate reactiveMongoTemplate, ApplicationRepository repository,
                                  AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }
}

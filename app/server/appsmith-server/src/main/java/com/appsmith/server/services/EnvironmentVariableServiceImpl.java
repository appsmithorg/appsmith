package com.appsmith.server.services;

import com.appsmith.server.repositories.EnvironmentVariableRepository;
import com.appsmith.server.services.ce.EnvironmentVariableServiceCEImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

public class EnvironmentVariableServiceImpl extends EnvironmentVariableServiceCEImpl implements EnvironmentVariableService {

    @Autowired
    public EnvironmentVariableServiceImpl(Scheduler scheduler,
                                            Validator validator,
                                            MongoConverter mongoConverter,
                                            ReactiveMongoTemplate reactiveMongoTemplate,
                                            EnvironmentVariableRepository repository,
                                            AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);

    }
}

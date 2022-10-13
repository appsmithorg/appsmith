package com.appsmith.server.services;

import com.appsmith.server.repositories.EnvironmentVariableRepository;
import com.appsmith.server.services.ce.EnvironmentVariableServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Slf4j
@Service
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

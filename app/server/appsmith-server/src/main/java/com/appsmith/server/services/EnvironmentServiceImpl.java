package com.appsmith.server.services;

import com.appsmith.server.repositories.EnvironmentRepository;
import com.appsmith.server.services.ce.EnvironmentServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
@Slf4j
public class EnvironmentServiceImpl extends EnvironmentServiceCEImpl implements EnvironmentService {

    @Autowired
    public EnvironmentServiceImpl (Scheduler scheduler,
                                   Validator validator,
                                   MongoConverter mongoConverter,
                                   ReactiveMongoTemplate reactiveMongoTemplate,
                                   EnvironmentRepository repository,
                                   AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }
}

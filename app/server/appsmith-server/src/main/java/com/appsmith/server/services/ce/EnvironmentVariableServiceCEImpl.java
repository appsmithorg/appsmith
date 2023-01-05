package com.appsmith.server.services.ce;

import com.appsmith.external.models.EnvironmentVariable;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.scheduler.Scheduler;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.repositories.EnvironmentVariableRepository;


import jakarta.validation.Validator;

@Slf4j
public class EnvironmentVariableServiceCEImpl extends BaseService<EnvironmentVariableRepository, EnvironmentVariable, String>
        implements EnvironmentVariableServiceCE {

    @Autowired
    public EnvironmentVariableServiceCEImpl(Scheduler scheduler,
                                            Validator validator,
                                            MongoConverter mongoConverter,
                                            ReactiveMongoTemplate reactiveMongoTemplate,
                                            EnvironmentVariableRepository repository,
                                            AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);

    }

}

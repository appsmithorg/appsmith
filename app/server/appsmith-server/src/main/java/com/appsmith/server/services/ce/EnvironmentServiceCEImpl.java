package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Environment;
import com.appsmith.server.repositories.EnvironmentRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.scheduler.Scheduler;

@Slf4j
public class EnvironmentServiceCEImpl extends BaseService<EnvironmentRepository, Environment, String> implements EnvironmentServiceCE {

    @Autowired
    public EnvironmentServiceCEImpl(Scheduler scheduler,
                                    Validator validator,
                                    MongoConverter mongoConverter,
                                    ReactiveMongoTemplate reactiveMongoTemplate,
                                    EnvironmentRepository repository,
                                    AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }

}

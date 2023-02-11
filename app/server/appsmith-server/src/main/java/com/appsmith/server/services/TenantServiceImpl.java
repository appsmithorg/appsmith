package com.appsmith.server.services;

import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.services.ce.TenantServiceCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import jakarta.validation.Validator;

@Service
public class TenantServiceImpl extends TenantServiceCEImpl implements TenantService {

    public TenantServiceImpl(Scheduler scheduler,
                             Validator validator,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             TenantRepository repository,
                             AnalyticsService analyticsService,
                             ConfigService configService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService, configService);
    }
}

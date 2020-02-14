package com.appsmith.server.services;

import com.appsmith.external.models.Provider;
import com.appsmith.server.repositories.ProviderRepository;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Service
public class ProviderServiceImpl extends BaseService<ProviderRepository, Provider, String> implements ProviderService {

    public ProviderServiceImpl(Scheduler scheduler,
                               Validator validator,
                               MongoConverter mongoConverter,
                               ReactiveMongoTemplate reactiveMongoTemplate,
                               ProviderRepository repository,
                               AnalyticsService analyticsService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
    }
}

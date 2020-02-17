package com.appsmith.server.services;

import com.appsmith.external.models.Provider;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.repositories.ProviderRepository;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
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

    @Override
    public Flux<Provider> get(MultiValueMap<String, String> params) {
        Provider providerExample = new Provider();
        Sort sort = Sort.by(FieldName.NAME);

        if (params.getFirst(FieldName.NAME) != null) {
            providerExample.setName(params.getFirst(FieldName.NAME));
        }

        return repository.findAll(Example.of(providerExample), sort);
    }
}

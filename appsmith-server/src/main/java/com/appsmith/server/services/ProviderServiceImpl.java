package com.appsmith.server.services;

import com.appsmith.external.models.Provider;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.repositories.ProviderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
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

        if (params.getFirst(FieldName.CATEGORY) != null) {
            List<String> categories = new ArrayList<>();
            categories.add(params.getFirst(FieldName.CATEGORY));
            providerExample.setCategories(categories);
        }

        return repository.findAll(Example.of(providerExample), sort);
    }
}

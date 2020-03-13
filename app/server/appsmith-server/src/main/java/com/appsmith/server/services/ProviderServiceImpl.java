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
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@Slf4j
public class ProviderServiceImpl extends BaseService<ProviderRepository, Provider, String> implements ProviderService {

    private static final List<String> CATEGORIES = Arrays.asList("Business","Visual Recognition","Location","Science",
            "Food","Travel, Transportation","Music","Tools","Text Analysis","Weather","Gaming","SMS","Events","Health, Fitness",
            "Payments","Financial","Translation","Storage","Logistics","Database","Search","Reward","Mapping","Machine Learning",
            "Email","News, Media","Video, Images","eCommerce","Medical","Devices","Business Software","Advertising","Education",
            "Media","Social","Commerce","Communication","Other","Monitoring","Energy");

    private static final String DEFAULT_CATEGORY = "Business Software";
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

        List<String> categories = new ArrayList<>();
        if (params.getFirst(FieldName.CATEGORY) != null) {
            categories.add(params.getFirst(FieldName.CATEGORY));

        } else {
            // No category has been provided. Set the default category.
            categories.add(DEFAULT_CATEGORY);
        }
        providerExample.setCategories(categories);

        return repository.findAll(Example.of(providerExample), sort);
    }

    @Override
    public Mono<List<String>> getAllCategories() {
        return Mono.just(CATEGORIES);
    }
}

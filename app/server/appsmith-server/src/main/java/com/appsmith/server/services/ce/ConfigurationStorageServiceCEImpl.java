package com.appsmith.server.services.ce;

import com.appsmith.external.models.ConfigurationStorage;
import com.appsmith.server.repositories.ConfigurationStorageRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.List;

@Slf4j
public class ConfigurationStorageServiceCEImpl
        extends BaseService<ConfigurationStorageRepository, ConfigurationStorage, String>
        implements ConfigurationStorageServiceCE{

    private final ConfigurationStorageRepository repository;
    public ConfigurationStorageServiceCEImpl(Scheduler scheduler,
                                             Validator validator,
                                             MongoConverter mongoConverter,
                                             ReactiveMongoTemplate reactiveMongoTemplate,
                                             ConfigurationStorageRepository repository,
                                             AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
    }

    @Override
    public Flux<ConfigurationStorage> findByDatasourceId(String datasourceId) {
        return null;
    }

    @Override
    public Flux<ConfigurationStorage> findAllByDatasourceIds(List<String> datasourceIds) {
        return null;
    }

    @Override
    public Mono<ConfigurationStorage> findOneByDatasourceId(String datasourceId) {
        return null;
    }

    @Override
    public Mono<ConfigurationStorage> save(ConfigurationStorage configurationStorage) {
        return repository.save(configurationStorage);
    }

    @Override
    public Mono<ConfigurationStorage> archive(ConfigurationStorage configurationStorage) {
        return repository.archive(configurationStorage);
    }
}

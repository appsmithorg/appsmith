package com.appsmith.server.services.ce;

import com.appsmith.external.models.DatasourceConfigurationStorage;
import com.appsmith.server.repositories.DatasourceConfigurationStorageRepository;
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
public class DatasourceConfigurationStorageServiceCEImpl
        extends BaseService<DatasourceConfigurationStorageRepository, DatasourceConfigurationStorage, String>
        implements DatasourceConfigurationStorageServiceCE {

    private final DatasourceConfigurationStorageRepository repository;
    public DatasourceConfigurationStorageServiceCEImpl(Scheduler scheduler,
                                                       Validator validator,
                                                       MongoConverter mongoConverter,
                                                       ReactiveMongoTemplate reactiveMongoTemplate,
                                                       DatasourceConfigurationStorageRepository repository,
                                                       AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
    }

    @Override
    public Flux<DatasourceConfigurationStorage> findByDatasourceId(String datasourceId) {
        return repository.findByDatasourceId(datasourceId);
    }

    @Override
    public Flux<DatasourceConfigurationStorage> findAllByDatasourceIds(List<String> datasourceIds) {
        return repository.findAllByDatasourceIds(datasourceIds);
    }

    @Override
    public Mono<DatasourceConfigurationStorage> findOneByDatasourceId(String datasourceId) {
        return repository.findOneByDatasourceId(datasourceId);
    }

    @Override
    public Mono<DatasourceConfigurationStorage> save(DatasourceConfigurationStorage datasourceConfigurationStorage) {
        return repository.save(datasourceConfigurationStorage);
    }

    @Override
    public Mono<DatasourceConfigurationStorage> archive(DatasourceConfigurationStorage datasourceConfigurationStorage) {
        return repository.archive(datasourceConfigurationStorage);
    }
}

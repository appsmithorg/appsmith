package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.HashSet;
import java.util.List;

@Slf4j
public class DatasourceStorageServiceCEImpl
        extends BaseService<DatasourceStorageRepository, DatasourceStorage, String>
        implements DatasourceStorageServiceCE {

    private final DatasourceStorageRepository repository;
    public DatasourceStorageServiceCEImpl(Scheduler scheduler,
                                                       Validator validator,
                                                       MongoConverter mongoConverter,
                                                       ReactiveMongoTemplate reactiveMongoTemplate,
                                                       DatasourceStorageRepository repository,
                                                       AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.repository = repository;
    }

    @Override
    public Flux<DatasourceStorage> findByDatasourceId(String datasourceId) {
        return repository.findByDatasourceId(datasourceId);
    }

    @Override
    public Flux<DatasourceStorage> findAllByDatasourceIds(List<String> datasourceIds) {
        return repository.findAllByDatasourceIds(datasourceIds);
    }

    @Override
    public Mono<DatasourceStorage> findOneByDatasourceId(String datasourceId) {
        return repository.findOneByDatasourceId(datasourceId);
    }

    @Override
    public Mono<DatasourceStorage> save(DatasourceStorage datasourceStorage) {
        return repository.save(datasourceStorage);
    }

    @Override
    public Mono<DatasourceStorage> archive(DatasourceStorage datasourceStorage) {
        return repository.archive(datasourceStorage);
    }

    @Override
    public Mono<DatasourceStorage> findByDatasourceIdOrSave(Datasource datasource, String environmentId) {
        return findOneByDatasourceId(datasource.getId())
                .switchIfEmpty(saveDatasourceConfigurationFromDatasource(datasource, environmentId));
    }

    private Mono<DatasourceStorage> saveDatasourceConfigurationFromDatasource(Datasource datasource,
                                                                                           String environmentId) {
        if (datasource.getDatasourceConfiguration() == null) {
            // here, we don't have datasource configuration in datasource collection or datasourceStorage collection
            return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND));
        }

        DatasourceStorage datasourceStorage =
                new DatasourceStorage(
                        datasource.getId(),
                        environmentId,
                        datasource.getDatasourceConfiguration(),
                        datasource.getInvalids(),
                        new HashSet<>()
                );

        return  repository.save(datasourceStorage);
    }

}

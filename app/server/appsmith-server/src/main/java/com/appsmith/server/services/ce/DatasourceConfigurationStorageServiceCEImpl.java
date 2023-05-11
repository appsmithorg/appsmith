package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfigurationStorage;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.DatasourceConfigurationStorageRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.util.function.Tuple2;

import java.util.HashSet;
import java.util.List;

@Slf4j
public class DatasourceConfigurationStorageServiceCEImpl
        extends BaseService<DatasourceConfigurationStorageRepository, DatasourceConfigurationStorage, String>
        implements DatasourceConfigurationStorageServiceCE {

    private final DatasourceConfigurationStorageRepository repository;
    @Autowired
    private DatasourceRepository datasourceRepository;
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

    @Override
    public Mono<DatasourceConfigurationStorage> findByDatasourceIdOrSave(Datasource datasource, String environmentId) {
        return findOneByDatasourceId(datasource.getId())
                .switchIfEmpty(migrateDatasourceConfigurationToDatasourceConfigurationStorage(datasource));
    }

    private Mono<DatasourceConfigurationStorage> migrateDatasourceConfigurationToDatasourceConfigurationStorage(Datasource datasource) {
        if (datasource.getDatasourceConfiguration() == null) {
            // here, we don't have datasource configuration in datasource collection or datasourceConfigurationStorage collection
            return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND));
        }

        DatasourceConfigurationStorage datasourceConfigurationStorage =
                new DatasourceConfigurationStorage(
                        datasource.getId(),
                        null,
                        datasource.getDatasourceConfiguration(),
                        datasource.getInvalids(),
                        new HashSet<>()
                );

        datasource.setDatasourceConfiguration(null);
        datasource.setMessages(null);
        datasource.setInvalids(null);

        return Mono.just(datasourceConfigurationStorage)
                .flatMap(datasourceConfigurationStorage1 -> {
                    return repository.save(datasourceConfigurationStorage)
                            .zipWith(datasourceRepository.save(datasource))
                            .map(Tuple2::getT1)
                            .subscribeOn(Schedulers.parallel());
                });
    }

    @Override
    public Mono<DatasourceConfigurationStorage> getDatasourceConfigurationStorageByDatasourceId(String datasourceId) {
        return findOneByDatasourceId(datasourceId)
                .switchIfEmpty(datasourceRepository.findById(datasourceId)
                        .flatMap(this::migrateDatasourceConfigurationToDatasourceConfigurationStorage));
    }
}

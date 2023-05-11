package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfigurationStorage;
import com.appsmith.server.repositories.DatasourceConfigurationStorageRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.solutions.DatasourceConfigurationTransferSolution;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.List;

@Slf4j
public class DatasourceConfigurationStorageServiceCEImpl implements DatasourceConfigurationStorageServiceCE {

    private final DatasourceConfigurationStorageRepository repository;

    private final DatasourceConfigurationTransferSolution datasourceConfigurationTransferSolution;

    public DatasourceConfigurationStorageServiceCEImpl(
            DatasourceConfigurationStorageRepository repository,
            DatasourceConfigurationTransferSolution datasourceConfigurationTransferSolution) {

        this.repository = repository;
        this.datasourceConfigurationTransferSolution = datasourceConfigurationTransferSolution;
    }

    @Override
    public Flux<DatasourceConfigurationStorage> findByDatasourceId(Datasource datasource) {
        return repository.findByDatasourceId(datasource.getId())
                .switchIfEmpty(datasourceConfigurationTransferSolution
                        .createDatasourceStorageAndDeleteDatasourceConfiguration(datasource, null));
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
    public Mono<DatasourceConfigurationStorage> archive(DatasourceConfigurationStorage datasourceConfigurationStorage) {
        return repository.archive(datasourceConfigurationStorage);
    }

}

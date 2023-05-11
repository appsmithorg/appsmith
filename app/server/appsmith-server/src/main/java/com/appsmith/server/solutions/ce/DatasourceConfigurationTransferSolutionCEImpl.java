package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceConfigurationStorage;
import com.appsmith.server.repositories.DatasourceConfigurationStorageRepository;
import com.appsmith.server.services.DatasourceConfigurationStorageService;
import com.appsmith.server.services.DatasourceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.HashSet;


@Slf4j
public class DatasourceConfigurationTransferSolutionCEImpl implements DatasourceConfigurationTransferSolutionCE {

    private final DatasourceService datasourceService;

    private final DatasourceConfigurationStorageRepository datasourceConfigurationStorageRepository;

    public DatasourceConfigurationTransferSolutionCEImpl(DatasourceService datasourceService,
                                                         DatasourceConfigurationStorageRepository datasourceConfigurationStorageRepository) {
        this.datasourceService = datasourceService;
        this.datasourceConfigurationStorageRepository = datasourceConfigurationStorageRepository;
    }

    @Transactional
    @Override
    public Mono<DatasourceConfiguration> createDatasourceStorageAndGetDatasourceConfiguration(
            Datasource datasource, String environmentId) {
        if (datasource.getDatasourceConfiguration() == null) {
            // here, we don't have datasource configuration in datasource collection or datasourceConfigurationStorage collection
            return Mono.empty();
        }

        DatasourceConfigurationStorage datasourceConfigurationStorage =
                new DatasourceConfigurationStorage(
                        datasource.getId(),
                        environmentId,
                        datasource.getDatasourceConfiguration(),
                        datasource.getInvalids(),
                        new HashSet<>()
                );

        datasource.setDatasourceConfiguration(null);
        datasource.setHasDatasourceConfigurationStorage(true);

        Mono.zip(datasourceConfigurationStorageRepository.save(datasourceConfigurationStorage),
                        datasourceService.save(datasource))
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe();

        return Mono.just(datasourceConfigurationStorage.getDatasourceConfiguration());
    }
}

package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceConfigurationStorage;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CustomDatasourceConfigurationStorageRepositoryCE extends AppsmithRepository<DatasourceConfigurationStorage> {
    Flux<DatasourceConfigurationStorage> findByDatasourceId(String datasourceId);
    Flux<DatasourceConfigurationStorage> findAllByDatasourceIds(List<String> datasourceIds);
    Mono<DatasourceConfigurationStorage> findOneByDatasourceId(String datasourceId);
}

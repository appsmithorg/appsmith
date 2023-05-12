package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface CustomDatasourceStorageRepositoryCE extends AppsmithRepository<DatasourceStorage> {
    Flux<DatasourceStorage> findByDatasourceId(String datasourceId);
    Flux<DatasourceStorage> findAllByDatasourceIds(List<String> datasourceIds);
    Mono<DatasourceStorage> findOneByDatasourceId(String datasourceId);
    Mono<DatasourceStorage> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId);
}

package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.repositories.BaseRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface DatasourceStorageRepositoryCE extends BaseRepository<DatasourceStorage, String> {
    Flux<DatasourceStorage> findByDatasourceId(String datasourceId);

    Mono<DatasourceStorage> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId);
}

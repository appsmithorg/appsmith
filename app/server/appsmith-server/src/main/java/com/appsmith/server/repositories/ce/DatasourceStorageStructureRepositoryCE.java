package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomDatasourceStorageStructureRepository;
import reactor.core.publisher.Mono;

public interface DatasourceStorageStructureRepositoryCE
        extends BaseRepository<DatasourceStorageStructure, String>, CustomDatasourceStorageStructureRepository {

    Mono<DatasourceStorageStructure> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId);
}

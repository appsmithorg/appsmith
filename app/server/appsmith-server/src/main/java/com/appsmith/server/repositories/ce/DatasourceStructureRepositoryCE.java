package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomDatasourceStructureRepository;
import reactor.core.publisher.Mono;

public interface DatasourceStructureRepositoryCE
        extends BaseRepository<DatasourceStorageStructure, String>, CustomDatasourceStructureRepository {

    Mono<DatasourceStorageStructure> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId);
}

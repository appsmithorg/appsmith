package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomDatasourceConfigurationStructureRepository;
import reactor.core.publisher.Mono;

public interface DatasourceConfigurationStructureRepositoryCE
        extends BaseRepository<DatasourceStorageStructure, String>, CustomDatasourceConfigurationStructureRepository {

    Mono<DatasourceStorageStructure> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId);

}

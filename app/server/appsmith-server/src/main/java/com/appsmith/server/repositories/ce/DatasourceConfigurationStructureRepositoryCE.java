package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceConfigurationStructure;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomDatasourceConfigurationStructureRepository;
import reactor.core.publisher.Mono;

public interface DatasourceConfigurationStructureRepositoryCE
        extends BaseRepository<DatasourceConfigurationStructure, String>, CustomDatasourceConfigurationStructureRepository {

    Mono<DatasourceConfigurationStructure> findByDatasourceId(String datasourceId);

}

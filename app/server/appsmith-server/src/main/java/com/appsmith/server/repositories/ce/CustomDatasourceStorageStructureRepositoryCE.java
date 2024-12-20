package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import reactor.core.publisher.Mono;

public interface CustomDatasourceStorageStructureRepositoryCE {

    Mono<Integer> updateStructure(String datasourceId, String environmentId, DatasourceStructure structure);

    Mono<DatasourceStorageStructure> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId);
}

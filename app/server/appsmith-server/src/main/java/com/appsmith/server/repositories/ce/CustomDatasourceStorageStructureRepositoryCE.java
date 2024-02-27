package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStructure;
import reactor.core.publisher.Mono;

public interface CustomDatasourceStorageStructureRepositoryCE {

    Mono<Void> updateStructure(String datasourceId, String environmentId, DatasourceStructure structure);
}

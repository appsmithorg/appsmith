package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Mono;

public interface CustomDatasourceStorageStructureRepositoryCE extends AppsmithRepository<DatasourceStorageStructure> {

    Mono<Integer> updateStructure(String datasourceId, String environmentId, DatasourceStructure structure);
}

package com.appsmith.server.services.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import reactor.core.publisher.Mono;

public interface DatasourceStructureServiceCE {

    Mono<DatasourceStorageStructure> getByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId);

    Mono<DatasourceStorageStructure> save(DatasourceStorageStructure datasourceStorageStructure);

    Mono<Void> saveStructure(String datasourceId, String environmentId, DatasourceStructure structure);
}

package com.appsmith.server.services.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Mono;

public interface DatasourceConfigurationStructureServiceCE {

    Mono<DatasourceStorageStructure> getByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId);

    Mono<DatasourceStorageStructure> save(DatasourceStorageStructure datasourceStorageStructure);

    Mono<UpdateResult> saveStructure(String datasourceId, DatasourceStructure structure);
}

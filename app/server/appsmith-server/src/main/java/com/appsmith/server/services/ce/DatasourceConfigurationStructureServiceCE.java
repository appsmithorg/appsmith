package com.appsmith.server.services.ce;

import com.appsmith.external.models.DatasourceConfigurationStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Mono;

public interface DatasourceConfigurationStructureServiceCE {

    Mono<DatasourceConfigurationStructure> getByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId);

    Mono<DatasourceConfigurationStructure> save(DatasourceConfigurationStructure datasourceConfigurationStructure);

    Mono<UpdateResult> saveStructure(String datasourceId, DatasourceStructure structure);
}

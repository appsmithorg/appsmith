package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStructure;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Mono;

public interface CustomDatasourceStructureRepositoryCE {

    Mono<UpdateResult> updateStructure(String datasourceId, DatasourceStructure structure);
}

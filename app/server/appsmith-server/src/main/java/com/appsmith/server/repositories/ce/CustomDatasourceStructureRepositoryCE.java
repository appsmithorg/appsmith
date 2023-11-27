package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStructure;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Mono;
import java.util.List;
import java.util.Optional;

public interface CustomDatasourceStructureRepositoryCE {

    Optional<UpdateResult> updateStructure(String datasourceId, String environmentId, DatasourceStructure structure);
}

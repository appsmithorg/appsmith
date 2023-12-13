package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStructure;
import com.mongodb.client.result.UpdateResult;

import java.util.Optional;
import java.util.List;

public interface CustomDatasourceStorageStructureRepositoryCE {

    Optional<UpdateResult> updateStructure(String datasourceId, String environmentId, DatasourceStructure structure);
}

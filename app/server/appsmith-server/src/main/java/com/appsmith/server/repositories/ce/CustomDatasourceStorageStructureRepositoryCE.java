package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.server.repositories.AppsmithRepository;
import com.mongodb.client.result.UpdateResult;

import java.util.Optional;

public interface CustomDatasourceStorageStructureRepositoryCE extends AppsmithRepository<DatasourceStorageStructure> {

    Optional<UpdateResult> updateStructure(String datasourceId, String environmentId, DatasourceStructure structure);
}

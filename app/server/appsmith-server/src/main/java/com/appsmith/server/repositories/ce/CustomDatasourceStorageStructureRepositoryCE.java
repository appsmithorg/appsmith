package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.server.repositories.AppsmithRepository;

public interface CustomDatasourceStorageStructureRepositoryCE extends AppsmithRepository<DatasourceStorageStructure> {

    int updateStructure(String datasourceId, String environmentId, DatasourceStructure structure, EntityManager entityManager);
}

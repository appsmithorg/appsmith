package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.server.repositories.AppsmithRepository;
import jakarta.persistence.EntityManager;

import java.util.Optional;

public interface CustomDatasourceStorageStructureRepositoryCE extends AppsmithRepository<DatasourceStorageStructure> {

    int updateStructure(String datasourceId, String environmentId, DatasourceStructure structure, EntityManager entityManager);

    Optional<DatasourceStorageStructure> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId);
}

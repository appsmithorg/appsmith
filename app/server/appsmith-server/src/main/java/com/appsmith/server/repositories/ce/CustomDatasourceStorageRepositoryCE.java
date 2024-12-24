package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.List;
import java.util.Optional;

public interface CustomDatasourceStorageRepositoryCE extends AppsmithRepository<DatasourceStorage> {
    Optional<DatasourceStorage> findByDatasourceIdAndEnvironmentId(
            String datasourceId, String environmentId, EntityManager entityManager);

    List<DatasourceStorage> findByDatasourceId(String datasourceId, EntityManager entityManager);
}

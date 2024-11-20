package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.repositories.BaseRepository;

import java.util.List;
import java.util.Optional;

public interface DatasourceStorageRepositoryCE extends BaseRepository<DatasourceStorage, String> {
    List<DatasourceStorage> findByDatasourceId(String datasourceId, EntityManager entityManager);

    Optional<DatasourceStorage> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId, EntityManager entityManager);
}

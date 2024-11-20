package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomDatasourceStorageStructureRepository;

import java.util.Optional;

public interface DatasourceStorageStructureRepositoryCE
        extends BaseRepository<DatasourceStorageStructure, String>, CustomDatasourceStorageStructureRepository {

    Optional<DatasourceStorageStructure> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId, EntityManager entityManager);
}

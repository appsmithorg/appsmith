package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomDatasourceStructureRepository;
import reactor.core.publisher.Mono;
import java.util.List;
import java.util.Optional;

public interface DatasourceStructureRepositoryCE
        extends BaseRepository<DatasourceStorageStructure, String>, CustomDatasourceStructureRepository {

    Optional<DatasourceStorageStructure> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId);
}

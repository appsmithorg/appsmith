package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomDatasourceStorageRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface DatasourceStorageRepositoryCE
        extends BaseRepository<DatasourceStorage, String>, CustomDatasourceStorageRepository {
    Flux<DatasourceStorage> findByDatasourceId(String datasourceId);
}

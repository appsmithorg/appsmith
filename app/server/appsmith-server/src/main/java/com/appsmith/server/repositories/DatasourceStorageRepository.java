package com.appsmith.server.repositories;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.repositories.ce.DatasourceStorageRepositoryCE;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface DatasourceStorageRepository extends DatasourceStorageRepositoryCE, CustomDatasourceStorageRepository {

    Flux<DatasourceStorage> findByEnvironmentId(String environmentId);
}

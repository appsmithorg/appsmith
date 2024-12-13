package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Mono;

public interface CustomDatasourceStorageRepositoryCE extends AppsmithRepository<DatasourceStorage> {
    Mono<DatasourceStorage> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId);
}

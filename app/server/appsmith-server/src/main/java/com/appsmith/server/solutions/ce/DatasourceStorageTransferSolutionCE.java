package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import reactor.core.publisher.Mono;

public interface DatasourceStorageTransferSolutionCE {
    DatasourceStorage initializeDatasourceStorage(Datasource datasource, String environmentId);

    Mono<DatasourceStorage> transferAndGetDatasourceStorage(Datasource datasource, String environmentId);

    Mono<DatasourceStorage> transferToFallbackEnvironmentAndGetDatasourceStorage(Datasource datasource);
}

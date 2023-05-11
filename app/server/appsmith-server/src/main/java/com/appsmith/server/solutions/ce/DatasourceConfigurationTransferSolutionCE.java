package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfigurationStorage;
import reactor.core.publisher.Mono;

public interface DatasourceConfigurationTransferSolutionCE {

    Mono<DatasourceConfigurationStorage> createDatasourceStorageAndDeleteDatasourceConfiguration(Datasource datasource, String environmentId);
}

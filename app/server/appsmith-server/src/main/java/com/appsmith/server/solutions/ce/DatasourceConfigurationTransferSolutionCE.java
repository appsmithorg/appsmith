package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import reactor.core.publisher.Mono;

public interface DatasourceConfigurationTransferSolutionCE {

    Mono<DatasourceConfiguration> createDatasourceStorageAndGetDatasourceConfiguration(Datasource datasource, String environmentId);
}

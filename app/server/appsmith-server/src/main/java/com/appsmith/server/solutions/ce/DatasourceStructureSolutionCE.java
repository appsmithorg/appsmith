package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStructure;
import reactor.core.publisher.Mono;

public interface DatasourceStructureSolutionCE {

    Mono<DatasourceStructure> getStructure(String datasourceId, boolean ignoreCache, String environmentName);

    Mono<DatasourceStructure> getStructure(DatasourceStorage datasourceStorage, boolean ignoreCache);
}

package com.appsmith.server.services;

import com.appsmith.server.domains.DatasourceContext;
import reactor.core.publisher.Mono;

public interface DatasourceContextService {

    /**
     * This function is responsible for returning the datasource context stored
     * against the datasource id. In case the datasourceId is not found in the
     * map, create a new datasource context and return that.
     * @param datasourceId
     * @return DatasourceContext
     */
    Mono<DatasourceContext> getDatasourceContext(String datasourceId);

    Mono<DatasourceContext> deleteDatasourceContext(String datasourceId);
}

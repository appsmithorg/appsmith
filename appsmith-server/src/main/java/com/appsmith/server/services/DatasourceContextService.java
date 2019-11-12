package com.appsmith.server.services;

import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.DatasourceContext;
import reactor.core.publisher.Mono;

public interface DatasourceContextService {

    /**
     * This function is responsible for returning the datasource context stored
     * against the datasource id. In case the datasourceId is not found in the
     * map, create a new datasource context and return that.
     * @param datasource
     * @return DatasourceContext
     */
    Mono<DatasourceContext> getDatasourceContext(Datasource datasource);

    Mono<DatasourceContext> deleteDatasourceContext(String datasourceId);
}

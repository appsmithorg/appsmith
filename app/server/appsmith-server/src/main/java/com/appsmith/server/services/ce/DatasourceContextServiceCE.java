package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.DatasourceContext;
import reactor.core.publisher.Mono;

import java.util.function.Function;

public interface DatasourceContextServiceCE {

    /**
     * This function is responsible for returning the datasource context stored
     * against the datasource id. In case the datasourceId is not found in the
     * map, create a new datasource context and return that.
     *
     * @param datasource
     * @return DatasourceContext
     */
    Mono<DatasourceContext> getDatasourceContext(Datasource datasource);

    <T> Mono<T> retryOnce(Datasource datasource, Function<DatasourceContext, Mono<T>> task);

    Mono<DatasourceContext> deleteDatasourceContext(String datasourceId);
}

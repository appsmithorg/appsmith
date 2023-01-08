package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.DatasourceContext;
import com.appsmith.server.domains.DsContextMapKey;
import com.appsmith.server.domains.Plugin;
import reactor.core.publisher.Mono;

import java.util.function.Function;
import java.util.Map;

public interface DatasourceContextServiceCE {

    /**
     * This function is responsible for returning the datasource context stored
     * against the datasource id. In case the datasourceId is not found in the
     * map, create a new datasource context and return that.
     *
     * @param dsContextMapKey
     * @return DatasourceContext
     */
    Mono<DatasourceContext<?>> getDatasourceContext(Datasource datasource, DsContextMapKey dsContextMapKey, Map<String, BaseDomain> environmentMap);

    Mono<DatasourceContext<?>> getRemoteDatasourceContext(Plugin plugin, Datasource datasource);

    <T> Mono<T> retryOnce(Datasource datasource, DsContextMapKey dsContextMapKey,
                          Map<String, BaseDomain> environmentMap, Function<DatasourceContext<?>, Mono<T>> task);

    Mono<DatasourceContext<?>> deleteDatasourceContext(DsContextMapKey dsContextMapKey);

    DsContextMapKey getCustomKey(Datasource datasource);
}

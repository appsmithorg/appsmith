package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.DatasourceContext;
import com.appsmith.server.domains.DatasourceContextIdentifier;
import com.appsmith.server.domains.Plugin;
import reactor.core.publisher.Mono;

import java.util.function.Function;
import java.util.Map;

public interface DatasourceContextServiceCE {

    /**
     * This function is responsible for returning the datasource context stored
     * against the DatasourceContextIdentifier object,
     * which stores datasourceId in CE and environmentId as well in EE.
     * In case the datasourceId is not found in the
     * map, create a new datasource context and return that.
     * The environmentMap parameter is not being Used in the CE version. it's specific to EE version
     * @param datasource
     * @param datasourceContextIdentifier
     * @param environmentMap
     * @return DatasourceContext
     */
    Mono<DatasourceContext<?>> getDatasourceContext(Datasource datasource, DatasourceContextIdentifier datasourceContextIdentifier,
                                                    Map<String, BaseDomain> environmentMap);

    Mono<DatasourceContext<?>> getRemoteDatasourceContext(Plugin plugin, Datasource datasource);

    <T> Mono<T> retryOnce(Datasource datasource, DatasourceContextIdentifier datasourceContextIdentifier,
                          Map<String, BaseDomain> environmentMap, Function<DatasourceContext<?>, Mono<T>> task);

    Mono<DatasourceContext<?>> deleteDatasourceContext(DatasourceContextIdentifier datasourceContextIdentifier);

    DatasourceContextIdentifier createDsContextIdentifier(Datasource datasource);
}

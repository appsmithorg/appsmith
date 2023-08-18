package com.appsmith.server.services.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.domains.DatasourceContext;
import com.appsmith.server.domains.DatasourceContextIdentifier;
import com.appsmith.server.domains.Plugin;
import reactor.core.publisher.Mono;

import java.util.function.Function;

public interface DatasourceContextServiceCE {

    /**
     * This function is responsible for returning the datasource context stored
     * against the DatasourceContextIdentifier object,
     * which stores datasourceId in CE and environmentId as well in EE.
     * In case the datasourceId is not found in the
     * map, create a new datasource context and return that.
     * The environmentMap parameter is not being Used in the CE version. it's specific to EE version
     * @param datasourceStorage
     * @return DatasourceContext
     */
    Mono<DatasourceContext<?>> getDatasourceContext(DatasourceStorage datasourceStorage);

    Mono<DatasourceContext<?>> getDatasourceContext(DatasourceStorage datasourceStorage, Plugin plugin);

    Mono<DatasourceContext<?>> getRemoteDatasourceContext(Plugin plugin, DatasourceStorage datasourceStorage);

    <T> Mono<T> retryOnce(DatasourceStorage datasourceStorage, Function<DatasourceContext<?>, Mono<T>> task);

    Mono<DatasourceContext<?>> deleteDatasourceContext(DatasourceStorage datasourceStorage);

    DatasourceContextIdentifier initializeDatasourceContextIdentifier(DatasourceStorage datasourceStorage);
}

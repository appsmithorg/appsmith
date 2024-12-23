package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public class CustomDatasourceStorageRepositoryCEImpl extends BaseAppsmithRepositoryImpl<DatasourceStorage>
        implements CustomDatasourceStorageRepositoryCE {
    @Override
    public Mono<DatasourceStorage> findByDatasourceIdAndEnvironmentId(String datasourceId, String environmentId) {
        final BridgeQuery<DatasourceStorage> q = Bridge.<DatasourceStorage>equal(
                        DatasourceStorage.Fields.datasourceId, datasourceId)
                .equal(DatasourceStorage.Fields.environmentId, environmentId);
        return queryBuilder().criteria(q).one();
    }

    @Override
    public Flux<DatasourceStorage> findByDatasourceId(String datasourceId) {
        final BridgeQuery<DatasourceStorage> q =
                Bridge.<DatasourceStorage>equal(DatasourceStorage.Fields.datasourceId, datasourceId);
        return queryBuilder().criteria(q).all();
    }
}

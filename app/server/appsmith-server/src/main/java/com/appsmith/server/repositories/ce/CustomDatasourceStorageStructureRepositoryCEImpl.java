package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class CustomDatasourceStorageStructureRepositoryCEImpl
        extends BaseAppsmithRepositoryImpl<DatasourceStorageStructure>
        implements CustomDatasourceStorageStructureRepositoryCE {

    @Override
    public Mono<Integer> updateStructure(String datasourceId, String environmentId, DatasourceStructure structure) {
        return queryBuilder()
                .criteria(Bridge.equal(DatasourceStorageStructure.Fields.datasourceId, datasourceId)
                        .equal(DatasourceStorageStructure.Fields.environmentId, environmentId))
                .updateFirst(Bridge.update().set(DatasourceStorageStructure.Fields.structure, structure));
    }

    @Override
    public Mono<DatasourceStorageStructure> findByDatasourceIdAndEnvironmentId(
            String datasourceId, String environmentId) {
        final BridgeQuery<DatasourceStorageStructure> q = Bridge.<DatasourceStorageStructure>equal(
                        DatasourceStorageStructure.Fields.datasourceId, datasourceId)
                .equal(DatasourceStorageStructure.Fields.environmentId, environmentId);
        return queryBuilder().criteria(q).one();
    }
}

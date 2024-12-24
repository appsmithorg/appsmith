package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import jakarta.persistence.EntityManager;

import java.util.List;
import java.util.Optional;

public class CustomDatasourceStorageRepositoryCEImpl extends BaseAppsmithRepositoryImpl<DatasourceStorage>
        implements CustomDatasourceStorageRepositoryCE {
    @Override
    public Optional<DatasourceStorage> findByDatasourceIdAndEnvironmentId(
            String datasourceId, String environmentId, EntityManager entityManager) {
        final BridgeQuery<DatasourceStorage> q = Bridge.<DatasourceStorage>equal(
                        DatasourceStorage.Fields.datasourceId, datasourceId)
                .equal(DatasourceStorage.Fields.environmentId, environmentId);
        return queryBuilder().criteria(q).entityManager(entityManager).one();
    }

    @Override
    public List<DatasourceStorage> findByDatasourceId(String datasourceId, EntityManager entityManager) {
        final BridgeQuery<DatasourceStorage> q =
                Bridge.<DatasourceStorage>equal(DatasourceStorage.Fields.datasourceId, datasourceId);
        return queryBuilder().criteria(q).entityManager(entityManager).all();
    }
}

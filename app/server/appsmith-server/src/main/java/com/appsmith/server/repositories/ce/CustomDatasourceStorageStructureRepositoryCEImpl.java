package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class CustomDatasourceStorageStructureRepositoryCEImpl
        extends BaseAppsmithRepositoryImpl<DatasourceStorageStructure>
        implements CustomDatasourceStorageStructureRepositoryCE {

    @Override
    @Transactional
    @Modifying
    public int updateStructure(String datasourceId, String environmentId, DatasourceStructure structure) {
        return queryBuilder()
                .criteria(Bridge.equal(DatasourceStorageStructure.Fields.datasourceId, datasourceId)
                        .equal(DatasourceStorageStructure.Fields.environmentId, environmentId))
                .updateFirst(Bridge.update().set(DatasourceStorageStructure.Fields.structure, structure));
    }

    @Override
    public Optional<DatasourceStorageStructure> findByDatasourceIdAndEnvironmentId(
            String datasourceId, String environmentId) {
        final BridgeQuery<DatasourceStorageStructure> q = Bridge.<DatasourceStorageStructure>equal(
                        DatasourceStorageStructure.Fields.datasourceId, datasourceId)
                .equal(DatasourceStorageStructure.Fields.environmentId, environmentId);
        return queryBuilder().criteria(q).one();
    }
}

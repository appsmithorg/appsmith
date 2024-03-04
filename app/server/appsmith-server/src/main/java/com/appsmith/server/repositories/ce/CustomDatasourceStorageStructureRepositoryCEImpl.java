package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomDatasourceStorageStructureRepositoryCEImpl
        extends BaseAppsmithRepositoryImpl<DatasourceStorageStructure>
        implements CustomDatasourceStorageStructureRepositoryCE {

    public CustomDatasourceStorageStructureRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public int updateStructure(String datasourceId, String environmentId, DatasourceStructure structure) {
        return queryBuilder()
                .criteria(Bridge.equal(DatasourceStorageStructure.Fields.datasourceId, datasourceId)
                        .equal(DatasourceStorageStructure.Fields.environmentId, environmentId))
                .updateFirst(Bridge.update().set(DatasourceStorageStructure.Fields.structure, structure));
    }
}

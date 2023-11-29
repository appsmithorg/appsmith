package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;

import java.util.Optional;

import static org.springframework.data.mongodb.core.query.Criteria.where;

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

    public static Criteria getDatasourceIdAndEnvironmentIdCriteria(String datasourceId, String environmentId) {
        return new Criteria()
                .andOperator(
                        where("datasourceId").is(datasourceId),
                        where("environmentId").is(environmentId));
    }

    @Override
    public Optional<UpdateResult> updateStructure(
            String datasourceId, String environmentId, DatasourceStructure structure) {
        return Optional.empty(); /*
        return mongoOperations.upsert(
                new Query().addCriteria(getDatasourceIdAndEnvironmentIdCriteria(datasourceId, environmentId)),
                Update.update("structure", structure),
                DatasourceStorageStructure.class);*/
    }
}

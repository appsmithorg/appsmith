package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

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
                        where(DatasourceStorageStructure.Fields.datasourceId).is(datasourceId),
                        where(DatasourceStorageStructure.Fields.environmentId).is(environmentId));
    }

    @Override
    public Mono<Integer> updateStructure(String datasourceId, String environmentId, DatasourceStructure structure) {
        return mongoOperations
                .upsert(
                        new Query().addCriteria(getDatasourceIdAndEnvironmentIdCriteria(datasourceId, environmentId)),
                        Update.update(DatasourceStorageStructure.Fields.structure, structure),
                        DatasourceStorageStructure.class)
                .map(updateResult -> Math.toIntExact(updateResult.getModifiedCount()));
    }
}

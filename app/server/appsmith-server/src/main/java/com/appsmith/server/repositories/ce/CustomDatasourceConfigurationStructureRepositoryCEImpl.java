package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.DatasourceConfigurationStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.QDatasourceConfigurationStructure;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Component
public class CustomDatasourceConfigurationStructureRepositoryCEImpl
        extends BaseAppsmithRepositoryImpl<DatasourceConfigurationStructure>
        implements CustomDatasourceConfigurationStructureRepositoryCE {
    public CustomDatasourceConfigurationStructureRepositoryCEImpl(ReactiveMongoOperations mongoOperations,
                                                                  MongoConverter mongoConverter,
                                                                  CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Mono<UpdateResult> updateStructure(String datasourceId, DatasourceStructure structure) {
        return mongoOperations.upsert(
                query(where(fieldName(QDatasourceConfigurationStructure.datasourceConfigurationStructure.datasourceId)).is(datasourceId)),
                Update.update(fieldName(QDatasourceConfigurationStructure.datasourceConfigurationStructure.structure), structure),
                DatasourceConfigurationStructure.class
        );
    }
}

package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomDatasourceStructureRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomDatasourceStructureRepositoryImpl extends CustomDatasourceStructureRepositoryCEImpl
        implements CustomDatasourceStructureRepository {
    public CustomDatasourceStructureRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }
}

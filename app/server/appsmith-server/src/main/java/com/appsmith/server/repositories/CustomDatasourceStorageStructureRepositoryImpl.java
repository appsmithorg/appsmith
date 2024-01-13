package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomDatasourceStorageStructureRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomDatasourceStorageStructureRepositoryImpl extends CustomDatasourceStorageStructureRepositoryCEImpl
        implements CustomDatasourceStorageStructureRepository {
    public CustomDatasourceStorageStructureRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }
}

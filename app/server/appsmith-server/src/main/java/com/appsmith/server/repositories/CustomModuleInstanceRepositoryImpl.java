package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomModuleInstanceRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomModuleInstanceRepositoryImpl extends CustomModuleInstanceRepositoryCEImpl
        implements CustomModuleInstanceRepository {

    public CustomModuleInstanceRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }
}

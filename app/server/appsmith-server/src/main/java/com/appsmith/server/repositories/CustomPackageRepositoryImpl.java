package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomPackageRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomPackageRepositoryImpl extends CustomPackageRepositoryCEImpl implements CustomPackageRepository {

    public CustomPackageRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }
}

package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomJSLibRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomJSLibRepositoryImpl extends CustomJSLibRepositoryCEImpl implements CustomJSLibRepository {
    public CustomJSLibRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter,
                                     CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }
}

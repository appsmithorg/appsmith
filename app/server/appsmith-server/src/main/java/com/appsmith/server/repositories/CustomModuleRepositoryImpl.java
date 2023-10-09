package com.appsmith.server.repositories;

import com.appsmith.server.domains.Module;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomModuleRepositoryImpl extends BaseAppsmithRepositoryImpl<Module> implements CustomModuleRepository {

    public CustomModuleRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }
}

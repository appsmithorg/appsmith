package com.appsmith.server.repositories.ce;

import com.appsmith.caching.components.CacheManager;
import com.appsmith.server.domains.Collection;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomCollectionRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Collection> implements CustomCollectionRepositoryCE {

    @Autowired
    public CustomCollectionRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheManager cacheManager) {
        super(mongoOperations, mongoConverter, cacheManager);
    }
}

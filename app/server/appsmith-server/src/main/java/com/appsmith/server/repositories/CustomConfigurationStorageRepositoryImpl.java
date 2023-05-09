package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomConfigurationStorageRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Component
public class CustomConfigurationStorageRepositoryImpl extends CustomConfigurationStorageRepositoryCEImpl
        implements CustomConfigurationStorageRepository {

    public CustomConfigurationStorageRepositoryImpl(ReactiveMongoOperations mongoOperations,
                                                    MongoConverter mongoConverter,
                                                    CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }
}

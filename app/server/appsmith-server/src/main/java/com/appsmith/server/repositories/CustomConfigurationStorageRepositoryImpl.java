package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomConfigurationStorageRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CustomConfigurationStorageRepositoryImpl extends CustomConfigurationStorageRepositoryCEImpl
        implements CustomConfigurationStorageRepository {

    public CustomConfigurationStorageRepositoryImpl(ReactiveMongoOperations mongoOperations,
                                                    MongoConverter mongoConverter,
                                                    CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }
}

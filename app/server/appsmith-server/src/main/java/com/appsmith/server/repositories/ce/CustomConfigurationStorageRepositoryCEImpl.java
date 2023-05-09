package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.ConfigurationStorage;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomConfigurationStorageRepositoryCEImpl
        extends BaseAppsmithRepositoryImpl<ConfigurationStorage>
        implements CustomConfigurationStorageRepositoryCE {

    public CustomConfigurationStorageRepositoryCEImpl(ReactiveMongoOperations mongoOperations,
                                                      MongoConverter mongoConverter,
                                                      CacheableRepositoryHelper cacheableRepositoryHelper) {

        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

}

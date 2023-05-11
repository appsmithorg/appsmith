package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomDatasourceConfigurationStorageRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CustomDatasourceConfigurationStorageRepositoryImpl extends CustomDatasourceConfigurationStorageRepositoryCEImpl
        implements CustomDatasourceConfigurationStorageRepository {

    public CustomDatasourceConfigurationStorageRepositoryImpl(ReactiveMongoOperations mongoOperations,
                                                              MongoConverter mongoConverter,
                                                              CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }
}

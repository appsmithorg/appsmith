package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomDatasourceConfigurationStructureRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomDatasourceConfigurationStructureRepositoryImpl
        extends CustomDatasourceConfigurationStructureRepositoryCEImpl
        implements CustomDatasourceConfigurationStructureRepository {
    public CustomDatasourceConfigurationStructureRepositoryImpl(ReactiveMongoOperations mongoOperations,
                                                                MongoConverter mongoConverter,
                                                                CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }
}

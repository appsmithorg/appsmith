package com.appsmith.server.repositories;

import com.appsmith.server.domains.Tenant;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;

public class CustomTenantRepositoryImpl extends BaseAppsmithRepositoryImpl<Tenant>
        implements CustomTenantRepository {

    public CustomTenantRepositoryImpl(ReactiveMongoOperations mongoOperations,
                                      MongoConverter mongoConverter,
                                      CacheableRepositoryHelper cacheableRepositoryHelper) {

        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }
}

package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomTenantRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;

public class CustomTenantRepositoryImpl extends CustomTenantRepositoryCEImpl implements CustomTenantRepository {

    public CustomTenantRepositoryImpl(
            CacheableRepositoryHelper cacheableRepositoryHelper, ReactiveMongoOperations mongoOperations) {
        super(cacheableRepositoryHelper, mongoOperations);
    }
}

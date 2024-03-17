package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomTenantRepositoryCEImpl;

public class CustomTenantRepositoryImpl extends CustomTenantRepositoryCEImpl implements CustomTenantRepository {

    public CustomTenantRepositoryImpl(CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(cacheableRepositoryHelper);
    }
}

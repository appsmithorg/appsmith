package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CustomPermissionGroupRepositoryCEImpl;
import org.springframework.stereotype.Component;

@Component
public class CustomPermissionGroupRepositoryImpl extends CustomPermissionGroupRepositoryCEImpl
        implements CustomPermissionGroupRepository {

    public CustomPermissionGroupRepositoryImpl(CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(cacheableRepositoryHelper);
    }
}

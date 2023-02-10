package com.appsmith.server.repositories.ce;

import com.appsmith.server.repositories.CacheableRepositoryHelper;
import reactor.core.publisher.Mono;

public class CacheableRepositoryUtilCEImpl implements CacheableRepositoryUtilCE {

    private final CacheableRepositoryHelper cacheableRepositoryHelper;

    public CacheableRepositoryUtilCEImpl(CacheableRepositoryHelper cacheableRepositoryHelper) {
        this.cacheableRepositoryHelper = cacheableRepositoryHelper;
    }

    @Override
    public Mono<Void> evictAllPermissionGroupRelatedDetailsForUser(String email, String tenantId) {
        return cacheableRepositoryHelper.evictPermissionGroupsUser(email, tenantId);
    }
}

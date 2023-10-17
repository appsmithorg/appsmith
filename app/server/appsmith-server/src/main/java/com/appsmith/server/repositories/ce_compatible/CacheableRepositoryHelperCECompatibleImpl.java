package com.appsmith.server.repositories.ce_compatible;

import com.appsmith.caching.annotations.CacheEvict;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.InMemoryCacheableRepositoryHelper;
import com.appsmith.server.repositories.ce.CacheableRepositoryHelperCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class CacheableRepositoryHelperCECompatibleImpl extends CacheableRepositoryHelperCEImpl
        implements CacheableRepositoryHelperCECompatible {
    public CacheableRepositoryHelperCECompatibleImpl(
            ReactiveMongoOperations mongoOperations,
            InMemoryCacheableRepositoryHelper inMemoryCacheableRepositoryHelper) {
        super(mongoOperations, inMemoryCacheableRepositoryHelper);
    }

    @Override
    public Mono<Long> getAllReadablePermissionGroupsForUser(User user) {
        return Mono.just(0L);
    }

    @Override
    @CacheEvict(cacheName = "readablePermissionGroupCountForUser", key = "{#email + #tenantId}")
    public Mono<Void> evictGetAllReadablePermissionGroupsForUser(String email, String tenantId) {
        return Mono.empty();
    }

    @Override
    @CacheEvict(cacheName = "gacEnabled_permissionGroupsForUser", key = "{#email + #tenantId}")
    public Mono<Void> evictGacEnabledPermissionGroupsUser(String email, String tenantId) {
        return Mono.empty();
    }
}

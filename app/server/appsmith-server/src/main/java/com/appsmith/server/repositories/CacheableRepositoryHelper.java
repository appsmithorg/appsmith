package com.appsmith.server.repositories;

import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.ce_compatible.CacheableRepositoryHelperCECompatible;
import reactor.core.publisher.Mono;

public interface CacheableRepositoryHelper extends CacheableRepositoryHelperCECompatible {
    Mono<Long> getAllReadablePermissionGroupsForUser(User user);

    Mono<Void> evictGetAllReadablePermissionGroupsForUser(String email, String tenantId);
}

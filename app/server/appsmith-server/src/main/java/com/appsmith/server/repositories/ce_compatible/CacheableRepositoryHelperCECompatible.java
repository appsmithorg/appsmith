package com.appsmith.server.repositories.ce_compatible;

import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.ce.CacheableRepositoryHelperCE;
import reactor.core.publisher.Mono;

public interface CacheableRepositoryHelperCECompatible extends CacheableRepositoryHelperCE {
    Mono<Long> getAllReadablePermissionGroupsForUser(User user);

    Mono<Void> evictGetAllReadablePermissionGroupsForUser(String email, String tenantId);

    Mono<Void> evictGacEnabledPermissionGroupsUser(String email, String tenantId);
}

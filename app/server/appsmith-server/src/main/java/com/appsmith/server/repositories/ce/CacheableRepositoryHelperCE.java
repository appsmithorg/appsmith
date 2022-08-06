package com.appsmith.server.repositories.ce;

import com.appsmith.caching.annotations.CacheEvict;
import com.appsmith.server.domains.User;
import reactor.core.publisher.Mono;

import java.util.Set;

public interface CacheableRepositoryHelperCE {

    Mono<Set<String>> getAllPermissionGroupsForUser(User user);

    Mono<Void> evictPermissionGroupsUser(String email, String tenantId);
}

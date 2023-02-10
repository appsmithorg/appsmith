package com.appsmith.server.repositories.ce;

import reactor.core.publisher.Mono;

public interface CacheableRepositoryUtilCE {
    Mono<Void> evictAllPermissionGroupRelatedDetailsForUser(String email, String tenantId);
}

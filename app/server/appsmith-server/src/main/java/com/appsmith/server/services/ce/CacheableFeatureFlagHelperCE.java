package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.CachedFlags;
import reactor.core.publisher.Mono;

public interface CacheableFeatureFlagHelperCE {

    Mono<CachedFlags> fetchUserCachedFlags(String userIdentifier, User user);

    Mono<Void> evictUserCachedFlags(String userIdentifier);

    /**
     * To fetch the tenant features via cache
     * @param tenantId Id of the tenant
     * @return Mono of CachedFeatures
     */
    Mono<CachedFeatures> fetchTenantCachedFeatures(String tenantId);

    /**
     * To evict the tenant features cache
     * @param tenantId Id of the tenant
     * @return Mono of Void
     */
    Mono<Void> evictTenantCachedFeatures(String tenantId);
}

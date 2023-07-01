package com.appsmith.server.services;
import com.appsmith.caching.annotations.Cache;
import com.appsmith.caching.annotations.CacheEvict;
import com.appsmith.server.featureflags.CachedFlags;
import reactor.core.publisher.Mono;

public interface CacheableFeatureFlagHelper {

    @Cache(cacheName = "featureFlag", key = "test")
    Mono<CachedFlags> fetchUserCachedFlags(String userIdentifier);

    @CacheEvict(cacheName = "featureFlag", key = "test")
    Mono<Void> evictUserCachedFlags(String userIdentifier);
}

package com.appsmith.server.services.ce;

import com.appsmith.server.featureflags.CachedFlags;
import reactor.core.publisher.Mono;

public interface CacheableFeatureFlagHelperCE {

    Mono<CachedFlags> fetchUserCachedFlags(String userIdentifier);

    Mono<Void> evictUserCachedFlags(String userIdentifier);
}

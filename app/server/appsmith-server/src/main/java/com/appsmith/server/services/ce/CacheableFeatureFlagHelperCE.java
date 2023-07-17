package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.featureflags.CachedFlags;
import reactor.core.publisher.Mono;

public interface CacheableFeatureFlagHelperCE {

    Mono<CachedFlags> fetchUserCachedFlags(String userIdentifier, User user);

    Mono<Void> evictUserCachedFlags(String userIdentifier);
}

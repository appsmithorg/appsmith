package com.appsmith.server.helpers;

import com.appsmith.caching.annotations.Cache;
import com.appsmith.caching.annotations.CacheEvict;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.FeaturesRequestDTO;
import com.appsmith.server.dtos.FeaturesResponseDTO;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.CachedFlags;
import com.appsmith.server.services.CacheableFeatureFlagHelper;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;

@Profile("test")
@Primary
@Component
public class MockCacheableFeatureFlagHelper implements CacheableFeatureFlagHelper {

    @Cache(cacheName = "featureFlag", key = "{#userIdentifier}")
    @Override
    public Mono<CachedFlags> fetchUserCachedFlags(String userIdentifier, User user) {
        CachedFlags cachedFlags = new CachedFlags();
        cachedFlags.setRefreshedAt(Instant.now().minus(1, ChronoUnit.DAYS));
        cachedFlags.setFlags(new HashMap<>());
        return Mono.just(cachedFlags);
    }

    @Cache(cacheName = "featureFlag", key = "{#userIdentifier}")
    @Override
    public Mono<CachedFlags> updateUserCachedFlags(String userIdentifier, CachedFlags cachedFlags) {
        return Mono.just(cachedFlags);
    }

    @CacheEvict(cacheName = "featureFlag", key = "{#userIdentifier}")
    @Override
    public Mono<Void> evictUserCachedFlags(String userIdentifier) {
        return Mono.empty();
    }

    @Cache(cacheName = "tenantNewFeatures", key = "{#tenantId}")
    @Override
    public Mono<CachedFeatures> fetchCachedTenantFeatures(String tenantId) {
        return getRemoteFeaturesForTenant(new FeaturesRequestDTO()).map(responseDTO -> {
            CachedFeatures cachedFeatures = new CachedFeatures();
            cachedFeatures.setRefreshedAt(Instant.now().minus(1, ChronoUnit.DAYS));
            cachedFeatures.setFeatures(responseDTO.getFeatures());
            return cachedFeatures;
        });
    }

    @Cache(cacheName = "tenantNewFeatures", key = "{#tenantId}")
    @Override
    public Mono<CachedFeatures> updateCachedTenantFeatures(String tenantId, CachedFeatures cachedFeatures) {
        return Mono.just(cachedFeatures);
    }

    @CacheEvict(cacheName = "tenantNewFeatures", key = "{#tenantId}")
    @Override
    public Mono<Void> evictCachedTenantFeatures(String tenantId) {
        return Mono.empty();
    }

    @Override
    public Mono<FeaturesResponseDTO> getRemoteFeaturesForTenant(FeaturesRequestDTO featuresRequestDTO) {
        FeaturesResponseDTO responseDTO = new FeaturesResponseDTO();
        responseDTO.setFeatures(new HashMap<>());
        return Mono.just(responseDTO);
    }
}

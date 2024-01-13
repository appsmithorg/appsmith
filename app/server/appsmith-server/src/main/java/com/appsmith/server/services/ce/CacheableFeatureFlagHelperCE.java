package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.FeaturesRequestDTO;
import com.appsmith.server.dtos.FeaturesResponseDTO;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.CachedFlags;
import reactor.core.publisher.Mono;

public interface CacheableFeatureFlagHelperCE {

    Mono<CachedFlags> fetchUserCachedFlags(String userIdentifier, User user);

    Mono<CachedFlags> updateUserCachedFlags(String userIdentifier, CachedFlags cachedFlags);

    Mono<Void> evictUserCachedFlags(String userIdentifier);

    /**
     * To fetch the tenant new features via cache
     * @param tenantId Id of the tenant
     * @return Mono of CachedFeatures
     */
    Mono<CachedFeatures> fetchCachedTenantFeatures(String tenantId);

    Mono<CachedFeatures> updateCachedTenantFeatures(String tenantId, CachedFeatures cachedFeatures);

    /**
     * To evict the tenant new features cache
     * @param tenantId Id of the tenant
     * @return Mono of Void
     */
    Mono<Void> evictCachedTenantFeatures(String tenantId);

    /**
     * To get all tenant features from Cloud Services
     * @param featuresRequestDTO FeaturesRequestDTO
     * @return Mono of Map
     */
    Mono<FeaturesResponseDTO> getRemoteFeaturesForTenant(FeaturesRequestDTO featuresRequestDTO);
}

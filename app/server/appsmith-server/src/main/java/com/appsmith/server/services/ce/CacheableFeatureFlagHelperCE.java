package com.appsmith.server.services.ce;

import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ce.FeaturesRequestDTO;
import com.appsmith.server.dtos.ce.FeaturesResponseDTO;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.CachedFlags;
import reactor.core.publisher.Mono;

public interface CacheableFeatureFlagHelperCE {

    Mono<CachedFlags> fetchUserCachedFlags(String userIdentifier, User user);

    Mono<Void> evictUserCachedFlags(String userIdentifier);

    /**
     * To fetch the tenant current features via cache
     * @param tenantId Id of the tenant
     * @return Mono of CachedFeatures
     */
    Mono<CachedFeatures> fetchCachedTenantCurrentFeatures(String tenantId);

    /**
     * To evict the tenant current features cache
     * @param tenantId Id of the tenant
     * @return Mono of Void
     */
    Mono<Void> evictCachedTenantCurrentFeatures(String tenantId);

    /**
     * To fetch the tenant new features via cache
     * @param tenantId Id of the tenant
     * @return Mono of CachedFeatures
     */
    Mono<CachedFeatures> fetchCachedTenantNewFeatures(String tenantId);

    /**
     * To evict the tenant new features cache
     * @param tenantId Id of the tenant
     * @return Mono of Void
     */
    Mono<Void> evictCachedTenantNewFeatures(String tenantId);

    /**
     * To get all tenant features from Cloud Services
     * @param featuresRequestDTO FeaturesRequestDTO
     * @return Mono of Map
     */
    Mono<FeaturesResponseDTO> getRemoteFeaturesForTenant(FeaturesRequestDTO featuresRequestDTO);

    /**
     * To force update all features of the current tenant.
     * @return Mono of Map
     */
    Mono<CachedFeatures> forceUpdateTenantFeatures(String tenantId);
}

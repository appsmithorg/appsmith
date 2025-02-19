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
     * To fetch the org new features via cache
     * @param organizationId Id of the organization
     * @return Mono of CachedFeatures
     */
    Mono<CachedFeatures> fetchCachedOrganizationFeatures(String organizationId);

    Mono<CachedFeatures> updateCachedOrganizationFeatures(String organizationId, CachedFeatures cachedFeatures);

    /**
     * To evict the org new features cache
     * @param organizationId Id of the organization
     * @return Mono of Void
     */
    Mono<Void> evictCachedOrganizationFeatures(String organizationId);

    /**
     * To get all organization features from Cloud Services
     * @param featuresRequestDTO FeaturesRequestDTO
     * @return Mono of Map
     */
    Mono<FeaturesResponseDTO> getRemoteFeaturesForOrganization(FeaturesRequestDTO featuresRequestDTO);
}

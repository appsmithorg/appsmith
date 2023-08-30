package com.appsmith.server.services.ce;

import com.appsmith.caching.annotations.Cache;
import com.appsmith.caching.annotations.CacheEvict;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.ce.FeaturesRequestDTO;
import com.appsmith.server.dtos.ce.FeaturesResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.CachedFlags;
import com.appsmith.server.featureflags.FeatureFlagIdentityTraits;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.UserIdentifierService;
import com.appsmith.server.solutions.ReleaseNotesService;
import com.appsmith.util.WebClientUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT;

@Slf4j
@RequiredArgsConstructor
public class CacheableFeatureFlagHelperCEImpl implements CacheableFeatureFlagHelperCE {

    private final TenantRepository tenantRepository;
    private final ConfigService configService;
    private final CloudServicesConfig cloudServicesConfig;
    private final CommonConfig commonConfig;
    private final UserIdentifierService userIdentifierService;
    private final ReleaseNotesService releaseNotesService;

    @Cache(cacheName = "featureFlag", key = "{#userIdentifier}")
    @Override
    public Mono<CachedFlags> fetchUserCachedFlags(String userIdentifier, User user) {
        return this.forceAllRemoteFeatureFlagsForUser(userIdentifier, user).flatMap(flags -> {
            CachedFlags cachedFlags = new CachedFlags();
            cachedFlags.setRefreshedAt(Instant.now());
            cachedFlags.setFlags(flags);
            return Mono.just(cachedFlags);
        });
    }

    private Mono<Map<String, Object>> getUserDefaultTraits(User user) {
        return configService.getInstanceId().map(instanceId -> {
            Map<String, Object> userTraits = new HashMap<>();
            String emailTrait;
            String emailDomain = userIdentifierService.getEmailDomain(user.getEmail());
            if (!commonConfig.isCloudHosting()) {
                emailTrait = userIdentifierService.hash(user.getEmail());
                if (emailDomain != null) {
                    emailDomain = userIdentifierService.hash(emailDomain);
                }
            } else {
                emailTrait = user.getEmail();
            }
            userTraits.put("email", emailTrait);
            userTraits.put("instanceId", instanceId);
            userTraits.put("tenantId", user.getTenantId());
            userTraits.put("emailDomain", emailDomain);
            userTraits.put("isTelemetryOn", !commonConfig.isTelemetryDisabled());
            // for anonymous user, user.getCreatedAt() is null
            if (user.getCreatedAt() != null) {
                userTraits.put("createdAt", user.getCreatedAt().getEpochSecond());
            }
            userTraits.put("defaultTraitsUpdatedAt", Instant.now().getEpochSecond());
            userTraits.put("type", "user");
            return userTraits;
        });
    }

    @CacheEvict(cacheName = "featureFlag", key = "{#userIdentifier}")
    @Override
    public Mono<Void> evictUserCachedFlags(String userIdentifier) {
        return Mono.empty();
    }

    private Mono<Map<String, Boolean>> forceAllRemoteFeatureFlagsForUser(String userIdentifier, User user) {
        Mono<String> instanceIdMono = configService.getInstanceId();
        // TODO: Convert to current tenant when the feature is enabled
        Mono<Tenant> defaultTenantMono = tenantRepository.findBySlug(DEFAULT);
        return Mono.zip(instanceIdMono, defaultTenantMono, getUserDefaultTraits(user))
                .flatMap(objects -> {
                    String tenantId = objects.getT2().getId();
                    return this.getRemoteFeatureFlagsByIdentity(new FeatureFlagIdentityTraits(
                            objects.getT1(), tenantId, Set.of(userIdentifier), objects.getT3()));
                })
                .map(newValue -> newValue.get(userIdentifier));
    }

    /**
     * This method will call the cloud services which will call the flagsmith sdk.
     * The default traits and the user identifier are passed to flagsmith sdk which internally will set the traits
     * for the user and also returns the flags in the same sdk call.
     * @param featureFlagIdentityTraits
     * @return
     */
    private Mono<Map<String, Map<String, Boolean>>> getRemoteFeatureFlagsByIdentity(
            FeatureFlagIdentityTraits featureFlagIdentityTraits) {
        return WebClientUtils.create(cloudServicesConfig.getBaseUrlWithSignatureVerification())
                .post()
                .uri("/api/v1/feature-flags")
                .body(BodyInserters.fromValue(featureFlagIdentityTraits))
                .exchangeToMono(clientResponse -> {
                    if (clientResponse.statusCode().is2xxSuccessful()) {
                        return clientResponse.bodyToMono(
                                new ParameterizedTypeReference<ResponseDTO<Map<String, Map<String, Boolean>>>>() {});
                    } else {
                        return clientResponse.createError();
                    }
                })
                .map(ResponseDTO::getData)
                .onErrorMap(
                        // Only map errors if we haven't already wrapped them into an AppsmithException
                        e -> !(e instanceof AppsmithException),
                        e -> new AppsmithException(AppsmithError.CLOUD_SERVICES_ERROR, e.getMessage()))
                .onErrorResume(error -> {
                    // We're gobbling up errors here so that all feature flags are turned off by default
                    // This will be problematic if we do not maintain code to reflect validity of flags
                    log.debug("Received error from CS for feature flags: {}", error.getMessage());
                    return Mono.just(Map.of());
                });
    }

    /**
     * To fetch the tenant current features via cache
     * @param tenantId Id of the tenant
     * @return Mono of CachedFeatures
     */
    @Cache(cacheName = "tenantCurrentFeatures", key = "{#tenantId}")
    @Override
    public Mono<CachedFeatures> fetchCachedTenantCurrentFeatures(String tenantId) {
        // TODO: Add logic to fetch default or current features from persistent storage
        // TODO: Store the current features to DB for safe storage
        // TODO: Update cache and persistent storage with newFeatures when migration is applied
        return Mono.empty();
    }

    /**
     * To evict the tenant current features cache
     * @param tenantId Id of the tenant
     * @return Mono of Void
     */
    @CacheEvict(cacheName = "tenantCurrentFeatures", key = "{#tenantId}")
    @Override
    public Mono<Void> evictCachedTenantCurrentFeatures(String tenantId) {
        return Mono.empty();
    }

    /**
     * To fetch the tenant new features via cache
     * @param tenantId Id of the tenant
     * @return Mono of CachedFeatures
     */
    @Cache(cacheName = "tenantNewFeatures", key = "{#tenantId}")
    @Override
    public Mono<CachedFeatures> fetchCachedTenantNewFeatures(String tenantId) {
        return this.forceAllRemoteFeaturesForTenant(tenantId).flatMap(flags -> {
            CachedFeatures cachedFeatures = new CachedFeatures();
            cachedFeatures.setRefreshedAt(Instant.now());
            cachedFeatures.setFeatures(flags);
            return Mono.just(cachedFeatures);
        });
    }

    /**
     * To evict the tenant new features cache
     * @param tenantId Id of the tenant
     * @return Mono of Void
     */
    @CacheEvict(cacheName = "tenantNewFeatures", key = "{#tenantId}")
    @Override
    public Mono<Void> evictCachedTenantNewFeatures(String tenantId) {
        return Mono.empty();
    }

    /**
     * To force fetch all tenant features from Cloud Services
     * @param tenantId Id of the tenant
     * @return Mono of Map
     */
    private Mono<Map<String, Boolean>> forceAllRemoteFeaturesForTenant(String tenantId) {
        Mono<String> instanceIdMono = configService.getInstanceId();
        String appsmithVersion = releaseNotesService.getRunningVersion();
        return instanceIdMono
                .map(instanceId -> {
                    FeaturesRequestDTO featuresRequestDTO = new FeaturesRequestDTO();
                    featuresRequestDTO.setTenantId(tenantId);
                    featuresRequestDTO.setInstanceId(instanceId);
                    featuresRequestDTO.setAppsmithVersion(appsmithVersion);

                    return featuresRequestDTO;
                })
                .flatMap(this::getRemoteFeaturesForTenant)
                .map(responseDTO -> CollectionUtils.isNullOrEmpty(responseDTO.getFeatures())
                        ? new HashMap<>()
                        : responseDTO.getFeatures());
    }

    /**
     * To get all tenant features from Cloud Services
     * @param featuresRequestDTO FeaturesRequestDTO
     * @return Mono of Map
     */
    public Mono<FeaturesResponseDTO> getRemoteFeaturesForTenant(FeaturesRequestDTO featuresRequestDTO) {
        return WebClientUtils.create(cloudServicesConfig.getBaseUrlWithSignatureVerification())
                .post()
                .uri("/api/v1/business-features")
                .body(BodyInserters.fromValue(featuresRequestDTO))
                .exchangeToMono(clientResponse -> {
                    if (clientResponse.statusCode().is2xxSuccessful()) {
                        return clientResponse.bodyToMono(
                                new ParameterizedTypeReference<ResponseDTO<FeaturesResponseDTO>>() {});
                    } else {
                        return clientResponse.createError();
                    }
                })
                .map(ResponseDTO::getData)
                .onErrorMap(
                        // Only map errors if we haven't already wrapped them into an AppsmithException
                        e -> !(e instanceof AppsmithException),
                        e -> new AppsmithException(AppsmithError.CLOUD_SERVICES_ERROR, e.getMessage()))
                .onErrorResume(error -> {
                    log.debug("Received error from CS while fetching features: {}", error.getMessage());
                    return Mono.just(new FeaturesResponseDTO());
                });
    }
}

package com.appsmith.server.services.ce;

import com.appsmith.caching.annotations.Cache;
import com.appsmith.caching.annotations.CacheEvict;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.CachedFlags;
import com.appsmith.server.featureflags.FeatureFlagIdentityTraits;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserIdentifierService;
import com.appsmith.util.WebClientUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Slf4j
public class CacheableFeatureFlagHelperCEImpl implements CacheableFeatureFlagHelperCE {
    private final TenantService tenantService;

    private final ConfigService configService;

    private final CloudServicesConfig cloudServicesConfig;

    private final CommonConfig commonConfig;

    private final UserIdentifierService userIdentifierService;

    public CacheableFeatureFlagHelperCEImpl(TenantService tenantService, ConfigService configService,
                                            CloudServicesConfig cloudServicesConfig, CommonConfig commonConfig,
                                            UserIdentifierService userIdentifierService) {
        this.tenantService = tenantService;
        this.configService = configService;
        this.cloudServicesConfig = cloudServicesConfig;
        this.commonConfig = commonConfig;
        this.userIdentifierService = userIdentifierService;
    }

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
        return configService.getInstanceId()
                .map(instanceId -> {
                    Map<String, Object> userTraits = new HashMap<>();
                    String emailTrait;
                    if (!commonConfig.isCloudHosting()) {
                        emailTrait = userIdentifierService.hash(user.getEmail());
                    } else {
                        emailTrait = user.getEmail();
                    }
                    userTraits.put("email", emailTrait);
                    userTraits.put("instanceId", instanceId);
                    userTraits.put("tenantId", user.getTenantId());
                    userTraits.put("isTelemetryOn", !commonConfig.isTelemetryDisabled());
                    userTraits.put("createdAt", user.getCreatedAt());
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
        Mono<String> defaultTenantIdMono = tenantService.getDefaultTenantId();
        return Mono.zip(instanceIdMono, defaultTenantIdMono, getUserDefaultTraits(user))
                .flatMap(objects -> {
                    return this.getRemoteFeatureFlagsByIdentity(
                            new FeatureFlagIdentityTraits(
                                    objects.getT1(),
                                    objects.getT2(),
                                    Set.of(userIdentifier),
                                    objects.getT3())
                    );
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
    private Mono<Map<String, Map<String, Boolean>>> getRemoteFeatureFlagsByIdentity(FeatureFlagIdentityTraits featureFlagIdentityTraits) {
        return WebClientUtils.create(cloudServicesConfig.getBaseUrl())
                .post()
                .uri("/api/v1/feature-flags")
                .body(BodyInserters.fromValue(featureFlagIdentityTraits))
                .exchangeToMono(clientResponse -> {
                    if (clientResponse.statusCode().is2xxSuccessful()) {
                        return clientResponse.bodyToMono(new ParameterizedTypeReference<ResponseDTO<Map<String,
                                Map<String, Boolean>>>>() {
                        });
                    } else {
                        return clientResponse.createError();
                    }
                })
                .map(ResponseDTO::getData)
                .onErrorMap(
                        // Only map errors if we haven't already wrapped them into an AppsmithException
                        e -> !(e instanceof AppsmithException),
                        e -> new AppsmithException(AppsmithError.CLOUD_SERVICES_ERROR, e.getMessage())
                )
                .onErrorResume(error -> {
                    // We're gobbling up errors here so that all feature flags are turned off by default
                    // This will be problematic if we do not maintain code to reflect validity of flags
                    log.debug("Received error from CS for feature flags: {}", error.getMessage());
                    return Mono.just(Map.of());
                });
    }
}

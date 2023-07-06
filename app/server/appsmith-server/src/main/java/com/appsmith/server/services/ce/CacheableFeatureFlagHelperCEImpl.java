package com.appsmith.server.services.ce;

import com.appsmith.caching.annotations.Cache;
import com.appsmith.caching.annotations.CacheEvict;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.CachedFlags;
import com.appsmith.server.featureflags.FeatureFlagIdentities;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.TenantService;
import com.appsmith.util.WebClientUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;
import java.util.Set;

@Slf4j
public class CacheableFeatureFlagHelperCEImpl implements CacheableFeatureFlagHelperCE {
    private final TenantService tenantService;

    private final ConfigService configService;

    private final CloudServicesConfig cloudServicesConfig;

    public CacheableFeatureFlagHelperCEImpl(TenantService tenantService, ConfigService configService,
                                            CloudServicesConfig cloudServicesConfig) {
        this.tenantService = tenantService;
        this.configService = configService;
        this.cloudServicesConfig = cloudServicesConfig;
    }

    @Cache(cacheName = "featureFlag", key = "{#userIdentifier}")
    @Override
    public Mono<CachedFlags> fetchUserCachedFlags(String userIdentifier) {
        return this.forceAllRemoteFeatureFlagsForUser(userIdentifier).flatMap(flags -> {
            CachedFlags cachedFlags = new CachedFlags();
            cachedFlags.setRefreshedAt(Instant.now());
            cachedFlags.setFlags(flags);
            return Mono.just(cachedFlags);
        });
    }

    @CacheEvict(cacheName = "featureFlag", key = "{#userIdentifier}")
    @Override
    public Mono<Void> evictUserCachedFlags(String userIdentifier) {
        return Mono.empty();
    }

    private Mono<Map<String, Boolean>> forceAllRemoteFeatureFlagsForUser(String userIdentifier) {
        Mono<String> instanceIdMono = configService.getInstanceId();
        // TODO: Convert to current tenant when the feature is enabled
        Mono<String> defaultTenantIdMono = tenantService.getDefaultTenantId();
        return Mono.zip(instanceIdMono, defaultTenantIdMono)
                .flatMap(tuple2 -> {
                    return this.getRemoteFeatureFlagsByIdentity(
                            new FeatureFlagIdentities(
                                    tuple2.getT1(),
                                    tuple2.getT2(),
                                    Set.of(userIdentifier)));
                })
                .map(newValue -> newValue.get(userIdentifier));
    }

    private Mono<Map<String, Map<String, Boolean>>> getRemoteFeatureFlagsByIdentity(FeatureFlagIdentities identity) {
        return WebClientUtils.create(cloudServicesConfig.getBaseUrl())
                .post()
                .uri("/api/v1/feature-flags")
                .body(BodyInserters.fromValue(identity))
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

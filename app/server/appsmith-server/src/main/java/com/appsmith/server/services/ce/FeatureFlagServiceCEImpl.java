package com.appsmith.server.services.ce;

import com.appsmith.caching.annotations.Cache;
import com.appsmith.caching.annotations.CacheEvict;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.CachedFlags;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.featureflags.FeatureFlagIdentities;
import com.appsmith.server.featureflags.FeatureFlagTrait;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserIdentifierService;
import com.appsmith.util.WebClientUtils;
import lombok.extern.slf4j.Slf4j;
import org.ff4j.FF4j;
import org.ff4j.core.FlippingExecutionContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Set;


@Slf4j
@Component
public class FeatureFlagServiceCEImpl implements FeatureFlagServiceCE {

    private final SessionUserService sessionUserService;

    private final FF4j ff4j;

    private final TenantService tenantService;

    private final ConfigService configService;

    private final CloudServicesConfig cloudServicesConfig;

    private long featureFlagCacheTimeMin = 120;

    private final UserIdentifierService userIdentifierService;

    @Autowired
    public FeatureFlagServiceCEImpl(SessionUserService sessionUserService,
                                    FF4j ff4j,
                                    TenantService tenantService,
                                    ConfigService configService,
                                    CloudServicesConfig cloudServicesConfig,
                                    UserIdentifierService userIdentifierService,
                                    ReactiveRedisTemplate<String, Object> reactiveRedisTemplate) {
        this.sessionUserService = sessionUserService;
        this.ff4j = ff4j;
        this.tenantService = tenantService;
        this.configService = configService;
        this.cloudServicesConfig = cloudServicesConfig;
        this.userIdentifierService = userIdentifierService;
    }


    @Override
    @Cache(cacheName = "featureFlag", key = "{#userIdentifier}")
    public Mono<CachedFlags> fetchUserCachedFlags(String userIdentifier){
        return this.forceAllRemoteFeatureFlagsForUser(userIdentifier).flatMap(flags -> {
            CachedFlags cachedFlags = new CachedFlags();
            cachedFlags.setRefreshedAt(Instant.now());
            cachedFlags.setFlags(flags);
            return Mono.just(cachedFlags);
        });
    }

    @Override
    @CacheEvict(cacheName = "featureFlag", key = "{#userIdentifier}")
    public Mono<Void> evictUserCachedFlags(String userIdentifier) {
        return Mono.empty();
    }

    private Mono<Boolean> checkAll(String featureName, User user) {
        Boolean check = check(featureName, user);

        if (Boolean.TRUE.equals(check)) {
            return Mono.just(check);
        }

        return getAllFeatureFlagsForUser()
                .flatMap(featureMap -> Mono.justOrEmpty(featureMap.get(featureName)))
                                .switchIfEmpty(Mono.just(false));
    }

    @Override
    public Mono<Boolean> check(FeatureFlagEnum featureEnum, User user) {
        if (featureEnum == null) {
            return Mono.just(false);
        }
        return checkAll(featureEnum.toString(), user);
    }

    @Override
    public Mono<Boolean> check(FeatureFlagEnum featureEnum) {
        return sessionUserService.getCurrentUser()
                .flatMap(user -> check(featureEnum, user));
    }

    @Override
    public Boolean check(String featureName, User user) {
        return ff4j.check(featureName, new FlippingExecutionContext(Map.of(FieldName.USER, user)));
    }

    @Override
    public Mono<Map<String, Boolean>> getAllFeatureFlagsForUser() {
        Mono<User> currentUser = sessionUserService.getCurrentUser().cache();
        Flux<Tuple2<String, User>> featureUserTuple = Flux.fromIterable(ff4j.getFeatures().keySet())
                .flatMap(featureName -> Mono.just(featureName).zipWith(currentUser));

        Mono<Map<String, Boolean>> localFlagsForUser = featureUserTuple
                .filter(objects -> !objects.getT2().isAnonymous())
                .collectMap(
                        Tuple2::getT1,
                        tuple -> check(tuple.getT1(), tuple.getT2())
                );

        return Mono.zip(localFlagsForUser, this.getAllRemoteFeatureFlagsForUser())
                .map(tuple -> {
                    tuple.getT1().putAll(tuple.getT2());
                    return tuple.getT1();
                });
    }

    /**
     * This function fetches remote flags (i.e. flagsmith flags)
     * @return
     */
    private Mono<Map<String, Boolean>> getAllRemoteFeatureFlagsForUser() {
        Mono<User> userMono = sessionUserService.getCurrentUser().cache();
        return userMono
                .flatMap(user -> {
                    String userIdentifier = userIdentifierService.getUserIdentifier(user);
                    // Checks for flags present in cache and if the cache is not expired
                    return fetchUserCachedFlags(userIdentifier)
                            .flatMap(cachedFlags-> {
                        if (cachedFlags.getRefreshedAt().until(Instant.now(), ChronoUnit.MINUTES) < this.featureFlagCacheTimeMin){
                            return Mono.just(cachedFlags.getFlags());
                        }else {
                            // empty the cache for the userIdentifier as expired
                            return evictUserCachedFlags(userIdentifier)
                                    .then(fetchUserCachedFlags(userIdentifier))
                                    .flatMap(cachedFlagsUpdated -> Mono.just(cachedFlagsUpdated.getFlags()));
                        }
                    });
                });
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
                        return clientResponse.bodyToMono(new ParameterizedTypeReference<ResponseDTO<Map<String, Map<String, Boolean>>>>() {
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

    @Override
    public Mono<Void> remoteSetUserTraits(List<FeatureFlagTrait> featureFlagTraits){

        return WebClientUtils.create(cloudServicesConfig.getBaseUrl())
                .post()
                .uri("/api/v1/feature-flags/trait")
                .body(BodyInserters.fromValue(featureFlagTraits))
                .exchangeToMono(clientResponse -> {
                    if (clientResponse.statusCode().is2xxSuccessful()) {
                        return clientResponse.bodyToMono(new ParameterizedTypeReference<ResponseDTO<Void>>() {
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
                    return Mono.empty();
                });
    }
}
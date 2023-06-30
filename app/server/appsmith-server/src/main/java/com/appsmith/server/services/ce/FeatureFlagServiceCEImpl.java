package com.appsmith.server.services.ce;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.FeatureFlagValidationContextConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
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
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;


@Slf4j
@Component
public class FeatureFlagServiceCEImpl implements FeatureFlagServiceCE {

    private final SessionUserService sessionUserService;

    private final FeatureFlagValidationContextConfig featureFlagValidationContextConfig;

    private final FF4j ff4j;

    private final TenantService tenantService;

    private final ConfigService configService;

    private final CloudServicesConfig cloudServicesConfig;

    private final Map<String, Map<String, Boolean>> featureFlagCache;

    private final UserIdentifierService userIdentifierService;

    @Autowired
    public FeatureFlagServiceCEImpl(SessionUserService sessionUserService,
                                    FF4j ff4j,
                                    TenantService tenantService,
                                    ConfigService configService,
                                    CloudServicesConfig cloudServicesConfig,
                                    UserIdentifierService userIdentifierService,
                                    FeatureFlagValidationContextConfig featureFlagValidationContextConfig) {
        this.sessionUserService = sessionUserService;
        this.ff4j = ff4j;
        this.tenantService = tenantService;
        this.configService = configService;
        this.cloudServicesConfig = cloudServicesConfig;
        this.featureFlagCache = new ConcurrentHashMap<>();
        this.userIdentifierService = userIdentifierService;
        this.featureFlagValidationContextConfig = featureFlagValidationContextConfig;
    }

    private Mono<Boolean> checkAll(String featureName, Object context) {
        Boolean check = check(featureName, context);

        if (Boolean.TRUE.equals(check)) {
            return Mono.just(check);
        }

        // checking further against the current user instead of assuming the context is user object

        return featureFlagValidationContextConfig.currentUserValidationContextProvider.getFeatureFlagValidationContext().map(user -> {
            String userIdentifier = userIdentifierService.getUserIdentifier(user);
            if (this.featureFlagCache.containsKey(userIdentifier) &&
                    this.featureFlagCache.get(userIdentifier).containsKey(featureName)) {
                return this.featureFlagCache.get(userIdentifier).get(featureName);
            } else {
                return this.forceAllRemoteFeatureFlagsForUser(user)
                        .flatMap(featureMap -> Mono.just(featureMap.getOrDefault(featureName, false)));
            }
        }).hasElement();
    }

    @Override
    public Mono<Boolean> check(FeatureFlagEnum featureEnum, Object context) {
        if (featureEnum == null) {
            return Mono.just(false);
        }
        return checkAll(featureEnum.toString(), context);
    }

    @Override
    public Mono<Boolean> check(FeatureFlagEnum featureEnum) {
        Object validationContext = featureFlagValidationContextConfig
                .featureFlagEnumValidationContextMap()
                .getOrDefault(featureEnum, featureFlagValidationContextConfig.currentUserValidationContextProvider)
                .getFeatureFlagValidationContext();
        Mono<Object> validationContextMono = (Mono<Object>) validationContext;
        return validationContextMono.flatMap(validationContextObj -> check(featureEnum, validationContextObj));
    }

    @Override
    public Boolean check(String featureName, Object context) {
        return ff4j.check(featureName, new FlippingExecutionContext(Map.of(FieldName.VALIDATION_CONTEXT, context)));
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

    private Mono<Map<String, Boolean>> getAllRemoteFeatureFlagsForUser() {
        Mono<User> userMono = sessionUserService.getCurrentUser().cache();
        return userMono
                .flatMap(user -> {
                    String userIdentifier = userIdentifierService.getUserIdentifier(user);
                    if (this.featureFlagCache.containsKey(userIdentifier)) {
                        return Mono.just(this.featureFlagCache.get(userIdentifier));
                    } else {
                        return this.forceAllRemoteFeatureFlagsForUser(user);
                    }
                });
    }


    private Mono<Map<String, Boolean>> forceAllRemoteFeatureFlagsForUser(User user) {
        Mono<String> instanceIdMono = configService.getInstanceId();
        // TODO: Convert to current tenant when the feature is enabled
        Mono<String> defaultTenantIdMono = tenantService.getDefaultTenantId();
        String userIdentifier = userIdentifierService.getUserIdentifier(user);
        return Mono.zip(instanceIdMono, defaultTenantIdMono)
                .flatMap(tuple2 -> {
                    return this.getRemoteFeatureFlagsByIdentity(
                            new FeatureFlagIdentities(
                                    tuple2.getT1(),
                                    tuple2.getT2(),
                                    Set.of(userIdentifier)));
                })
                .map(newValue -> {
                    this.featureFlagCache.putAll(newValue);
                    return newValue.get(userIdentifier);
                });
    }

    @Override
    public Mono<Void> refreshFeatureFlagsForAllUsers() {
        if (this.featureFlagCache.isEmpty()) {
            return Mono.empty();
        }

        Mono<String> instanceIdMono = configService.getInstanceId();
        // TODO: Convert to current tenant when the feature is enabled
        Mono<String> defaultTenantIdMono = tenantService.getDefaultTenantId();

        return Mono.zip(instanceIdMono, defaultTenantIdMono)
                .flatMap(tuple -> {
                    return this.getRemoteFeatureFlagsByIdentity(
                            new FeatureFlagIdentities(
                                    tuple.getT1(),
                                    tuple.getT2(),
                                    this.featureFlagCache.keySet()));
                })
                .map(newCache -> {
                    this.featureFlagCache.putAll(newCache);
                    return newCache;
                })
                .then();
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
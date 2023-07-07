package com.appsmith.server.services.ce;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.CacheableFeatureFlagHelper;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserIdentifierService;
import lombok.extern.slf4j.Slf4j;
import org.ff4j.FF4j;
import org.ff4j.core.FlippingExecutionContext;
import org.springframework.beans.factory.annotation.Autowired;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;


@Slf4j
public class FeatureFlagServiceCEImpl implements FeatureFlagServiceCE {

    private final SessionUserService sessionUserService;

    private final FF4j ff4j;

    private final TenantService tenantService;

    private final ConfigService configService;

    private final CloudServicesConfig cloudServicesConfig;

    private final long featureFlagCacheTimeMin = 120;

    private final UserIdentifierService userIdentifierService;

    private final CacheableFeatureFlagHelper cacheableFeatureFlagHelper;

    @Autowired
    public FeatureFlagServiceCEImpl(SessionUserService sessionUserService,
                                    FF4j ff4j,
                                    TenantService tenantService,
                                    ConfigService configService,
                                    CloudServicesConfig cloudServicesConfig,
                                    UserIdentifierService userIdentifierService,
                                    CacheableFeatureFlagHelper cacheableFeatureFlagHelper) {
        this.sessionUserService = sessionUserService;
        this.ff4j = ff4j;
        this.tenantService = tenantService;
        this.configService = configService;
        this.cloudServicesConfig = cloudServicesConfig;
        this.userIdentifierService = userIdentifierService;
        this.cacheableFeatureFlagHelper = cacheableFeatureFlagHelper;
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
     *
     * @return
     */
    private Mono<Map<String, Boolean>> getAllRemoteFeatureFlagsForUser() {
        Mono<User> userMono = sessionUserService.getCurrentUser().cache();
        return userMono
                .flatMap(user -> {
                    String userIdentifier = userIdentifierService.getUserIdentifier(user);
                    // Checks for flags present in cache and if the cache is not expired
                    return cacheableFeatureFlagHelper
                            .fetchUserCachedFlags(userIdentifier, user)
                            .flatMap(cachedFlags -> {
                                if (cachedFlags.getRefreshedAt().until(Instant.now(), ChronoUnit.MINUTES) < this.featureFlagCacheTimeMin) {
                                    return Mono.just(cachedFlags.getFlags());
                                } else {
                                    // empty the cache for the userIdentifier as expired
                                    return cacheableFeatureFlagHelper.evictUserCachedFlags(userIdentifier)
                                            .then(cacheableFeatureFlagHelper.fetchUserCachedFlags(userIdentifier, user))
                                            .flatMap(cachedFlagsUpdated -> Mono.just(cachedFlagsUpdated.getFlags()));
                                }
                            });
                });
    }
}
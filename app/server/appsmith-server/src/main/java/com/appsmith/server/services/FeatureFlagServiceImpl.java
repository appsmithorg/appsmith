package com.appsmith.server.services;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.services.ce.FeatureFlagServiceCEImpl;
import org.ff4j.FF4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.Map;

@Component
public class FeatureFlagServiceImpl extends FeatureFlagServiceCEImpl implements FeatureFlagService {

    private final SessionUserService sessionUserService;
    private final FF4j ff4j;

    private final AirgapInstanceConfig airgapInstanceConfig;

    public FeatureFlagServiceImpl(
            SessionUserService sessionUserService,
            FF4j ff4j,
            TenantService tenantService,
            UserIdentifierService userIdentifierService,
            CacheableFeatureFlagHelper cacheableFeatureFlagHelper,
            FeatureFlagMigrationHelper featureFlagMigrationHelper,
            AirgapInstanceConfig airgapInstanceConfig) {
        super(
                sessionUserService,
                ff4j,
                tenantService,
                userIdentifierService,
                cacheableFeatureFlagHelper,
                featureFlagMigrationHelper);

        this.sessionUserService = sessionUserService;
        this.ff4j = ff4j;
        this.airgapInstanceConfig = airgapInstanceConfig;
    }

    @Override
    public Mono<Map<String, Boolean>> getAllFeatureFlagsForUser() {
        if (!airgapInstanceConfig.isAirgapEnabled()) {
            return super.getAllFeatureFlagsForUser();
        }

        Mono<User> currentUser = sessionUserService.getCurrentUser();
        Flux<Tuple2<String, User>> featureUserTuple = Flux.fromIterable(
                        ff4j.getFeatures().keySet())
                .flatMap(featureName -> Mono.just(featureName).zipWith(currentUser));

        Mono<Map<String, Boolean>> localFlagsForUser = featureUserTuple
                .filter(objects -> !objects.getT2().isAnonymous())
                .collectMap(Tuple2::getT1, tuple -> check(tuple.getT1(), tuple.getT2()));

        return localFlagsForUser;
    }
}

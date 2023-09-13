package com.appsmith.server.services;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.server.constants.MigrationStatus;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.services.ce.FeatureFlagServiceCEImpl;
import org.ff4j.FF4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.Map;

import static java.lang.Boolean.TRUE;

@Component
public class FeatureFlagServiceImpl extends FeatureFlagServiceCEImpl implements FeatureFlagService {

    private final SessionUserService sessionUserService;
    private final FF4j ff4j;
    private final AirgapInstanceConfig airgapInstanceConfig;
    private final TenantService tenantService;

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
        this.tenantService = tenantService;
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

    /**
     * Method to execute migrations for feature flags only if the plan has not changed otherwise the migrations are
     * gated via user action which is via:
     * 1. update license
     * 2. remove license
     *
     * @param tenant    tenant for which the migrations need to be executed
     * @return          tenant with migrations executed
     */
    @Override
    public Mono<Tenant> checkAndExecuteMigrationsForTenantFeatureFlags(Tenant tenant) {
        if (tenant.getTenantConfiguration() == null
                || tenant.getTenantConfiguration().getLicense() == null) {
            return Mono.just(tenant);
        }
        TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
        License license = tenantConfiguration.getLicense();

        Mono<Tenant> tenantMono = super.checkAndExecuteMigrationsForTenantFeatureFlags(tenant);
        // If the plan has changed or the license is not active (expired) then set the migration status to pending as
        // the execute migration is gated via user action
        if (!CollectionUtils.isNullOrEmpty(tenantConfiguration.getFeaturesWithPendingMigration())
                && (!license.getPlan().equals(license.getPreviousPlan()) || !TRUE.equals(license.getActive()))) {
            tenantConfiguration.setMigrationStatus(MigrationStatus.PENDING);
            tenantMono = tenantService.save(tenant);
        }
        return tenantMono;
    }
}

package com.appsmith.server.services;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.server.constants.MigrationStatus;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.services.ce.FeatureFlagServiceCEImpl;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

import static java.lang.Boolean.TRUE;

@Component
public class FeatureFlagServiceImpl extends FeatureFlagServiceCEImpl implements FeatureFlagService {

    private final AirgapInstanceConfig airgapInstanceConfig;
    private final TenantService tenantService;

    public FeatureFlagServiceImpl(
            SessionUserService sessionUserService,
            TenantService tenantService,
            UserIdentifierService userIdentifierService,
            CacheableFeatureFlagHelper cacheableFeatureFlagHelper,
            FeatureFlagMigrationHelper featureFlagMigrationHelper,
            AirgapInstanceConfig airgapInstanceConfig) {
        super(
                sessionUserService,
                tenantService,
                userIdentifierService,
                cacheableFeatureFlagHelper,
                featureFlagMigrationHelper);
        this.airgapInstanceConfig = airgapInstanceConfig;
        this.tenantService = tenantService;
    }

    @Override
    public Mono<Map<String, Boolean>> getAllFeatureFlagsForUser() {
        if (!airgapInstanceConfig.isAirgapEnabled()) {
            return super.getAllFeatureFlagsForUser();
        }
        // For airgap, we need to fetch the feature flags for the tenant only as user level flags needs third party call
        // to CS, but tenant flags are embedded into the license key itself
        return getTenantFeatures().switchIfEmpty(Mono.just(new HashMap<>()));
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
        // If the plan has changed or the license is not active (expired) then set the migration status to pending as
        // the execute migration is gated via user action
        if (shouldOnlyUpdateMigrationStatus(tenant)) {
            tenant.getTenantConfiguration().setMigrationStatus(MigrationStatus.PENDING);
            return tenantService.save(tenant);
        }
        return super.checkAndExecuteMigrationsForTenantFeatureFlags(tenant);
    }

    private boolean shouldOnlyUpdateMigrationStatus(Tenant tenant) {
        TenantConfiguration tenantConfiguration =
                tenant.getTenantConfiguration() == null ? new TenantConfiguration() : tenant.getTenantConfiguration();
        License license = tenantConfiguration.getLicense();

        return license != null
                && !CollectionUtils.isNullOrEmpty(tenantConfiguration.getFeaturesWithPendingMigration())
                && ((license.getPreviousPlan() != null
                                && !license.getPreviousPlan().equals(license.getPlan()))
                        || !TRUE.equals(license.getActive()));
    }
}

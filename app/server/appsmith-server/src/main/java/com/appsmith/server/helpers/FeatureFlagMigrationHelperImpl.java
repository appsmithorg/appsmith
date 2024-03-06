package com.appsmith.server.helpers;

import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.domains.LoginSource;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.dtos.DisconnectProvisioningDto;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ce.FeatureFlagMigrationHelperCEImpl;
import com.appsmith.server.services.CacheableFeatureFlagHelper;
import com.appsmith.server.services.ProvisionService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.EnvManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.constants.EnvVariables.APPSMITH_FORM_LOGIN_DISABLED;
import static com.appsmith.server.constants.FeatureMigrationType.DISABLE;

@Component
@Slf4j
public class FeatureFlagMigrationHelperImpl extends FeatureFlagMigrationHelperCEImpl
        implements FeatureFlagMigrationHelper {
    private final SessionUserService sessionUserService;
    private final UserService userService;
    private final EnvManager envManager;
    private final ProvisionService provisionService;

    public FeatureFlagMigrationHelperImpl(
            CacheableFeatureFlagHelper cacheableFeatureFlagHelper,
            SessionUserService sessionUserService,
            @Lazy UserService userService,
            @Lazy EnvManager envManager,
            @Lazy ProvisionService provisionService) {
        super(cacheableFeatureFlagHelper);
        this.sessionUserService = sessionUserService;
        this.userService = userService;
        this.envManager = envManager;
        this.provisionService = provisionService;
    }

    /**
     * Method to execute the migrations for the given feature flag.
     * @param tenant                Tenant for which the migrations need to be executed
     * @param featureFlagEnum       Feature flag for which the migrations need to be executed
     * @return                      Boolean indicating if the migrations is successfully executed or not
     */
    @Override
    public Mono<Boolean> executeMigrationsBasedOnFeatureFlag(Tenant tenant, FeatureFlagEnum featureFlagEnum) {

        TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
        Map<FeatureFlagEnum, FeatureMigrationType> featuresWithPendingMigration =
                tenantConfiguration.getFeaturesWithPendingMigration();
        List<Mono<?>> migrationMonos = new ArrayList<>();
        switch (featureFlagEnum) {
            case license_sso_saml_enabled -> {
                if (DISABLE.equals(featuresWithPendingMigration.get(featureFlagEnum))) {
                    // Run SAML downgrade migration
                    migrationMonos.addAll(
                            executeDowngradeMigrationForSSOBasedOnLoginSourceAndTenantId(LoginSource.KEYCLOAK, tenant));
                }
            }

                // Check and run migrations for user sessions
            case license_sso_oidc_enabled -> {
                if (DISABLE.equals(featuresWithPendingMigration.get(featureFlagEnum))) {
                    // Run SSO OIDC migrations
                    migrationMonos.addAll(
                            executeDowngradeMigrationForSSOBasedOnLoginSourceAndTenantId(LoginSource.OIDC, tenant));
                }
            }

            case license_scim_enabled -> {
                if (DISABLE.equals(featuresWithPendingMigration.get(featureFlagEnum))) {
                    // Run SCIM migrations
                    DisconnectProvisioningDto disconnectProvisioningDto = new DisconnectProvisioningDto();
                    disconnectProvisioningDto.setKeepAllProvisionedResources(true);
                    migrationMonos.add(
                            provisionService.disconnectProvisioningWithoutUserContext(disconnectProvisioningDto));
                }
            }
            default -> {}
        }

        return Flux.concat(migrationMonos)
                .then(super.executeMigrationsBasedOnFeatureFlag(tenant, featureFlagEnum))
                .onErrorResume(error -> {
                    log.error(
                            "Error executing migrations for feature flag {} for tenant {}",
                            featureFlagEnum,
                            tenant.getId(),
                            error);
                    return Mono.just(false);
                });
    }

    private List<Mono<?>> executeDowngradeMigrationForSSOBasedOnLoginSourceAndTenantId(
            LoginSource loginSource, Tenant tenant) {

        final String tenantId = tenant.getId();
        List<Mono<?>> migrationMonos = new ArrayList<>();
        Mono<Boolean> enableFormLoginIfRequired = envManager
                .getAllWithoutAclCheck()
                .flatMap(envVarMap -> {
                    String formLoginDisabledString = envVarMap.get(APPSMITH_FORM_LOGIN_DISABLED.name());
                    // If form login is disabled, enable it for the tenant and also register the server restart
                    if ("true".equals(formLoginDisabledString)) {
                        log.debug("Enabling form login for tenant {}", tenantId);
                        tenant.getTenantConfiguration().setIsRestartRequired(true);
                        return envManager
                                .applyChangesToEnvFileWithoutAclCheck(
                                        Map.of(APPSMITH_FORM_LOGIN_DISABLED.toString(), "false"))
                                .then(Mono.just(true));
                    }
                    return Mono.just(false);
                });

        Mono<Boolean> pristineUserMono = userService.makeUserPristineBasedOnLoginSource(loginSource, tenantId);

        migrationMonos.add(
                sessionUserService.invalidateSessionByLoginSource(loginSource).thenReturn(true));
        migrationMonos.add(enableFormLoginIfRequired);
        migrationMonos.add(pristineUserMono);
        return migrationMonos;
    }
}

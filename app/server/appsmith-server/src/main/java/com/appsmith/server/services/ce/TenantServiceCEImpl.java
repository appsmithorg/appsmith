package com.appsmith.server.services.ce;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.MigrationStatus;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.solutions.EnvManager;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.Map;

import static com.appsmith.server.acl.AclPermission.MANAGE_TENANT;
import static java.lang.Boolean.TRUE;

@Slf4j
public class TenantServiceCEImpl extends BaseService<TenantRepository, Tenant, String> implements TenantServiceCE {

    private String tenantId = null;

    private final ConfigService configService;

    private final EnvManager envManager;

    private final FeatureFlagMigrationHelper featureFlagMigrationHelper;

    public TenantServiceCEImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            TenantRepository repository,
            AnalyticsService analyticsService,
            ConfigService configService,
            @Lazy EnvManager envManager,
            FeatureFlagMigrationHelper featureFlagMigrationHelper) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.configService = configService;
        this.envManager = envManager;
        this.featureFlagMigrationHelper = featureFlagMigrationHelper;
    }

    @Override
    public Mono<String> getDefaultTenantId() {

        // If the value exists in cache, return it as is
        if (StringUtils.hasLength(tenantId)) {
            return Mono.just(tenantId);
        }

        return repository.findBySlug(FieldName.DEFAULT).map(Tenant::getId).map(tenantId -> {
            // Set the cache value before returning.
            this.tenantId = tenantId;
            return tenantId;
        });
    }

    @Override
    public Mono<Tenant> updateTenantConfiguration(String tenantId, TenantConfiguration tenantConfiguration) {
        return repository
                .findById(tenantId, MANAGE_TENANT)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.TENANT, tenantId)))
                .flatMap(tenant -> {
                    TenantConfiguration oldtenantConfiguration = tenant.getTenantConfiguration();
                    if (oldtenantConfiguration == null) {
                        oldtenantConfiguration = new TenantConfiguration();
                    }
                    Mono<Map<String, String>> envMono = Mono.empty();
                    // instance admin is setting the email verification to true but the SMTP settings are not configured
                    if (tenantConfiguration.isEmailVerificationEnabled() == Boolean.TRUE) {
                        envMono = envManager.getAllNonEmpty().flatMap(properties -> {
                            String mailHost = properties.get("APPSMITH_MAIL_HOST");
                            if (mailHost == null || mailHost == "") {
                                return Mono.error(new AppsmithException(AppsmithError.INVALID_SMTP_CONFIGURATION));
                            }
                            return Mono.empty();
                        });
                    }
                    return envMono.then(Mono.zip(Mono.just(oldtenantConfiguration), Mono.just(tenant)));
                })
                .flatMap(tuple2 -> {
                    Tenant tenant = tuple2.getT2();
                    TenantConfiguration oldConfig = tuple2.getT1();
                    AppsmithBeanUtils.copyNestedNonNullProperties(tenantConfiguration, oldConfig);
                    tenant.setTenantConfiguration(oldConfig);
                    return repository.updateById(tenantId, tenant, MANAGE_TENANT);
                });
    }

    @Override
    public Mono<Tenant> findById(String tenantId, AclPermission permission) {
        return repository
                .findById(tenantId, permission)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "tenantId", tenantId)));
    }

    /*
     * For now, returning just the instance-id, with an empty tenantConfiguration object in this class. Will enhance
     * this function once we start saving other pertinent environment variables in the tenant collection.
     */
    @Override
    public Mono<Tenant> getTenantConfiguration() {
        Mono<Tenant> dbTenantMono = getDefaultTenant();
        Mono<Tenant> clientTenantMono = configService.getInstanceId().map(instanceId -> {
            final Tenant tenant = new Tenant();
            tenant.setInstanceId(instanceId);

            final TenantConfiguration config = new TenantConfiguration();
            tenant.setTenantConfiguration(config);

            config.setGoogleMapsKey(System.getenv("APPSMITH_GOOGLE_MAPS_API_KEY"));

            if (StringUtils.hasText(System.getenv("APPSMITH_OAUTH2_GOOGLE_CLIENT_ID"))) {
                config.addThirdPartyAuth("google");
            }

            if (StringUtils.hasText(System.getenv("APPSMITH_OAUTH2_GITHUB_CLIENT_ID"))) {
                config.addThirdPartyAuth("github");
            }

            config.setIsFormLoginEnabled(!"true".equals(System.getenv("APPSMITH_FORM_LOGIN_DISABLED")));

            return tenant;
        });

        return Mono.zip(dbTenantMono, clientTenantMono).map(tuple -> {
            Tenant dbTenant = tuple.getT1();
            Tenant clientTenant = tuple.getT2();
            return getClientPertinentTenant(dbTenant, clientTenant);
        });
    }

    @Override
    public Mono<Tenant> getDefaultTenant() {
        // Get the default tenant object from the DB and then populate the relevant user permissions in that
        // We are doing this differently because `findBySlug` is a Mongo JPA query and not a custom Appsmith query
        return repository
                .findBySlug(FieldName.DEFAULT)
                .map(tenant -> {
                    if (tenant.getTenantConfiguration() == null) {
                        tenant.setTenantConfiguration(new TenantConfiguration());
                    }
                    return tenant;
                })
                .flatMap(tenant -> repository.setUserPermissionsInObject(tenant).switchIfEmpty(Mono.just(tenant)));
    }

    @Override
    public Mono<Tenant> updateDefaultTenantConfiguration(TenantConfiguration tenantConfiguration) {
        return getDefaultTenantId()
                .flatMap(tenantId -> updateTenantConfiguration(tenantId, tenantConfiguration))
                .flatMap(updatedTenant -> getTenantConfiguration());
    }

    /**
     * To get the Tenant with values that are pertinent to the client
     * @param dbTenant Original tenant from the database
     * @param clientTenant Tenant object that is sent to the client, can be null
     * @return Tenant
     */
    protected Tenant getClientPertinentTenant(Tenant dbTenant, Tenant clientTenant) {
        if (clientTenant == null) {
            clientTenant = new Tenant();
            clientTenant.setTenantConfiguration(new TenantConfiguration());
        }

        final TenantConfiguration tenantConfiguration = clientTenant.getTenantConfiguration();

        // Only copy the values that are pertinent to the client
        tenantConfiguration.copyNonSensitiveValues(dbTenant.getTenantConfiguration());
        clientTenant.setUserPermissions(dbTenant.getUserPermissions());

        return clientTenant;
    }

    @Override
    public Mono<Tenant> save(Tenant tenant) {
        return repository.save(tenant);
    }

    /**
     * This function checks if there are any pending migrations for feature flags and execute them.
     * @param tenant    tenant for which the migrations need to be executed
     * @return          tenant with migrations executed
     */
    @Override
    public Mono<Tenant> checkAndExecuteMigrationsForTenantFeatureFlags(Tenant tenant) {
        if (!isMigrationRequired(tenant)) {
            return Mono.just(tenant);
        }
        Map<FeatureFlagEnum, FeatureMigrationType> featureMigrationTypeMap =
                tenant.getTenantConfiguration().getFeaturesWithPendingMigration();

        FeatureFlagEnum featureFlagEnum =
                featureMigrationTypeMap.keySet().stream().findFirst().orElse(null);
        return featureFlagMigrationHelper
                .checkAndExecuteMigrationsForFeatureFlag(tenant, featureFlagEnum)
                .flatMap(isSuccessful -> {
                    if (TRUE.equals(isSuccessful)) {
                        featureMigrationTypeMap.remove(featureFlagEnum);
                        if (CollectionUtils.isNullOrEmpty(featureMigrationTypeMap)) {
                            tenant.getTenantConfiguration().setMigrationStatus(MigrationStatus.COMPLETED);
                        } else {
                            tenant.getTenantConfiguration().setMigrationStatus(MigrationStatus.IN_PROGRESS);
                        }
                        return this.save(tenant)
                                // Fetch the tenant again from DB to make sure the downstream chain is consuming the
                                // latest
                                // DB object and not the modified one because of the client pertinent changes
                                .then(repository.retrieveById(tenant.getId()))
                                .flatMap(this::checkAndExecuteMigrationsForTenantFeatureFlags);
                    }
                    return Mono.error(
                            new AppsmithException(AppsmithError.FeatureFlagMigrationFailure, featureFlagEnum, ""));
                });
    }

    @Override
    public Mono<Tenant> retrieveById(String id) {
        if (!StringUtils.hasLength(id)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return repository.retrieveById(id);
    }

    /**
     * This function checks if the tenant needs to be restarted and restarts after the feature flag migrations are
     * executed.
     *
     * @return
     */
    @Override
    public Mono<Void> restartTenant() {
        // Avoid dependency on user context as this method will be called internally by the server
        Mono<Tenant> defaultTenantMono = this.getDefaultTenantId().flatMap(this::retrieveById);
        return defaultTenantMono.flatMap(updatedTenant -> {
            if (TRUE.equals(updatedTenant.getTenantConfiguration().getIsRestartRequired())) {
                log.debug("Triggering tenant restart after the feature flag migrations are executed");
                TenantConfiguration tenantConfiguration = updatedTenant.getTenantConfiguration();
                tenantConfiguration.setIsRestartRequired(false);
                return this.update(updatedTenant.getId(), updatedTenant).then(envManager.restartWithoutAclCheck());
            }
            return Mono.empty();
        });
    }

    private boolean isMigrationRequired(Tenant tenant) {
        return tenant.getTenantConfiguration() != null
                && (!CollectionUtils.isNullOrEmpty(
                                tenant.getTenantConfiguration().getFeaturesWithPendingMigration())
                        || (CollectionUtils.isNullOrEmpty(
                                        tenant.getTenantConfiguration().getFeaturesWithPendingMigration())
                                && !MigrationStatus.COMPLETED.equals(
                                        tenant.getTenantConfiguration().getMigrationStatus())));
    }
}

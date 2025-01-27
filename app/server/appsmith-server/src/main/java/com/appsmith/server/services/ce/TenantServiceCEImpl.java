package com.appsmith.server.services.ce;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.MigrationStatus;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.helpers.ReactiveContextUtils;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.repositories.cakes.TenantRepositoryCake;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.solutions.EnvManager;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Mono;

import java.util.Map;

import static com.appsmith.external.constants.spans.TenantSpan.FETCH_DEFAULT_TENANT_SPAN;
import static com.appsmith.external.constants.spans.TenantSpan.FETCH_TENANT_CACHE_POST_DESERIALIZATION_ERROR_SPAN;
import static com.appsmith.server.acl.AclPermission.MANAGE_TENANT;
import static java.lang.Boolean.TRUE;

@Slf4j
public class TenantServiceCEImpl extends BaseService<TenantRepository, TenantRepositoryCake, Tenant, String>
        implements TenantServiceCE {

    private String tenantId;

    private final ConfigService configService;

    private final EnvManager envManager;

    private final FeatureFlagMigrationHelper featureFlagMigrationHelper;

    private final CacheableRepositoryHelper cacheableRepositoryHelper;

    private final CommonConfig commonConfig;
    private final ObservationRegistry observationRegistry;

    public TenantServiceCEImpl(
            Validator validator,
            TenantRepository repositoryDirect,
            TenantRepositoryCake repository,
            AnalyticsService analyticsService,
            ConfigService configService,
            @Lazy EnvManager envManager,
            FeatureFlagMigrationHelper featureFlagMigrationHelper,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            CommonConfig commonConfig,
            ObservationRegistry observationRegistry) {
        super(validator, repositoryDirect, repository, analyticsService);
        this.configService = configService;
        this.envManager = envManager;
        this.featureFlagMigrationHelper = featureFlagMigrationHelper;
        this.cacheableRepositoryHelper = cacheableRepositoryHelper;
        this.commonConfig = commonConfig;
        this.observationRegistry = observationRegistry;
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
        Mono<Void> evictTenantCache = cacheableRepositoryHelper.evictCachedTenant(tenantId);
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
                    Mono<Tenant> updatedTenantMono = repository
                            .updateById(tenantId, tenant, MANAGE_TENANT)
                            .cache();
                    // Firstly updating the Tenant object in the database and then evicting the cache.
                    // returning the updatedTenant, notice the updatedTenantMono is cached using .cache()
                    // hence it will not be evaluated again
                    return updatedTenantMono
                            .then(Mono.defer(() -> evictTenantCache))
                            .then(updatedTenantMono);
                });
    }

    @Override
    public Mono<Tenant> findById(String tenantId, AclPermission permission) {
        return repository
                .findById(tenantId, permission)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "tenantId", tenantId)));
    }

    @Override
    public Mono<Tenant> getTenantConfiguration(Mono<Tenant> dbTenantMono) {
        String adminEmailDomainHash = commonConfig.getAdminEmailDomainHash();
        Mono<Tenant> clientTenantMono = configService.getInstanceId().map(instanceId -> {
            final Tenant tenant = new Tenant();
            tenant.setInstanceId(instanceId);
            tenant.setAdminEmailDomainHash(adminEmailDomainHash);

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

        return Mono.zip(dbTenantMono, clientTenantMono).flatMap(tuple -> {
            Tenant dbTenant = tuple.getT1();
            Tenant clientTenant = tuple.getT2();
            return getClientPertinentTenant(dbTenant, clientTenant);
        });
    }

    /*
     * For now, returning just the instance-id, with an empty tenantConfiguration object in this class. Will enhance
     * this function once we start saving other pertinent environment variables in the tenant collection.
     */
    @Override
    public Mono<Tenant> getTenantConfiguration() {
        Mono<Tenant> dbTenantMono = getDefaultTenant();
        return getTenantConfiguration(dbTenantMono);
    }

    @Override
    public Mono<Tenant> getDefaultTenant() {
        Mono<User> currentUserMono = ReactiveContextUtils.getCurrentUser().cache();
        // Fetching Tenant from redis cache
        return getDefaultTenantId()
                .flatMap(tenantId -> cacheableRepositoryHelper.fetchDefaultTenant(tenantId))
                .name(FETCH_DEFAULT_TENANT_SPAN)
                .tap(Micrometer.observation(observationRegistry))
                .flatMap(tenant -> currentUserMono
                        .flatMap(user -> repository.setUserPermissionsInObject(tenant, user))
                        .switchIfEmpty(Mono.just(tenant)))
                .onErrorResume(e -> {
                    e.printStackTrace();
                    log.error("Error fetching default tenant from redis : {}", e.getMessage());
                    // If there is an error fetching the tenant from the cache, then evict the cache and fetching from
                    // the db. This handles the case for deserialization errors. This prevents the entire instance to
                    // go down if tenant cache is corrupted.
                    // More info - https://github.com/appsmithorg/appsmith/issues/33504
                    log.info("Evicting the default tenant from cache and fetching from the database!");
                    return cacheableRepositoryHelper
                            .evictCachedTenant(tenantId)
                            .then(cacheableRepositoryHelper
                                    .fetchDefaultTenant(tenantId)
                                    .map(tenant -> {
                                        if (tenant.getTenantConfiguration() == null) {
                                            tenant.setTenantConfiguration(new TenantConfiguration());
                                        }
                                        return tenant;
                                    }))
                            .name(FETCH_TENANT_CACHE_POST_DESERIALIZATION_ERROR_SPAN)
                            .tap(Micrometer.observation(observationRegistry))
                            .flatMap(tenant -> currentUserMono
                                    .flatMap(user -> repository.setUserPermissionsInObject(tenant, user))
                                    .switchIfEmpty(Mono.just(tenant)));
                });
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
     * @return Mono<Tenant>
     */
    protected Mono<Tenant> getClientPertinentTenant(Tenant dbTenant, Tenant clientTenant) {
        if (clientTenant == null) {
            clientTenant = new Tenant();
            clientTenant.setTenantConfiguration(new TenantConfiguration());
        }

        final TenantConfiguration tenantConfiguration = clientTenant.getTenantConfiguration();

        // Only copy the values that are pertinent to the client
        tenantConfiguration.copyNonSensitiveValues(dbTenant.getTenantConfiguration());
        clientTenant.setUserPermissions(dbTenant.getUserPermissions());

        return Mono.just(clientTenant);
    }

    // This function is used to save the tenant object in the database and evict the cache
    @Override
    public Mono<Tenant> save(Tenant tenant) {
        Mono<Void> evictTenantCache = cacheableRepositoryHelper.evictCachedTenant(tenantId);
        Mono<Tenant> savedTenantMono = repository.save(tenant).cache();
        return savedTenantMono.then(Mono.defer(() -> evictTenantCache)).then(savedTenantMono);
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
                                .then(repository.findById(tenant.getId()))
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
        return repository.findById(id);
    }

    /**
     * This function updates the tenant object in the database and evicts the cache
     * @param tenantId
     * @param tenant
     * @return
     */
    @Override
    public Mono<Tenant> update(String tenantId, Tenant tenant) {
        Mono<Void> evictTenantCache = cacheableRepositoryHelper.evictCachedTenant(tenantId);
        Mono<Tenant> updatedTenantMono = super.update(tenantId, tenant).cache();
        return updatedTenantMono.then(Mono.defer(() -> evictTenantCache)).then(updatedTenantMono);
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

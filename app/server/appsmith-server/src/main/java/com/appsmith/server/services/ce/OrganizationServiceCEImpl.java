package com.appsmith.server.services.ce;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.MigrationStatus;
import com.appsmith.server.constants.ce.FieldNameCE;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.cakes.OrganizationRepositoryCake;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.EnvManager;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Mono;

import java.util.Map;

import static com.appsmith.external.constants.spans.OrganizationSpan.FETCH_DEFAULT_ORGANIZATION_SPAN;
import static com.appsmith.external.constants.spans.OrganizationSpan.FETCH_ORGANIZATION_CACHE_POST_DESERIALIZATION_ERROR_SPAN;
import static com.appsmith.server.acl.AclPermission.MANAGE_ORGANIZATION;
import static java.lang.Boolean.TRUE;

@Slf4j
public class OrganizationServiceCEImpl
        extends BaseService<OrganizationRepository, OrganizationRepositoryCake, Organization, String>
        implements OrganizationServiceCE {

    private String organizationId = null;

    private final ConfigService configService;

    private final EnvManager envManager;

    private final FeatureFlagMigrationHelper featureFlagMigrationHelper;

    private final CacheableRepositoryHelper cacheableRepositoryHelper;

    private final CommonConfig commonConfig;
    private final ObservationRegistry observationRegistry;

    private final SessionUserService sessionUserService;

    public OrganizationServiceCEImpl(
            Validator validator,
            OrganizationRepository repository,
            OrganizationRepositoryCake repositoryCake,
            AnalyticsService analyticsService,
            ConfigService configService,
            @Lazy EnvManager envManager,
            FeatureFlagMigrationHelper featureFlagMigrationHelper,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            CommonConfig commonConfig,
            ObservationRegistry observationRegistry,
            SessionUserService sessionUserService) {
        super(validator, repository, repositoryCake, analyticsService);
        this.configService = configService;
        this.envManager = envManager;
        this.featureFlagMigrationHelper = featureFlagMigrationHelper;
        this.cacheableRepositoryHelper = cacheableRepositoryHelper;
        this.commonConfig = commonConfig;
        this.observationRegistry = observationRegistry;
        this.sessionUserService = sessionUserService;
    }

    @Override
    public Mono<String> getDefaultOrganizationId() {

        // If the value exists in cache, return it as is
        if (StringUtils.hasLength(organizationId)) {
            return Mono.just(organizationId);
        }
        return repository.findBySlug(FieldName.DEFAULT).map(Organization::getId).map(organizationId -> {
            // Set the cache value before returning.
            this.organizationId = organizationId;
            return organizationId;
        });
    }

    @Override
    public Mono<Organization> updateOrganizationConfiguration(
            String organizationId, OrganizationConfiguration organizationConfiguration) {
        Mono<Void> evictOrganizationCache = cacheableRepositoryHelper.evictCachedOrganization(organizationId);
        return repository
                .findById(organizationId, MANAGE_ORGANIZATION)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.ORGANIZATION, organizationId)))
                .flatMap(organization -> {
                    OrganizationConfiguration oldOrganizationConfiguration =
                            organization.getOrganizationConfiguration();
                    if (oldOrganizationConfiguration == null) {
                        oldOrganizationConfiguration = new OrganizationConfiguration();
                    }
                    Mono<Map<String, String>> envMono = Mono.empty();
                    // instance admin is setting the email verification to true but the SMTP settings are not configured
                    if (organizationConfiguration.isEmailVerificationEnabled() == Boolean.TRUE) {
                        envMono = envManager.getAllNonEmpty().flatMap(properties -> {
                            String mailHost = properties.get("APPSMITH_MAIL_HOST");
                            if (mailHost == null || mailHost == "") {
                                return Mono.error(new AppsmithException(AppsmithError.INVALID_SMTP_CONFIGURATION));
                            }
                            return Mono.empty();
                        });
                    }

                    return envMono.then(Mono.zip(Mono.just(oldOrganizationConfiguration), Mono.just(organization)));
                })
                .flatMap(tuple2 -> {
                    Organization organization = tuple2.getT2();
                    OrganizationConfiguration oldConfig = tuple2.getT1();
                    AppsmithBeanUtils.copyNestedNonNullProperties(organizationConfiguration, oldConfig);
                    organization.setOrganizationConfiguration(oldConfig);
                    Mono<Organization> updatedOrganizationMono = repository
                            .updateById(organizationId, organization, MANAGE_ORGANIZATION)
                            .cache();
                    // Firstly updating the Organization object in the database and then evicting the cache.
                    // returning the updatedOrganization, notice the updatedOrganizationMono is cached using .cache()
                    // hence it will not be evaluated again
                    return updatedOrganizationMono
                            .then(Mono.defer(() -> evictOrganizationCache))
                            .then(updatedOrganizationMono);
                });
    }

    @Override
    public Mono<Organization> findById(String organizationId, AclPermission permission) {
        return repository
                .findById(organizationId, permission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldNameCE.ORGANIZATION_ID, organizationId)));
    }

    @Override
    public Mono<Organization> getOrganizationConfiguration(Mono<Organization> dbOrganizationMono) {
        String adminEmailDomainHash = commonConfig.getAdminEmailDomainHash();
        Mono<Organization> clientOrganizationMono = configService
                .getInstanceId()
                .map(instanceId -> {
                    final Organization organization = new Organization();
                    organization.setInstanceId(instanceId);
                    organization.setAdminEmailDomainHash(adminEmailDomainHash);

                    final OrganizationConfiguration config = new OrganizationConfiguration();
                    organization.setOrganizationConfiguration(config);

                    config.setGoogleMapsKey(System.getenv("APPSMITH_GOOGLE_MAPS_API_KEY"));

                    if (StringUtils.hasText(System.getenv("APPSMITH_OAUTH2_GOOGLE_CLIENT_ID"))) {
                        config.addThirdPartyAuth("google");
                    }

                    if (StringUtils.hasText(System.getenv("APPSMITH_OAUTH2_GITHUB_CLIENT_ID"))) {
                        config.addThirdPartyAuth("github");
                    }

                    config.setIsFormLoginEnabled(!"true".equals(System.getenv("APPSMITH_FORM_LOGIN_DISABLED")));

                    return organization;
                });

        return Mono.zip(dbOrganizationMono, clientOrganizationMono).flatMap(tuple -> {
            Organization dbOrganization = tuple.getT1();
            Organization clientOrganization = tuple.getT2();
            return getClientPertinentOrganization(dbOrganization, clientOrganization);
        });
    }

    /*
     * For now, returning just the instance-id, with an empty organizationConfiguration object in this class. Will enhance
     * this function once we start saving other pertinent environment variables in the organization collection.
     */
    @Override
    public Mono<Organization> getOrganizationConfiguration() {
        Mono<Organization> dbOrganizationMono = getDefaultOrganization();
        return getOrganizationConfiguration(dbOrganizationMono);
    }

    @Override
    public Mono<Organization> getDefaultOrganization() {
        // Fetching Organization from redis cache
        Mono<User> currentUserMono = sessionUserService.getCurrentUser().cache();
        return getDefaultOrganizationId()
                .flatMap(organizationId -> cacheableRepositoryHelper.fetchDefaultOrganization(organizationId))
                .zipWith(currentUserMono)
                .name(FETCH_DEFAULT_ORGANIZATION_SPAN)
                .tap(Micrometer.observation(observationRegistry))
                .flatMap(tuple -> repository
                        .setUserPermissionsInObject(tuple.getT1(), tuple.getT2())
                        .switchIfEmpty(Mono.just(tuple.getT1())))
                .onErrorResume(e -> {
                    e.printStackTrace();
                    log.error("Error fetching default organization from redis : {}", e.getMessage());
                    // If there is an error fetching the organization from the cache, then evict the cache and fetching
                    // from the db. This handles the case for deserialization errors. This prevents the entire instance
                    // to
                    // go down if organization cache is corrupted.
                    // More info - https://github.com/appsmithorg/appsmith/issues/33504
                    log.info("Evicting the default organization from cache and fetching from the database!");
                    return cacheableRepositoryHelper
                            .evictCachedOrganization(organizationId)
                            .then(cacheableRepositoryHelper
                                    .fetchDefaultOrganization(organizationId)
                                    .map(organization -> {
                                        if (organization.getOrganizationConfiguration() == null) {
                                            organization.setOrganizationConfiguration(new OrganizationConfiguration());
                                        }
                                        return organization;
                                    }))
                            .zipWith(currentUserMono)
                            .name(FETCH_ORGANIZATION_CACHE_POST_DESERIALIZATION_ERROR_SPAN)
                            .tap(Micrometer.observation(observationRegistry))
                            .flatMap(tuple -> repository
                                    .setUserPermissionsInObject(tuple.getT1(), tuple.getT2())
                                    .switchIfEmpty(Mono.just(tuple.getT1())));
                });
    }

    @Override
    public Mono<Organization> updateDefaultOrganizationConfiguration(
            OrganizationConfiguration organizationConfiguration) {
        return getDefaultOrganizationId()
                .flatMap(organizationId -> updateOrganizationConfiguration(organizationId, organizationConfiguration))
                .flatMap(updatedOrganization -> getOrganizationConfiguration());
    }

    /**
     * To get the Organization with values that are pertinent to the client
     * @param dbOrganization Original organization from the database
     * @param clientOrganization Organization object that is sent to the client, can be null
     * @return Mono<Organization>
     */
    protected Mono<Organization> getClientPertinentOrganization(
            Organization dbOrganization, Organization clientOrganization) {
        if (clientOrganization == null) {
            clientOrganization = new Organization();
            clientOrganization.setOrganizationConfiguration(new OrganizationConfiguration());
        }

        final OrganizationConfiguration organizationConfiguration = clientOrganization.getOrganizationConfiguration();

        // Only copy the values that are pertinent to the client
        organizationConfiguration.copyNonSensitiveValues(dbOrganization.getOrganizationConfiguration());
        clientOrganization.setUserPermissions(dbOrganization.getUserPermissions());

        return Mono.just(clientOrganization);
    }

    // This function is used to save the organization object in the database and evict the cache
    @Override
    public Mono<Organization> save(Organization organization) {
        Mono<Void> evictCachedOrganization = cacheableRepositoryHelper.evictCachedOrganization(organizationId);
        Mono<Organization> savedOrganizationMono = repository.save(organization).cache();
        return savedOrganizationMono
                .then(Mono.defer(() -> evictCachedOrganization))
                .then(savedOrganizationMono);
    }

    /**
     * This function checks if there are any pending migrations for feature flags and execute them.
     * @param organization    organization for which the migrations need to be executed
     * @return          organization with migrations executed
     */
    @Override
    public Mono<Organization> checkAndExecuteMigrationsForOrganizationFeatureFlags(Organization organization) {
        if (!isMigrationRequired(organization)) {
            return Mono.just(organization);
        }
        Map<FeatureFlagEnum, FeatureMigrationType> featureMigrationTypeMap =
                organization.getOrganizationConfiguration().getFeaturesWithPendingMigration();

        FeatureFlagEnum featureFlagEnum =
                featureMigrationTypeMap.keySet().stream().findFirst().orElse(null);
        return featureFlagMigrationHelper
                .checkAndExecuteMigrationsForFeatureFlag(organization, featureFlagEnum)
                .flatMap(isSuccessful -> {
                    if (TRUE.equals(isSuccessful)) {
                        featureMigrationTypeMap.remove(featureFlagEnum);
                        if (CollectionUtils.isNullOrEmpty(featureMigrationTypeMap)) {
                            organization.getOrganizationConfiguration().setMigrationStatus(MigrationStatus.COMPLETED);
                        } else {
                            organization.getOrganizationConfiguration().setMigrationStatus(MigrationStatus.IN_PROGRESS);
                        }
                        return this.save(organization)
                                // Fetch the organization again from DB to make sure the downstream chain is consuming
                                // the
                                // latest
                                // DB object and not the modified one because of the client pertinent changes
                                .then(repository.findById(organization.getId()))
                                .flatMap(this::checkAndExecuteMigrationsForOrganizationFeatureFlags);
                    }
                    return Mono.error(
                            new AppsmithException(AppsmithError.FeatureFlagMigrationFailure, featureFlagEnum, ""));
                });
    }

    @Override
    public Mono<Organization> retrieveById(String id) {
        if (!StringUtils.hasLength(id)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return repository.findById(id);
    }

    /**
     * This function updates the organization object in the database and evicts the cache
     * @param organizationId
     * @param organization
     * @return
     */
    @Override
    public Mono<Organization> update(String organizationId, Organization organization) {
        Mono<Void> evictCachedOrganization = cacheableRepositoryHelper.evictCachedOrganization(organizationId);
        Mono<Organization> updatedOrganizationMono =
                super.update(organizationId, organization).cache();
        return updatedOrganizationMono
                .then(Mono.defer(() -> evictCachedOrganization))
                .then(updatedOrganizationMono);
    }

    /**
     * This function checks if the organization needs to be restarted and restarts after the feature flag migrations are
     * executed.
     *
     * @return
     */
    @Override
    public Mono<Void> restartOrganization() {
        // Avoid dependency on user context as this method will be called internally by the server
        Mono<Organization> defaultOrganizationMono =
                this.getDefaultOrganizationId().flatMap(this::retrieveById);
        return defaultOrganizationMono.flatMap(updatedOrganization -> {
            if (TRUE.equals(updatedOrganization.getOrganizationConfiguration().getIsRestartRequired())) {
                log.debug("Triggering organization restart after the feature flag migrations are executed");
                OrganizationConfiguration organizationConfiguration =
                        updatedOrganization.getOrganizationConfiguration();
                organizationConfiguration.setIsRestartRequired(false);
                return this.update(updatedOrganization.getId(), updatedOrganization)
                        .then(envManager.restartWithoutAclCheck());
            }
            return Mono.empty();
        });
    }

    private boolean isMigrationRequired(Organization organization) {
        return organization.getOrganizationConfiguration() != null
                && (!CollectionUtils.isNullOrEmpty(
                                organization.getOrganizationConfiguration().getFeaturesWithPendingMigration())
                        || (CollectionUtils.isNullOrEmpty(organization
                                        .getOrganizationConfiguration()
                                        .getFeaturesWithPendingMigration())
                                && !MigrationStatus.COMPLETED.equals(organization
                                        .getOrganizationConfiguration()
                                        .getMigrationStatus())));
    }
}

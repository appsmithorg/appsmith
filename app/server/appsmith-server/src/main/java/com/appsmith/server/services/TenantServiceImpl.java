package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.LicensePlan;
import com.appsmith.server.constants.LicenseStatus;
import com.appsmith.server.constants.MigrationStatus;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.AuditLog;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.UpdateLicenseKeyDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.helpers.NetworkUtils;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ce.TenantServiceCEImpl;
import com.appsmith.server.solutions.EnvManager;
import com.appsmith.server.solutions.LicenseAPIManager;
import com.appsmith.server.solutions.LicenseCacheHelper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.util.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.codec.multipart.Part;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.util.function.Tuple2;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;
import static com.appsmith.server.acl.AclPermission.MANAGE_TENANT;
import static com.appsmith.server.constants.CommonConstants.DEFAULT;
import static com.appsmith.server.constants.FieldName.LICENSE;
import static com.appsmith.server.constants.ce.FieldNameCE.KEY;
import static com.appsmith.server.constants.ce.FieldNameCE.TENANT;
import static com.appsmith.server.domains.TenantConfiguration.ASSET_PREFIX;
import static java.lang.Boolean.TRUE;

@Service
@Slf4j
public class TenantServiceImpl extends TenantServiceCEImpl implements TenantService {

    private final LicenseAPIManager licenseAPIManager;
    private final SessionUserService sessionUserService;
    private final WorkspaceRepository workspaceRepository;
    private final ApplicationRepository applicationRepository;
    private final RedirectHelper redirectHelper;
    private final CacheableFeatureFlagHelper cacheableFeatureFlagHelper;
    private final AssetService assetService;
    private final ObjectMapper objectMapper;
    private final BrandingService brandingService;
    private final SessionLimiterService sessionLimiterService;
    private final PACConfigurationService pacConfigurationService;
    private final FeatureFlagMigrationHelper featureFlagMigrationHelper;
    private final OidcConfigurationService oidcConfigurationService;
    private final SamlConfigurationService samlConfigurationService;

    private final Scheduler scheduler;
    private final UserUtils userUtils;
    private final NetworkUtils networkUtils;
    private final ConfigService configService;
    private final AuditLogService auditLogService;
    private final LicenseCacheHelper licenseCacheHelper;
    // Based on information provided on the Branding page.
    private static final int MAX_LOGO_SIZE_KB = 2048;
    private static final int MAX_FAVICON_SIZE_KB = 1024;

    @Autowired
    public TenantServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            TenantRepository repository,
            WorkspaceRepository workspaceRepository,
            ApplicationRepository applicationRepository,
            AnalyticsService analyticsService,
            ConfigService configService,
            @Lazy EnvManager envManager,
            SessionUserService sessionUserService,
            LicenseAPIManager licenseAPIManager,
            RedirectHelper redirectHelper,
            AssetService assetService,
            ObjectMapper objectMapper,
            CacheableFeatureFlagHelper cacheableFeatureFlagHelper,
            SessionLimiterService sessionLimiterService,
            FeatureFlagMigrationHelper featureFlagMigrationHelper,
            BrandingService brandingService,
            OidcConfigurationService oidcConfigurationService,
            @Lazy SamlConfigurationService samlConfigurationService,
            UserUtils userUtils,
            PACConfigurationService pacConfigurationService,
            NetworkUtils networkUtils,
            AuditLogService auditLogService,
            LicenseCacheHelper licenseCacheHelper) {

        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService,
                configService,
                envManager,
                featureFlagMigrationHelper);
        this.licenseAPIManager = licenseAPIManager;
        this.sessionUserService = sessionUserService;
        this.redirectHelper = redirectHelper;
        this.workspaceRepository = workspaceRepository;
        this.applicationRepository = applicationRepository;
        this.assetService = assetService;
        this.objectMapper = objectMapper;
        this.cacheableFeatureFlagHelper = cacheableFeatureFlagHelper;
        this.brandingService = brandingService;
        this.sessionLimiterService = sessionLimiterService;
        this.featureFlagMigrationHelper = featureFlagMigrationHelper;
        this.scheduler = scheduler;
        this.oidcConfigurationService = oidcConfigurationService;
        this.samlConfigurationService = samlConfigurationService;
        this.pacConfigurationService = pacConfigurationService;
        this.userUtils = userUtils;
        this.networkUtils = networkUtils;
        this.configService = configService;
        this.auditLogService = auditLogService;
        this.licenseCacheHelper = licenseCacheHelper;
    }

    @Override
    public Mono<Tenant> findById(String id, AclPermission aclPermission) {
        return repository.findById(id, aclPermission);
    }

    @Override
    public Mono<Tenant> getDefaultTenant(AclPermission aclPermission) {
        return repository.findBySlug(FieldName.DEFAULT, aclPermission);
    }

    @Override
    public Mono<Tenant> getTenantConfiguration() {
        return Mono.zip(this.getDefaultTenant(), super.getTenantConfiguration()).flatMap(tuple -> {
            final Tenant dbTenant = tuple.getT1();
            final Tenant clientTenant = tuple.getT2();
            final TenantConfiguration config = clientTenant.getTenantConfiguration();

            oidcConfigurationService.getTenantConfiguration(config);
            samlConfigurationService.getTenantConfiguration(config);
            return getClientPertinentTenant(dbTenant, clientTenant);
        });
    }

    /**
     * Method to activate the default tenant and return redirect URL. If the license key is provided tenant activation
     * depends upon license key validity
     *
     * @param updateLicenseKeyDTO   DTO to update license key
     * @param httpHeaders               Request headers
     * @return Mono of String
     */
    public Mono<String> activateTenantAndGetRedirectUrl(
            UpdateLicenseKeyDTO updateLicenseKeyDTO, HttpHeaders httpHeaders) {
        /*
        1. Check if the valid license key is provided
        2. Update the tenant configuration to activated state either with:
            a. Free plan if the license key is not provided
            b. Key specific plan received from CS
         */
        Mono<Tuple2<Tenant, Boolean>> licenseMono = Mono.empty();
        if (updateLicenseKeyDTO != null && !StringUtils.isNullOrEmpty(updateLicenseKeyDTO.getKey())) {
            licenseMono = saveTenantLicenseKey(updateLicenseKeyDTO.getKey());
        }

        Mono<Tenant> updateTenantMono = this.getDefaultTenant(MANAGE_TENANT)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, TENANT, DEFAULT)))
                .flatMap(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    tenantConfiguration = tenantConfiguration == null ? new TenantConfiguration() : tenantConfiguration;
                    if (TRUE.equals(tenantConfiguration.getIsActivated())) {
                        return Mono.just(tenant);
                    }
                    tenantConfiguration.setIsActivated(true);
                    return save(tenant);
                });

        return licenseMono
                .then(updateTenantMono)
                .flatMap(tenant -> {
                    if (updateLicenseKeyDTO == null || StringUtils.isNullOrEmpty(updateLicenseKeyDTO.getKey())) {
                        sendFreeInstanceSetupEvent(tenant);
                    } else if (tenant.getTenantConfiguration() != null
                            && tenant.getTenantConfiguration().getLicense() != null
                            && tenant.getTenantConfiguration().getLicense().getActive()) {
                        return sendAddLicenseToInstanceEvent(tenant);
                    }
                    return Mono.empty();
                })
                .then(sessionUserService
                        .getCurrentUser()
                        .flatMap(user -> workspaceRepository
                                .findFirstByIsAutoGeneratedWorkspaceAndEmailOrderByCreatedAt(true, user.getEmail())
                                .switchIfEmpty(Mono.just(new Workspace())))
                        .flatMap(workspace -> {
                            if (StringUtils.isNullOrEmpty(workspace.getId())) {
                                return Mono.just(new Application());
                            }
                            return applicationRepository
                                    .findFirstByWorkspaceId(workspace.getId())
                                    .switchIfEmpty(Mono.just(new Application()));
                        })
                        .map(application -> {
                            boolean isFirstTimeExperience = !StringUtils.isNullOrEmpty(application.getId());
                            return redirectHelper.buildSignupSuccessUrl(
                                    redirectHelper.buildApplicationUrl(application, httpHeaders),
                                    isFirstTimeExperience);
                        }));
    }

    /**
     * Method to remove the default tenant's license key
     *
     * @return Mono of Tenant
     */
    @Override
    public Mono<Tenant> removeLicenseKey() {
        Mono<Tenant> tenantMono = this.getDefaultTenant(MANAGE_TENANT)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, TENANT, DEFAULT)));

        return tenantMono.flatMap(tenant -> {
            log.debug("Going to remove the license key for tenant {} and execute downgrade migrations", tenant.getId());
            TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
            if (tenantConfiguration == null || tenantConfiguration.getLicense() == null) {
                return Mono.just(tenant);
            }
            License pastLicense = new License();
            AppsmithBeanUtils.copyNestedNonNullProperties(tenantConfiguration.getLicense(), pastLicense);

            License license = tenant.getTenantConfiguration().getLicense();
            final LicensePlan previousPlan = license.getPlan();
            license.setPlan(LicensePlan.FREE);
            license.setPreviousPlan(previousPlan);

            Mono<Boolean> downgradeToFreePlanOnCS =
                    StringUtils.isNullOrEmpty(tenantConfiguration.getLicense().getKey())
                            ? Mono.just(TRUE)
                            : licenseAPIManager.downgradeTenantToFreePlan(tenant);

            Mono<Tenant> downgradeTenantAndRemoveLicenseMono = downgradeToFreePlanOnCS
                    .flatMap(isSuccessful -> {
                        if (TRUE.equals(isSuccessful)) {
                            License updatedLicense = new License();
                            updatedLicense.setPlan(LicensePlan.FREE);
                            updatedLicense.setPreviousPlan(previousPlan);
                            updatedLicense.setActive(false);
                            tenant.getTenantConfiguration().setLicense(updatedLicense);
                            return this.save(tenant)
                                    .map(updatedTenant -> licenseCacheHelper
                                            .remove(updatedTenant.getId())
                                            .thenReturn(updatedTenant))
                                    // Fetch the tenant again from DB to make sure the downstream chain is consuming the
                                    // latest
                                    // DB object and not the modified one because of the client pertinent changes
                                    .then(repository.findById(tenant.getId()))
                                    .flatMap(this::forceUpdateTenantFeaturesAndUpdateFeaturesWithPendingMigrations)
                                    .flatMap(this::syncLicensePlansAndRunFeatureBasedMigrationsWithoutPermission);
                        }
                        return Mono.error(new AppsmithException(
                                AppsmithError.TENANT_DOWNGRADE_EXCEPTION,
                                "Received error from Cloud Services while downgrading the tenant to free plan"));
                    })
                    .flatMap(updatedTenant -> sendLicenseRemovedFromInstanceEvent(updatedTenant, pastLicense)
                            .thenReturn(updatedTenant));
            // To ensures that even though the client may have cancelled the flow, the removal of license should proceed
            // uninterrupted and whenever the user refreshes the page, user should be presented with the synced state
            // with CS.
            // To achieve this, we use a synchronous sink which does not take subscription cancellations into account.
            // This means that even if the subscriber has cancelled its subscription, the create method still generates
            // its event.
            return Mono.create(sink -> downgradeTenantAndRemoveLicenseMono.subscribe(
                    sink::success, sink::error, null, sink.currentContext()));
        });
    }

    /**
     * Method to sync current and previous license plan.
     *
     * @return Mono of Tenant
     */
    private Mono<Tenant> syncLicensePlansAndRunFeatureBasedMigrationsWithoutPermission(Tenant tenant) {
        if (tenant.getTenantConfiguration() == null) {
            return Mono.just(tenant);
        }
        log.debug("Going to sync license plans and run feature based migrations for tenant {}", tenant.getId());
        License license = tenant.getTenantConfiguration().getLicense() == null
                ? new License()
                : tenant.getTenantConfiguration().getLicense();
        license.setPreviousPlan(license.getPlan());
        return this.save(tenant)
                .flatMap(savedTenant -> repository.findById(savedTenant.getId()))
                .map(tenantWithUpdatedMigration -> {
                    // Run the migrations in a separate thread, as we expect the migrations can run for few seconds
                    // Generate the deep copy for the tenant to avoid any unintended updates while running the migration
                    Tenant tenantDeepCopy = new Tenant();
                    copyNestedNonNullProperties(tenantWithUpdatedMigration, tenantDeepCopy);
                    this.checkAndExecuteMigrationsForTenantFeatureFlags(tenantDeepCopy)
                            .then(this.restartTenant())
                            .subscribeOn(scheduler)
                            .subscribe();
                    return tenantWithUpdatedMigration;
                });
    }

    @Override
    public Mono<Tenant> syncLicensePlansAndRunFeatureBasedMigrations() {
        Mono<Tenant> tenantMono = this.getDefaultTenant(MANAGE_TENANT)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, TENANT, DEFAULT)));
        Mono<Tenant> syncPlansAndExecuteMigrationMono =
                tenantMono.flatMap(this::syncLicensePlansAndRunFeatureBasedMigrationsWithoutPermission);

        // To ensures that even though the client may have cancelled the flow, migration execution should proceed
        // uninterrupted and whenever the user refreshes the page, user should be presented with the valid DB state.
        // To achieve this, we use a synchronous sink which does not take subscription cancellations into account.
        // This means that even if the subscriber has cancelled its subscription, the create method still generates
        // its event.
        return Mono.create(sink ->
                syncPlansAndExecuteMigrationMono.subscribe(sink::success, sink::error, null, sink.currentContext()));
    }

    /**
     * Method to update and/or refresh the license key in the DB. If the license key is provided, it will be updated in
     * the DB if the key is valid and the license status will be refreshed. If the license key is not provided, the
     * license status will be refreshed with the key present within the DB.
     *
     * @param updateLicenseKeyDTO update license key DTO which includes license key and a boolean to selectively update DB states
     * @return Mono of Tenant
     */
    public Mono<Tenant> updateAndRefreshTenantLicenseKey(UpdateLicenseKeyDTO updateLicenseKeyDTO) {

        Mono<Tenant> tenantMono = this.getDefaultTenant(MANAGE_TENANT)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, TENANT, DEFAULT)));

        Mono<String> licenseKeyMono = Mono.just(updateLicenseKeyDTO).flatMap(licenseKeyDTO -> {
            // 1. If the license key is provided check the status of the provided key and update the DB
            // 2. If the license key is not provided and refreshLicenseAndFlags is null/false, throw an error
            // 3. Else refresh the license status of existing key in DB
            if (!StringUtils.isNullOrEmpty(licenseKeyDTO.getKey())) {
                return Mono.just(licenseKeyDTO.getKey());
            } else if (!TRUE.equals(licenseKeyDTO.getRefreshExistingLicenseAndFlags())) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.LICENSE_KEY));
            }
            return tenantMono.map(currentTenant -> {
                if (isValidLicenseConfiguration(currentTenant)) {
                    return currentTenant.getTenantConfiguration().getLicense().getKey();
                }
                throw new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, LICENSE, KEY);
            });
        });

        return licenseKeyMono
                .flatMap(licenseKey -> saveTenantLicenseKey(licenseKey, updateLicenseKeyDTO.getIsDryRun()))
                .flatMap(tuple -> {
                    try {
                        // Create a deep copy of the tenant before generating the client pertinent tenant to avoid any
                        // unintentional updates to DB
                        Tenant updatedTenant =
                                objectMapper.readValue(objectMapper.writeValueAsString(tuple.getT1()), Tenant.class);
                        return getClientPertinentTenant(updatedTenant, null);
                    } catch (JsonProcessingException e) {
                        log.error(
                                "JsonProcessingException for Tenant {}",
                                tuple.getT1().getId(),
                                e);
                        return Mono.error(new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR, e.getMessage()));
                    }
                });
    }

    /**
     * To validate and save the license key in the DB and send corresponding analytics event
     * Only valid license keys will be saved in the DB
     *
     * @param licenseKey License key
     * @return Mono of Tuple<Tenant, Boolean>
     */
    private Mono<Tuple2<Tenant, Boolean>> saveTenantLicenseKey(String licenseKey) {
        return this.saveTenantLicenseKey(licenseKey, Boolean.FALSE);
    }

    /**
     * Method to validate and save the license key in the DB and send corresponding analytics event
     * License will be saved to DB if
     * - It's a valid license keys
     * - isDryRun : false
     *
     * @param licenseKey License key
     * @param isDryRun   Variable to selectively save the license to DB
     * @return Mono of Tuple<Tenant, Boolean>
     */
    private Mono<Tuple2<Tenant, Boolean>> saveTenantLicenseKey(String licenseKey, Boolean isDryRun) {
        License license = new License();
        // TODO: Update to getCurrentTenant when multi tenancy is introduced
        return repository
                .findBySlug(DEFAULT, MANAGE_TENANT)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, TENANT, DEFAULT)))
                .flatMap(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    boolean isActivateInstance = tenantConfiguration.getLicense() == null
                            || StringUtils.isNullOrEmpty(
                                    tenantConfiguration.getLicense().getKey());
                    License existingLicense = tenantConfiguration.getLicense();
                    if (existingLicense == null) {
                        existingLicense = new License();
                    }

                    copyNestedNonNullProperties(tenantConfiguration.getLicense(), license);
                    license.setKey(licenseKey);
                    tenantConfiguration.setLicense(license);
                    tenant.setTenantConfiguration(tenantConfiguration);
                    license.setIsDryRun(isDryRun);

                    return checkTenantLicense(tenant)
                            .zipWith(Mono.just(isActivateInstance))
                            .zipWith(Mono.just(existingLicense));
                })
                .flatMap(tuple -> {
                    Tenant tenant = tuple.getT1().getT1();
                    boolean isActivateInstance = tuple.getT1().getT2();
                    License existingLicense = tuple.getT2();

                    // Update/save license only in case of a valid license key
                    if (!TRUE.equals(
                            tenant.getTenantConfiguration().getLicense().getActive())) {
                        License updatedLicense = isValidLicenseConfiguration(tenant)
                                ? tenant.getTenantConfiguration().getLicense()
                                : new License();

                        // If the license key is same as the existing one, return exception to immediately activate the
                        // license key, else revert with invalid license key error
                        if (updatedLicense.getKey() != null
                                && updatedLicense.getKey().equals(existingLicense.getKey())
                                && TRUE.equals(existingLicense.getActive())) {
                            return Mono.error(new AppsmithException(AppsmithError.LICENSE_KEY_ACTIVATION_WARNING));
                        }
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_LICENSE_KEY));
                    }

                    Mono<Tenant> tenantMono;
                    if (TRUE.equals(isDryRun)) {
                        tenantMono = Mono.just(tenant);
                    } else {
                        tenantMono = this.save(tenant)
                                // Fetch the tenant again from DB to make sure the downstream chain is consuming the
                                // latest DB object and not the modified one because of the client pertinent changes
                                .then(repository.findById(tenant.getId()))
                                .flatMap(updatedTenant -> sendLicenseUpdatedOnInstanceEvent(
                                                updatedTenant, existingLicense)
                                        .thenReturn(updatedTenant))
                                .flatMap(this::forceUpdateTenantFeaturesAndUpdateFeaturesWithPendingMigrations)
                                .then(syncLicensePlansAndRunFeatureBasedMigrations())
                                .flatMap(updatedTenant -> licenseCacheHelper
                                        .put(
                                                updatedTenant.getId(),
                                                updatedTenant
                                                        .getTenantConfiguration()
                                                        .getLicense())
                                        .thenReturn(updatedTenant));
                    }
                    return tenantMono.zipWith(Mono.just(isActivateInstance));
                });
    }

    /**
     * To refresh the current license status in the DB by making a license validation request to the Cloud Services and
     * return latest license status
     *
     * @return Mono of Tenant
     */
    public Mono<Tenant> refreshAndGetCurrentLicense() {
        // TODO: Update to getCurrentTenant when multi tenancy is introduced
        Mono<Tenant> defaultTenant = repository
                .findBySlug(FieldName.DEFAULT, MANAGE_TENANT)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, TENANT, FieldName.DEFAULT)))
                .cache();
        return defaultTenant
                .flatMap(this::checkTenantLicense)
                .zipWith(defaultTenant)
                .map(tuple -> {
                    Tenant updatedTenant = tuple.getT1();
                    Tenant tenantBeforeRefresh = tuple.getT2();
                    log.debug(
                            "Refresh the current license status for tenant {} and return the latest status",
                            updatedTenant.getId());
                    sendLicenseRefreshedEvent(
                            updatedTenant,
                            tenantBeforeRefresh.getTenantConfiguration().getLicense(),
                            updatedTenant.getTenantConfiguration().getLicense());
                    return updatedTenant;
                })
                .flatMap(this::save)
                .flatMap(tenant -> licenseCacheHelper
                        .put(tenant.getId(), tenant.getTenantConfiguration().getLicense())
                        .then(getClientPertinentTenant(tenant, null)));
    }

    /**
     * To check the status of a license key associated with the tenant
     *
     * @param tenant Tenant
     * @return Mono of Tenant
     */
    private Mono<Tenant> checkTenantLicense(Tenant tenant) {
        Mono<License> licenseMono = licenseAPIManager.licenseCheck(tenant).onErrorResume(throwable -> {
            Objects.requireNonNull(this.checkAndUpdateLicenseExpiryWithinInstance(tenant))
                    .subscribeOn(scheduler)
                    .subscribe();
            log.debug("Error while validating license: {}", throwable.getMessage(), throwable);
            return Mono.error(throwable);
        });
        return licenseMono.map(license -> {
            // To prevent empty License object being saved in DB for license checks with empty license key
            if (!StringUtils.isNullOrEmpty(license.getKey())) {
                TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                tenantConfiguration.setLicense(license);
                if (TRUE.equals(license.getActive())) {
                    tenantConfiguration.setIsActivated(true);
                }
                tenant.setTenantConfiguration(tenantConfiguration);
            }
            return tenant;
        });
    }

    /**
     * To check and update the status of default tenant's license
     * This can be used for periodic license checks via scheduled jobs
     *
     * @return Mono of Tenant
     */
    public Mono<Tenant> checkAndUpdateDefaultTenantLicense() {
        return this.getDefaultTenant().flatMap(this::checkTenantLicense).flatMap(this::save);
    }

    /**
     * To check whether a tenant have valid license configuration
     *
     * @param tenant Tenant
     * @return Boolean
     */
    public Boolean isValidLicenseConfiguration(Tenant tenant) {
        return tenant.getTenantConfiguration() != null
                && tenant.getTenantConfiguration().getLicense() != null
                && tenant.getTenantConfiguration().getLicense().getKey() != null;
    }

    @Override
    public Mono<Tenant> updateDefaultTenantConfiguration(
            Mono<String> tenantConfigAsStringMono, Mono<Part> brandLogoMono, Mono<Part> brandFaviconMono) {
        Mono<Tenant> defaultTenantMono =
                getDefaultTenant(AclPermission.MANAGE_TENANT).cache();
        Mono<String> brandLogoAssetIdMono = brandLogoMono
                .flatMap(brandLogoFile -> uploadFileAndGetFormattedAssetId(brandLogoFile, MAX_LOGO_SIZE_KB))
                .switchIfEmpty(Mono.just(""));
        Mono<String> brandFaviconAssetIdMono = brandFaviconMono
                .flatMap(brandFaviconFile -> uploadFileAndGetFormattedAssetId(brandFaviconFile, MAX_FAVICON_SIZE_KB))
                .switchIfEmpty(Mono.just(""));
        Mono<TenantConfiguration> newBrandConfigMono = tenantConfigAsStringMono
                .flatMap(tenantConfigurationAsString -> {
                    try {
                        return Mono.just(
                                objectMapper.readValue(tenantConfigurationAsString, TenantConfiguration.class));
                    } catch (JsonProcessingException e) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.GENERIC_BAD_REQUEST, "Invalid Tenant configuration"));
                    }
                })
                .switchIfEmpty(Mono.just(new TenantConfiguration()));

        return Mono.zip(defaultTenantMono, brandLogoAssetIdMono, brandFaviconAssetIdMono, newBrandConfigMono)
                .flatMap(tuple4 -> {
                    Tenant defaultTenant = tuple4.getT1();
                    String brandLogoAssetId = tuple4.getT2();
                    String brandFaviconAssetId = tuple4.getT3();
                    TenantConfiguration updateForTenantConfig = tuple4.getT4();

                    if (org.apache.commons.lang3.StringUtils.isNotEmpty(brandLogoAssetId)) {
                        updateForTenantConfig.setWhiteLabelLogo(brandLogoAssetId);
                    }

                    if (org.apache.commons.lang3.StringUtils.isNotEmpty(brandFaviconAssetId)) {
                        updateForTenantConfig.setWhiteLabelFavicon(brandFaviconAssetId);
                    }
                    // TODO replace the null setting with @JsonProperty(access = JsonProperty.Access.READ_ONLY) for
                    //  `isActivated` field to make the field read only for client
                    updateForTenantConfig.setIsActivated(null);
                    return updateTenantConfiguration(defaultTenant.getId(), updateForTenantConfig);
                })
                .flatMap(updatedTenant -> this.getTenantConfiguration());
    }

    @Override
    public Mono<Tenant> updateTenantConfiguration(String tenantId, TenantConfiguration tenantConfiguration) {
        return brandingService
                .updateTenantConfiguration(tenantConfiguration)
                .flatMap(pacConfigurationService::updateTenantConfiguration)
                .flatMap(sessionLimiterService::updateTenantConfiguration)
                .flatMap(updatedTenantConfiguration ->
                        super.updateTenantConfiguration(tenantId, updatedTenantConfiguration));
    }

    private Mono<Tenant> checkAndUpdateLicenseExpiryWithinInstance(Tenant tenant) {
        if (StringUtils.isNullOrEmpty(tenant.getId())) {
            return Mono.just(tenant);
        }
        TenantConfiguration tenantConfiguration =
                tenant.getTenantConfiguration() != null ? tenant.getTenantConfiguration() : new TenantConfiguration();

        License license = tenantConfiguration.getLicense() != null ? tenantConfiguration.getLicense() : new License();

        // TODO: Update the check from plain timestamp so that user should not be able to tamper the DB resource
        if (license.getExpiry() != null && license.getExpiry().isBefore(Instant.now())) {
            license.setActive(false);
            license.setStatus(LicenseStatus.EXPIRED);
            tenantConfiguration.setLicense(license);
            tenant.setTenantConfiguration(tenantConfiguration);
            return this.save(tenant).then(repository.findById(tenant.getId()));
        }
        return Mono.just(tenant);
    }

    private TenantConfiguration.BrandColors getUpdatedBrandColors(
            TenantConfiguration.BrandColors currentBrandColors, TenantConfiguration.BrandColors newBrandColors) {
        if (Objects.isNull(currentBrandColors)) {
            return newBrandColors;
        }
        copyNestedNonNullProperties(newBrandColors, currentBrandColors);
        return currentBrandColors;
    }

    private Mono<String> uploadFileAndGetFormattedAssetId(Part partFile, int maxFileSizeKB) {
        return assetService
                .upload(List.of(partFile), maxFileSizeKB, false)
                .map(brandLogoAsset -> ASSET_PREFIX + brandLogoAsset.getId());
    }

    private Mono<Tenant> forceUpdateTenantFeaturesAndUpdateFeaturesWithPendingMigrations(Tenant tenant) {
        // 1. Fetch current/saved feature flags from cache
        // 2. Force update the tenant flags keeping existing flags as fallback in case the API
        // call to fetch the flags fails for some reason
        // 3. Get the diff and update the flags with pending migrations to be used to run
        // migrations selectively
        return featureFlagMigrationHelper
                .getUpdatedFlagsWithPendingMigration(tenant, true)
                .flatMap(featureFlagWithPendingMigrations -> {
                    TenantConfiguration tenantConfig = tenant.getTenantConfiguration() == null
                            ? new TenantConfiguration()
                            : tenant.getTenantConfiguration();
                    tenantConfig.setFeaturesWithPendingMigration(featureFlagWithPendingMigrations);
                    if (CollectionUtils.isNullOrEmpty(featureFlagWithPendingMigrations)) {
                        tenantConfig.setMigrationStatus(MigrationStatus.COMPLETED);
                    } else {
                        tenantConfig.setMigrationStatus(MigrationStatus.PENDING);
                    }
                    return this.save(tenant)
                            // Fetch the tenant again from DB to make sure the downstream chain is consuming the latest
                            // DB object and not the modified one because of the client pertinent changes
                            .then(repository.findById(tenant.getId()));
                });
    }

    /**
     * This method overrides some DB stored tenant configuration based on the feature flag and then return
     * the Tenant with values that are pertinent to the client
     *
     * @param dbTenant     Original tenant from the database
     * @param clientTenant Tenant object that is sent to the client, can be null
     * @return Tenant - return value for client consumer
     */
    @Override
    protected Mono<Tenant> getClientPertinentTenant(Tenant dbTenant, Tenant clientTenant) {
        TenantConfiguration tenantConfiguration = dbTenant.getTenantConfiguration();
        return brandingService
                .getTenantConfiguration(tenantConfiguration)
                .flatMap(pacConfigurationService::getTenantConfiguration)
                .flatMap(sessionLimiterService::getTenantConfiguration)
                .map(updatedTenantConfiguration -> {
                    dbTenant.setTenantConfiguration(updatedTenantConfiguration);
                    return dbTenant;
                })
                .flatMap(updatedDbTenant -> {
                    // if user is superuser, then only return subscription details
                    return sessionUserService
                            .getCurrentUser()
                            .flatMap(userUtils::isSuperUser)
                            .map(isSuperUser -> {
                                if (!isSuperUser
                                        && updatedDbTenant.getTenantConfiguration() != null
                                        && updatedDbTenant
                                                        .getTenantConfiguration()
                                                        .getLicense()
                                                != null) {
                                    updatedDbTenant
                                            .getTenantConfiguration()
                                            .getLicense()
                                            .setSubscriptionDetails(null);
                                }
                                return updatedDbTenant;
                            })
                            .switchIfEmpty(Mono.just(updatedDbTenant));
                })
                .flatMap(updatedDbTenant -> super.getClientPertinentTenant(updatedDbTenant, clientTenant));
    }

    private void sendFreeInstanceSetupEvent(Tenant tenant) {
        if (tenant == null) {
            return;
        }
        Map<String, Object> analyticsProperties = new HashMap<>();
        analyticsProperties.put(FieldName.LICENSE_PLAN, LicensePlan.FREE);
        analyticsProperties.put(FieldName.TENANT_ID, tenant.getId());

        sendAnalyticsEvent(AnalyticsEvents.FREE_PLAN, analyticsProperties);
    }

    private Mono<Boolean> sendAddLicenseToInstanceEvent(Tenant tenant) {
        if (tenant == null) {
            return Mono.just(true);
        }
        Map<String, Object> analyticsProperties = new HashMap<>();
        License license = tenant.getTenantConfiguration().getLicense();

        updateCurrentLicenseProperties(license, analyticsProperties);
        analyticsProperties.put(FieldName.TENANT_ID, tenant.getId());

        sendAnalyticsEvent(AnalyticsEvents.ADD_LICENSE, analyticsProperties);
        return logEvent(AnalyticsEvents.ADD_LICENSE, license, analyticsProperties)
                .thenReturn(true);
    }

    private Mono<Boolean> sendLicenseRemovedFromInstanceEvent(Tenant tenant, License pastLicense) {
        if (tenant == null) {
            return Mono.just(true);
        }
        Map<String, Object> analyticsProperties = new HashMap<>();
        License license = tenant.getTenantConfiguration().getLicense();

        analyticsProperties.put(FieldName.TENANT_ID, tenant.getId());
        updatePastLicenseProperties(pastLicense, analyticsProperties);
        updateCurrentLicenseProperties(license, analyticsProperties);

        sendAnalyticsEvent(AnalyticsEvents.REMOVE_LICENSE, analyticsProperties);
        return logEvent(AnalyticsEvents.REMOVE_LICENSE, pastLicense, analyticsProperties)
                .thenReturn(true);
    }

    private void sendLicenseRefreshedEvent(Tenant tenant, License pastLicense, License currentLicense) {
        if (tenant == null) {
            return;
        }
        Map<String, Object> analyticsProperties = new HashMap<>();

        updatePastLicenseProperties(pastLicense, analyticsProperties);
        updateCurrentLicenseProperties(currentLicense, analyticsProperties);
        analyticsProperties.put(FieldName.TENANT_ID, tenant.getId());

        sendAnalyticsEvent(AnalyticsEvents.REFRESH_LICENSE, analyticsProperties);
    }

    private Mono<Boolean> sendLicenseUpdatedOnInstanceEvent(Tenant tenant, License existingLicense) {
        if (tenant == null) {
            return Mono.just(true);
        }
        // if existing license is empty, it is a license add event
        if (existingLicense == null || StringUtils.isNullOrEmpty(existingLicense.getKey())) {
            return sendAddLicenseToInstanceEvent(tenant);
        }

        Map<String, Object> analyticsProperties = new HashMap<>();
        License license = tenant.getTenantConfiguration().getLicense();
        String instanceId = tenant.getInstanceId();

        updatePastLicenseProperties(existingLicense, analyticsProperties);
        updateCurrentLicenseProperties(license, analyticsProperties);
        analyticsProperties.put(FieldName.TENANT_ID, tenant.getId());

        sendAnalyticsEvent(AnalyticsEvents.UPDATE_LICENSE, analyticsProperties);
        return logEvent(AnalyticsEvents.UPDATE_LICENSE, license, analyticsProperties)
                .thenReturn(true);
    }

    private Mono<AuditLog> logEvent(AnalyticsEvents event, License license, Map<String, Object> analyticsProperties) {
        return auditLogService.logEvent(event, license, Map.of(FieldName.EVENT_DATA, analyticsProperties));
    }

    private void sendAnalyticsEvent(AnalyticsEvents event, Map<String, Object> analyticsProperties) {
        configService
                .getInstanceId()
                .flatMap(instanceId -> networkUtils.getExternalAddress().flatMap(ipAddress -> {
                    analyticsProperties.put(FieldName.IP_ADDRESS, ipAddress);
                    analyticsProperties.put(FieldName.INSTANCE_ID, instanceId);
                    return analyticsService.sendEvent(event.getEventName(), instanceId, analyticsProperties, false);
                }))
                .subscribeOn(scheduler)
                .subscribe();
    }

    private void updateCurrentLicenseProperties(License license, Map<String, Object> analyticsProperties) {
        if (license == null) {
            return;
        }
        analyticsProperties.put(FieldName.LICENSE_ID, license.getLicenseId());
        analyticsProperties.put(FieldName.LICENSE_PLAN, license.getPlan());
        analyticsProperties.put(FieldName.LICENSE_ORIGIN, license.getOrigin());
        analyticsProperties.put(FieldName.LICENSE_TYPE, license.getType());
        analyticsProperties.put(FieldName.LICENSE_STATUS, license.getStatus());
    }

    private void updatePastLicenseProperties(License pastLicense, Map<String, Object> analyticsProperties) {
        if (pastLicense == null) {
            return;
        }
        analyticsProperties.put(FieldName.PREVIOUS_PLAN, pastLicense.getPlan());
        analyticsProperties.put(FieldName.PREVIOUS_ORIGIN, pastLicense.getOrigin());
        analyticsProperties.put(FieldName.PREVIOUS_TYPE, pastLicense.getType());
        analyticsProperties.put(FieldName.PREVIOUS_STATUS, pastLicense.getStatus());
        analyticsProperties.put(FieldName.PAST_LICENSE_ID, pastLicense.getLicenseId());
    }
}

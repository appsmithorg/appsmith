package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.LicenseStatus;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.ce.TenantServiceCEImpl;
import com.appsmith.server.solutions.LicenseValidator;
import jakarta.validation.Validator;
import org.pf4j.util.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.util.function.Tuple2;

import java.util.Map;

import static com.appsmith.server.constants.CommonConstants.FOR;
import static com.appsmith.server.constants.CommonConstants.DELIMETER_SPACE;
import static com.appsmith.server.constants.CommonConstants.IN;
import static com.appsmith.server.constants.CommonConstants.COLUMN;
import static com.appsmith.server.constants.CommonConstants.DEFAULT;

@Service
public class TenantServiceImpl extends TenantServiceCEImpl implements TenantService {

    private final LicenseValidator licenseValidator;
    private final SessionUserService sessionUserService;
    private final WorkspaceRepository workspaceRepository;
    private final ApplicationRepository applicationRepository;
    private final RedirectHelper redirectHelper;

    @Autowired
    public TenantServiceImpl(Scheduler scheduler,
                             Validator validator,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             TenantRepository repository,
                             WorkspaceRepository workspaceRepository,
                             ApplicationRepository applicationRepository,
                             AnalyticsService analyticsService,
                             ConfigService configService,
                             SessionUserService sessionUserService,
                             LicenseValidator licenseValidator,RedirectHelper redirectHelper){

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService, configService);
        this.licenseValidator = licenseValidator;
        this.sessionUserService = sessionUserService;
        this.redirectHelper = redirectHelper;
        this.workspaceRepository = workspaceRepository;
        this.applicationRepository = applicationRepository;
    }

    @Override
    public Mono<Tenant> findById(String id, AclPermission aclPermission) {
        return repository.findById(id, aclPermission);
    }

    @Override
    public Mono<Tenant> save(Tenant tenant) {
        return repository.save(tenant);
    }

    @Override
    public Mono<Tenant> getDefaultTenant() {
        // Get the default tenant object from the DB and then populate the relevant user permissions in that
        // We are doing this differently because `findBySlug` is a Mongo JPA query and not a custom Appsmith query
        return repository.findBySlug(FieldName.DEFAULT)
                .flatMap(tenant -> repository.setUserPermissionsInObject(tenant)
                        .switchIfEmpty(Mono.just(tenant)));
    }

    @Override
    public Mono<Tenant> getDefaultTenant(AclPermission aclPermission) {
        return repository.findBySlug(FieldName.DEFAULT, aclPermission);
    }

    @Override
    public Mono<Tenant> getTenantConfiguration() {
        return Mono.zip(
                        this.getDefaultTenant(),
                        super.getTenantConfiguration()
                )
                .map(tuple -> {
                    final Tenant dbTenant = tuple.getT1();
                    final Tenant clientTenant = tuple.getT2();
                    final TenantConfiguration config = clientTenant.getTenantConfiguration();

                    if (org.springframework.util.StringUtils.hasText(System.getenv("APPSMITH_OAUTH2_OIDC_CLIENT_ID"))) {
                        config.addThirdPartyAuth("oidc");
                    }

                    if ("true".equals(System.getenv("APPSMITH_SSO_SAML_ENABLED"))) {
                        config.addThirdPartyAuth("saml");
                    }

                    return getClientPertinentTenant(dbTenant, clientTenant);
                });
    }

    /**
     * To add a license key to the default tenant and return redirect URL
     * @param licenseKey License key
     * @param exchange ServerWebExchange
     * @return Mono of String
     */
    public Mono<String> addLicenseKeyAndGetRedirectUrl(String licenseKey, ServerWebExchange exchange) {
        if (StringUtils.isNullOrEmpty(licenseKey)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.LICENSE_KEY));
        }
        return saveTenantLicenseKey(licenseKey)
                .flatMap(tuple -> sessionUserService.getCurrentUser()
                        .flatMap(user -> workspaceRepository.findFirstByIsAutoGeneratedWorkspaceAndEmailOrderByCreatedAt(true, user.getEmail())
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, DEFAULT + DELIMETER_SPACE + FieldName.WORKSPACE + FOR,  FieldName.USER + COLUMN + user.getId()))))
                        .flatMap(workspace -> applicationRepository.findFirstByWorkspaceId(workspace.getId())
                                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, DEFAULT + DELIMETER_SPACE + FieldName.APPLICATION + IN, FieldName.WORKSPACE + COLUMN + workspace.getId()))))
                        .map(application ->  redirectHelper.buildSignupSuccessUrl(redirectHelper.buildApplicationUrl(application, exchange.getRequest().getHeaders()), true)));
    }

    /**
     * To update the default tenant's license key
     * Response will be status of update with 2xx
     * @param licenseKey License key received from client
     * @return Mono of Tenant
     */
    public Mono<Tenant> updateTenantLicenseKey(String licenseKey) {
        return saveTenantLicenseKey(licenseKey)
                .map(tuple -> getClientPertinentTenant(tuple.getT1(), null));
    }

    /**
     * To validate and save the license key in the DB and send corresponding analytics event
     * Only valid license keys will be saved in the DB
     * @param licenseKey License key
     * @return Mono of Tuple<Tenant, Boolean>
     */
    private Mono<Tuple2<Tenant, Boolean>> saveTenantLicenseKey(String licenseKey) {
        TenantConfiguration.License license = new TenantConfiguration.License();
        license.setKey(licenseKey);
        // TODO: Update to getCurrentTenant when multi tenancy is introduced
        return repository.findBySlug(FieldName.DEFAULT, AclPermission.MANAGE_TENANT)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.TENANT, FieldName.DEFAULT)))
                .flatMap(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    boolean isActivateInstance = tenantConfiguration.getLicense() == null || StringUtils.isNullOrEmpty(tenantConfiguration.getLicense().getKey());
                    tenantConfiguration.setLicense(license);
                    tenant.setTenantConfiguration(tenantConfiguration);

                    return checkTenantLicense(tenant).zipWith(Mono.just(isActivateInstance));
                })
                .flatMap(tuple -> {
                    Tenant tenant = tuple.getT1();
                    boolean isActivateInstance = tuple.getT2();
                    TenantConfiguration.License license1 = tenant.getTenantConfiguration().getLicense();
                    AnalyticsEvents analyticsEvent = isActivateInstance ? AnalyticsEvents.ACTIVATE_NEW_INSTANCE : AnalyticsEvents.UPDATE_EXISTING_LICENSE;
                    Map<String, Object> analyticsProperties = Map.of(
                            FieldName.LICENSE_KEY, StringUtils.isNullOrEmpty(license1.getKey()) ? "" : DataTypeStringUtils.maskString(license1.getKey(), 8, 32, 'x'),
                            FieldName.LICENSE_VALID, license1.getStatus() != null  && LicenseStatus.ACTIVE.equals(license1.getStatus()),
                            FieldName.LICENSE_TYPE, license1.getType() == null ? "" : license1.getType(),
                            FieldName.LICENSE_STATUS, license1.getStatus() == null ? "" : license1.getStatus()
                    );
                    Mono<Tenant> analyticsEventMono = analyticsService.sendObjectEvent(analyticsEvent, tenant, analyticsProperties);
                    // Update/save license only in case of a valid license key
                    if (!Boolean.TRUE.equals(tenant.getTenantConfiguration().getLicense().getActive())) {
                        return analyticsEventMono.then(Mono.error(new AppsmithException(AppsmithError.INVALID_LICENSE_KEY_ENTERED)));
                    }

                    return this.save(tenant)
                            .flatMap(analyticsEventMono::thenReturn).zipWith(Mono.just(isActivateInstance));
                });
    }

    /**
     * To refresh the current license status in the DB by making a license validation request to the Cloud Services and
     * return latest license status
     * @return Mono of Tenant
     */
    public Mono<Tenant> refreshAndGetCurrentLicense() {
        // TODO: Update to getCurrentTenant when multi tenancy is introduced
        return repository.findBySlug(FieldName.DEFAULT, AclPermission.MANAGE_TENANT)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.TENANT, FieldName.DEFAULT)))
                .flatMap(this::checkTenantLicense)
                .flatMap(this::save)
                .map(tenant -> getClientPertinentTenant(tenant, null));
    }

    /**
     * To check the status of a license key associated with the tenant
     * @param tenant Tenant
     * @return Mono of Tenant
     */
    private Mono<Tenant> checkTenantLicense(Tenant tenant) {
        Mono<TenantConfiguration.License> licenseMono = licenseValidator.licenseCheck(tenant);
        return licenseMono
            .map(license -> {
                // To prevent empty License object being saved in DB for license checks with empty license key
                if (!StringUtils.isNullOrEmpty(license.getKey())) {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    tenantConfiguration.setLicense(license);
                    tenant.setTenantConfiguration(tenantConfiguration);
                }
                return tenant;
            });
    }

    /**
     * To check and update the status of default tenant's license
     * This can be used for periodic license checks via scheduled jobs
     * @return Mono of Tenant
     */
    public Mono<Tenant> checkAndUpdateDefaultTenantLicense() {
        return this.getDefaultTenant()
                .flatMap(this::checkTenantLicense)
                .flatMap(this::save);
    }

    /**
     * To check whether a tenant have valid license configuration
     * @param tenant Tenant
     * @return Boolean
     */
    public Boolean isValidLicenseConfiguration(Tenant tenant) {
        return tenant.getTenantConfiguration() != null &&
                tenant.getTenantConfiguration().getLicense() != null &&
                tenant.getTenantConfiguration().getLicense().getKey() != null;
    }

    @Override
    public Mono<Tenant> updateDefaultTenantConfiguration(TenantConfiguration tenantConfiguration) {
        return getDefaultTenantId()
                .flatMap(tenantId -> updateTenantConfiguration(tenantId, tenantConfiguration));
    }
}
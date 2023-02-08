package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.services.ce.TenantServiceCEImpl;
import com.appsmith.server.solutions.LicenseValidator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import jakarta.validation.Validator;

@Service
public class TenantServiceImpl extends TenantServiceCEImpl implements TenantService {
    private final LicenseValidator licenseValidator;
    public TenantServiceImpl(Scheduler scheduler,
                             Validator validator,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             TenantRepository repository,
                             AnalyticsService analyticsService,
                             LicenseValidator licenseValidator,
                             ConfigService configService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService, configService);
        this.licenseValidator = licenseValidator;
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
        // Get the default tenant object from the DB and then populate the relevant user permissions in it
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
                    return getClientPertinentTenant(dbTenant, clientTenant);
                });
    }

    /**
     * To set a license key to the default tenant
     * Only valid license key will get added to the tenant
     * @param licenseKey
     * @return Mono of Tenant
     */
    public Mono<Tenant> setTenantLicenseKey(String licenseKey) {
        TenantConfiguration.License license = new TenantConfiguration.License();
        license.setKey(licenseKey);
        // TODO: Update to getCurrentTenant when multi tenancy is introduced
        return repository.findBySlug(FieldName.DEFAULT, AclPermission.MANAGE_TENANT)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.TENANT, FieldName.DEFAULT)))
                .flatMap(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    tenantConfiguration.setLicense(license);
                    tenant.setTenantConfiguration(tenantConfiguration);

                    return checkTenantLicense(tenant);
                })
                .flatMap(tenant -> {
                    // Update/save license only in case of a valid license key
                    if (!Boolean.TRUE.equals(tenant.getTenantConfiguration().getLicense().getActive())) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.KEY));
                    }
                    return this.save(tenant);
                })
                .map((Tenant dbTenant) -> getClientPertinentTenant(dbTenant, null));
    }

    /**
     * To check the status of a license key associated with the tenant
     * @param tenant
     * @return Mono of Tenant
     */
    private Mono<Tenant> checkTenantLicense(Tenant tenant) {
        Mono<TenantConfiguration.License> licenseMono = licenseValidator.licenseCheck(tenant);
        return licenseMono
            .map(license -> {
                TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                tenantConfiguration.setLicense(license);
                tenant.setTenantConfiguration(tenantConfiguration);
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
     * To get the Tenant with values that are pertinent to the client
     * @param dbTenant Original tenant from the database
     * @param clientTenant Tenant object that is sent to the client, can be null
     * @return Tenant
     */
    private Tenant getClientPertinentTenant(Tenant dbTenant, Tenant clientTenant) {
        TenantConfiguration tenantConfiguration;
        if (clientTenant == null) {
            clientTenant = new Tenant();
            tenantConfiguration = new TenantConfiguration();
        } else {
            tenantConfiguration = clientTenant.getTenantConfiguration();
        }

        // Only copy the values that are pertinent to the client
        tenantConfiguration.copyNonSensitiveValues(dbTenant.getTenantConfiguration());
        clientTenant.setTenantConfiguration(tenantConfiguration);
        clientTenant.setUserPermissions(dbTenant.getUserPermissions());

        return clientTenant;
    }

    /**
     * To check whether a tenant have valid license configuration
     * @param tenant Tenant
     * @return
     */
    public Boolean isValidLicenseConfiguration(Tenant tenant) {
        return tenant.getTenantConfiguration() != null &&
                tenant.getTenantConfiguration().getLicense() != null &&
                tenant.getTenantConfiguration().getLicense().getKey() != null;
    }
}

package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
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
                             LicenseValidator licenseValidator) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
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
        return this.getDefaultTenant()
                .map(dbTenant -> getClientPertinentTenant(dbTenant));
    }

    /**
     * To set a license key to the default tenant
     * Only valid license key will get added to the tenant
     * @param licenseKey
     * @return Mono of Tenant
     */
    public Mono<Tenant> setTenantLicenseKey (String licenseKey) {
        TenantConfiguration.License license = new TenantConfiguration.License();
        license.setKey(licenseKey);
        // TODO: Update to getCurrentTenant when multi tenancy is introduced
        return this.getDefaultTenant()
                .flatMap(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    tenantConfiguration.setLicense(license);
                    tenant.setTenantConfiguration(tenantConfiguration);

                    return checkTenantLicense(tenant);
                })
                .flatMap(tenant -> {
                    // Add license only in case of a valid license key
                    if (tenant.getTenantConfiguration().getLicense().getActive()) {
                        return save(tenant);
                    }
                    return Mono.just(tenant);
                })
                .map(dbTenant -> getClientPertinentTenant(dbTenant));
    }

    /**
     * To check the status of a license key associated with the tenant
     * @param tenant
     * @return Mono of Tenant
     */
    private Mono<Tenant> checkTenantLicense(Tenant tenant) {
        TenantConfiguration.License license = licenseValidator.licenseCheck(tenant);
        TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
        tenantConfiguration.setLicense(license);
        tenant.setTenantConfiguration(tenantConfiguration);

        return Mono.just(tenant);
    }

    /**
     * To check and update the status of default tenant's license
     * This can be used for periodic license checks via scheduled jobs
     * @return Mono of Tenant
     */
    public Mono<Tenant> checkAndUpdateDefaultTenantLicense() {
        return this.getDefaultTenant()
                .flatMap(tenant -> checkTenantLicense(tenant).then(save(tenant)));
    }

    /**
     * To get the Tenant with values that are pertinent to the client
     * @param dbTenant
     * @return Tenant
     */
    private Tenant getClientPertinentTenant(Tenant dbTenant) {
        Tenant tenant = new Tenant();
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        TenantConfiguration dbTenantConfiguration = dbTenant.getTenantConfiguration();

        // Only copy the values that are pertinent to the client
        tenantConfiguration.copyNonSensitiveValues(dbTenantConfiguration);
        tenant.setTenantConfiguration(tenantConfiguration);
        tenant.setUserPermissions(dbTenant.getUserPermissions());

        return tenant;
    }
}

package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.services.ce.TenantServiceCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import jakarta.validation.Validator;

@Service
public class TenantServiceImpl extends TenantServiceCEImpl implements TenantService {
    public TenantServiceImpl(Scheduler scheduler,
                             Validator validator,
                             MongoConverter mongoConverter,
                             ReactiveMongoTemplate reactiveMongoTemplate,
                             TenantRepository repository,
                             AnalyticsService analyticsService) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
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
                .map(dbTenant -> {
                    Tenant tenant = new Tenant();
                    TenantConfiguration tenantConfiguration = new TenantConfiguration();
                    TenantConfiguration dbTenantConfiguration = dbTenant.getTenantConfiguration();

                    // Only copy the values that are pertinent to the client
                    tenantConfiguration.copyNonSensitiveValues(dbTenantConfiguration);
                    tenant.setTenantConfiguration(tenantConfiguration);
                    tenant.setUserPermissions(dbTenant.getUserPermissions());
                    return tenant;
                });
    }
}

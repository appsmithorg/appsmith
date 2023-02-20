package com.appsmith.server.services.ce;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.EnvVariables;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.ConfigService;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import jakarta.validation.Validator;

import static com.appsmith.server.acl.AclPermission.MANAGE_TENANT;

public class TenantServiceCEImpl extends BaseService<TenantRepository, Tenant, String> implements TenantServiceCE {

    private String tenantId = null;

    private final ConfigService configService;

    public TenantServiceCEImpl(Scheduler scheduler,
                               Validator validator,
                               MongoConverter mongoConverter,
                               ReactiveMongoTemplate reactiveMongoTemplate,
                               TenantRepository repository,
                               AnalyticsService analyticsService,
                               ConfigService configService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.configService = configService;
    }

    @Override
    public Mono<String> getDefaultTenantId() {

        // If the value exists in cache, return it as is
        if (StringUtils.hasLength(tenantId)) {
            return Mono.just(tenantId);
        }

        return repository.findBySlug(FieldName.DEFAULT)
                .map(Tenant::getId)
                .map(tenantId -> {
                    // Set the cache value before returning.
                    this.tenantId = tenantId;
                    return tenantId;
                });
    }

    @Override
    public Mono<Tenant> updateTenantConfiguration(String tenantId, TenantConfiguration tenantConfiguration) {
        return repository.findById(tenantId, MANAGE_TENANT)
                .flatMap(tenant -> {
                    TenantConfiguration oldtenantConfiguration = tenant.getTenantConfiguration();
                    if (oldtenantConfiguration == null) {
                        oldtenantConfiguration = new TenantConfiguration();
                    }
                    AppsmithBeanUtils.copyNestedNonNullProperties(tenantConfiguration, oldtenantConfiguration);
                    tenant.setTenantConfiguration(oldtenantConfiguration);
                    return repository.updateById(tenantId, tenant, MANAGE_TENANT);
                });
    }

    @Override
    public Mono<Tenant> findById(String tenantId, AclPermission permission) {
        return repository.findById(tenantId, permission)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "tenantId", tenantId)));
    }

    @Override
    public Mono<Tenant> getDefaultTenant() {
        // Get the default tenant object from the DB and then populate the relevant user permissions in that
        // We are doing this differently because `findBySlug` is a Mongo JPA query and not a custom Appsmith query
        return repository.findBySlug(FieldName.DEFAULT)
                .flatMap(tenant -> repository.setUserPermissionsInObject(tenant).thenReturn(tenant));
    }

    @Override
    public Mono<Tenant> getTenantConfiguration() {
        return Mono.zip(
                        getDefaultTenant(),
                        configService.getInstanceId()
                )
                .map(tuple -> {
                    final Tenant dbTenant = tuple.getT1();
                    final String instanceId = tuple.getT2();

                    final Tenant tenantForClient = new Tenant();
                    tenantForClient.setInstanceId(instanceId);

                    final TenantConfiguration configForClient = new TenantConfiguration();
                    tenantForClient.setTenantConfiguration(configForClient);

                    // Only copy the values that are pertinent to the client
                    configForClient.copyNonSensitiveValues(dbTenant.getTenantConfiguration());
                    tenantForClient.setUserPermissions(dbTenant.getUserPermissions());

                    if (StringUtils.isEmpty(configForClient.getGoogleMapsKey())) {
                        configForClient.setGoogleMapsKey(System.getenv(EnvVariables.APPSMITH_GOOGLE_MAPS_API_KEY.name()));
                    }

                    return tenantForClient;
                });
    }

}

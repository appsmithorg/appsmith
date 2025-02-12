package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface TenantServiceCE extends CrudService<Tenant, String> {

    Mono<String> getDefaultTenantId();

    Mono<Tenant> updateTenantConfiguration(String tenantId, TenantConfiguration tenantConfiguration);

    Mono<Tenant> findById(String tenantId, AclPermission permission);

    Mono<Tenant> getTenantConfiguration(Mono<Tenant> dbTenantMono);

    Mono<Tenant> getTenantConfiguration();

    Mono<Tenant> getDefaultTenant();

    Mono<Tenant> updateDefaultTenantConfiguration(TenantConfiguration tenantConfiguration);

    Mono<Tenant> save(Tenant tenant);

    Mono<Tenant> checkAndExecuteMigrationsForTenantFeatureFlags(Tenant tenant);

    Mono<Tenant> retrieveById(String id);

    Mono<Void> restartTenant();

    Flux<Tenant> retrieveAll();
}

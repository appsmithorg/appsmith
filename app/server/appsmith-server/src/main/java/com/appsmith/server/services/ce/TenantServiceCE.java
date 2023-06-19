package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Mono;

public interface TenantServiceCE extends CrudService<Tenant, String> {

    Mono<String> getDefaultTenantId();

    Mono<Tenant> updateTenantConfiguration(String tenantId, TenantConfiguration tenantConfiguration);

    Mono<Tenant> findById(String tenantId, AclPermission permission);

    /*
     *  For now, returning an empty tenantConfiguration object in this class. Will enhance this function once we
     *  start saving other pertinent environment variables in the tenant collection
     */
    Mono<Tenant> getTenantConfiguration();

    Mono<Tenant> getDefaultTenant();

    Mono<Tenant> updateDefaultTenantConfiguration(TenantConfiguration tenantConfiguration);
}

package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.services.ce.TenantServiceCE;
import reactor.core.publisher.Mono;

public interface TenantService extends TenantServiceCE {
    Mono<Tenant> findById(String id, AclPermission aclPermission);
    Mono<Tenant> save(Tenant tenant);
    Mono<Tenant> getDefaultTenant();
}

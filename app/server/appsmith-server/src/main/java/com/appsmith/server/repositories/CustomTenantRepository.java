package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.repositories.ce.CustomTenantRepositoryCE;
import reactor.core.publisher.Mono;

public interface CustomTenantRepository extends CustomTenantRepositoryCE {
    Mono<Tenant> findBySlug(String slug, AclPermission aclPermission);
}

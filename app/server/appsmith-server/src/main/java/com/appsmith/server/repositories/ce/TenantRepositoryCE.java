package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.repositories.BaseRepository;

import java.util.Optional;

public interface TenantRepositoryCE extends BaseRepository<Tenant, String>, CustomTenantRepositoryCE {
    // Use tenantService.getDefaultTenant() instead of this method as it is cached to redis.
    @Deprecated(forRemoval = true)
    Optional<Tenant> findBySlug(String slug, EntityManager entityManager);
}

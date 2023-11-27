package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.repositories.BaseRepository;

public interface TenantRepositoryCE extends BaseRepository<Tenant, String>, CustomTenantRepositoryCE {
    Tenant findBySlug(String slug);
}

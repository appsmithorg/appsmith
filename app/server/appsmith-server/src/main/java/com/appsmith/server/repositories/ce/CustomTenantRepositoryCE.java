package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Mono;

public interface CustomTenantRepositoryCE extends AppsmithRepository<Tenant> {
    Mono<Tenant> save(Tenant tenant);

    Mono<Tenant> update(String tenantId, Tenant tenant);
}

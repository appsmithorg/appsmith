package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Mono;

public interface CustomTenantRepositoryCE extends AppsmithRepository<Tenant> {
    Mono<Integer> disableRestartForAllTenants();
}

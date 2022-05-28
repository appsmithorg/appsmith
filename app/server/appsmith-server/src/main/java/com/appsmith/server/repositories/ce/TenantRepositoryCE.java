package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.repositories.BaseRepository;
import reactor.core.publisher.Mono;

public interface TenantRepositoryCE extends BaseRepository<Tenant, String> {

    Mono<Tenant> findBySlug(String slug);

}

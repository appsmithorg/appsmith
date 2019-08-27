package com.appsmith.server.repositories;

import com.appsmith.server.domains.Tenant;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface TenantRepository extends BaseRepository<Tenant, String> {
    Mono<Tenant> findByName(String name);
}

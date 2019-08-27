package com.appsmith.server.services;

import com.appsmith.server.domains.Tenant;
import reactor.core.publisher.Mono;

public interface TenantService extends CrudService<Tenant, String> {

    Mono<Tenant> getByName(String name);

    Mono<Tenant> create(Tenant object);

    Mono<Tenant> findById(String id);

    Mono<Tenant> save(Tenant tenant);
}

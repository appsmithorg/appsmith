package com.mobtools.server.services;

import com.mobtools.server.domains.Tenant;
import reactor.core.publisher.Mono;

public interface TenantService extends CrudService<Tenant, String> {

    Mono<Tenant> getByName(String name);
}

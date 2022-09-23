package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Mono;

public interface TenantServiceCE extends CrudService<Tenant, String> {

    Mono<String> getDefaultTenantId();

}

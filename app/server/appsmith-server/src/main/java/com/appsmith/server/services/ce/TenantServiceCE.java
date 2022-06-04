package com.appsmith.server.services.ce;

import reactor.core.publisher.Mono;

public interface TenantServiceCE {

    Mono<String> getDefaultTenantId();

}

package com.appsmith.server.services.ce;

import reactor.core.publisher.Mono;

public interface TestServiceCE {
    Mono<String> ce_ee_same_impl_method();

    String ce_ee_same_diff_method();
}

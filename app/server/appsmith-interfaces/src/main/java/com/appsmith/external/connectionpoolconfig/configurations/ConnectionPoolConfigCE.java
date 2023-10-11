package com.appsmith.external.connectionpoolconfig.configurations;

import reactor.core.publisher.Mono;

public interface ConnectionPoolConfigCE {
    Mono<Integer> getMaxConnectionPoolSize();
}

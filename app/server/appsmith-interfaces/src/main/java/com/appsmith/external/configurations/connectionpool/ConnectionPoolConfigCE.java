package com.appsmith.external.configurations.connectionpool;

import reactor.core.publisher.Mono;

public interface ConnectionPoolConfigCE {
    Mono<Integer> getMaxConnectionPoolSize();
}

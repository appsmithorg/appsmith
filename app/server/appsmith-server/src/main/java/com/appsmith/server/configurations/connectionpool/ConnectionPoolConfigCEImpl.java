package com.appsmith.server.configurations.connectionpool;

import com.appsmith.external.configurations.connectionpool.ConnectionPoolConfigCE;
import reactor.core.publisher.Mono;

public class ConnectionPoolConfigCEImpl implements ConnectionPoolConfigCE {

    protected static final Integer DEFAULT_MINIMUM_MAX_POOL_SIZE = 5;

    @Override
    public Mono<Integer> getMaxConnectionPoolSize() {
        return Mono.just(DEFAULT_MINIMUM_MAX_POOL_SIZE);
    }
}

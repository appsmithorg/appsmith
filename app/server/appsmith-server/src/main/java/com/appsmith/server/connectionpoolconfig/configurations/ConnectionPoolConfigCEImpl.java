package com.appsmith.server.connectionpoolconfig.configurations;

import com.appsmith.external.connectionpoolconfig.configurations.ConnectionPoolConfigCE;
import reactor.core.publisher.Mono;

public class ConnectionPoolConfigCEImpl implements ConnectionPoolConfigCE {

    protected static final Integer DEFAULT_MINIMUM_MAX_POOL_SIZE = 5;

    @Override
    public Mono<Integer> getMaxConnectionPoolSize() {
        return Mono.just(DEFAULT_MINIMUM_MAX_POOL_SIZE);
    }
}

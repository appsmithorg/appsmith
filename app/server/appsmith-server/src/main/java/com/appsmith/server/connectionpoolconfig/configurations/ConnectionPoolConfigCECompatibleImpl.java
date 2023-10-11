package com.appsmith.server.connectionpoolconfig.configurations;

import com.appsmith.external.connectionpoolconfig.configurations.ConnectionPoolConfigCECompatible;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class ConnectionPoolConfigCECompatibleImpl extends ConnectionPoolConfigCEImpl
        implements ConnectionPoolConfigCECompatible {

    @Override
    public Mono<Integer> getMaxConnectionPoolSize() {
        return super.getMaxConnectionPoolSize();
    }
}

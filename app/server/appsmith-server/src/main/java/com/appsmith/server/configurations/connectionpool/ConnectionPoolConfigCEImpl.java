package com.appsmith.server.configurations.connectionpool;

import com.appsmith.external.configurations.connectionpool.ConnectionPoolConfigCE;
import org.springframework.beans.factory.annotation.Value;
import reactor.core.publisher.Mono;

public class ConnectionPoolConfigCEImpl implements ConnectionPoolConfigCE {

    protected static final Integer DEFAULT_MINIMUM_MAX_POOL_SIZE = 5;
    protected static final Integer DEFAULT_SOCKET_TIMEOUT_SECONDS = 600;

    /**
     * Per-read socket timeout applied to JDBC datasources, in seconds. Bounds how long any
     * single read on a pooled connection (or during connection establishment) can block.
     * Default 600s (10 min) leaves plenty of headroom for legitimately slow queries while
     * preventing the Hikari connection-adder from hanging indefinitely when the network
     * path is broken. Override via APPSMITH_PLUGIN_JDBC_SOCKET_TIMEOUT_SECONDS.
     */
    @Value("${appsmith.plugin.jdbc.socket-timeout-seconds:600}")
    private Integer socketTimeoutSeconds;

    @Override
    public Mono<Integer> getMaxConnectionPoolSize() {
        return Mono.just(DEFAULT_MINIMUM_MAX_POOL_SIZE);
    }

    @Override
    public Mono<Integer> getSocketTimeoutSeconds() {
        return Mono.just(socketTimeoutSeconds != null ? socketTimeoutSeconds : DEFAULT_SOCKET_TIMEOUT_SECONDS);
    }
}

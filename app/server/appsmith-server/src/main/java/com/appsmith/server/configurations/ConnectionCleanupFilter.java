package com.appsmith.server.configurations;

import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

public class ConnectionCleanupFilter implements WebFilter {

    private final CustomHikariDataSource dataSource;

    public ConnectionCleanupFilter(CustomHikariDataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        return chain.filter(exchange).doFinally(signalType -> {
            String reqId = ReactorContextHelper.getReqId();
            if (reqId != null) {
                dataSource.releaseConnection(reqId);
            }
        });
    }
}

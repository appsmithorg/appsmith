package com.appsmith.server.filters;

import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

public class ConditionalFilter implements WebFilter {

    private final WebFilter filter;
    private final String targetUrl;

    public ConditionalFilter(WebFilter filter, String targetUrl) {
        this.filter = filter;
        this.targetUrl = targetUrl;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        if (exchange.getRequest().getPath().toString().equals(targetUrl)) {
            return filter.filter(exchange, chain);
        }

        return chain.filter(exchange);
    }
}

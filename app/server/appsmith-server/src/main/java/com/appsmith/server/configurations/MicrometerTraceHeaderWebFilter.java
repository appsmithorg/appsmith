package com.appsmith.server.configurations;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Order(Ordered.HIGHEST_PRECEDENCE)
@Component
public class MicrometerTraceHeaderWebFilter implements WebFilter {

    public static final String TRACEPARENT_OTLP_HEADER_KEY = "traceparent-otlp";
    public static final String TRACEPARENT_HEADER_KEY = "traceparent";
    @Override
    public Mono<Void> filter(ServerWebExchange serverWebExchange,
                             WebFilterChain webFilterChain) {
        HttpHeaders requestHeaders = serverWebExchange.getRequest()
            .getHeaders();

        if (requestHeaders.containsKey(TRACEPARENT_OTLP_HEADER_KEY)) {
            ServerHttpRequest newRequest = serverWebExchange.getRequest().mutate().header(TRACEPARENT_HEADER_KEY, requestHeaders.get(
                TRACEPARENT_OTLP_HEADER_KEY).get(0)).build();
            ServerWebExchange newExchange = serverWebExchange.mutate().request(newRequest).build();

            return webFilterChain.filter(newExchange);
        }

        return webFilterChain.filter(serverWebExchange);
    }
}

package com.mobtools.server.filters;

import com.mobtools.server.helpers.LogHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * This class specifically parses the requestId key from the headers and sets it in the logger MDC
 */
@Slf4j
@Component
public class RequestIdFilter implements WebFilter {

    private static final String REQUEST_ID_HEADER = "X-REQUEST-ID";
    private static final String REQUEST_ID_LOG = "requestId";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {

        if (!exchange.getRequest().getHeaders().containsKey(REQUEST_ID_HEADER)) {
            exchange.getRequest().mutate().header(REQUEST_ID_HEADER, UUID.randomUUID().toString()).build();
        }

        String header = exchange.getRequest().getHeaders().get(REQUEST_ID_HEADER).get(0);
        log.debug("Setting the requestId header to {}", header);
        return chain.filter(exchange).subscriberContext(LogHelper.putLogContext(REQUEST_ID_LOG, header));
    }
}

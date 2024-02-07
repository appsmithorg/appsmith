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

import static org.springframework.util.CollectionUtils.isEmpty;

/**
 * This webfilter copies the value of traceparent-otlp header into traceparent header. This is required because at
 * the moment the client application has two different services that creates traces and sends to the NewRelic server
 * - one that gathers web vitals information like LCP, FCP etc. and another one that creates user defined traces. They
 * both have different traceparent header and hence to overcome this conflict of headers the client has copied the
 * user defined trace header into traceparent-otlp. However, Micrometer expects the traceparent information to be
 * present in the traceparent header - hence this method copies the correct header data into traceparent header
 * before it gets set into Micrometer context.
 * As per measurement on my local setup this webFilter takes around 0.1 milliseconds to complete hence should not
 * have any practical impact on response times.
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
@Component
public class MicrometerTraceHeaderWebFilter implements WebFilter {

    public static final String TRACEPARENT_OTLP_HEADER_KEY = "traceparent-otlp";
    public static final String TRACEPARENT_HEADER_KEY = "traceparent";

    @Override
    public Mono<Void> filter(ServerWebExchange serverWebExchange, WebFilterChain webFilterChain) {
        HttpHeaders requestHeaders = serverWebExchange.getRequest().getHeaders();

        if (isTraceparentOtlpHeaderPresent(requestHeaders)) {
            ServerHttpRequest newRequest = serverWebExchange
                    .getRequest()
                    .mutate()
                    .header(
                            TRACEPARENT_HEADER_KEY,
                            requestHeaders.get(TRACEPARENT_OTLP_HEADER_KEY).get(0))
                    .build();
            ServerWebExchange newExchange =
                    serverWebExchange.mutate().request(newRequest).build();

            return webFilterChain.filter(newExchange);
        }

        return webFilterChain.filter(serverWebExchange);
    }

    private boolean isTraceparentOtlpHeaderPresent(HttpHeaders requestHeaders) {
        return requestHeaders != null
                && requestHeaders.containsKey(TRACEPARENT_OTLP_HEADER_KEY)
                && !isEmpty(requestHeaders.get(TRACEPARENT_OTLP_HEADER_KEY));
    }
}

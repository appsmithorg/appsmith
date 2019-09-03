package com.appsmith.server.filters;

import com.appsmith.server.helpers.LogHelper;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;

import java.util.Map;
import java.util.UUID;

import static java.util.stream.Collectors.toMap;

/**
 * This class parses all headers that start with X-MDC-* and set them in the logger MDC.
 * These MDC parameters are also set in the response object before being sent to the user.
 */
@Component
@Slf4j
public class MDCFilter implements WebFilter {

    private static final String MDC_HEADER_PREFIX = "X-MDC-";
    private static final String REQUEST_ID_HEADER = "X-REQUEST-ID";
    private static final String REQUEST_ID_LOG = "requestId";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        try {
            // Using beforeCommit here ensures that the function `addContextToHttpResponse` isn't run immediately
            // It is only run when the response object is being created
            exchange.getResponse().beforeCommit(() -> addContextToHttpResponse(exchange.getResponse()));
            return chain.filter(exchange).subscriberContext(ctx -> addRequestHeadersToContext(exchange.getRequest(), ctx));
        } finally {
            MDC.clear();
        }
    }

    private Context addRequestHeadersToContext(final ServerHttpRequest request, final Context context) {
        final Map<String, String> contextMap = request.getHeaders().toSingleValueMap().entrySet()
                .stream()
                .filter(x -> x.getKey().startsWith(MDC_HEADER_PREFIX))
                .collect(toMap(v -> v.getKey().substring((MDC_HEADER_PREFIX.length())), Map.Entry::getValue));

        contextMap.put(REQUEST_ID_LOG, getOrCreateRequestId(request));

        // Set the MDC context here for regular non-reactive logs
        MDC.setContextMap(contextMap);

        // Setting the context map to the reactive context. This will be used in the reactive logger to print the MDC
        return context.put(LogHelper.CONTEXT_MAP, contextMap);
    }

    private Mono<Void> addContextToHttpResponse(final ServerHttpResponse response) {
        return Mono.subscriberContext().doOnNext(ctx -> {
            if (!ctx.hasKey(LogHelper.CONTEXT_MAP)) {
                return;
            }

            final HttpHeaders httpHeaders = response.getHeaders();
            // Add all the request MDC keys to the response object
            ctx.<Map<String, String>>get(LogHelper.CONTEXT_MAP)
                    .forEach((key, value) -> {
                        if (!key.contains(REQUEST_ID_LOG)) {
                            httpHeaders.add(MDC_HEADER_PREFIX + key, value);
                        } else {
                            httpHeaders.add(REQUEST_ID_HEADER, value);
                        }
                    });

        }).then();
    }

    private String getOrCreateRequestId(final ServerHttpRequest request) {
        if (!request.getHeaders().containsKey(REQUEST_ID_HEADER)) {
            request.mutate().header(REQUEST_ID_HEADER, UUID.randomUUID().toString()).build();
        }

        String header = request.getHeaders().get(REQUEST_ID_HEADER).get(0);
        return header;
    }
}


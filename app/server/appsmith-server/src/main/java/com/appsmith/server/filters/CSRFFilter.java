package com.appsmith.server.filters;

import com.appsmith.server.constants.Url;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.Set;
import java.util.UUID;

import static java.util.stream.Collectors.toMap;

@Slf4j
public class CSRFFilter implements WebFilter {

    private static final Set<String> EXEMPT = Set.of(
            Url.LOGIN_URL,
            Url.USER_URL  // For signup request
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        final ServerHttpRequest request = exchange.getRequest();
        final HttpMethod method = request.getMethod();
        final boolean isGetOrHead = HttpMethod.GET.equals(method) || HttpMethod.HEAD.equals(method);

        if (!isGetOrHead && !EXEMPT.contains(request.getPath().value())) {
            // For POST requests, either a `X-Requested-By: Appsmith` header or a `Content-Type: application/json`
            // is required. If neither is present, reject the request. This is to prevent CSRF attacks.
            if (MediaType.APPLICATION_JSON.equals(request.getHeaders().getContentType())
                    || "Appsmith".equals(request.getHeaders().getFirst("X-Requested-By"))) {
                return chain.filter(exchange);
            }

            log.error("CSRF header requirements not satisfied to {}. Rejecting request.", request.getPath());
            return Mono.error(new RuntimeException("CSRF header requirements not satisfied. Rejecting request."));
        }

        return chain.filter(exchange);
    }

}

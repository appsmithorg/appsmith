package com.appsmith.server.filters;

import com.appsmith.server.constants.Url;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.Set;

import static java.util.stream.Collectors.toMap;

@Slf4j
public class CSRFFilter implements WebFilter {

    private static final Set<String> EXEMPT = Set.of(
            Url.LOGIN_URL,
            Url.USER_URL,  // For signup request
            Url.USER_URL + "/super"  // For superuser signup request
    );

    private static final String X_REQUESTED_BY_NAME = "X-Requested-By";
    private static final String X_REQUESTED_BY_VALUE = "Appsmith";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        final ServerHttpRequest request = exchange.getRequest();
        final HttpMethod method = request.getMethod();
        final boolean isGetOrHead = HttpMethod.GET.equals(method) || HttpMethod.HEAD.equals(method);

        if (!isGetOrHead && !EXEMPT.contains(request.getPath().value())) {
            // For POST requests, either a `X-Requested-By: Appsmith` header or a `Content-Type: application/json`
            // is required. If neither is present, reject the request. This is to prevent CSRF attacks.
            if (MediaType.APPLICATION_JSON.equals(request.getHeaders().getContentType())
                    || X_REQUESTED_BY_VALUE.equals(request.getHeaders().getFirst(X_REQUESTED_BY_NAME))) {
                return chain.filter(exchange);
            }

            log.error("CSRF header requirements not satisfied to {}. Rejecting request.", request.getPath());
            return Mono.error(new AppsmithException(
                    AppsmithError.CSRF_TOKEN_INVALID,
                    "CSRF header requirements not satisfied. Rejecting request."
            ));
        }

        return chain.filter(exchange);
    }

}

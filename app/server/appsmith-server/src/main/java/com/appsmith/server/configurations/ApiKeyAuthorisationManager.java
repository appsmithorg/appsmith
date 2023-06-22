package com.appsmith.server.configurations;

import org.apache.commons.lang.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.ReactiveAuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.authorization.AuthorizationContext;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class ApiKeyAuthorisationManager implements ReactiveAuthorizationManager<AuthorizationContext> {
    private static final AuthorizationDecision UNAUTHORIZED = new AuthorizationDecision(false);

    @Value("${appsmith.remote.apikey}")
    private String API_KEY;

    @Override
    public Mono<AuthorizationDecision> check(final Mono<Authentication> authentication, final AuthorizationContext context) {

        if (StringUtils.isEmpty(API_KEY)) {
            return Mono.just(UNAUTHORIZED);
        }

        final ServerWebExchange exchange = context.getExchange();
        if (null == exchange) {
            return Mono.just(UNAUTHORIZED);
        }

        final List<String> authorizationHeaders = exchange.getRequest().getHeaders().getOrEmpty(HttpHeaders.AUTHORIZATION);
        if (authorizationHeaders.isEmpty()) {
            return Mono.just(UNAUTHORIZED);
        }

        final String bearer = authorizationHeaders.get(0);

        return determineAuthorization(bearer.replace("Token ", ""));
    }

    private Mono<AuthorizationDecision> determineAuthorization(String token) {
        if (StringUtils.isBlank(token)) {
            return Mono.just(UNAUTHORIZED);
        } else {
            return Mono.just(new AuthorizationDecision(API_KEY.equals(token)));
        }
    }
}

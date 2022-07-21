package com.appsmith.server.authentication.handlers.ce;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * This class returns 401 unauthorized for all unauthenticated requests that require authentication. The client will
 * redirect to the login page when it receives this response header.
 * <p>
 * This class is invoked via the ExceptionHandlingSpec configured in the `SecurityConfig.configure()` function.
 * In future, we can append to this response object to return other custom headers as required for any unauthenticated
 * requests.
 */
@Slf4j
public class AuthenticationEntryPointCE implements ServerAuthenticationEntryPoint {

    @Override
    public Mono<Void> commence(ServerWebExchange exchange, AuthenticationException e) {
        // In the custom authenticationEntryPoint. Returning unauthorized from here
        return Mono.fromRunnable(() -> {
            ServerHttpResponse response = exchange.getResponse();
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
        });
    }
}

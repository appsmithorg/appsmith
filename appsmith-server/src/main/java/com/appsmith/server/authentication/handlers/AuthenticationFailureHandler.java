package com.appsmith.server.authentication.handlers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.server.DefaultServerRedirectStrategy;
import org.springframework.security.web.server.ServerRedirectStrategy;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.ServerAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URI;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthenticationFailureHandler implements ServerAuthenticationFailureHandler {

    private ServerRedirectStrategy redirectStrategy = new DefaultServerRedirectStrategy();

    @Override
    public Mono<Void> onAuthenticationFailure(WebFilterExchange webFilterExchange, AuthenticationException exception) {
        log.error("In the login failure handler. Cause: {}", exception.getMessage());
        ServerWebExchange exchange = webFilterExchange.getExchange();

        // On authentication failure, we send a redirect to the client's login error page. The browser will re-load the
        // login page again with an error message shown to the user.
        String originHeader = exchange.getRequest().getHeaders().getOrigin();
        if(originHeader == null || originHeader.isEmpty()) {
            originHeader = "/";
        }

        URI defaultRedirectLocation = URI.create(originHeader + "/user/login?error=true");
        return this.redirectStrategy.sendRedirect(exchange, defaultRedirectLocation);

    }
}

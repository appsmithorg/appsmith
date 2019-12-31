package com.appsmith.server.authentication.handlers;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.DefaultServerRedirectStrategy;
import org.springframework.security.web.server.ServerRedirectStrategy;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.logout.ServerLogoutSuccessHandler;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URI;

@Slf4j
public class LogoutSuccessHandler implements ServerLogoutSuccessHandler {

    private ServerRedirectStrategy redirectStrategy = new DefaultServerRedirectStrategy();

    @Override
    public Mono<Void> onLogoutSuccess(WebFilterExchange webFilterExchange, Authentication authentication) {
        ServerWebExchange exchange = webFilterExchange.getExchange();

        // On logout success, we send a redirect to the client's home page. This ensures that the user is redirected
        // to the login page directly.
        String originHeader = exchange.getRequest().getHeaders().getOrigin();
        if (originHeader == null || originHeader.isEmpty()) {
            originHeader = "/";
        }

        URI defaultRedirectLocation = URI.create(originHeader);
        return this.redirectStrategy.sendRedirect(exchange, defaultRedirectLocation);
    }

}

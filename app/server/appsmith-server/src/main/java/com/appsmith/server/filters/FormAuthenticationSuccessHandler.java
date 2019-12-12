package com.appsmith.server.filters;

import com.appsmith.server.constants.Url;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.DefaultServerRedirectStrategy;
import org.springframework.security.web.server.ServerRedirectStrategy;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.ServerAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.URI;

@Slf4j
@Component
@RequiredArgsConstructor
public class FormAuthenticationSuccessHandler implements ServerAuthenticationSuccessHandler {

    private ServerRedirectStrategy redirectStrategy = new DefaultServerRedirectStrategy();

    /**
     * On authentication success, we send a redirect to the endpoint that serve's the user's profile.
     * The client browser will follow this redirect and fetch the user's profile JSON from the server.
     * In the process, the client browser will also set the session ID in the cookie against the server's API domain.
     *
     * @param webFilterExchange
     * @param authentication
     * @return
     */
    @Override
    public Mono<Void> onAuthenticationSuccess(WebFilterExchange webFilterExchange,
                                              Authentication authentication) {
        log.debug("Login succeeded for user: {}", authentication.getPrincipal());
        ServerWebExchange exchange = webFilterExchange.getExchange();

        URI defaultRedirectLocation = URI.create(Url.USER_URL + "/me");
        return this.redirectStrategy.sendRedirect(exchange, defaultRedirectLocation);
    }

}

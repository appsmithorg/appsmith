package com.appsmith.server.authentication.handlers;

import com.appsmith.server.constants.Security;
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
import java.net.URISyntaxException;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthenticationFailureHandler implements ServerAuthenticationFailureHandler {

    private ServerRedirectStrategy redirectStrategy = new DefaultServerRedirectStrategy();

    @Override
    public Mono<Void> onAuthenticationFailure(WebFilterExchange webFilterExchange, AuthenticationException exception) {
        log.error("In the login failure handler. Cause: {}", exception.getMessage(), exception);
        ServerWebExchange exchange = webFilterExchange.getExchange();

        // On authentication failure, we send a redirect to the client's login error page. The browser will re-load the
        // login page again with an error message shown to the user.
        String state = exchange.getRequest().getQueryParams().getFirst(Security.QUERY_PARAMETER_STATE);
        String originHeader = "/";
        if (state != null && !state.isEmpty()) {
            // This is valid for OAuth2 login failures. We derive the client login URL from the state query parameter
            // that would have been set when we initiated the OAuth2 request.
            String[] stateArray = state.split(",");
            for (int i = 0; i < stateArray.length; i++) {
                String stateVar = stateArray[i];
                if (stateVar != null && stateVar.startsWith(Security.STATE_PARAMETER_ORIGIN) && stateVar.contains("=")) {
                    // This is the origin of the request that we want to redirect to
                    originHeader = stateVar.split("=")[1];
                }
            }
        } else {
            // This is a form login authentication failure
            originHeader = exchange.getRequest().getHeaders().getOrigin();
            if (originHeader == null || originHeader.isEmpty()) {
                // Check the referer header if the origin is not available
                String refererHeader = exchange.getRequest().getHeaders().getFirst(Security.REFERER_HEADER);
                if (refererHeader != null && !refererHeader.isBlank()) {
                    URI uri = null;
                    try {
                        uri = new URI(refererHeader);
                        String authority = uri.getAuthority();
                        String scheme = uri.getScheme();
                        originHeader = scheme + "://" + authority;
                    } catch (URISyntaxException e) {
                        originHeader = "/";
                    }
                }
            }
        }

        URI defaultRedirectLocation = URI.create(originHeader + "/user/login?error=true");
        return this.redirectStrategy.sendRedirect(exchange, defaultRedirectLocation);

    }
}

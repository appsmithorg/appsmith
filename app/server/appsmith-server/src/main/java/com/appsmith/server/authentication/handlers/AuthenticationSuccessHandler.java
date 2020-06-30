package com.appsmith.server.authentication.handlers;

import com.appsmith.server.constants.Security;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
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
public class AuthenticationSuccessHandler implements ServerAuthenticationSuccessHandler {

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

        if (authentication instanceof OAuth2AuthenticationToken) {
            return handleOAuth2Redirect(webFilterExchange);
        }

        return handleRedirect(webFilterExchange);
    }

    /**
     * This function redirects the back to the client's page after a successful sign in/sign up attempt by the user
     * This is to transfer control back to the client because the OAuth2 dance would have been performed by the server.
     * <p>
     * We extract the redirect url from the `state` key present in the request exchange object. This is state variable
     * contains a random generated key along with the referer header set in the
     * {@link CustomServerOAuth2AuthorizationRequestResolver#generateKey(HttpHeaders)} function.
     *
     * @param webFilterExchange
     * @return
     */
    private Mono<Void> handleOAuth2Redirect(WebFilterExchange webFilterExchange) {
        ServerWebExchange exchange = webFilterExchange.getExchange();
        String state = exchange.getRequest().getQueryParams().getFirst(Security.QUERY_PARAMETER_STATE);
        String originHeader = "/";
        if (state != null && !state.isEmpty()) {
            String[] stateArray = state.split(",");
            for (int i = 0; i < stateArray.length; i++) {
                String stateVar = stateArray[i];
                if (stateVar != null && stateVar.startsWith(Security.STATE_PARAMETER_ORIGIN) && stateVar.contains("=")) {
                    // This is the origin of the request that we want to redirect to
                    originHeader = stateVar.split("=")[1];
                }
            }
        }

        URI defaultRedirectLocation = URI.create(originHeader);
        return this.redirectStrategy.sendRedirect(exchange, defaultRedirectLocation);
    }

    private Mono<Void> handleRedirect(WebFilterExchange webFilterExchange) {
        ServerWebExchange exchange = webFilterExchange.getExchange();

        // On authentication success, we send a redirect to the client's home page. This ensures that the session
        // is set in the cookie on the browser.
        String originHeader = exchange.getRequest().getHeaders().getOrigin();
        if (originHeader == null || originHeader.isEmpty()) {
            originHeader = "/";
        }

        URI defaultRedirectLocation = URI.create(originHeader);
        return this.redirectStrategy.sendRedirect(exchange, defaultRedirectLocation);
    }
}

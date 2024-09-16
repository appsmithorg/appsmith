package com.appsmith.server.authentication.handlers.ce;

import com.appsmith.server.authentication.helpers.AuthenticationFailureRetryHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.ServerAuthenticationFailureHandler;
import reactor.core.publisher.Mono;

@Slf4j
@RequiredArgsConstructor
public class AuthenticationFailureHandlerCE implements ServerAuthenticationFailureHandler {

    private final AuthenticationFailureRetryHandler authenticationFailureRetryHandler;

    @Override
    public Mono<Void> onAuthenticationFailure(WebFilterExchange webFilterExchange, AuthenticationException exception) {
        return authenticationFailureRetryHandler.retryAndRedirectOnAuthenticationFailure(webFilterExchange, exception);
    }
}

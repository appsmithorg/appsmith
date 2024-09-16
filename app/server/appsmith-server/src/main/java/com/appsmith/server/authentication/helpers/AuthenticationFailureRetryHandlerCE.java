package com.appsmith.server.authentication.helpers;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.server.WebFilterExchange;
import reactor.core.publisher.Mono;

public interface AuthenticationFailureRetryHandlerCE {
    Mono<Void> retryAndRedirectOnAuthenticationFailure(
            WebFilterExchange webFilterExchange, AuthenticationException exception);
}

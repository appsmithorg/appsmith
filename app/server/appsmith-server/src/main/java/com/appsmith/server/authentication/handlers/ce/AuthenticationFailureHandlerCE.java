package com.appsmith.server.authentication.handlers.ce;

import com.appsmith.server.authentication.helpers.AuthenticationFailureRetryHandler;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.ServerAuthenticationFailureHandler;
import reactor.core.publisher.Mono;

import static com.appsmith.external.constants.spans.LoginSpan.LOGIN_FAILURE;

@Slf4j
@RequiredArgsConstructor
public class AuthenticationFailureHandlerCE implements ServerAuthenticationFailureHandler {

    private final AuthenticationFailureRetryHandler authenticationFailureRetryHandler;
    private final MeterRegistry meterRegistry;

    @Override
    public Mono<Void> onAuthenticationFailure(WebFilterExchange webFilterExchange, AuthenticationException exception) {
        String source = exception instanceof OAuth2AuthenticationException
                ? ((OAuth2AuthenticationException) exception).getError().getErrorCode()
                : "form";

        String errorMessage = exception.getMessage();

        meterRegistry
                .counter(LOGIN_FAILURE, "source", source, "message", errorMessage)
                .increment();
        return authenticationFailureRetryHandler.retryAndRedirectOnAuthenticationFailure(webFilterExchange, exception);
    }

    public Mono<Void> handleErrorRedirect(WebFilterExchange webFilterExchange) {
        String error =
                webFilterExchange.getExchange().getRequest().getQueryParams().getFirst("error");
        String message =
                webFilterExchange.getExchange().getRequest().getQueryParams().getFirst("message");

        if ("true".equals(error)) {
            meterRegistry
                    .counter(LOGIN_FAILURE, "source", "redirect", "message", message)
                    .increment();
        }

        return Mono.empty();
    }
}

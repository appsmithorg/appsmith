package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.AuthenticationFailureHandlerCE;
import com.appsmith.server.authentication.helpers.AuthenticationFailureRetryHandler;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class AuthenticationFailureHandler extends AuthenticationFailureHandlerCE {

    public AuthenticationFailureHandler(
            AuthenticationFailureRetryHandler authenticationFailureRetryHandler, MeterRegistry meterRegistry) {
        super(authenticationFailureRetryHandler, meterRegistry);
    }
}

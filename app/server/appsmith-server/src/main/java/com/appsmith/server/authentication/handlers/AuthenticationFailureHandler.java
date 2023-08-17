package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.AuthenticationFailureHandlerCE;
import com.appsmith.server.ratelimiting.RateLimitService;
import org.springframework.stereotype.Component;

@Component
public class AuthenticationFailureHandler extends AuthenticationFailureHandlerCE {
    public AuthenticationFailureHandler(RateLimitService rateLimitService) {
        super(rateLimitService);
    }
}

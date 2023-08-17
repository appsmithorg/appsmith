package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.AuthenticationFailureHandlerCE;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.services.SessionUserService;
import org.springframework.stereotype.Component;

@Component
public class AuthenticationFailureHandler extends AuthenticationFailureHandlerCE {
    public AuthenticationFailureHandler(RateLimitService rateLimitService, SessionUserService sessionUserService) {
        super(rateLimitService, sessionUserService);
    }
}

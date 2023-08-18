package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.AuthenticationFailureHandlerCE;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class AuthenticationFailureHandler extends AuthenticationFailureHandlerCE {
    public AuthenticationFailureHandler(RateLimitService rateLimitService, SessionUserService sessionUserService) {
        super(rateLimitService, sessionUserService);
    }
}

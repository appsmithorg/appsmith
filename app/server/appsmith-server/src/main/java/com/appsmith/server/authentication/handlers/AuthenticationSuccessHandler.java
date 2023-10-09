package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.AuthenticationSuccessHandlerCE;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.SessionLimiterService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class AuthenticationSuccessHandler extends AuthenticationSuccessHandlerCE {

    private final TenantService tenantService;
    private final SessionLimiterService sessionLimiterService;

    public AuthenticationSuccessHandler(
            RedirectHelper redirectHelper,
            SessionUserService sessionUserService,
            AnalyticsService analyticsService,
            UserDataService userDataService,
            UserRepository userRepository,
            WorkspaceRepository workspaceRepository,
            WorkspaceService workspaceService,
            ApplicationPageService applicationPageService,
            WorkspacePermission workspacePermission,
            RateLimitService rateLimitService,
            TenantService tenantService,
            UserService userService,
            SessionLimiterService sessionLimiterService) {
        super(
                redirectHelper,
                sessionUserService,
                analyticsService,
                userDataService,
                userRepository,
                workspaceRepository,
                workspaceService,
                applicationPageService,
                workspacePermission,
                rateLimitService,
                tenantService,
                userService);
        this.tenantService = tenantService;
        this.sessionLimiterService = sessionLimiterService;
    }

    @Override
    public Mono<Void> onAuthenticationSuccess(WebFilterExchange webFilterExchange, Authentication authentication) {
        return super.onAuthenticationSuccess(webFilterExchange, authentication)
                .then(tenantService.getTenantConfiguration())
                .flatMap(tenant -> sessionLimiterService.handleSessionLimits(authentication, webFilterExchange, tenant))
                .then();
    }
}

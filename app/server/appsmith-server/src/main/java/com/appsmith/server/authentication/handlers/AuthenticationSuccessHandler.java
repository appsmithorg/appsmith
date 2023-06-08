package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.AuthenticationSuccessHandlerCE;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ForkExamplesWorkspace;
import com.appsmith.server.solutions.WorkspacePermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Component
public class AuthenticationSuccessHandler extends AuthenticationSuccessHandlerCE {

    private final TenantService tenantService;
    private final SessionUserService sessionUserService;


    public AuthenticationSuccessHandler(ForkExamplesWorkspace forkExamplesWorkspace,
                                        RedirectHelper redirectHelper,
                                        SessionUserService sessionUserService,
                                        AnalyticsService analyticsService,
                                        UserDataService userDataService,
                                        UserRepository userRepository,
                                        WorkspaceService workspaceService,
                                        WorkspaceRepository workspaceRepository,
                                        ApplicationPageService applicationPageService,
                                        WorkspacePermission workspacePermission,
                                        TenantService tenantService) {

        super(forkExamplesWorkspace, redirectHelper, sessionUserService, analyticsService, userDataService,
                userRepository, workspaceRepository, workspaceService, applicationPageService, workspacePermission);
        this.tenantService = tenantService;
        this.sessionUserService = sessionUserService;
    }

    @Override
    public Mono<Void> onAuthenticationSuccess(
        WebFilterExchange webFilterExchange,
        Authentication authentication
    ) {
        return super.onAuthenticationSuccess(webFilterExchange, authentication)
            .then(this.logoutUserFromExistingSessionsBasedOnTenantConfig(authentication, webFilterExchange))
            .then();
    }

    private Mono<User> logoutUserFromExistingSessionsBasedOnTenantConfig(Authentication authentication, WebFilterExchange exchange) {
        User currentUser = (User) authentication.getPrincipal();
        // TODO update to fetch user specific tenant after multi-tenancy is introduced
        Mono<Tenant> tenantMono = tenantService.getTenantConfiguration();
        return tenantMono
            .flatMap(tenant -> {
                TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                if (tenantConfiguration != null && Boolean.TRUE.equals(tenantConfiguration.getSingleSessionPerUserEnabled())) {
                    // In a separate thread, we delete all other active sessions of this user.
                    sessionUserService.logoutExistingSessions(currentUser.getEmail(), exchange)
                        .thenReturn(currentUser)
                        .subscribeOn(Schedulers.boundedElastic())
                        .subscribe();
                }
                return Mono.just(currentUser);
            });
    }

}
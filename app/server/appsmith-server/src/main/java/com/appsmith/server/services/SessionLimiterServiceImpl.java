package com.appsmith.server.services;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.ce_compatible.SessionLimiterServiceCECompatibleImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionLimiterServiceImpl extends SessionLimiterServiceCECompatibleImpl implements SessionLimiterService {
    private final SessionUserService sessionUserService;

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_session_limit_enabled)
    @Override
    public Mono<TenantConfiguration> updateTenantConfiguration(TenantConfiguration tenantConfiguration) {
        // if license session limit enabled then allow tenant configuration update related to session limits
        return Mono.just(tenantConfiguration);
    }

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_session_limit_enabled)
    @Override
    public Mono<User> handleSessionLimits(Authentication authentication, WebFilterExchange exchange, Tenant tenant) {
        return logoutUserFromExistingSessionsBasedOnTenantConfig(authentication, exchange, tenant);
    }

    private Mono<User> logoutUserFromExistingSessionsBasedOnTenantConfig(
            Authentication authentication, WebFilterExchange exchange, Tenant tenant) {
        User currentUser = (User) authentication.getPrincipal();
        // TODO update to fetch user specific tenant after multi-tenancy is introduced
        TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
        if (tenantConfiguration != null && Boolean.TRUE.equals(tenantConfiguration.getSingleSessionPerUserEnabled())) {
            // In a separate thread, we delete all other active sessions of this user.
            sessionUserService
                    .logoutExistingSessions(currentUser.getEmail(), exchange)
                    .thenReturn(currentUser)
                    .subscribeOn(Schedulers.boundedElastic())
                    .subscribe();
        }
        return Mono.just(currentUser);
    }
}

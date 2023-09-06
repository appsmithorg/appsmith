package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Slf4j
@Service
public class SessionLimiterServiceCECompatibleImpl implements SessionLimiterServiceCECompatible {
    @Override
    public Mono<TenantConfiguration> updateTenantConfiguration(TenantConfiguration tenantConfiguration) {
        // if feature flag is disabled for session limits, we shouldn't allow any update so setting it null
        tenantConfiguration.setSingleSessionPerUserEnabled(null);
        return Mono.just(tenantConfiguration);
    }

    @Override
    public Mono<User> handleSessionLimits(Authentication authentication, WebFilterExchange exchange, Tenant tenant) {
        return Mono.just((User) authentication.getPrincipal());
    }
}

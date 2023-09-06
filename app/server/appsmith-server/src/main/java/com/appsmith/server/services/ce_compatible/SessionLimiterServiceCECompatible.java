package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.WebFilterExchange;
import reactor.core.publisher.Mono;

public interface SessionLimiterServiceCECompatible {
    Mono<TenantConfiguration> updateTenantConfiguration(TenantConfiguration tenantConfiguration);

    Mono<User> handleSessionLimits(Authentication authentication, WebFilterExchange exchange, Tenant tenant);
}

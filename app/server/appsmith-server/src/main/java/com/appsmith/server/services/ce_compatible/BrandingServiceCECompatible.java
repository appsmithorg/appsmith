package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.TenantConfiguration;
import reactor.core.publisher.Mono;

public interface BrandingServiceCECompatible {
    Mono<TenantConfiguration> getTenantConfiguration(TenantConfiguration tenantConfiguration);

    Mono<TenantConfiguration> updateTenantConfiguration(TenantConfiguration tenantConfiguration);
}

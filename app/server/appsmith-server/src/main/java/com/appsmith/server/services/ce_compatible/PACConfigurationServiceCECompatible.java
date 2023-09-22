package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.TenantConfiguration;
import reactor.core.publisher.Mono;

/**
 * PACConfigurationService - Controls the configurations for PAC
 * <br>
 * - PAC : programmatic access control
 */
public interface PACConfigurationServiceCECompatible {
    Mono<TenantConfiguration> getTenantConfiguration(TenantConfiguration tenantConfiguration);

    Mono<TenantConfiguration> updateTenantConfiguration(TenantConfiguration tenantConfiguration);
}

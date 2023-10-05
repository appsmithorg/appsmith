package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.services.ce.PACConfigurationServiceCE;
import reactor.core.publisher.Mono;

/**
 * PACConfigurationService - Controls the configurations for PAC
 * <br>
 * - PAC : programmatic access control
 */
public interface PACConfigurationServiceCECompatible extends PACConfigurationServiceCE {
    Mono<TenantConfiguration> getTenantConfiguration(TenantConfiguration tenantConfiguration);

    Mono<TenantConfiguration> updateTenantConfiguration(TenantConfiguration tenantConfiguration);
}

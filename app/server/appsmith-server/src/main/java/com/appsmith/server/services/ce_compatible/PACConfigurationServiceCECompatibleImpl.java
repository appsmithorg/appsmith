package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.services.ce.PACConfigurationServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class PACConfigurationServiceCECompatibleImpl extends PACConfigurationServiceCEImpl
        implements PACConfigurationServiceCECompatible {
    @Override
    public Mono<TenantConfiguration> getTenantConfiguration(TenantConfiguration tenantConfiguration) {
        tenantConfiguration.setShowRolesAndGroups(false);
        return Mono.just(tenantConfiguration);
    }

    @Override
    public Mono<TenantConfiguration> updateTenantConfiguration(TenantConfiguration tenantConfiguration) {
        tenantConfiguration.setShowRolesAndGroups(null);
        return Mono.just(tenantConfiguration);
    }
}

package com.appsmith.server.services;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.ce_compatible.PACConfigurationServiceCECompatibleImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class PACConfigurationServiceImpl extends PACConfigurationServiceCECompatibleImpl
        implements PACConfigurationService {

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_pac_enabled)
    @Override
    public Mono<TenantConfiguration> getTenantConfiguration(TenantConfiguration tenantConfiguration) {
        return Mono.just(tenantConfiguration);
    }

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_pac_enabled)
    @Override
    public Mono<TenantConfiguration> updateTenantConfiguration(TenantConfiguration tenantConfiguration) {
        return Mono.just(tenantConfiguration);
    }
}

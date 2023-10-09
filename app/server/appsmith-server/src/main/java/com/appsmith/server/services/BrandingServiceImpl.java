package com.appsmith.server.services;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.ce_compatible.BrandingServiceCECompatibleImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class BrandingServiceImpl extends BrandingServiceCECompatibleImpl implements BrandingService {
    public BrandingServiceImpl(AssetService assetService) {
        super(assetService);
    }

    /**
     * If branding feature flag is enabled, then don't update the configuration and return the incoming value
     */
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_branding_enabled)
    @Override
    public Mono<TenantConfiguration> getTenantConfiguration(TenantConfiguration tenantConfiguration) {
        return Mono.just(tenantConfiguration);
    }

    /**
     * If branding feature flag is enabled, then don't update the configuration and return the incoming value
     */
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_branding_enabled)
    @Override
    public Mono<TenantConfiguration> updateTenantConfiguration(TenantConfiguration tenantConfiguration) {
        return Mono.just(tenantConfiguration);
    }
}

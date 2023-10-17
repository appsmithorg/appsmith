package com.appsmith.server.services;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.ce_compatible.BrandingServiceCECompatibleImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import static com.appsmith.server.domains.TenantConfiguration.DEFAULT_BACKGROUND_COLOR;
import static com.appsmith.server.domains.TenantConfiguration.DEFAULT_FONT_COLOR;
import static com.appsmith.server.domains.TenantConfiguration.DEFAULT_PRIMARY_COLOR;

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
        TenantConfiguration.BrandColors brandColors = tenantConfiguration.getBrandColors() == null
                ? new TenantConfiguration.BrandColors()
                : tenantConfiguration.getBrandColors();
        brandColors.setPrimary(
                StringUtils.hasLength(brandColors.getPrimary()) ? brandColors.getPrimary() : DEFAULT_PRIMARY_COLOR);
        brandColors.setBackground(
                StringUtils.hasLength(brandColors.getBackground())
                        ? brandColors.getBackground()
                        : DEFAULT_BACKGROUND_COLOR);
        brandColors.setFont(StringUtils.hasLength(brandColors.getFont()) ? brandColors.getFont() : DEFAULT_FONT_COLOR);
        tenantConfiguration.setBrandColors(brandColors);

        String instanceName = StringUtils.hasLength(tenantConfiguration.getInstanceName())
                ? tenantConfiguration.getInstanceName()
                : BRANDING_DISABLED_INSTANCE_NAME;
        tenantConfiguration.setInstanceName(instanceName);
        if (tenantConfiguration.getHideWatermark() == null) {
            tenantConfiguration.setHideWatermark(false);
        }

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

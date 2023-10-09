package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.services.AssetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class BrandingServiceCECompatibleImpl implements BrandingServiceCECompatible {
    private final AssetService assetService;

    public BrandingServiceCECompatibleImpl(AssetService assetService) {
        this.assetService = assetService;
    }
    /**
     * This will be called when there is feature flag disabled for branding so set the default value in tenant configuration
     */
    @Override
    public Mono<TenantConfiguration> getTenantConfiguration(TenantConfiguration tenantConfiguration) {
        tenantConfiguration.setWhiteLabelEnable(Boolean.FALSE.toString());
        tenantConfiguration.setWhiteLabelFavicon(TenantConfiguration.DEFAULT_APPSMITH_FEVICON);

        TenantConfiguration.BrandColors brandColors = new TenantConfiguration.BrandColors();
        brandColors.setPrimary(TenantConfiguration.DEFAULT_PRIMARY_COLOR);
        brandColors.setFont(TenantConfiguration.DEFAULT_FONT_COLOR);
        brandColors.setBackground(TenantConfiguration.DEFAULT_BACKGROUND_COLOR);

        tenantConfiguration.setBrandColors(brandColors);

        return getDefaultLogoPath().map(logoPath -> {
            tenantConfiguration.setWhiteLabelLogo(logoPath);
            return tenantConfiguration;
        });
    }

    /**
     * Get logo URL as appsmith asset
     */
    private Mono<String> getDefaultLogoPath() {
        return assetService
                .findByName(TenantConfiguration.APPSMITH_DEFAULT_LOGO)
                .map(asset -> TenantConfiguration.ASSET_PREFIX + asset.getId())
                .switchIfEmpty(Mono.just(TenantConfiguration.DEFAULT_APPSMITH_LOGO));
    }

    /**
     * This will be called when there is feature flag disabled for branding so don't allow any update by setting null value
     * in update
     */
    @Override
    public Mono<TenantConfiguration> updateTenantConfiguration(TenantConfiguration tenantConfiguration) {
        tenantConfiguration.setBrandColors(null);
        tenantConfiguration.setWhiteLabelEnable(null);
        tenantConfiguration.setWhiteLabelLogo(null);
        tenantConfiguration.setWhiteLabelFavicon(null);
        return Mono.just(tenantConfiguration);
    }
}

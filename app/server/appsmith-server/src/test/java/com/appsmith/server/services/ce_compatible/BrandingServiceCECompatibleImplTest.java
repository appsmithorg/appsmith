package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.BrandingService;
import com.appsmith.server.services.FeatureFlagService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class BrandingServiceCECompatibleImplTest {
    @Autowired
    BrandingService brandingService;

    @SpyBean
    FeatureFlagService featureFlagService;

    @BeforeEach
    public void setup() {
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_branding_enabled))
                .thenReturn(Mono.just(false));
    }

    @Test
    public void test_whenBrandingDisabled_defaultValueShouldReturn() {
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setBrandColors(new TenantConfiguration.BrandColors());
        tenantConfiguration.setWhiteLabelFavicon("favicon");
        tenantConfiguration.setWhiteLabelLogo("logo");
        tenantConfiguration.setWhiteLabelEnable("true");

        Mono<TenantConfiguration> tenantConfigurationMono = brandingService.getTenantConfiguration(tenantConfiguration);

        StepVerifier.create(tenantConfigurationMono)
                .assertNext(updatedTenantConfiguration -> {
                    assertTrue(updatedTenantConfiguration.getBrandLogoUrl().contains(Url.ASSET_URL));
                    assertEquals(
                            TenantConfiguration.DEFAULT_APPSMITH_FEVICON,
                            updatedTenantConfiguration.getBrandFaviconUrl());

                    TenantConfiguration.BrandColors brandColors = updatedTenantConfiguration.getBrandColors();
                    assertEquals(TenantConfiguration.DEFAULT_BACKGROUND_COLOR, brandColors.getBackground());
                    assertEquals(TenantConfiguration.DEFAULT_PRIMARY_COLOR, brandColors.getPrimary());
                    assertEquals(TenantConfiguration.DEFAULT_FONT_COLOR, brandColors.getFont());
                })
                .verifyComplete();
    }

    @Test
    public void test_whenBrandingDisabled_updateShouldNotBeAllowed() {
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setBrandColors(new TenantConfiguration.BrandColors());
        tenantConfiguration.setWhiteLabelFavicon("favicon");
        tenantConfiguration.setWhiteLabelLogo("logo");
        tenantConfiguration.setWhiteLabelEnable("true");

        Mono<TenantConfiguration> tenantConfigurationMono =
                brandingService.updateTenantConfiguration(tenantConfiguration);

        StepVerifier.create(tenantConfigurationMono)
                .assertNext(updatedTenantConfiguration -> {
                    assertNull(updatedTenantConfiguration.getWhiteLabelFavicon());
                    assertNull(updatedTenantConfiguration.getWhiteLabelLogo());
                    assertNull(updatedTenantConfiguration.getWhiteLabelEnable());
                    assertNull(updatedTenantConfiguration.getBrandColors());
                })
                .verifyComplete();
    }
}

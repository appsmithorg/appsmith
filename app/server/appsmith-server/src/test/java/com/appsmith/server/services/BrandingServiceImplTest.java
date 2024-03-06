package com.appsmith.server.services;

import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.featureflags.FeatureFlagEnum;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class BrandingServiceImplTest {

    @Autowired
    BrandingService brandingService;

    @SpyBean
    FeatureFlagService featureFlagService;

    @BeforeEach
    public void setup() {
        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_branding_enabled))
                .thenReturn(Mono.just(true));
    }

    @Test
    public void test_whenBrandingEnabled_storedValueShouldReturn() {
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        TenantConfiguration.BrandColors brandColors = new TenantConfiguration.BrandColors();
        brandColors.setFont("font");
        brandColors.setPrimary("primary");
        brandColors.setBackground("background");

        tenantConfiguration.setBrandColors(brandColors);
        tenantConfiguration.setWhiteLabelFavicon("favicon");
        tenantConfiguration.setWhiteLabelLogo("logo");
        tenantConfiguration.setWhiteLabelEnable("true");

        Mono<TenantConfiguration> tenantConfigurationMono = brandingService.getTenantConfiguration(tenantConfiguration);

        StepVerifier.create(tenantConfigurationMono)
                .assertNext(updatedTenantConfiguration -> {
                    assertEquals(tenantConfiguration, updatedTenantConfiguration);
                })
                .verifyComplete();
    }

    @Test
    public void test_whenBrandingEnabled_updateShouldBeAllowed() {
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setBrandColors(new TenantConfiguration.BrandColors());
        tenantConfiguration.setWhiteLabelFavicon("favicon");
        tenantConfiguration.setWhiteLabelLogo("logo");
        tenantConfiguration.setWhiteLabelEnable("true");

        Mono<TenantConfiguration> tenantConfigurationMono =
                brandingService.updateTenantConfiguration(tenantConfiguration);

        StepVerifier.create(tenantConfigurationMono)
                .assertNext(updatedTenantConfiguration -> {
                    assertEquals(tenantConfiguration, updatedTenantConfiguration);
                })
                .verifyComplete();
    }

    @Test
    public void test_whenBrandingEnabled_nullBrandColors_getDefaultColors() {
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        Mono<TenantConfiguration> tenantConfigurationMono = brandingService.getTenantConfiguration(tenantConfiguration);

        StepVerifier.create(tenantConfigurationMono)
                .assertNext(tenantConfiguration1 -> {
                    TenantConfiguration.BrandColors brandColors = tenantConfiguration1.getBrandColors();
                    assertThat(brandColors).isNotNull();
                    // Assert default values for brand colors in plain text to avoid any unintended update
                    assertEquals("#F1F5F9", brandColors.getBackground());
                    assertEquals("#E15615", brandColors.getPrimary());
                    assertEquals(TenantConfiguration.DEFAULT_FONT_COLOR, brandColors.getFont());
                })
                .verifyComplete();
    }

    @Test
    void getTenantConfiguration_hideWatermark_revertAsIsBasedOnTenantConfig() {

        // Test when hideWatermark is null, it should be false
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        Mono<TenantConfiguration> tenantConfigurationMono = brandingService.getTenantConfiguration(tenantConfiguration);

        StepVerifier.create(tenantConfigurationMono)
                .assertNext(tenantConfiguration1 -> {
                    assertFalse(tenantConfiguration1.getHideWatermark());
                })
                .verifyComplete();

        // Test when hideWatermark is true, it should be true
        tenantConfiguration.setHideWatermark(true);
        tenantConfigurationMono = brandingService.getTenantConfiguration(tenantConfiguration);

        StepVerifier.create(tenantConfigurationMono)
                .assertNext(tenantConfiguration1 -> {
                    assertTrue(tenantConfiguration1.getHideWatermark());
                })
                .verifyComplete();

        // Test when hideWatermark is false, it should be false
        tenantConfiguration.setHideWatermark(false);
        tenantConfigurationMono = brandingService.getTenantConfiguration(tenantConfiguration);
        StepVerifier.create(tenantConfigurationMono)
                .assertNext(tenantConfiguration1 -> {
                    assertFalse(tenantConfiguration1.getHideWatermark());
                })
                .verifyComplete();
    }
}

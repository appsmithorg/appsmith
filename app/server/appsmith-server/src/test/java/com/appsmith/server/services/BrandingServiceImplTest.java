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

import static org.junit.jupiter.api.Assertions.assertEquals;

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
}

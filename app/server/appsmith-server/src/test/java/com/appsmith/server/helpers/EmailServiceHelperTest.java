package com.appsmith.server.helpers;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.TenantService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.Map;

import static com.appsmith.server.constants.EmailConstants.BRAND_BACKGROUND_COLOR;
import static com.appsmith.server.constants.EmailConstants.BRAND_FONT_COLOR;
import static com.appsmith.server.constants.EmailConstants.BRAND_PRIMARY_COLOR;
import static com.appsmith.server.constants.EmailConstants.EMAIL_VERIFICATION_EMAIL_TEMPLATE_EE;
import static com.appsmith.server.constants.EmailConstants.FORGOT_PASSWORD_TEMPLATE_EE;
import static com.appsmith.server.constants.EmailConstants.INVITE_TO_INSTANCE_ADMIN_EMAIL_TEMPLATE;
import static com.appsmith.server.constants.EmailConstants.INVITE_TO_WORKSPACE_EXISTING_USER_TEMPLATE_EE;
import static com.appsmith.server.constants.EmailConstants.INVITE_TO_WORKSPACE_NEW_USER_TEMPLATE_EE;
import static com.appsmith.server.constants.EmailConstants.LOGO_URL;
import static com.appsmith.server.constants.ce.EmailConstantsCE.INSTANCE_NAME;
import static com.appsmith.server.domains.TenantConfiguration.DEFAULT_BACKGROUND_COLOR;
import static com.appsmith.server.domains.TenantConfiguration.DEFAULT_FONT_COLOR;
import static com.appsmith.server.domains.TenantConfiguration.DEFAULT_PRIMARY_COLOR;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class EmailServiceHelperTest {
    @Autowired
    private EmailServiceHelper emailServiceHelper;

    @Autowired
    TenantService tenantService;

    @SpyBean
    FeatureFlagService featureFlagService;

    @BeforeEach
    public void beforeTest() {
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(
                FeatureFlagEnum.license_gac_enabled.name(),
                Boolean.TRUE,
                FeatureFlagEnum.license_branding_enabled.name(),
                Boolean.TRUE));
        Mockito.when(featureFlagService.getCachedTenantFeatureFlags()).thenReturn(cachedFeatures);

        Mockito.when(featureFlagService.check(Mockito.eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(Boolean.TRUE));
        Mockito.when(featureFlagService.check(Mockito.eq(FeatureFlagEnum.license_branding_enabled)))
                .thenReturn(Mono.just(Boolean.TRUE));
    }

    @AfterEach
    public void afterTest() {
        CachedFeatures cachedFeatures = new CachedFeatures();
        Mockito.when(featureFlagService.getCachedTenantFeatureFlags()).thenReturn(cachedFeatures);

        Mockito.when(featureFlagService.check(Mockito.eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(Boolean.FALSE));
        Mockito.when(featureFlagService.check(Mockito.eq(FeatureFlagEnum.license_branding_enabled)))
                .thenReturn(Mono.just(Boolean.FALSE));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testEnrichWithBrandParams_withBrandingFeatureFlagTurnedOff() {
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.license_branding_enabled.name(), Boolean.FALSE));
        Mockito.when(featureFlagService.getCachedTenantFeatureFlags()).thenReturn(cachedFeatures);

        Mockito.when(featureFlagService.check(Mockito.eq(FeatureFlagEnum.license_branding_enabled)))
                .thenReturn(Mono.just(Boolean.FALSE));

        Tenant originalTenant = tenantService.getDefaultTenant().block();
        TenantConfiguration originalTenantConfiguration = originalTenant.getTenantConfiguration();
        TenantConfiguration.BrandColors originalBrandColors = originalTenantConfiguration.getBrandColors();

        TenantConfiguration.BrandColors newBrandColors = new TenantConfiguration.BrandColors();
        newBrandColors.setBackground("F");
        newBrandColors.setPrimary("F");
        newBrandColors.setFont("F");
        originalTenantConfiguration.setBrandColors(newBrandColors);
        originalTenantConfiguration.setInstanceName("any instance name");

        tenantService.save(originalTenant).block();
        Tenant defautTenant = tenantService.getTenantConfiguration().block();
        String instanceName = defautTenant.getTenantConfiguration().getInstanceName();
        String logoUrl =
                "http://www.test.com" + defautTenant.getTenantConfiguration().getBrandLogoUrl();
        StepVerifier.create(emailServiceHelper.enrichWithBrandParams(new HashMap<>(), "http://www.test.com"))
                .assertNext(map -> {
                    assertThat(map.containsKey(INSTANCE_NAME)).isTrue();
                    assertThat(map.get(INSTANCE_NAME)).isEqualTo(instanceName);
                    assertThat(map.containsKey(BRAND_PRIMARY_COLOR)).isTrue();
                    assertThat(map.get(BRAND_PRIMARY_COLOR)).isEqualTo(DEFAULT_PRIMARY_COLOR);
                    assertThat(map.containsKey(BRAND_BACKGROUND_COLOR)).isTrue();
                    assertThat(map.get(BRAND_BACKGROUND_COLOR)).isEqualTo(DEFAULT_BACKGROUND_COLOR);
                    assertThat(map.containsKey(BRAND_FONT_COLOR)).isTrue();
                    assertThat(map.get(BRAND_FONT_COLOR)).isEqualTo(DEFAULT_FONT_COLOR);
                    assertThat(map.containsKey(LOGO_URL)).isTrue();
                    assertThat(map.get(LOGO_URL)).isEqualTo(logoUrl);
                })
                .verifyComplete();
        Tenant newTenant = tenantService.getDefaultTenant().block();
        TenantConfiguration newTenantConfiguration = originalTenant.getTenantConfiguration();
        newTenantConfiguration.setBrandColors(originalBrandColors);
        tenantService.save(newTenant).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testEnrichWithBrandParams() {
        Tenant originalTenant = tenantService.getDefaultTenant().block();
        TenantConfiguration originalTenantConfiguration = originalTenant.getTenantConfiguration();
        TenantConfiguration.BrandColors originalBrandColors = originalTenantConfiguration.getBrandColors();

        TenantConfiguration.BrandColors newBrandColors = new TenantConfiguration.BrandColors();
        newBrandColors.setBackground("F");
        newBrandColors.setPrimary("F");
        newBrandColors.setFont("F");
        originalTenantConfiguration.setBrandColors(newBrandColors);
        originalTenantConfiguration.setInstanceName("any instance name");

        tenantService.save(originalTenant).block();

        Tenant defautTenant = tenantService.getTenantConfiguration().block();
        String instanceName = defautTenant.getTenantConfiguration().getInstanceName();
        String primaryColor =
                defautTenant.getTenantConfiguration().getBrandColors().getPrimary();
        String backgroundColor =
                defautTenant.getTenantConfiguration().getBrandColors().getBackground();
        String font = defautTenant.getTenantConfiguration().getBrandColors().getFont();
        String logoUrl =
                "http://www.test.com" + defautTenant.getTenantConfiguration().getBrandLogoUrl();
        StepVerifier.create(emailServiceHelper.enrichWithBrandParams(new HashMap<>(), "http://www.test.com"))
                .assertNext(map -> {
                    assertThat(map.containsKey(INSTANCE_NAME)).isTrue();
                    assertThat(map.get(INSTANCE_NAME)).isEqualTo(instanceName);
                    assertThat(map.containsKey(LOGO_URL)).isTrue();
                    assertThat(map.get(LOGO_URL)).isEqualTo(logoUrl);
                    assertThat(map.containsKey(BRAND_PRIMARY_COLOR)).isTrue();
                    assertThat(map.get(BRAND_PRIMARY_COLOR)).isEqualTo(primaryColor);
                    assertThat(map.containsKey(BRAND_BACKGROUND_COLOR)).isTrue();
                    assertThat(map.get(BRAND_BACKGROUND_COLOR)).isEqualTo(backgroundColor);
                    assertThat(map.containsKey(BRAND_FONT_COLOR)).isTrue();
                    assertThat(map.get(BRAND_FONT_COLOR)).isEqualTo(font);
                })
                .verifyComplete();

        Tenant newTenant = tenantService.getDefaultTenant().block();
        TenantConfiguration newTenantConfiguration = originalTenant.getTenantConfiguration();
        newTenantConfiguration.setBrandColors(originalBrandColors);
        tenantService.save(newTenant).block();
    }

    @Test
    void testGetForgotPasswordTemplate() {
        assertThat(emailServiceHelper.getForgotPasswordTemplate()).isEqualTo(FORGOT_PASSWORD_TEMPLATE_EE);
    }

    @Test
    void testGetWorkspaceInviteTemplate() {
        assertThat(emailServiceHelper.getWorkspaceInviteTemplate(Boolean.TRUE))
                .isEqualTo(INVITE_TO_WORKSPACE_NEW_USER_TEMPLATE_EE);
        assertThat(emailServiceHelper.getWorkspaceInviteTemplate(Boolean.FALSE))
                .isEqualTo(INVITE_TO_WORKSPACE_EXISTING_USER_TEMPLATE_EE);
    }

    @Test
    void testGetEmailVerificationTemplate() {
        assertThat(emailServiceHelper.getEmailVerificationTemplate()).isEqualTo(EMAIL_VERIFICATION_EMAIL_TEMPLATE_EE);
    }

    @Test
    void testGetAdminInstanceInviteTemplate() {
        assertThat(emailServiceHelper.getAdminInstanceInviteTemplate())
                .isEqualTo(INVITE_TO_INSTANCE_ADMIN_EMAIL_TEMPLATE);
    }
}

package com.appsmith.server.services;

import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import uk.org.webcompere.systemstubs.environment.EnvironmentVariables;
import uk.org.webcompere.systemstubs.jupiter.SystemStub;
import uk.org.webcompere.systemstubs.jupiter.SystemStubsExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@SpringBootTest
@ExtendWith(SystemStubsExtension.class)
class OidcConfigurationServiceImplTest {

    @Autowired
    OidcConfigurationService oidcConfigurationService;

    @SpyBean
    FeatureFlagService featureFlagService;

    // Dependency for adding the system env stub as the System.getEnv() is a UnmodifiableMap
    // Sets the environment before Spring even starts
    // TODO remove this dependency once the SSO configs are moved to DB
    @SystemStub
    private static EnvironmentVariables environmentVariables;

    @BeforeEach
    void setup() {
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.license_sso_oidc_enabled.name(), true));
        when(featureFlagService.getCachedTenantFeatureFlags()).thenReturn(cachedFeatures);
        environmentVariables.set("APPSMITH_OAUTH2_OIDC_CLIENT_ID", null);
    }

    @Test
    void getTenantConfiguration_oidcAuthEnabled_oidcLoginAdded() {
        environmentVariables.set("APPSMITH_OAUTH2_OIDC_CLIENT_ID", "test");
        TenantConfiguration config = new TenantConfiguration();
        List<String> thirdPartyAuthProviders = new ArrayList<>();
        thirdPartyAuthProviders.add("google");
        config.setThirdPartyAuths(thirdPartyAuthProviders);
        assertThat(oidcConfigurationService.getTenantConfiguration(config).getThirdPartyAuths())
                .containsExactlyInAnyOrder("oidc", "google");
    }

    @Test
    void getTenantConfiguration_oidcAuthDisabled_oidcLoginNotAdded() {
        TenantConfiguration config = new TenantConfiguration();
        List<String> thirdPartyAuthProviders = new ArrayList<>();
        thirdPartyAuthProviders.add("google");
        config.setThirdPartyAuths(thirdPartyAuthProviders);
        assertThat(oidcConfigurationService.getTenantConfiguration(config).getThirdPartyAuths())
                .containsExactlyInAnyOrder("google");
    }
}

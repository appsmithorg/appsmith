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
import static org.mockito.Mockito.when;

@SpringBootTest
@ExtendWith(SystemStubsExtension.class)
class SamlConfigurationServiceImplTest {

    @Autowired
    SamlConfigurationService samlConfigurationService;

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
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.license_sso_saml_enabled.name(), true));
        when(featureFlagService.getCachedTenantFeatureFlags()).thenReturn(cachedFeatures);
        environmentVariables.set("APPSMITH_SSO_SAML_ENABLED", null);
    }

    @Test
    void getTenantConfiguration_samlAuthEnabled_samlLoginAdded() {
        environmentVariables.set("APPSMITH_SSO_SAML_ENABLED", "true");
        TenantConfiguration config = new TenantConfiguration();
        List<String> thirdPartyAuthProviders = new ArrayList<>();
        thirdPartyAuthProviders.add("google");
        config.setThirdPartyAuths(thirdPartyAuthProviders);
        assertThat(samlConfigurationService.getTenantConfiguration(config).getThirdPartyAuths())
                .containsExactlyInAnyOrder("saml", "google");
    }

    @Test
    void getTenantConfiguration_samlAuthDisabled_samlLoginNotAdded() {
        TenantConfiguration config = new TenantConfiguration();
        List<String> thirdPartyAuthProviders = new ArrayList<>();
        thirdPartyAuthProviders.add("google");
        config.setThirdPartyAuths(thirdPartyAuthProviders);
        assertThat(samlConfigurationService.getTenantConfiguration(config).getThirdPartyAuths())
                .containsExactlyInAnyOrder("google");
    }
}

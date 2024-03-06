package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.services.OidcConfigurationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class OidcConfigurationServiceCECompatibleTest {

    @Autowired
    OidcConfigurationService oidcConfigurationService;

    @Test
    void getTenantConfiguration_removeOidcAuth_success() {
        TenantConfiguration config = new TenantConfiguration();
        List<String> thirdPartyAuthProviders = List.of("google", "github", "oidc");
        config.setThirdPartyAuths(thirdPartyAuthProviders);
        assertThat(oidcConfigurationService.getTenantConfiguration(config).getThirdPartyAuths())
                .containsExactlyInAnyOrder("google", "github");
    }
}

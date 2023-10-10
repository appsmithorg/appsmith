package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.services.SamlConfigurationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class SamlConfigurationServiceCECompatibleTest {

    @Autowired
    SamlConfigurationService samlConfigurationService;

    @Test
    void getTenantConfiguration_removeSamlAuth_success() {
        TenantConfiguration config = new TenantConfiguration();
        List<String> thirdPartyAuthProviders = List.of("google", "github", "saml");
        config.setThirdPartyAuths(thirdPartyAuthProviders);
        assertThat(samlConfigurationService.getTenantConfiguration(config).getThirdPartyAuths())
                .containsExactlyInAnyOrder("google", "github");
    }
}

package com.appsmith.server.services;

import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.repositories.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.test.StepVerifier;

import java.util.ArrayList;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
public class TenantServiceTest {
    @Autowired
    TenantService tenantService;

    @Autowired
    TenantRepository tenantRepository;

    private Tenant tenant;

    @BeforeEach
    public void setup() {
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setWhiteLabelEnable("true");
        tenantConfiguration.setWhiteLabelLogo("https://custom.random.url");
        tenantConfiguration.setWhiteLabelFavicon("https://custom.random.favicon");

        tenant = tenantService.getDefaultTenant().block();
        tenant.setTenantConfiguration(tenantConfiguration);
        tenant = tenantRepository.save(this.tenant).block();
    }
    
    @Test
    @WithUserDetails("anonymousUser")
    public void getTenantConfig_Valid_AnonymousUser() {
        StepVerifier.create(tenantService.getTenantConfiguration())
                .assertNext(tenant -> {
                    TenantConfiguration tenantConfiguration = tenant.getTenantConfiguration();
                    assertThat(tenantConfiguration.getWhiteLabelLogo()).isEqualTo(tenant.getTenantConfiguration().getWhiteLabelLogo());
                    assertThat(tenantConfiguration.getWhiteLabelFavicon()).isEqualTo(tenant.getTenantConfiguration().getWhiteLabelFavicon());
                    assertThat(tenantConfiguration.getWhiteLabelEnable()).isNullOrEmpty();
                })
                .verifyComplete();

    }

}

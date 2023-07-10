package com.appsmith.server.services.ce;

import com.appsmith.server.constants.LicensePlan;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.services.TenantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
public class TenantServiceCETest {
    @SpyBean
    TenantService tenantService;

    @BeforeEach
    void setup() {
        Tenant tenant = new Tenant();
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenant.setTenantConfiguration(tenantConfiguration);

        Mockito.when(tenantService.getDefaultTenant()).thenReturn(Mono.just(tenant));
    }

    @Test
    @WithUserDetails("anonymousUser")
    public void getTenantConfig_Valid_AnonymousUser() {
        StepVerifier.create(tenantService.getTenantConfiguration())
                .assertNext(tenant -> {
                    assertThat(tenant.getTenantConfiguration()).isNotNull();
                    assertThat(tenant.getTenantConfiguration().getLicense()).isNotNull();
                    assertThat(tenant.getTenantConfiguration().getLicense().getPlan())
                            .isEqualTo(LicensePlan.FREE);
                })
                .verifyComplete();
    }
}

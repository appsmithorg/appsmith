package com.appsmith.server.services.ce;

import com.appsmith.server.services.TenantService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class TenantServiceCETest {

    @Autowired
    TenantService tenantService;

    @Test
    void ensureMapsKey() {
        StepVerifier.create(tenantService.getTenantConfiguration())
                .assertNext(tenant -> {
                    assertThat(tenant.getTenantConfiguration().getGoogleMapsKey()).isEqualTo("abcd");
                })
                .verifyComplete();
    }

}

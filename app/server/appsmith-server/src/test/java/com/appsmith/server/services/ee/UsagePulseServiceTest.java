package com.appsmith.server.services.ee;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.UsagePulse;
import com.appsmith.server.dtos.UsagePulseDTO;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UsagePulseService;
import com.appsmith.server.solutions.UsageReporter;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;


@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
@Slf4j
public class UsagePulseServiceTest {

    @Autowired
    private UsagePulseService usagePulseService;

    @MockBean
    private UsageReporter usageReporter;

    @SpyBean
    private TenantService tenantService;

    @Autowired
    private CommonConfig commonConfig;


    @BeforeEach
    public void setup() {
        commonConfig.setCloudHosting(false);
    }

    /**
     * To verify usage pulses are sent to Cloud Services properly
     */
    @Test
    @WithUserDetails(value = "anonymousUser")
    public void test_sendUsagePulse_ToCloudServices() {
        Tenant testTenant = new Tenant();
        TenantConfiguration testTenantConfiguration = new TenantConfiguration();
        TenantConfiguration.License testLicense = new TenantConfiguration.License();
        testLicense.setKey("testLicenseKey");
        testTenantConfiguration.setLicense(testLicense);
        testTenant.setTenantConfiguration(testTenantConfiguration);

        Mockito.when(usageReporter.reportUsage(Mockito.any())).thenReturn(Mono.just(true));
        Mockito.when(tenantService.getDefaultTenant()).thenReturn(Mono.just(testTenant));
        Mockito.when(tenantService.getDefaultTenantId()).thenReturn(Mono.just("testTenantId"));

        UsagePulseDTO usagePulseDTO = new UsagePulseDTO();
        usagePulseDTO.setAnonymousUserId("testUser");
        usagePulseDTO.setViewMode(true);

        Mono<UsagePulse> createUsagePulseMono = usagePulseService.createPulse(usagePulseDTO);

        StepVerifier.create(createUsagePulseMono.then(usagePulseService.sendAndUpdateUsagePulse()))
                .expectNext(true)
                .verifyComplete();
    }
}
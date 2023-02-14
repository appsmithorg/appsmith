package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.UsagePulse;
import com.appsmith.server.dtos.UsagePulseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.solutions.UsageReporter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
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

import static org.assertj.core.api.Assertions.assertThat;

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

    /**
     * To verify anonymous user usage pulses are logged properly
     */
    @Test
    @WithUserDetails(value = "anonymousUser")
    public void test_AnonymousUserPulse_Success() {
        UsagePulseDTO usagePulseDTO = new UsagePulseDTO();
        String anonymousUserId = "testAnonymousUserId";
        usagePulseDTO.setViewMode(false);
        usagePulseDTO.setAnonymousUserId(anonymousUserId);

        StepVerifier.create(usagePulseService.createPulse(usagePulseDTO))
                .assertNext(usagePulse -> {
                    assertThat(usagePulse.getId()).isNotNull();
                    assertThat(usagePulse.getEmail()).isNull();
                    assertThat(usagePulse.getUser()).isEqualTo(anonymousUserId);
                    assertThat(usagePulse.getIsAnonymousUser()).isTrue();
                    assertThat(usagePulse.getInstanceId()).isNotNull();
                    assertThat(usagePulse.getTenantId()).isNotNull();
                    assertThat(usagePulse.getViewMode()).isFalse();
                })
                .verifyComplete();
    }

    /**
     * To verify anonymous usage pulse without anonymousUserId will fail
     */
    @Test
    @WithUserDetails(value = "anonymousUser")
    public void test_AnonymousUserPulse_Invalid_AnonymousUserId_ThrowsException() {
        UsagePulseDTO usagePulseDTO = new UsagePulseDTO();
        usagePulseDTO.setViewMode(false);

        StepVerifier.create(usagePulseService.createPulse(usagePulseDTO))
                .expectErrorMessage(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ANONYMOUS_USER_ID))
                .verify();
    }

    /**
     * To verify logged in user usage pulses are logged properly
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void test_loggedInUserPulse_Success() {
        UsagePulseDTO usagePulseDTO = new UsagePulseDTO();
        usagePulseDTO.setViewMode(true);

        StepVerifier.create(usagePulseService.createPulse(usagePulseDTO))
                .assertNext(usagePulse -> {
                    String hashedUserEmail = DigestUtils.sha256Hex("api_user");
                    assertThat(usagePulse.getId()).isNotNull();
                    assertThat(usagePulse.getEmail()).isNull();
                    assertThat(usagePulse.getUser()).isEqualTo(hashedUserEmail);
                    assertThat(usagePulse.getIsAnonymousUser()).isFalse();
                    assertThat(usagePulse.getInstanceId()).isNotNull();
                    assertThat(usagePulse.getTenantId()).isNotNull();
                    assertThat(usagePulse.getViewMode()).isTrue();
                })
                .verifyComplete();
    }

    /**
     * To verify usage pulses without viewMode will fail
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void test_Invalid_ViewMode_ThrowsException() {
        UsagePulseDTO usagePulseDTO = new UsagePulseDTO();

        StepVerifier.create(usagePulseService.createPulse(usagePulseDTO))
                .expectErrorMessage(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.VIEW_MODE))
                .verify();
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
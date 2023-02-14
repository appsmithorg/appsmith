package com.appsmith.server.services;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.dtos.UsagePulseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.repositories.UsagePulseRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
@Slf4j
public class UsagePulseServiceTest {

    @Autowired
    private UsagePulseService usagePulseService;

    @Autowired
    private CommonConfig commonConfig;

    @Autowired
    private UsagePulseRepository repository;

    @BeforeEach
    public void setup() {
        commonConfig.setCloudHosting(false);
    }
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

    @Test
    @WithUserDetails(value = "anonymousUser")
    public void createUsagePulse_forAppsmithCloud_pulseNotSavedInDB() {
        UsagePulseDTO usagePulseDTO = new UsagePulseDTO();
        String anonymousUserId = "testAnonymousUserId";
        usagePulseDTO.setViewMode(false);
        usagePulseDTO.setAnonymousUserId(anonymousUserId);

        usagePulseService.createPulse(usagePulseDTO).block();
        Long usagePulseCount = repository.count().block();
        usagePulseService.createPulse(usagePulseDTO).block();
        Long usagePulseCountForSelfHostedInstance = repository.count().block();

        commonConfig.setCloudHosting(true);
        usagePulseService.createPulse(usagePulseDTO).block();
        Long usagePulseCountForCloud = repository.count().block();

        assertThat(usagePulseCount).isNotNull();
        assertThat(usagePulseCountForSelfHostedInstance).isEqualTo(usagePulseCount + 1);
        assertThat(usagePulseCountForSelfHostedInstance).isEqualTo(usagePulseCountForCloud);

    }
}
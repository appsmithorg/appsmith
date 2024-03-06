package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ApplicationMemberService;
import com.appsmith.server.services.FeatureFlagService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ApplicationMemberServiceCECompatibleTest {

    @Autowired
    ApplicationMemberService applicationMemberService;

    @MockBean
    FeatureFlagService featureFlagService;

    @BeforeEach
    public void setup() {
        Mockito.when(featureFlagService.check(Mockito.any())).thenReturn(Mono.just(Boolean.FALSE));
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testGetAllMembersForApplicationCECompatible() {
        // Feature assertion started
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> applicationMemberService
                .getAllMembersForApplication("random-application-id")
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        // Feature assertion finished
    }

    @Test
    @WithUserDetails(value = "api_user")
    void getAllApplicationsMembersForWorkspaceCECompatible() {
        // Feature assertion started
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> applicationMemberService
                .getAllApplicationsMembersForWorkspace("random-workspace-id")
                .collectList()
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        // Feature assertion finished
    }
}

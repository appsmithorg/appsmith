package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.dtos.InviteUsersToApplicationDTO;
import com.appsmith.server.dtos.UpdateApplicationRoleDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
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
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
class ApplicationServiceCECompatibleTest {

    @Autowired
    ApplicationService applicationService;

    @MockBean
    FeatureFlagService featureFlagService;

    @BeforeEach
    public void setup() {
        Mockito.when(featureFlagService.check(Mockito.any())).thenReturn(Mono.just(Boolean.FALSE));
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testFetchAllDefaultRolesCECompatible() {
        // Feature assertion started
        AppsmithException unsupportedException = assertThrows(
                AppsmithException.class,
                () -> applicationService.fetchAllDefaultRoles("").block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        // Feature assertion finished
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testInviteToApplicationCECompatible() {
        // Feature assertion started
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> applicationService
                .inviteToApplication(new InviteUsersToApplicationDTO(), "")
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        // Feature assertion finished
    }

    @Test
    @WithUserDetails(value = "api_user")
    void testUpdateRoleForMemberCECompatible() {
        // Feature assertion started
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> applicationService
                .updateRoleForMember("", new UpdateApplicationRoleDTO())
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        // Feature assertion finished
    }

    @Test
    void testFetchAllDefaultRolesWithoutPermissionsCECompatible() {
        // Feature assertion started
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> applicationService
                .fetchAllDefaultRolesWithoutPermissions()
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        // Feature assertion finished
    }
}

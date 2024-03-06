package com.appsmith.server.solutions.ce_compatible;

import com.appsmith.server.dtos.UpdateRoleAssociationDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class UserAndAccessManagementServiceCECompatibleTest {

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    @MockBean
    FeatureFlagService featureFlagService;

    @BeforeEach
    public void setup() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(Boolean.FALSE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_scim_enabled)))
                .thenReturn(Mono.just(Boolean.FALSE));
    }

    @Test
    public void testDeleteProvisionUserCECompatible() {
        // Feature assertion started
        AppsmithException unsupportedException =
                assertThrows(AppsmithException.class, () -> userAndAccessManagementService
                        .deleteProvisionUser("random-id")
                        .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        // Feature assertion finished
    }

    @Test
    public void testGetAllUsersCECompatible() {
        // Feature assertion started
        AppsmithException unsupportedException =
                assertThrows(AppsmithException.class, () -> userAndAccessManagementService
                        .getAllUsers(new LinkedMultiValueMap<>())
                        .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        // Feature assertion finished
    }

    @Test
    public void testChangeRoleAssociationsCECompatible() {
        // Feature assertion started
        AppsmithException unsupportedException =
                assertThrows(AppsmithException.class, () -> userAndAccessManagementService
                        .changeRoleAssociations(new UpdateRoleAssociationDTO(), "")
                        .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        // Feature assertion finished
    }

    @Test
    public void testUnAssignUsersAndGroupsFromAllAssociatedRolesCECompatible() {
        // Feature assertion started
        AppsmithException unsupportedException =
                assertThrows(AppsmithException.class, () -> userAndAccessManagementService
                        .unAssignUsersAndGroupsFromAllAssociatedRoles(List.of(), List.of())
                        .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        // Feature assertion finished
    }
}

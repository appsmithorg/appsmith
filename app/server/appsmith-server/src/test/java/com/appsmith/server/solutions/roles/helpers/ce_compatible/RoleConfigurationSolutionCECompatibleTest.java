package com.appsmith.server.solutions.roles.helpers.ce_compatible;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.solutions.roles.RoleConfigurationSolution;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleConfigDTO;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;

@Slf4j
@ExtendWith(SpringExtension.class)
@SpringBootTest
class RoleConfigurationSolutionCECompatibleTest {

    @Autowired
    RoleConfigurationSolution roleConfigurationSolution;

    @MockBean
    FeatureFlagService featureFlagService;

    @BeforeEach
    public void setup() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(false));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_datasource_environments_enabled)))
                .thenReturn(Mono.just(false));
    }

    @Test
    void testGetAllTabViews() {
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> roleConfigurationSolution
                .getAllTabViews("randomPermissionGroupId")
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }

    @Test
    void testUpdateRoles() {
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> {
            UpdateRoleConfigDTO updateRoleConfigDTO = new UpdateRoleConfigDTO();
            roleConfigurationSolution
                    .updateRoles("randomPermissionGroupId", updateRoleConfigDTO)
                    .block();
        });
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }

    @Test
    void testUpdateApplicationAndRelatedResourcesWithPermissionsForRole() {
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> roleConfigurationSolution
                .updateApplicationAndRelatedResourcesWithPermissionsForRole(
                        "randomApplicationId", "randomRoleId", Map.of(), Map.of())
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }

    @Test
    void testUpdateWorkspaceAndDatasourcesInWorkspaceWithPermissionsForRole() {
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> roleConfigurationSolution
                .updateWorkspaceAndDatasourcesInWorkspaceWithPermissionsForRole(
                        "randomWorkspaceId", "randomRoleId", Map.of(), Map.of())
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }

    @Test
    void testUpdateEnvironmentsInWorkspaceWithPermissionsForRole() {
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> roleConfigurationSolution
                .updateEnvironmentsInWorkspaceWithPermissionsForRole(
                        "randomWorkspaceId", "randomRoleId", "applicationRoleType", Map.of(), Map.of())
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
    }
}

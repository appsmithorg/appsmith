package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.ProvisionResourceDto;
import com.appsmith.server.dtos.UserGroupUpdateDTO;
import com.appsmith.server.dtos.UsersForGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@Slf4j
@ExtendWith(SpringExtension.class)
@SpringBootTest
class UserGroupServiceCECompatibleTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserGroupService userGroupService;

    @Autowired
    private UserAndAccessManagementService userAndAccessManagementService;

    @MockBean
    FeatureFlagService featureFlagService;

    @BeforeEach
    public void setFeatureFlags() {
        mockFeatureFlag(FeatureFlagEnum.license_audit_logs_enabled, false);
    }

    private void mockFeatureFlag(FeatureFlagEnum featureFlagEnum, boolean value) {
        Mockito.when(featureFlagService.check(Mockito.eq(featureFlagEnum))).thenReturn(Mono.just(value));
    }

    @Test
    @WithUserDetails(value = FieldName.PROVISIONING_USER)
    void testUpdateProvisionGroup() {
        // Test setup started
        String testName = "testUpdateProvisionGroup";
        UserGroup userGroup_provisioning = new UserGroup();
        userGroup_provisioning.setName(testName + "_provisionedGroup");
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, true);
        ProvisionResourceDto provisionedUserGroup =
                userGroupService.createProvisionGroup(userGroup_provisioning).block();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, false);

        UserGroupUpdateDTO userGroupUpdateDTO = new UserGroupUpdateDTO();
        userGroupUpdateDTO.setName(testName + "_provisionedGroup" + "_updated");
        // Test setup finished

        // Feature assertion started
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> userGroupService
                .updateProvisionGroup(provisionedUserGroup.getResource().getId(), userGroupUpdateDTO)
                .block());

        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        // Feature assertion finished

        // Test cleanup started
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, true);
        userGroupService
                .archiveProvisionGroupById(provisionedUserGroup.getResource().getId())
                .block();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, false);
        // Test cleanup finished
    }

    @Test
    @WithUserDetails(value = FieldName.PROVISIONING_USER)
    void testGetProvisionGroup() {
        // Test setup started
        String testName = "testGetProvisionGroup";
        UserGroup userGroup_provisioning = new UserGroup();
        userGroup_provisioning.setName(testName + "_provisionedGroup");
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, true);
        ProvisionResourceDto provisionedUserGroup =
                userGroupService.createProvisionGroup(userGroup_provisioning).block();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, false);
        // Test setup finished

        // Feature assertion started
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> userGroupService
                .getProvisionGroup(provisionedUserGroup.getResource().getId())
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        // Feature assertion finished

        // Test cleanup started
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, true);
        userGroupService
                .archiveProvisionGroupById(provisionedUserGroup.getResource().getId())
                .block();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, false);
        // Test cleanup finished
    }

    @Test
    @WithUserDetails(value = FieldName.PROVISIONING_USER)
    void testGetProvisionGroups() {
        // Test setup started
        String testName = "testGetProvisionGroups";
        UserGroup userGroup_provisioning = new UserGroup();
        userGroup_provisioning.setName(testName + "_provisionedGroup");
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, true);
        ProvisionResourceDto provisionedUserGroup =
                userGroupService.createProvisionGroup(userGroup_provisioning).block();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, false);
        // Test setup finished

        // Feature assertion started
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> userGroupService
                .getProvisionGroups(new LinkedMultiValueMap<>())
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        // Feature assertion finished

        // Test cleanup started
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, true);
        userGroupService
                .archiveProvisionGroupById(provisionedUserGroup.getResource().getId())
                .block();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, false);
        // Test cleanup finished
    }

    @Test
    @WithUserDetails(value = FieldName.PROVISIONING_USER)
    void testCreateProvisionGroup() {
        // Test setup started
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, false);
        String testName = "testCreateProvisionGroup";
        UserGroup userGroup_provisioning = new UserGroup();
        userGroup_provisioning.setName(testName + "_provisionedGroup");
        // Test setup finished

        // Feature assertion started
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> userGroupService
                .createProvisionGroup(userGroup_provisioning)
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        // Feature assertion finished
    }

    @Test
    @WithUserDetails(value = FieldName.PROVISIONING_USER)
    void testRemoveUsersFromProvisionGroup() {
        // Test setup started
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, true);
        mockFeatureFlag(FeatureFlagEnum.license_branding_enabled, true);
        String testName = "testRemoveUsersFromProvisionGroup";
        User user1 = new User();
        user1.setEmail(testName + "_provisioned_user1@appsmith.com");
        ProvisionResourceDto provisionedUser1 =
                userService.createProvisionUser(user1).block();

        UserGroup userGroup_provisioning = new UserGroup();
        userGroup_provisioning.setName(testName + "_provisionedGroup");
        ProvisionResourceDto provisionedUserGroup =
                userGroupService.createProvisionGroup(userGroup_provisioning).block();

        UsersForGroupDTO addUsersForGroupDTO = new UsersForGroupDTO();
        addUsersForGroupDTO.setGroupIds(
                Set.of(provisionedUserGroup.getResource().getId()));
        addUsersForGroupDTO.setUserIds(List.of(provisionedUser1.getResource().getId()));

        userGroupService.addUsersToProvisionGroup(addUsersForGroupDTO).block();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, false);
        // Test setup finished

        // Feature assertion started
        UsersForGroupDTO removeUserFromGroupUsersForGroupDTO = new UsersForGroupDTO();
        removeUserFromGroupUsersForGroupDTO.setGroupIds(
                Set.of(provisionedUserGroup.getResource().getId()));

        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> userGroupService
                .removeUsersFromProvisionGroup(removeUserFromGroupUsersForGroupDTO)
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        // Feature assertion finished

        // Test cleanup started
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, true);
        userAndAccessManagementService
                .deleteProvisionUser(provisionedUser1.getResource().getId())
                .block();
        userGroupService
                .archiveProvisionGroupById(provisionedUserGroup.getResource().getId())
                .block();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, false);
        // Test cleanup finished
    }

    @Test
    @WithUserDetails(value = FieldName.PROVISIONING_USER)
    void testAddUsersToProvisionGroup() {
        // Test setup started
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, true);
        String testName = "testAddUsersToProvisionGroup";
        User user1 = new User();
        user1.setEmail(testName + "_provisioned_user1@appsmith.com");
        ProvisionResourceDto provisionedUser1 =
                userService.createProvisionUser(user1).block();

        UserGroup userGroup_provisioning = new UserGroup();
        userGroup_provisioning.setName(testName + "_provisionedGroup");
        ProvisionResourceDto provisionedUserGroup =
                userGroupService.createProvisionGroup(userGroup_provisioning).block();

        UsersForGroupDTO addUsersForGroupDTO = new UsersForGroupDTO();
        addUsersForGroupDTO.setGroupIds(
                Set.of(provisionedUserGroup.getResource().getId()));
        addUsersForGroupDTO.setUserIds(List.of(provisionedUser1.getResource().getId()));

        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, false);
        // Test setup finished

        // Feature assertion started
        AppsmithException unsupportedException = assertThrows(AppsmithException.class, () -> userGroupService
                .addUsersToProvisionGroup(addUsersForGroupDTO)
                .block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        // Feature assertion finished

        // Test cleanup started
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, true);
        userAndAccessManagementService
                .deleteProvisionUser(provisionedUser1.getResource().getId())
                .block();
        userGroupService
                .archiveProvisionGroupById(provisionedUserGroup.getResource().getId())
                .block();
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, false);
        // Test cleanup finished
    }

    @Test
    @WithUserDetails(value = FieldName.PROVISIONING_USER)
    void testArchiveProvisionGroupById() {
        // Test setup started
        mockFeatureFlag(FeatureFlagEnum.license_scim_enabled, false);
        // Test setup finished

        // Feature assertion started
        AppsmithException unsupportedException = assertThrows(
                AppsmithException.class,
                () -> userGroupService.archiveProvisionGroupById("random-id").block());
        assertThat(unsupportedException.getMessage()).isEqualTo(AppsmithError.UNSUPPORTED_OPERATION.getMessage());
        // Feature assertion finished
    }
}

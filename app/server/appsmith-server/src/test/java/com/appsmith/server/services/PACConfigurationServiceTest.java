package com.appsmith.server.services;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.dtos.UserProfileDTO;
import com.appsmith.server.dtos.UsersForGroupDTO;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.constants.AccessControlConstants.ENABLE_PROGRAMMATIC_ACCESS_CONTROL_IN_ADMIN_SETTINGS;
import static com.appsmith.server.constants.ce.AccessControlConstantsCE.UPGRADE_TO_BUSINESS_EDITION_TO_ACCESS_ROLES_AND_GROUPS_FOR_CONDITIONAL_BUSINESS_LOGIC;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@DirtiesContext
@Slf4j
class PACConfigurationServiceTest {
    @Autowired
    PACConfigurationService pacConfigurationService;

    @Autowired
    CommonConfig commonConfig;

    @Autowired
    UserService userService;

    @SpyBean
    FeatureFlagService featureFlagService;

    @Autowired
    UserUtils userUtils;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserGroupService userGroupService;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    UserGroupRepository userGroupRepository;

    @Autowired
    TenantService tenantService;

    @BeforeEach
    public void setup() {
        User apiUser = userRepository
                .findFirstByEmailIgnoreCaseOrderByCreatedAtDesc("api_user")
                .block();
        userUtils.makeSuperUser(List.of(apiUser)).block();

        Mockito.when(featureFlagService.check(FeatureFlagEnum.license_pac_enabled))
                .thenReturn(Mono.just(true));
    }

    @Test
    public void test_getTenantConfiguration_featureFlagDisabled() {
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setShowRolesAndGroups(true);

        Mono<TenantConfiguration> tenantConfigurationMono =
                pacConfigurationService.getTenantConfiguration(tenantConfiguration);
        StepVerifier.create(tenantConfigurationMono)
                .assertNext(tenantConfiguration1 -> Assertions.assertTrue(tenantConfiguration1.getShowRolesAndGroups()))
                .verifyComplete();
    }

    @Test
    public void test_updateTenantConfiguration_featureFlagDisabled() {
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setShowRolesAndGroups(true);

        Mono<TenantConfiguration> tenantConfigurationMono =
                pacConfigurationService.updateTenantConfiguration(tenantConfiguration);
        StepVerifier.create(tenantConfigurationMono)
                .assertNext(tenantConfiguration1 -> Assertions.assertTrue(tenantConfiguration1.getShowRolesAndGroups()))
                .verifyComplete();
    }

    @Test
    public void test_setRolesAndGroups_pacDisabled() {
        UserProfileDTO userProfileDTO = new UserProfileDTO();
        Mono<UserProfileDTO> userProfileDTOMono =
                pacConfigurationService.setRolesAndGroups(userProfileDTO, null, false, false);
        StepVerifier.create(userProfileDTOMono)
                .assertNext(userProfileDTO1 -> {
                    assertThat(userProfileDTO1.getRoles())
                            .isEqualTo(List.of(ENABLE_PROGRAMMATIC_ACCESS_CONTROL_IN_ADMIN_SETTINGS));
                    assertThat(userProfileDTO1.getGroups())
                            .isEqualTo(List.of(ENABLE_PROGRAMMATIC_ACCESS_CONTROL_IN_ADMIN_SETTINGS));
                })
                .verifyComplete();
    }

    @Test
    public void test_setRolesAndGroups_pacEnabledCloudHosting() {
        commonConfig.setCloudHosting(true);
        UserProfileDTO userProfileDTO = new UserProfileDTO();
        Mono<UserProfileDTO> userProfileDTOMono =
                pacConfigurationService.setRolesAndGroups(userProfileDTO, null, true, true);
        StepVerifier.create(userProfileDTOMono)
                .assertNext(userProfileDTO1 -> {
                    assertThat(userProfileDTO1.getRoles())
                            .isEqualTo(
                                    List.of(
                                            UPGRADE_TO_BUSINESS_EDITION_TO_ACCESS_ROLES_AND_GROUPS_FOR_CONDITIONAL_BUSINESS_LOGIC));
                    assertThat(userProfileDTO1.getGroups())
                            .isEqualTo(
                                    List.of(
                                            UPGRADE_TO_BUSINESS_EDITION_TO_ACCESS_ROLES_AND_GROUPS_FOR_CONDITIONAL_BUSINESS_LOGIC));
                })
                .verifyComplete();
    }

    @Test
    public void test_setRolesAndGroups_pacEnabled() {
        String testName = "test_setRolesAndGroups_pacEnabled".toLowerCase();
        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);

        userService.createUser(user).block();
        user = userService.findByEmail(testName).block();

        UserProfileDTO userProfileDTO = new UserProfileDTO();
        Mono<UserProfileDTO> userProfileDTOMono =
                pacConfigurationService.setRolesAndGroups(userProfileDTO, user, true, false);
        StepVerifier.create(userProfileDTOMono)
                .assertNext(userProfileDTO1 -> {
                    // by default roles gets attached to a user, so it must be non-empty
                    assertThat(userProfileDTO1.getRoles()).isNotEmpty();
                    // we are not attaching any group, so it should be empty
                    assertThat(userProfileDTO1.getGroups()).isEmpty();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void test_setRolesAndGroups_validateRoleNamesFromGroup() {
        String testName = "test_setRolesAndGroups_validateRoleNamesFromGroup";
        User apiUser = userRepository
                .findFirstByEmailIgnoreCaseOrderByCreatedAtDesc("api_user")
                .block();

        // Setup
        Mockito.when(featureFlagService.check(Mockito.eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(Boolean.TRUE));
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(FeatureFlagEnum.license_gac_enabled.name(), Boolean.TRUE));
        Mockito.when(featureFlagService.getCachedTenantFeatureFlags()).thenReturn(cachedFeatures);

        Tenant defaultTenant = tenantService.getTenantConfiguration().block();
        Boolean actualValueSetRolesAndGroups =
                defaultTenant.getTenantConfiguration().getShowRolesAndGroups();
        defaultTenant.getTenantConfiguration().setShowRolesAndGroups(Boolean.TRUE);
        Tenant updatedDefaultTenant = tenantService
                .updateDefaultTenantConfiguration(defaultTenant.getTenantConfiguration())
                .block();

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName);
        UserGroup createdUserGroup = userGroupService
                .createGroup(userGroup)
                .flatMap(userGroupDTO -> userGroupRepository.findById(userGroupDTO.getId()))
                .block();

        PermissionGroup permissionGroupAssociatedToUserGroup = new PermissionGroup();
        permissionGroupAssociatedToUserGroup.setName(testName + "_associatedToUserGroup");
        PermissionGroup createdPermissionGroupAssociatedToUserGroup = permissionGroupService
                .create(permissionGroupAssociatedToUserGroup)
                .block();

        PermissionGroup permissionGroupAssociatedToUser = new PermissionGroup();
        permissionGroupAssociatedToUser.setName(testName + "_associatedToUser");
        PermissionGroup createdPermissionGroupAssociatedToUser =
                permissionGroupService.create(permissionGroupAssociatedToUser).block();

        PermissionGroup permissionGroupAssociatedToUserAndUserGroup = new PermissionGroup();
        permissionGroupAssociatedToUserAndUserGroup.setName(testName + "_associatedToUserAndUserGroup");
        PermissionGroup createdPermissionGroupAssociatedToUserAndUserGroup = permissionGroupService
                .create(permissionGroupAssociatedToUserAndUserGroup)
                .block();

        UsersForGroupDTO usersForGroupDTO = new UsersForGroupDTO();
        usersForGroupDTO.setUsernames(Set.of("api_user"));
        usersForGroupDTO.setGroupIds(Set.of(createdUserGroup.getId()));
        List<UserGroupDTO> inviteUserToCreatedUserGroup =
                userGroupService.inviteUsers(usersForGroupDTO, "test").block();

        PermissionGroup associateUserGroupWithCreatedPermissionGroupAssociatedToUserGroup = permissionGroupService
                .assignToUserGroup(createdPermissionGroupAssociatedToUserGroup, createdUserGroup)
                .block();
        PermissionGroup associateUserGroupWithCreatedPermissionGroupAssociatedToUserAndUserGroup =
                permissionGroupService
                        .assignToUserGroup(createdPermissionGroupAssociatedToUserAndUserGroup, createdUserGroup)
                        .block();
        PermissionGroup associateUserWithCreatedPermissionGroupAssociatedToUser = permissionGroupService
                .assignToUser(createdPermissionGroupAssociatedToUser, apiUser)
                .block();
        PermissionGroup associateUserWithCreatedPermissionGroupAssociatedToUserAndUserGroup = permissionGroupService
                .assignToUser(createdPermissionGroupAssociatedToUserAndUserGroup, apiUser)
                .block();
        // Setup

        // Assertions
        UserProfileDTO userProfileDTO = userService.buildUserProfileDTO(apiUser).block();
        List<String> associatedRoles = userProfileDTO.getRoles();
        List<String> associatedGroups = userProfileDTO.getGroups();

        // Assert that all associated roles are coming
        assertThat(associatedRoles)
                .contains(createdPermissionGroupAssociatedToUserGroup.getName()); // Role was assigned to UserGroup
        assertThat(associatedRoles)
                .contains(
                        createdPermissionGroupAssociatedToUserAndUserGroup
                                .getName()); // Role was assigned to UserGroup and User
        assertThat(associatedRoles)
                .contains(createdPermissionGroupAssociatedToUser.getName()); // Role was assigned to User

        // Assert that all associated groups are coming
        assertThat(associatedGroups).contains(createdUserGroup.getName());

        // Assert that there is no duplication of roles
        List<String> rolesNamesAssignedToUserAndUserGroup = associatedRoles.stream()
                .filter(roleName -> roleName.equals(createdPermissionGroupAssociatedToUserAndUserGroup.getName()))
                .toList();
        assertThat(rolesNamesAssignedToUserAndUserGroup).hasSize(1);
        // Assertions

        // Cleanup
        updatedDefaultTenant.getTenantConfiguration().setShowRolesAndGroups(actualValueSetRolesAndGroups);
        Tenant updateDefaultTenantWithActualValue = tenantService
                .updateDefaultTenantConfiguration(updatedDefaultTenant.getTenantConfiguration())
                .block();
        PermissionGroup deletedPermissionGroup1 = permissionGroupService
                .archiveById(createdPermissionGroupAssociatedToUserGroup.getId())
                .block();
        PermissionGroup deletedPermissionGroup2 = permissionGroupService
                .archiveById(createdPermissionGroupAssociatedToUser.getId())
                .block();
        PermissionGroup deletedPermissionGroup3 = permissionGroupService
                .archiveById(createdPermissionGroupAssociatedToUserAndUserGroup.getId())
                .block();
        UserGroup deletedUserGroup =
                userGroupService.archiveById(createdUserGroup.getId()).block();
        // Cleanup
    }
}

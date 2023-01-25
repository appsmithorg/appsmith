package com.appsmith.server.services.ee;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.acl.AclPermission.MANAGE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_USER_GROUPS;
import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@ExtendWith(SpringExtension.class)
@SpringBootTest
public class UserServiceTest {

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserService userService;

    @Autowired
    UserUtils userUtils;

    @Autowired
    UserGroupService userGroupService;

    @Autowired
    UserGroupRepository userGroupRepository;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    PermissionGroupService permissionGroupService;

    User api_user = null;
    User admin_user = null;

    Set<String> superAdminIds;

    String superAdminPermissionGroupId = null;

    @BeforeEach
    public void setup() {

        api_user = userRepository.findByEmail("api_user").block();

        // Create a new user
        User newUser = new User();
        newUser.setEmail(UUID.randomUUID() + "@email.com");
        newUser.setPassword("password");
        admin_user = userService.create(newUser).block();

        superAdminIds = Set.of(api_user.getId(), admin_user.getId());

        // Make api_user instance administrator before starting the tests
        userUtils.makeSuperUser(List.of(api_user, admin_user)).block();

        if (superAdminPermissionGroupId == null) {
            superAdminPermissionGroupId = userUtils.getSuperAdminPermissionGroup().block().getId();
        }
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testNonAdminReturnNonAdminInProfile() {

        // First assert that api_user is a super admin
        StepVerifier.create(userService.buildUserProfileDTO(api_user))
                .assertNext(userProfileDTO -> {
                    assertThat(userProfileDTO.getUsername()).isEqualTo("api_user");
                    assertThat(userProfileDTO.isSuperUser()).isTrue();
                    assertThat(userProfileDTO.isAdminSettingsVisible()).isTrue();
                }).verifyComplete();

        // First make the api_user a non-admin
        userUtils.removeSuperUser(List.of(api_user)).block();

        StepVerifier.create(userService.buildUserProfileDTO(api_user))
                .assertNext(userProfileDTO -> {
                    assertThat(userProfileDTO.getUsername()).isEqualTo("api_user");
                    assertThat(userProfileDTO.isSuperUser()).isFalse();
                    assertThat(userProfileDTO.isAdminSettingsVisible()).isFalse();
                }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testNonAdminReturnAdminInProfile_givenReadGroup() {

        UserGroup userGroup = new UserGroup();
        String name = "Test Group testNonAdminReturnAdminInProfile_givenReadGroup";
        String description = "Test Group Description testNonAdminReturnAdminInProfile_givenReadGroup";
        userGroup.setName(name);
        userGroup.setDescription(description);

        UserGroup createdGroup = userGroupService.createGroup(userGroup)
                // Assert that the created role is also editable by the user who created it
                .flatMap(userGroup1 -> userGroupService.findById(userGroup1.getId(), MANAGE_USER_GROUPS)).block();

        PermissionGroup permissionGroup = new PermissionGroup();
        name = "Test Role testNonAdminReturnAdminInProfile_givenReadGroup";
        description = "Test Role Description testNonAdminReturnAdminInProfile_givenReadGroup";
        permissionGroup.setName(name);
        permissionGroup.setDescription(description);

        PermissionGroup createdPermissionGroup = permissionGroupService.create(permissionGroup).block();

        // Give read permission to the group for this permission group
        Policy readPolicy = createdGroup.getPolicies().stream().filter(policy -> policy.getPermission().equals(READ_USER_GROUPS.getValue()))
                .findFirst().get();
        readPolicy.getPermissionGroups().add(createdPermissionGroup.getId());
        userGroupRepository.save(createdGroup).block();
        // Assign the permission group to api_user
        createdPermissionGroup.getAssignedToUserIds().add(api_user.getId());
        permissionGroupRepository.save(createdPermissionGroup).block();

        // Now make the api_user a non-admin
        userUtils.removeSuperUser(List.of(api_user)).block();

        // Since the user now has access to read the created group, the user should be marked as super admin
        StepVerifier.create(userService.buildUserProfileDTO(api_user))
                .assertNext(userProfileDTO -> {
                    assertThat(userProfileDTO.getUsername()).isEqualTo("api_user");
                    assertThat(userProfileDTO.isSuperUser()).isFalse();
                    assertThat(userProfileDTO.isAdminSettingsVisible()).isTrue();
                }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "anonymousUser")
    public void validUserCreate_defaultRoleAssigned_cancelledMidway() {
        User user = new User();
        String email = UUID.randomUUID() + "@email.com";
        user.setEmail(email);
        user.setPassword("TestPassword");

        userService.userCreate(user, false)
                .timeout(Duration.ofMillis(5))
                .subscribe();

        // Sleep for user creation to finish before proceeding ahead.
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }

        User createdUser = userRepository.findByEmail(email)
                .block();


        Mono<PermissionGroup> defaultUserPermissionGroupMono = userUtils.getDefaultUserPermissionGroup();

        StepVerifier.create(defaultUserPermissionGroupMono)
                .assertNext(defaultUserPermissionGroup -> {
                    assertThat(defaultUserPermissionGroup.getAssignedToUserIds()).contains(createdUser.getId());
                })
                .verifyComplete();
    }

}

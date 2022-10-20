package com.appsmith.server.solutions;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.dtos.UserForManagementDTO;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.constants.FieldName.ANONYMOUS_USER;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
public class UserManagementServiceTest {

    @Autowired
    UserManagementService userManagementService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserUtils userUtils;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    UserGroupService userGroupService;

    @Autowired
    UserService userService;

    User api_user = null;

    String superAdminPermissionGroupId = null;

    @BeforeEach
    public void setup() {
        if (api_user == null) {
            api_user = userRepository.findByEmail("api_user").block();
        }

        // Make api_user instance administrator before starting the test
        userUtils.makeSuperUser(List.of(api_user)).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getAllUsersForManagementTest_valid() {

        Mono<List<UserForManagementDTO>> allUsersMono = userManagementService.getAllUsers();

        StepVerifier.create(allUsersMono)
                .assertNext(users -> {
                    assertThat(users).isNotNull();
                    assertThat(users.size()).isGreaterThan(0);

                    UserForManagementDTO apiUserDto = users.stream().filter(user -> user.getUsername().equals("api_user")).findFirst().get();
                    assertThat(apiUserDto.getId()).isEqualTo(api_user.getId());
                    assertThat(apiUserDto.getGroups().size()).isEqualTo(0);
                    assertThat(apiUserDto.getRoles().size()).isEqualTo(2);

                    boolean adminRole = apiUserDto.getRoles().stream()
                            .anyMatch(role -> "Instance Administrator Role".equals(role.getName()));
                    assertThat(adminRole).isTrue();

                    // Also assert that anonymous user is not returned inside the list of users
                    Optional<UserForManagementDTO> anonymousUserOptional = users.stream().filter(user -> user.getUsername().equals(ANONYMOUS_USER)).findFirst();
                    assertThat(anonymousUserOptional.isPresent()).isFalse();

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void getAllUsersForManagementTest_invalid() {
        Mono<List<UserForManagementDTO>> allUsersMono = userManagementService.getAllUsers();

        StepVerifier.create(allUsersMono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                throwable.getMessage()
                                        .equals(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS).getMessage())
                )
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getSingleUserForManagementTest_valid() {

        Mono<UserForManagementDTO> userByIdMono = userManagementService.getUserById(api_user.getId());

        StepVerifier.create(userByIdMono)
                .assertNext(user -> {
                    assertThat(user).isNotNull();

                    assertThat(user.getId()).isEqualTo(api_user.getId());
                    assertThat(user.getGroups().size()).isEqualTo(0);
                    assertThat(user.getRoles().size()).isEqualTo(2);

                    boolean adminRole = user.getRoles().stream()
                            .anyMatch(role -> "Instance Administrator Role".equals(role.getName()));
                    assertThat(adminRole).isTrue();

                    // Assert that name is also returned.
                    assertThat(user.getName()).isEqualTo("api_user");

                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    public void getSingleUserForManagementTest_invalid() {
        Mono<UserForManagementDTO> userByIdMono = userManagementService.getUserById(api_user.getId());

        StepVerifier.create(userByIdMono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                throwable.getMessage()
                                        .equals(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS).getMessage())
                )
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void deleteUserTest_valid() {
        User newUser = new User();
        String email = "deleteUserTest_valid@email.com";
        newUser.setEmail(email);
        newUser.setPassword("deleteUserTest_valid password");

        User createdUser = userService.create(newUser).block();

        Set<Policy> userPolicies = createdUser.getPolicies();
        Policy policy = userPolicies.stream().findFirst().get();
        String permissionGroupId = policy.getPermissionGroups().stream().findFirst().get();
        PermissionGroup existingPermissionGroup = permissionGroupService.findById(permissionGroupId).block();

        UserGroup ug = new UserGroup();
        ug.setName("deleteUserTest_valid User Group");
        UserGroupDTO createdUserGroup = userGroupService.createGroup(ug).block();

        // Delete the user
        userManagementService.deleteUser(createdUser.getId()).block();

        Mono<PermissionGroup> existingPermissionGroupPostDeleteMono = permissionGroupService.findById(existingPermissionGroup.getId());
        Mono<UserGroup> existingGroupAfterDeleteMono = userGroupService.findById(createdUserGroup.getId(), AclPermission.READ_USER_GROUPS);

        StepVerifier.create(Mono.zip(existingPermissionGroupPostDeleteMono, existingGroupAfterDeleteMono))
                .assertNext(tuple -> {
                    PermissionGroup permissionGroup = tuple.getT1();
                    UserGroup userGroup = tuple.getT2();

                    assertThat(permissionGroup.getAssignedToUserIds()).doesNotContain(createdUser.getId());
                    assertThat(userGroup.getUsers()).doesNotContain(createdUserGroup.getId());
                })
                .verifyComplete();

        User userFetchedAfterDelete = userService.findByEmail(email).block();
        assertThat(userFetchedAfterDelete).isNull();
    }
}

package com.appsmith.server.helpers;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.UserUtilsCE;
import com.appsmith.server.repositories.PermissionGroupRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class UserUtilsTest {

    @Autowired
    private UserUtilsCE userUtils;

    @Autowired
    private PermissionGroupRepository permissionGroupRepository;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        user1 = new User();
        user1.setId("user1");
        user1.setEmail("user1@test.com");
        user1.setOrganizationId("org1");

        user2 = new User();
        user2.setId("user2");
        user2.setEmail("user2@test.com");
        user2.setOrganizationId("org1");
    }

    @Test
    void makeInstanceAdministrator_WhenUsersProvided_AssignsPermissionsSuccessfully() {
        List<User> users = Arrays.asList(user1, user2);

        StepVerifier.create(userUtils
                        .makeInstanceAdministrator(users)
                        .then(Mono.zip(
                                userUtils.getInstanceAdminPermissionGroup(),
                                userUtils.getDefaultOrganizationAdminPermissionGroup())))
                .assertNext(tuple -> {
                    PermissionGroup instanceAdminPG = tuple.getT1();
                    PermissionGroup organizationAdminPG = tuple.getT2();

                    assertThat(instanceAdminPG.getAssignedToUserIds())
                            .contains(user1.getId(), user2.getId())
                            .as("Users should be assigned to instance admin group");

                    assertThat(organizationAdminPG.getAssignedToUserIds())
                            .contains(user1.getId(), user2.getId())
                            .as("Users should be assigned to organization admin group");
                })
                .verifyComplete();
    }

    @Test
    void removeInstanceAdmin_WhenUsersProvided_RemovesPermissionsSuccessfully() {
        List<User> users = Arrays.asList(user1, user2);

        StepVerifier.create(userUtils
                        .makeInstanceAdministrator(users)
                        .then(userUtils.removeInstanceAdmin(users))
                        .then(Mono.zip(
                                userUtils.getInstanceAdminPermissionGroup(),
                                userUtils.getDefaultOrganizationAdminPermissionGroup())))
                .assertNext(tuple -> {
                    PermissionGroup instanceAdminPG = tuple.getT1();
                    PermissionGroup organizationAdminPG = tuple.getT2();

                    assertThat(instanceAdminPG.getAssignedToUserIds())
                            .doesNotContain(user1.getId(), user2.getId())
                            .as("Users should be removed from instance admin group");

                    assertThat(organizationAdminPG.getAssignedToUserIds())
                            .doesNotContain(user1.getId(), user2.getId())
                            .as("Users should be removed from organization admin group");
                })
                .verifyComplete();
    }

    @Test
    void makeInstanceAdministrator_WhenUserAlreadyAdmin_MaintainsPermissionsSuccessfully() {
        List<User> users = List.of(user1);

        StepVerifier.create(userUtils
                        .makeInstanceAdministrator(users)
                        .then(userUtils.makeInstanceAdministrator(users))
                        .then(Mono.zip(
                                userUtils.getInstanceAdminPermissionGroup(),
                                userUtils.getDefaultOrganizationAdminPermissionGroup())))
                .assertNext(tuple -> {
                    PermissionGroup instanceAdminPG = tuple.getT1();
                    PermissionGroup organizationAdminPG = tuple.getT2();

                    assertThat(instanceAdminPG.getAssignedToUserIds())
                            .contains(user1.getId())
                            .hasSize(1)
                            .as("User should be assigned exactly once to instance admin group");

                    assertThat(organizationAdminPG.getAssignedToUserIds())
                            .contains(user1.getId())
                            .hasSize(1)
                            .as("User should be assigned exactly once to organization admin group");
                })
                .verifyComplete();
    }

    @Test
    void makeInstanceAdministrator_ConcurrentCalls_BothUsersAssigned() {
        Mono<Boolean> assign1 = userUtils.makeInstanceAdministrator(List.of(user1));
        Mono<Boolean> assign2 = userUtils.makeInstanceAdministrator(List.of(user2));

        StepVerifier.create(
                        Mono.zip(assign1, assign2)
                                .then(userUtils.getInstanceAdminPermissionGroup()))
                .assertNext(instanceAdminPG -> {
                    assertThat(instanceAdminPG.getAssignedToUserIds())
                            .contains(user1.getId(), user2.getId())
                            .as("Both users should be present after concurrent admin assignments");
                })
                .verifyComplete();
    }
}

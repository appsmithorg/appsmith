package com.appsmith.server.services;

import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.constants.ce.FieldNameCE.ADMINISTRATOR;
import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

@Slf4j
@SpringBootTest
@DirtiesContext
public class PermissionGroupServiceTest {

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserUtils userUtils;

    @Test
    @WithUserDetails(value = "api_user")
    public void valid_leaveRole() {

        Workspace workspace = new Workspace();
        workspace.setName("valid_leaveRole");

        Workspace createdWorkspace = workspaceService.create(workspace).block();

        Set<String> defaultPermissionGroupIds = createdWorkspace.getDefaultPermissionGroups();
        List<PermissionGroup> defaultPermissionGroups = permissionGroupRepository
                .findAllById(defaultPermissionGroupIds)
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = defaultPermissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        Mono<Boolean> leaveRoleMono = permissionGroupService
                .leaveExplicitlyAssignedSelfRole(adminPermissionGroup.getId())
                .cache();

        Mono<PermissionGroup> permissionGroupMono = permissionGroupService.findById(adminPermissionGroup.getId());

        String api_user_id = userRepository.findByEmail("api_user").block().getId();

        StepVerifier.create(leaveRoleMono.then(permissionGroupMono))
                .assertNext(permissionGroup -> {
                    assertThat(permissionGroup.getAssignedToUserIds().contains(api_user_id))
                            .isFalse();
                })
                .verifyComplete();

        // Assert that the api_user does not have access to the workspace
        Mono<Workspace> workspaceMono = leaveRoleMono
                .then(workspaceService.findById(createdWorkspace.getId(), READ_WORKSPACES))
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "workspace", createdWorkspace.getId())));

        StepVerifier.create(workspaceMono)
                .expectErrorMessage(AppsmithError.NO_RESOURCE_FOUND.getMessage("workspace", createdWorkspace.getId()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalid_leaveRole() {

        // Make api_user instance admin before running the test
        userRepository
                .findByEmail("api_user")
                .flatMap(user -> userUtils.makeSuperUser(List.of(user)))
                .block();

        PermissionGroup testPermissionGroup = new PermissionGroup();
        testPermissionGroup.setName("invalid_leaveRole");
        PermissionGroup createdPermissionGroup =
                permissionGroupService.create(testPermissionGroup).block();

        Mono<Boolean> leaveRoleMono = permissionGroupService
                .leaveExplicitlyAssignedSelfRole(createdPermissionGroup.getId())
                .cache();

        Mono<PermissionGroup> permissionGroupMono = permissionGroupService.findById(createdPermissionGroup.getId());

        StepVerifier.create(leaveRoleMono.then(permissionGroupMono))
                .expectErrorMessage(AppsmithError.USER_NOT_ASSIGNED_TO_ROLE.getMessage(
                        "api_user", createdPermissionGroup.getName()))
                .verify();
    }
}

package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DirtiesContext
class UserWorkspaceServiceMemberVisibilityTest {

    @Autowired
    UserService userService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    WorkspaceRepository workspaceRepository;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    UserWorkspaceService userWorkspaceService;

    Workspace workspace;

    User pendingInvitee;

    @BeforeEach
    void setup() {
        Workspace newWorkspace = new Workspace();
        newWorkspace.setName("Member Visibility Test " + UUID.randomUUID());
        workspace = workspaceService.create(newWorkspace).block();

        // Read the default roles before any assignment changes, because the creator of the workspace may lose access.
        PermissionGroup adminGroup = findDefaultGroup(FieldName.ADMINISTRATOR);
        PermissionGroup developerGroup = findDefaultGroup(FieldName.DEVELOPER);
        PermissionGroup viewerGroup = findDefaultGroup(FieldName.VIEWER);

        User apiUser = userService.findByEmail("api_user").block();
        User developer = userService.findByEmail("developer@solutiontest.com").block();
        User appViewer = userService.findByEmail("usertest@usertest.com").block();

        User invitee = new User();
        invitee.setEmail("invitee-" + UUID.randomUUID() + "@example.com");
        invitee.setIsEnabled(false);
        pendingInvitee = userService.userCreate(invitee, false).block();

        // The creator of the workspace depends on the test method's user, so each default role is assigned explicitly.
        adminGroup.setAssignedToUserIds(Set.of(apiUser.getId()));
        permissionGroupRepository.save(adminGroup).block();

        developerGroup.setAssignedToUserIds(Set.of(developer.getId()));
        permissionGroupRepository.save(developerGroup).block();

        viewerGroup.setAssignedToUserIds(Set.of(appViewer.getId(), pendingInvitee.getId()));
        permissionGroupRepository.save(viewerGroup).block();

        permissionGroupService
                .cleanPermissionGroupCacheForUsers(
                        List.of(apiUser.getId(), developer.getId(), appViewer.getId(), pendingInvitee.getId()))
                .block();
    }

    @AfterEach
    void cleanup() {
        // Archiving needs delete permission on the workspace, which the App Viewer test user does not have.
        workspaceRepository.deleteById(workspace.getId()).block();
        userRepository.deleteById(pendingInvitee.getId()).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void should_returnMemberEmailsAndPendingInvitations_when_callerIsAdministrator() {
        // Given
        String workspaceId = workspace.getId();

        // When
        Mono<List<MemberInfoDTO>> membersMono = userWorkspaceService.getWorkspaceMembers(workspaceId);

        // Then
        StepVerifier.create(membersMono)
                .assertNext(members -> {
                    assertThat(members)
                            .extracting(MemberInfoDTO::getUsername)
                            .contains("api_user", "usertest@usertest.com", pendingInvitee.getEmail());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "developer@solutiontest.com")
    void should_returnMemberEmailsAndPendingInvitations_when_callerIsDeveloper() {
        // Given
        String workspaceId = workspace.getId();

        // When
        Mono<List<MemberInfoDTO>> membersMono = userWorkspaceService.getWorkspaceMembers(workspaceId);

        // Then
        StepVerifier.create(membersMono)
                .assertNext(members -> {
                    assertThat(members)
                            .extracting(MemberInfoDTO::getUsername)
                            .contains("api_user", "usertest@usertest.com", pendingInvitee.getEmail());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "usertest@usertest.com")
    void should_hideMemberEmailsAndPendingInvitations_when_callerIsAppViewer() {
        // Given
        String workspaceId = workspace.getId();

        // When
        Mono<List<MemberInfoDTO>> membersMono = userWorkspaceService.getWorkspaceMembers(workspaceId);

        // Then
        StepVerifier.create(membersMono)
                .assertNext(members -> {
                    assertThat(members).extracting(MemberInfoDTO::getUsername).containsOnlyNulls();
                    assertThat(members).extracting(MemberInfoDTO::getUserId).doesNotContain(pendingInvitee.getId());
                })
                .verifyComplete();
    }

    private PermissionGroup findDefaultGroup(String namePrefix) {
        return permissionGroupService
                .getByDefaultWorkspace(workspace, AclPermission.READ_PERMISSION_GROUP_MEMBERS)
                .filter(permissionGroup -> permissionGroup.getName().startsWith(namePrefix))
                .single()
                .block();
    }
}

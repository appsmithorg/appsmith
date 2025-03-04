package com.appsmith.server.services;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.RecentlyUsedEntityDTO;
import com.appsmith.server.dtos.UpdatePermissionGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.PolicySolution;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.DEVELOPER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

@Slf4j
@SpringBootTest
@DirtiesContext
public class UserWorkspaceServiceTest {

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    SessionUserService sessionUserService;

    @Autowired
    UserService userService;

    @Autowired
    UserUtils userUtils;

    @Autowired
    private UserWorkspaceService userWorkspaceService;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PolicySolution policySolution;

    @Autowired
    private UserDataService userDataService;

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    @Test
    @WithUserDetails(value = "api_user")
    public void leaveWorkspace_WhenUserExistsInWorkspace_RemovesUser() {
        String randomString = UUID.randomUUID().toString();

        Workspace myWorkspace = new Workspace();
        myWorkspace.setName("Test org" + randomString);
        final Workspace testWorkspace = workspaceService.create(myWorkspace).block();

        // Now add api_user as a developer of the workspace
        Set<String> permissionGroupIds = testWorkspace.getDefaultPermissionGroups();

        List<PermissionGroup> permissionGroups = permissionGroupRepository
                .findAllById(permissionGroupIds)
                .collectList()
                .block();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        User api_user = userService.findByEmail("api_user").block();
        User usertest = userService.findByEmail("usertest@usertest.com").block();

        // Make api_user and user_test administrators
        adminPermissionGroup.setAssignedToUserIds(Set.of(usertest.getId(), api_user.getId()));
        permissionGroupRepository.save(adminPermissionGroup).block();

        Application application = new Application();
        application.setName("Test App " + randomString);
        Application savedApplication = applicationPageService
                .createApplication(application, testWorkspace.getId())
                .block();

        // Add application and workspace to the recently used list by accessing the application pages.
        newPageService
                .findApplicationPagesByBranchedApplicationIdAndViewMode(savedApplication.getId(), false, true)
                .block();

        Set<String> uniqueUsersInWorkspaceBefore = userWorkspaceService
                .getWorkspaceMembers(testWorkspace.getId())
                .flatMapMany(workspaceMembers -> Flux.fromIterable(workspaceMembers))
                .map(MemberInfoDTO::getUserId)
                .collect(Collectors.toSet())
                .block();

        Mono<User> leaveWorkspaceMono =
                userWorkspaceService.leaveWorkspace(testWorkspace.getId()).cache();

        Mono<Set<String>> uniqueUsersInWorkspaceAfterMono = leaveWorkspaceMono
                .then(workspaceRepository.findById(testWorkspace.getId()))
                .flatMapMany(afterWorkspace -> {
                    Set<String> defaultPermissionGroups = afterWorkspace.getDefaultPermissionGroups();

                    return permissionGroupRepository.findAllById(defaultPermissionGroups);
                })
                .flatMap(permissionGroup -> {
                    Set<String> userIds = permissionGroup.getAssignedToUserIds();
                    if (userIds == null) {
                        return Mono.empty();
                    }
                    return Flux.fromIterable(userIds);
                })
                .collect(Collectors.toSet());

        StepVerifier.create(uniqueUsersInWorkspaceAfterMono)
                .assertNext(uniqueUsersInWorkspaceAfter -> {
                    assertThat(uniqueUsersInWorkspaceBefore).containsAll(Set.of(api_user.getId(), usertest.getId()));
                    assertThat(uniqueUsersInWorkspaceAfter).containsAll(Set.of(usertest.getId()));
                })
                .verifyComplete();

        StepVerifier.create(userDataService.getForCurrentUser())
                .assertNext(userData -> {
                    List<RecentlyUsedEntityDTO> recentlyUsedEntityIds = userData.getRecentlyUsedEntityIds();
                    assertThat(recentlyUsedEntityIds).isNotNull();
                    Set<String> workspaceIds = recentlyUsedEntityIds.stream()
                            .map(RecentlyUsedEntityDTO::getWorkspaceId)
                            .collect(Collectors.toSet());
                    assertThat(workspaceIds).doesNotContain(testWorkspace.getId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void leaveWorkspace_WhenUserDoesNotExistInWorkspace_ThrowsException() {
        // Leave workspace once removes the api_user from the default workspace. The second time would reproduce the
        // test
        // case scenario.
        Workspace workspace = new Workspace();
        workspace.setName("Test org");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        // Invite another before we try to remove the existing administrator user.
        List<PermissionGroup> permissionGroups = permissionGroupRepository
                .findAllById(createdWorkspace.getDefaultPermissionGroups())
                .collectList()
                .block();

        PermissionGroup administratorPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setPermissionGroupId(administratorPermissionGroup.getId());
        inviteUsersDTO.setUsernames(List.of("usertest@usertest.com"));
        userAndAccessManagementService.inviteUsers(inviteUsersDTO, "test").block();

        Mono<User> userMono = userWorkspaceService
                .leaveWorkspace(createdWorkspace.getId())
                .then(userWorkspaceService.leaveWorkspace(createdWorkspace.getId()));

        StepVerifier.create(userMono)
                .expectErrorMessage(AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.WORKSPACE, workspace.getId()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateUserGroupForMember_WhenAdminUserGroupRemovedWithNoOtherAdmin_ThrowsExceptions() {

        Workspace workspace = new Workspace();
        workspace.setName("Test org");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        // Now make api_user an administrator and not a developer
        Set<String> permissionGroupIds = createdWorkspace.getDefaultPermissionGroups();

        List<PermissionGroup> permissionGroups = permissionGroupRepository
                .findAllById(permissionGroupIds)
                .collectList()
                .block();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        User api_user = userService.findByEmail("api_user").block();

        // Make api_user an administrator
        // Make api_user not a developer
        adminPermissionGroup.setAssignedToUserIds(Set.of(api_user.getId()));
        permissionGroupRepository.save(adminPermissionGroup).block();
        developerPermissionGroup.setAssignedToUserIds(new HashSet<>());
        permissionGroupRepository.save(developerPermissionGroup).block();

        UpdatePermissionGroupDTO updatePermissionGroupDTO = new UpdatePermissionGroupDTO();
        updatePermissionGroupDTO.setUsername("api_user");
        updatePermissionGroupDTO.setNewPermissionGroupId(developerPermissionGroup.getId());
        String origin = "http://random-origin.test";

        Mono<MemberInfoDTO> updateUserRoleMono = userWorkspaceService.updatePermissionGroupForMember(
                createdWorkspace.getId(), updatePermissionGroupDTO, origin);

        StepVerifier.create(updateUserRoleMono)
                .expectErrorMessage(AppsmithError.REMOVE_LAST_WORKSPACE_ADMIN_ERROR.getMessage());
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateUserGroupForMember_WhenAdminUserGroupRemovedButOtherAdminExists_MemberRemoved() {
        Workspace workspace = new Workspace();
        workspace.setName("Test org");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        // Now make api_user an administrator along with usertest. Remove api_user as a developer
        Set<String> permissionGroupIds = createdWorkspace.getDefaultPermissionGroups();

        List<PermissionGroup> permissionGroups = permissionGroupRepository
                .findAllById(permissionGroupIds)
                .collectList()
                .block();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        User api_user = userService.findByEmail("api_user").block();
        User usertest = userService.findByEmail("usertest@usertest.com").block();

        // Make api_user an administrator
        // Make api_user not a developer
        adminPermissionGroup.setAssignedToUserIds(Set.of(api_user.getId(), usertest.getId()));
        permissionGroupRepository.save(adminPermissionGroup).block();
        developerPermissionGroup.setAssignedToUserIds(new HashSet<>());
        permissionGroupRepository.save(developerPermissionGroup).block();

        // Make usertest a developer to simulate the test case scenario
        UpdatePermissionGroupDTO updatePermissionGroupDTO = new UpdatePermissionGroupDTO();
        updatePermissionGroupDTO.setUsername("usertest@usertest.com");
        updatePermissionGroupDTO.setNewPermissionGroupId(developerPermissionGroup.getId());
        String origin = "http://random-origin.test";

        Mono<MemberInfoDTO> updateUserRoleMono = userWorkspaceService.updatePermissionGroupForMember(
                createdWorkspace.getId(), updatePermissionGroupDTO, origin);

        StepVerifier.create(updateUserRoleMono)
                .assertNext(userRole1 -> {
                    assertEquals(usertest.getUsername(), userRole1.getUsername());
                    assertEquals(userRole1.getRoles().size(), 1);
                    assertEquals(
                            developerPermissionGroup.getId(),
                            userRole1.getRoles().get(0).getId());
                    assertEquals(
                            developerPermissionGroup.getName(),
                            userRole1.getRoles().get(0).getName());
                    assertEquals(
                            Workspace.class.getSimpleName(),
                            userRole1.getRoles().get(0).getEntityType());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void invalid_removeAnotherDeveloperAsDeveloperInWorkspace() {
        // Ensure neither of the users are super users
        User api_user = userRepository.findByEmail("api_user").block();
        User test_user = userRepository.findByEmail("usertest@usertest.com").block();
        userUtils.removeInstanceAdmin(List.of(api_user, test_user)).block();
        Workspace workspace = new Workspace();
        workspace.setName("Test org");
        Workspace createdWorkspace = workspaceService.create(workspace).block();
        List<PermissionGroup> permissionGroups = permissionGroupRepository
                .findAllById(createdWorkspace.getDefaultPermissionGroups())
                .collectList()
                .block();

        PermissionGroup administratorPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();

        administratorPermissionGroup.getAssignedToUserIds().remove(api_user.getId());
        developerPermissionGroup.setAssignedToUserIds(Set.of(api_user.getId(), test_user.getId()));
        permissionGroupRepository.save(administratorPermissionGroup).block();
        permissionGroupRepository.save(developerPermissionGroup).block();
        permissionGroupService
                .cleanPermissionGroupCacheForUsers(List.of(api_user.getId(), test_user.getId()))
                .block();

        UpdatePermissionGroupDTO updatePermissionGroupDTO = new UpdatePermissionGroupDTO();
        updatePermissionGroupDTO.setNewPermissionGroupId(null);
        updatePermissionGroupDTO.setUsername(test_user.getUsername());

        Mono<MemberInfoDTO> removeDeveloperMono = userWorkspaceService.updatePermissionGroupForMember(
                createdWorkspace.getId(), updatePermissionGroupDTO, "origin");

        StepVerifier.create(removeDeveloperMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable
                                .getMessage()
                                .equals(AppsmithError.ACTION_IS_NOT_AUTHORIZED.getMessage(
                                        "Change permissionGroup of a member")))
                .verify();

        // Cleanup the special state created for this test case
        administratorPermissionGroup.setAssignedToUserIds(Set.of(api_user.getId()));
        permissionGroupRepository.save(administratorPermissionGroup).block();
        permissionGroupService
                .cleanPermissionGroupCacheForUsers(List.of(api_user.getId(), test_user.getId()))
                .block();
    }
}

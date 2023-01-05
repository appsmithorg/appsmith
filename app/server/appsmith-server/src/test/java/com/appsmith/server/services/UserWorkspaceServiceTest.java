package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.UpdatePermissionGroupDTO;
import com.appsmith.server.dtos.WorkspaceMemberInfoDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private UserWorkspaceService userWorkspaceService;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PolicyUtils policyUtils;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private PolicyGenerator policyGenerator;

    @Autowired
    private UserDataService userDataService;

    @Autowired
    private ApplicationPageService applicationPageService;

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

    private Workspace workspace;
    private User user;

    @BeforeEach
    @WithUserDetails(value = "api_user")
    public void setup() {
        Workspace workspace = new Workspace();
        workspace.setName("Test org");
        this.workspace = workspaceService.create(workspace).block();

        // Now add api_user as a developer of the workspace
        Set<String> permissionGroupIds = workspace.getDefaultPermissionGroups();

        List<PermissionGroup> permissionGroups = permissionGroupRepository.findAllById(permissionGroupIds).collectList().block();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst().get();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst().get();

        User api_user = userService.findByEmail("api_user").block();
        User usertest = userService.findByEmail("usertest@usertest.com").block();

        // Make api_user a developer and not an administrator
        // Make user_test an administrator
        adminPermissionGroup.setAssignedToUserIds(Set.of(usertest.getId()));
        permissionGroupRepository.save(adminPermissionGroup).block();
        developerPermissionGroup.setAssignedToUserIds(Set.of(api_user.getId()));
        permissionGroupRepository.save(developerPermissionGroup).block();

    }

    private UserRole createUserRole(String username, String userId, AppsmithRole role) {
        UserRole userRole = new UserRole();
        userRole.setUsername(username);
        userRole.setUserId(userId);
        userRole.setName(username);
        if (role != null) {
            userRole.setRoleName(role.getName());
            userRole.setRole(role);
        }
        return userRole;
    }

    private void addRolesToWorkspace(List<UserRole> roles) {
        this.workspace.setUserRoles(roles);
        for (UserRole userRole : roles) {
            Set<AclPermission> rolePermissions = userRole.getRole().getPermissions();
            Map<String, Policy> workspacePolicyMap = policyUtils.generatePolicyFromPermission(
                    rolePermissions, userRole.getUsername()
            );
            this.workspace = policyUtils.addPoliciesToExistingObject(workspacePolicyMap, workspace);
        }
        this.workspace = workspaceRepository.save(workspace).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void leaveWorkspace_WhenUserExistsInWorkspace_RemovesUser() {

        User currentUser = userRepository.findByEmail("api_user").block();
        User usertest = userService.findByEmail("usertest@usertest.com").block();

        Application application = new Application();
        application.setName("leaveWorkspace_WhenUserExistsInWorkspace_RemovesUser app");
        Application savedApplication = applicationPageService.createApplication(application, workspace.getId()).block();

        // Add application and workspace to the recently used list by accessing the application pages.
        newPageService.findApplicationPagesByApplicationIdViewModeAndBranch(savedApplication.getId(), null, false, true).block();

        Set<String> uniqueUsersInWorkspaceBefore = userWorkspaceService.getWorkspaceMembers(workspace.getId())
                .flatMapMany(workspaceMembers -> Flux.fromIterable(workspaceMembers))
                .map(WorkspaceMemberInfoDTO::getUserId)
                .collect(Collectors.toSet())
                .block();

        Mono<User> leaveWorkspaceMono = userWorkspaceService.leaveWorkspace(workspace.getId())
                .cache();

        Mono<Set<String>> uniqueUsersInWorkspaceAfterMono = leaveWorkspaceMono
                .then(workspaceRepository.findById(workspace.getId()))
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
                    assertThat(uniqueUsersInWorkspaceBefore).containsAll(Set.of(currentUser.getId(), usertest.getId()));
                    assertThat(uniqueUsersInWorkspaceAfter).containsAll(Set.of(usertest.getId()));
                })
                .verifyComplete();

        // Assert userdata is correctly updated.
        StepVerifier.create(userDataService.getForUser(currentUser)).assertNext(userData -> {
            assertThat(CollectionUtils.isEmpty(userData.getRecentlyUsedWorkspaceIds())).isTrue();
            assertThat(CollectionUtils.isEmpty(userData.getRecentlyUsedAppIds())).isTrue();
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void leaveWorkspace_WhenUserDoesNotExistInWorkspace_ThrowsException() {
        // Leave workspace once removes the api_user from the default workspace. The second time would reproduce the test
        // case scenario.
        Mono<User> userMono = userWorkspaceService.leaveWorkspace(workspace.getId())
                .then(userWorkspaceService.leaveWorkspace(workspace.getId()));

        StepVerifier.create(userMono)
                .expectErrorMessage(
                        AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.WORKSPACE, workspace.getId())
                )
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateUserGroupForMember_WhenAdminUserGroupRemovedWithNoOtherAdmin_ThrowsExceptions() {

        // Now make api_user an administrator and not a developer
        Set<String> permissionGroupIds = workspace.getDefaultPermissionGroups();

        List<PermissionGroup> permissionGroups = permissionGroupRepository.findAllById(permissionGroupIds).collectList().block();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst().get();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst().get();

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

        Mono<WorkspaceMemberInfoDTO> updateUserRoleMono = userWorkspaceService.updatePermissionGroupForMember(workspace.getId(), updatePermissionGroupDTO, origin);

        StepVerifier.create(updateUserRoleMono).expectErrorMessage(
                AppsmithError.REMOVE_LAST_WORKSPACE_ADMIN_ERROR.getMessage()
        ).verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateUserGroupForMember_WhenAdminUserGroupRemovedButOtherAdminExists_MemberRemoved() {

        // Now make api_user an administrator along with usertest. Remove api_user as a developer
        Set<String> permissionGroupIds = workspace.getDefaultPermissionGroups();

        List<PermissionGroup> permissionGroups = permissionGroupRepository.findAllById(permissionGroupIds).collectList().block();

        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst().get();

        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst().get();

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

        Mono<WorkspaceMemberInfoDTO> updateUserRoleMono = userWorkspaceService.updatePermissionGroupForMember(workspace.getId(), updatePermissionGroupDTO, origin);

        StepVerifier.create(updateUserRoleMono)
                .assertNext(userRole1 -> {
                            assertEquals(usertest.getUsername(), userRole1.getUsername());
                            assertEquals(developerPermissionGroup.getId(), userRole1.getPermissionGroupId());
                            assertEquals(developerPermissionGroup.getName(), userRole1.getPermissionGroupName());
                        }
                )
                .verifyComplete();
    }

    @AfterEach
    public void clear() {
        User currentUser = userRepository.findByEmail("api_user").block();
        currentUser.getWorkspaceIds().remove(workspace.getId());
        userRepository.save(currentUser);
        workspaceRepository.deleteById(workspace.getId()).block();
    }

}
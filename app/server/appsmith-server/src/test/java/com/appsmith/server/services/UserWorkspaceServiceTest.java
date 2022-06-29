package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.UpdateUserGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.CommentThreadRepository;
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
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AppsmithRole.ORGANIZATION_ADMIN;
import static com.appsmith.server.acl.AppsmithRole.ORGANIZATION_DEVELOPER;
import static org.assertj.core.api.Assertions.assertThat;

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
    private CommentService commentService;

    @Autowired
    private CommentThreadRepository commentThreadRepository;

    @Autowired
    private PolicyGenerator policyGenerator;

    @Autowired
    private UserDataService userDataService;

    private Workspace workspace;
    private User user;

    @BeforeEach
    public void setup() {
        Workspace workspace = new Workspace();
        workspace.setName("Test org");
        workspace.setUserRoles(new ArrayList<>());
        this.workspace = workspaceRepository.save(workspace).block();
    }

    private UserRole createUserRole(String username, String userId, AppsmithRole role) {
        UserRole userRole = new UserRole();
        userRole.setUsername(username);
        userRole.setUserId(userId);
        userRole.setName(username);
        if(role != null) {
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

    @AfterEach
    public void clear() {
        User currentUser = userRepository.findByEmail("api_user").block();
        currentUser.getWorkspaceIds().remove(workspace.getId());
        userRepository.save(currentUser);
        workspaceRepository.deleteById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void leaveWorkspace_WhenUserExistsInWorkspace_RemovesUser() {
        User currentUser = userRepository.findByEmail("api_user").block();
        Set<String> workspaceIdsBefore = Set.copyOf(currentUser.getWorkspaceIds());

        List<UserRole> userRolesBeforeAddUser = List.copyOf(workspace.getUserRoles());

        currentUser.getWorkspaceIds().add(workspace.getId());
        userRepository.save(currentUser).block();

        // add workspace id and recent apps to user data
        Application application = new Application();
        application.setWorkspaceId(workspace.getId());

        Mono<UserData> saveUserDataMono = applicationRepository.save(application).flatMap(savedApplication -> {
            // add app id and workspace id to recent list
            UserData userData = new UserData();
            userData.setRecentlyUsedAppIds(List.of(savedApplication.getId()));
            userData.setRecentlyUsedWorkspaceIds(List.of(workspace.getId()));
            return userDataService.updateForUser(currentUser, userData);
        });

//        Flux<UserGroup> userGroupFlux = userGroupService.getDefaultUserGroups(application.getWorkspaceId());
//        Mono<UserGroup> adminGroupMono = userGroupFlux.filter(userGroup -> userGroup.getName().startsWith(FieldName.DEVELOPER)).single();
//        Mono<?> addUserAsDeveloperToWorkspaceMono = adminGroupMono
//                .flatMap(adminUserGroup -> userGroupService.addUser(adminUserGroup, currentUser));
//
//        Mono<User> userMono = addUserAsDeveloperToWorkspaceMono
//                .then(saveUserDataMono)
//                .then(userWorkspaceService.leaveWorkspace(this.workspace.getId()));
//
//        StepVerifier.create(userMono).assertNext(user -> {
//            assertEquals("api_user", user.getEmail());
//            assertEquals(workspaceIdsBefore, user.getWorkspaceIds());
//        }).verifyComplete();
//
//        StepVerifier.create(workspaceRepository.findById(this.workspace.getId())).assertNext(workspace1 -> {
//            assertEquals(userRolesBeforeAddUser.size(), workspace1.getUserRoles().size());
//        }).verifyComplete();
//
//        StepVerifier.create(userRepository.findByEmail("api_user")).assertNext(user1 -> {
//            assertFalse(
//                    "user's workspaceId list should not have left workspace id",
//                    user1.getWorkspaceIds().contains(this.workspace.getId())
//            );
//        }).verifyComplete();
//
//        StepVerifier.create(userDataService.getForUser(currentUser)).assertNext(userData -> {
//            assertThat(CollectionUtils.isEmpty(userData.getRecentlyUsedWorkspaceIds())).isTrue();
//            assertThat(CollectionUtils.isEmpty(userData.getRecentlyUsedAppIds())).isTrue();
//        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void leaveWorkspace_WhenUserDoesNotExistInWorkspace_ThrowsException() {
        Mono<User> userMono = userWorkspaceService.leaveWorkspace(this.workspace.getId());
        StepVerifier.create(userMono).expectErrorMessage(
                AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.USER + " api_user in the organization", workspace.getName())
        ).verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateUserGroupForMember_WhenAdminUserGroupRemovedWithNoOtherAdmin_ThrowsExceptions() {
        // add the current user as an admin to the workspace first
        User currentUser = userRepository.findByEmail("api_user").block();
//        Flux<UserGroup> userGroupFlux = userGroupService.getDefaultUserGroups(workspace.getId()).cache();
//        UserGroup adminGroupMono = userGroupFlux.filter(userGroup -> userGroup.getName().startsWith(FieldName.ADMINISTRATOR)).single().block();
//
//        userGroupService.addUser(adminGroupMono, currentUser).block();
//
//        Mono<UserAndGroupDTO> userRoleMono = userWorkspaceService.updateUserGroupForMember(workspace.getId(), UpdateUserGroupDTO.builder().username(currentUser.getUsername()).build(), null);
//        StepVerifier.create(userRoleMono).expectErrorMessage(
//                AppsmithError.REMOVE_LAST_WORKSPACE_ADMIN_ERROR.getMessage()
//        ).verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateUserGroupForMember_WhenAdminUserGroupRemovedButOtherAdminExists_MemberRemoved() {
        // add another admin role to the workspace
        UserRole adminRole = createUserRole("dummy_username2", "dummy_user_id2", ORGANIZATION_ADMIN);
        this.workspace.getUserRoles().add(adminRole);
        this.workspace = workspaceRepository.save(this.workspace).block();

        // add the current user as an admin to the workspace
        User currentUser = userRepository.findByEmail("api_user").block();
//        Flux<UserGroup> userGroupFlux = userGroupService.getDefaultUserGroups(workspace.getId()).cache();
//        UserGroup adminGroupMono = userGroupFlux.filter(userGroup -> userGroup.getName().startsWith(FieldName.ADMINISTRATOR)).single().block();
//        userGroupService.addUser(adminGroupMono, currentUser).block();
//
//        // try to remove the user from workspace
//        Mono<UserAndGroupDTO> userRoleMono = userWorkspaceService.updateUserGroupForMember(workspace.getId(), UpdateUserGroupDTO.builder().username(currentUser.getUsername()).build(), null);
//        StepVerifier.create(userRoleMono).assertNext(
//                userRole1 -> {
//                    assertEquals(currentUser.getUsername(), userRole1.getUsername());
//                }
//        ).verifyComplete();
    }

    private Application createTestApplicationForCommentThreadTests() {
        // add a two roles to the workspace
        User devUser = new User();
        devUser.setEmail("test_developer");
        userRepository.findByEmail("test_developer")
                .switchIfEmpty(userRepository.save(devUser))
                .block();

        UserRole adminRole = createUserRole("api_user", "api_user", ORGANIZATION_ADMIN);
        UserRole devRole = createUserRole("test_developer", "test_developer", ORGANIZATION_DEVELOPER);

        List<UserRole> userRoles = new ArrayList<>(2);
        userRoles.add(adminRole);
        userRoles.add(devRole);

        addRolesToWorkspace(userRoles);

        // create a test application
        Application application = new Application();
        application.setWorkspaceId(this.workspace.getId());
        application.setName("Test application");
        Set<Policy> documentPolicies = policyGenerator.getAllChildPolicies(
                workspace.getPolicies(), Workspace.class, Application.class
        );
        application.setPolicies(documentPolicies);
        return application;
    }

    @Test
    @WithUserDetails("api_user")
    public void updateRoleForMember_WhenCommentThreadExists_ThreadPoliciesUnchanged() {
        // create a test application
//        Mono<CommentThread> commentThreadMono = applicationRepository.save(createTestApplicationForCommentThreadTests())
//                .flatMap(savedApplication -> {
//                    CommentThread commentThread = new CommentThread();
//                    commentThread.setApplicationId(savedApplication.getId());
//                    commentThread.setPolicies(policyGenerator.getAllChildPolicies(
//                            savedApplication.getPolicies(), Application.class, CommentThread.class
//                    ));
//                    Flux<UserGroup> userGroupFlux = userGroupService.getDefaultUserGroups(workspace.getId()).cache();
//                    return commentThreadRepository.save(commentThread).zipWith(userGroupFlux.filter(userGroup -> userGroup.getName().startsWith(FieldName.VIEWER)).single());
//                }).flatMap(tuple -> {
//                    CommentThread commentThread = tuple.getT1();
//                    UserGroup adminGroup = tuple.getT2();
//                    // update an user's role
//                    //UserRole updatedRole = createUserRole("test_developer", "test_developer", ORGANIZATION_VIEWER);
//                    return userWorkspaceService.updateUserGroupForMember(
//                            workspace.getId(), UpdateUserGroupDTO.builder().username("test_developer").newGroupId(adminGroup.getId()).build(), null
//                    ).thenReturn(commentThread);
//                }).flatMap(commentThread ->
//                    commentThreadRepository.findById(commentThread.getId())
//                );
//
//        StepVerifier.create(commentThreadMono).assertNext(commentThread -> {
//            Set<Policy> policies = commentThread.getPolicies();
//            assertThat(policyUtils.isPermissionPresentForUser(
//                    policies, AclPermission.READ_THREADS.getValue(), "test_developer"
//            )).isTrue();
//            assertThat(policyUtils.isPermissionPresentForUser(
//                    policies, AclPermission.READ_THREADS.getValue(), "api_user"
//            )).isTrue();
//        }).verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void updateRoleForMember_WhenCommentThreadExistsAndUserRemoved_UserRemovedFromThreadPolicies() {
        Mono<CommentThread> commentThreadMono = applicationRepository.save(createTestApplicationForCommentThreadTests())
                .flatMap(savedApplication -> {
                    CommentThread commentThread = new CommentThread();
                    commentThread.setApplicationId(savedApplication.getId());
                    commentThread.setPolicies(policyGenerator.getAllChildPolicies(
                            savedApplication.getPolicies(), Application.class, CommentThread.class
                    ));
                    return commentThreadRepository.save(commentThread);
                }).flatMap(commentThread -> {
                    // remove the test_developer user from the workspace
                    return userWorkspaceService.updateUserGroupForMember(workspace.getId(), UpdateUserGroupDTO.builder().username("test_developer").build(), null)
                            .thenReturn(commentThread);
                }).flatMap(commentThread ->
                        commentThreadRepository.findById(commentThread.getId())
                );

        StepVerifier.create(commentThreadMono).assertNext(commentThread -> {
            Set<Policy> policies = commentThread.getPolicies();
            assertThat(policyUtils.isPermissionPresentForUser(
                    policies, AclPermission.READ_THREADS.getValue(), "test_developer"
            )).isFalse();
            assertThat(policyUtils.isPermissionPresentForUser(
                    policies, AclPermission.READ_THREADS.getValue(), "api_user"
            )).isTrue();
        }).verifyComplete();
    }
}
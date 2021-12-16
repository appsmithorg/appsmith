package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.CommentThreadRepository;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AppsmithRole.ORGANIZATION_ADMIN;
import static com.appsmith.server.acl.AppsmithRole.ORGANIZATION_DEVELOPER;
import static com.appsmith.server.acl.AppsmithRole.ORGANIZATION_VIEWER;
import static org.junit.Assert.assertFalse;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
class UserOrganizationServiceTest {

    @Autowired
    private UserOrganizationService userOrganizationService;

    @Autowired
    private OrganizationRepository organizationRepository;

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

    private Organization organization;
    private User user;

    @BeforeEach
    public void setup() {
        Organization org = new Organization();
        org.setName("Test org");
        org.setUserRoles(new ArrayList<>());
        this.organization = organizationRepository.save(org).block();
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

    private void addRolesToOrg(List<UserRole> roles) {
        this.organization.setUserRoles(roles);
        for (UserRole userRole : roles) {
            Set<AclPermission> rolePermissions = userRole.getRole().getPermissions();
            Map<String, Policy> orgPolicyMap = policyUtils.generatePolicyFromPermission(
                    rolePermissions, userRole.getUsername()
            );
            this.organization = policyUtils.addPoliciesToExistingObject(orgPolicyMap, organization);
        }
        this.organization = organizationRepository.save(organization).block();
    }

    @AfterEach
    public void clear() {
        User currentUser = userRepository.findByEmail("api_user").block();
        currentUser.getOrganizationIds().remove(organization.getId());
        userRepository.save(currentUser);
        organizationRepository.deleteById(organization.getId()).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void leaveOrganization_WhenUserExistsInOrg_RemovesUser() {
        User currentUser = userRepository.findByEmail("api_user").block();
        Set<String> organizationIdsBefore = Set.copyOf(currentUser.getOrganizationIds());

        List<UserRole> userRolesBeforeAddUser = List.copyOf(organization.getUserRoles());

        currentUser.getOrganizationIds().add(organization.getId());
        userRepository.save(currentUser).block();

        // add org id and recent apps to user data
        Application application = new Application();
        application.setOrganizationId(organization.getId());

        Mono<UserData> saveUserDataMono = applicationRepository.save(application).flatMap(savedApplication -> {
            // add app id and org id to recent list
            UserData userData = new UserData();
            userData.setRecentlyUsedAppIds(List.of(savedApplication.getId()));
            userData.setRecentlyUsedOrgIds(List.of(organization.getId()));
            return userDataService.updateForUser(currentUser, userData);
        });

        UserRole userRole = createUserRole(currentUser.getUsername(), currentUser.getId(), ORGANIZATION_DEVELOPER);

        Mono<User> userMono = userOrganizationService
                .addUserToOrganizationGivenUserObject(this.organization, currentUser, userRole)
                .then(saveUserDataMono)
                .then(userOrganizationService.leaveOrganization(this.organization.getId()));

        StepVerifier.create(userMono).assertNext(user -> {
            assertEquals("api_user", user.getEmail());
            assertEquals(organizationIdsBefore, user.getOrganizationIds());
        }).verifyComplete();

        StepVerifier.create(organizationRepository.findById(this.organization.getId())).assertNext(organization1 -> {
            assertEquals(userRolesBeforeAddUser.size(), organization1.getUserRoles().size());
        }).verifyComplete();

        StepVerifier.create(userRepository.findByEmail("api_user")).assertNext(user1 -> {
            assertFalse(
                    "user's orgId list should not have left org id",
                    user1.getOrganizationIds().contains(this.organization.getId())
            );
        }).verifyComplete();

        StepVerifier.create(userDataService.getForUser(currentUser)).assertNext(userData -> {
            assertThat(CollectionUtils.isEmpty(userData.getRecentlyUsedOrgIds())).isTrue();
            assertThat(CollectionUtils.isEmpty(userData.getRecentlyUsedAppIds())).isTrue();
        }).verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    void leaveOrganization_WhenUserDoesNotExistInOrg_ThrowsException() {
        Mono<User> userMono = userOrganizationService.leaveOrganization(this.organization.getId());
        StepVerifier.create(userMono).expectErrorMessage(
                AppsmithError.NO_RESOURCE_FOUND.getMessage(FieldName.USER + " api_user in the organization", organization.getName())
        ).verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateRoleForMember_WhenAdminRoleRemovedWithNoOtherAdmin_ThrowsExceptions() {
        // add the current user as an admin to the organization first
        User currentUser = userRepository.findByEmail("api_user").block();
        UserRole userRole = createUserRole(currentUser.getUsername(), currentUser.getId(), ORGANIZATION_ADMIN);

        userOrganizationService.addUserToOrganizationGivenUserObject(organization, currentUser, userRole).block();

        // try to remove the user from org
        UserRole updatedRole = new UserRole();
        updatedRole.setUsername(currentUser.getUsername());

        Mono<UserRole> userRoleMono = userOrganizationService.updateRoleForMember(organization.getId(), updatedRole, null);
        StepVerifier.create(userRoleMono).expectErrorMessage(
                AppsmithError.REMOVE_LAST_ORG_ADMIN_ERROR.getMessage()
        ).verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateRoleForMember_WhenAdminRoleRemovedButOtherAdminExists_MemberRemoved() {
        // add another admin role to the organization
        UserRole adminRole = createUserRole("dummy_username2", "dummy_user_id2", ORGANIZATION_ADMIN);
        this.organization.getUserRoles().add(adminRole);
        this.organization = organizationRepository.save(this.organization).block();

        // add the current user as an admin to the organization
        User currentUser = userRepository.findByEmail("api_user").block();
        UserRole userRole = createUserRole(currentUser.getUsername(), currentUser.getId(), ORGANIZATION_ADMIN);
        userOrganizationService.addUserToOrganizationGivenUserObject(organization, currentUser, userRole).block();

        // try to remove the user from org
        UserRole updatedRole = new UserRole();
        updatedRole.setUsername(currentUser.getUsername());

        Mono<UserRole> userRoleMono = userOrganizationService.updateRoleForMember(organization.getId(), updatedRole, null);
        StepVerifier.create(userRoleMono).assertNext(
                userRole1 -> {
                    assertEquals(currentUser.getUsername(), userRole1.getUsername());
                }
        ).verifyComplete();
    }

    private Application createTestApplicationForCommentThreadTests() {
        // add a two roles to the organization
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

        addRolesToOrg(userRoles);

        // create a test application
        Application application = new Application();
        application.setOrganizationId(this.organization.getId());
        application.setName("Test application");
        Set<Policy> documentPolicies = policyGenerator.getAllChildPolicies(
                organization.getPolicies(), Organization.class, Application.class
        );
        application.setPolicies(documentPolicies);
        return application;
    }

    @Test
    @WithUserDetails("api_user")
    public void updateRoleForMember_WhenCommentThreadExists_ThreadPoliciesUnchanged() {
        // create a test application
        Mono<CommentThread> commentThreadMono = applicationRepository.save(createTestApplicationForCommentThreadTests())
                .flatMap(savedApplication -> {
                    CommentThread commentThread = new CommentThread();
                    commentThread.setApplicationId(savedApplication.getId());
                    commentThread.setPolicies(policyGenerator.getAllChildPolicies(
                            savedApplication.getPolicies(), Application.class, CommentThread.class
                    ));
                    return commentThreadRepository.save(commentThread);
                }).flatMap(commentThread -> {
                    // update an user's role
                    UserRole updatedRole = createUserRole("test_developer", "test_developer", ORGANIZATION_VIEWER);
                    return userOrganizationService.updateRoleForMember(
                            organization.getId(), updatedRole, null
                    ).thenReturn(commentThread);
                }).flatMap(commentThread ->
                    commentThreadRepository.findById(commentThread.getId())
                );

        StepVerifier.create(commentThreadMono).assertNext(commentThread -> {
            Set<Policy> policies = commentThread.getPolicies();
            assertThat(policyUtils.isPermissionPresentForUser(
                    policies, AclPermission.READ_THREAD.getValue(), "test_developer"
            )).isTrue();
            assertThat(policyUtils.isPermissionPresentForUser(
                    policies, AclPermission.READ_THREAD.getValue(), "api_user"
            )).isTrue();
        }).verifyComplete();
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
                    // remove the test_developer user from the organization
                    UserRole updatedRole = createUserRole("test_developer", "test_developer", null);
                    return userOrganizationService.updateRoleForMember(organization.getId(), updatedRole, null)
                            .thenReturn(commentThread);
                }).flatMap(commentThread ->
                        commentThreadRepository.findById(commentThread.getId())
                );

        StepVerifier.create(commentThreadMono).assertNext(commentThread -> {
            Set<Policy> policies = commentThread.getPolicies();
            assertThat(policyUtils.isPermissionPresentForUser(
                    policies, AclPermission.READ_THREAD.getValue(), "test_developer"
            )).isFalse();
            assertThat(policyUtils.isPermissionPresentForUser(
                    policies, AclPermission.READ_THREAD.getValue(), "api_user"
            )).isTrue();
        }).verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    public void bulkAddUsersToOrganization_WhenNewUserAdded_ThreadPolicyUpdated() {
        // create a new user
        User user = new User();
        user.setEmail("new_test_user");
        Mono<User> saveUserMono = userRepository.save(user);

        Mono<CommentThread> commentThreadMono = applicationRepository.save(createTestApplicationForCommentThreadTests())
                .flatMap(savedApplication -> {
                    CommentThread commentThread = new CommentThread();
                    commentThread.setApplicationId(savedApplication.getId());
                    commentThread.setPolicies(policyGenerator.getAllChildPolicies(
                            savedApplication.getPolicies(), Application.class, CommentThread.class
                    ));
                    return commentThreadRepository.save(commentThread);
                }).flatMap(commentThread -> {
                    // add the new user to the organization
                    List<User> users = new ArrayList<>(1);
                    users.add(user);
                    return userOrganizationService
                            .bulkAddUsersToOrganization(organization, users, ORGANIZATION_DEVELOPER.getName())
                            .thenReturn(commentThread);
                }).flatMap(commentThread ->
                        commentThreadRepository.findById(commentThread.getId())
                );

        StepVerifier.create(saveUserMono.then(commentThreadMono)).assertNext(commentThread -> {
            Set<Policy> policies = commentThread.getPolicies();
            assertThat(policyUtils.isPermissionPresentForUser(
                    policies, AclPermission.READ_THREAD.getValue(), "test_developer"
            )).isTrue();
            assertThat(policyUtils.isPermissionPresentForUser(
                    policies, AclPermission.READ_THREAD.getValue(), "new_test_user"
            )).isTrue();
            assertThat(policyUtils.isPermissionPresentForUser(
                    policies, AclPermission.READ_THREAD.getValue(), "api_user"
            )).isTrue();
        }).verifyComplete();
    }
}
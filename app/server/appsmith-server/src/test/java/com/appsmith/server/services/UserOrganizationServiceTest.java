package com.appsmith.server.services;

import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.exceptions.AppsmithError;
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
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
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

    private Organization organization;
    private User user;

    @BeforeEach
    public void setup() {
        Organization org = new Organization();
        org.setName("Test org");

        UserRole userRole = new UserRole();
        userRole.setUsername("dummy_username");
        userRole.setUserId("dummy_user_id");
        userRole.setName("dummy_username");
        userRole.setRoleName(AppsmithRole.ORGANIZATION_DEVELOPER.getName());
        userRole.setRole(AppsmithRole.ORGANIZATION_DEVELOPER);

        List<UserRole> userRoles = new ArrayList<>();
        userRoles.add(userRole);
        org.setUserRoles(userRoles);

        this.organization = organizationRepository.save(org).block();
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

        UserRole userRole = new UserRole();
        userRole.setUsername(currentUser.getUsername());
        userRole.setUserId(currentUser.getId());
        userRole.setName(currentUser.getName());
        userRole.setRoleName(AppsmithRole.ORGANIZATION_DEVELOPER.getName());

        Organization updatedOrganization = userOrganizationService.addUserToOrganizationGivenUserObject(
                this.organization, currentUser, userRole
        ).block();

        Mono<User> userMono = userOrganizationService.leaveOrganization(this.organization.getId());
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
        UserRole userRole = new UserRole();
        userRole.setUsername(currentUser.getUsername());
        userRole.setRole(AppsmithRole.ORGANIZATION_DEVELOPER);
        userRole.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());

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
        UserRole adminRole = new UserRole();
        adminRole.setUsername("dummy_username2");
        adminRole.setUserId("dummy_user_id2");
        adminRole.setName("dummy_username2");
        adminRole.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());
        adminRole.setRole(AppsmithRole.ORGANIZATION_ADMIN);
        this.organization.getUserRoles().add(adminRole);

        this.organization = organizationRepository.save(this.organization).block();

        // add the current user as an admin to the organization
        User currentUser = userRepository.findByEmail("api_user").block();
        UserRole userRole = new UserRole();
        userRole.setUsername(currentUser.getUsername());
        userRole.setRole(AppsmithRole.ORGANIZATION_ADMIN);
        userRole.setRoleName(AppsmithRole.ORGANIZATION_ADMIN.getName());

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
}
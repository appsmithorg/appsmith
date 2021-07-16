package com.appsmith.server.services;

import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_ORGANIZATIONS;

@Service
@Slf4j
public class UserOrganizationServiceImpl implements UserOrganizationService {
    private final SessionUserService sessionUserService;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final UserDataRepository userDataRepository;
    private final PolicyUtils policyUtils;
    private final EmailSender emailSender;

    private static final String UPDATE_ROLE_EXISTING_USER_TEMPLATE = "email/updateRoleExistingUserTemplate.html";

    @Autowired
    public UserOrganizationServiceImpl(SessionUserService sessionUserService,
                                       OrganizationRepository organizationRepository,
                                       UserRepository userRepository,
                                       UserDataRepository userDataRepository,
                                       PolicyUtils policyUtils,
                                       EmailSender emailSender) {
        this.sessionUserService = sessionUserService;
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.userDataRepository = userDataRepository;
        this.policyUtils = policyUtils;
        this.emailSender = emailSender;
    }

    /**
     * This function adds an organizationId to the user. This will allow users to switch between multiple organizations
     * and operate inside them independently.
     *
     * @param orgId The organizationId being added to the user.
     * @param user
     * @return
     */
    @Override
    public Mono<User> addUserToOrganization(String orgId, User user) {

        Mono<User> currentUserMono;
        if (user == null) {
            currentUserMono = sessionUserService.getCurrentUser()
                    .flatMap(user1 -> userRepository.findByEmail(user1.getUsername()));
        } else {
            currentUserMono = Mono.just(user);
        }

       // Querying by example here because the organizationRepository.findById wasn't working when the user
        // signs up for a new account via Google SSO.
        Organization exampleOrg = new Organization();
        exampleOrg.setId(orgId);
        exampleOrg.setPolicies(null);

        return organizationRepository.findOne(Example.of(exampleOrg))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ORGANIZATION, orgId)))
                .zipWith(currentUserMono)
                .map(tuple -> {
                    Organization organization = tuple.getT1();
                    User user1 = tuple.getT2();
                    log.debug("Adding organization {} with id {} to user {}", organization.getName(), organization.getId(), user1.getEmail());
                    return user1;
                })
                .map(user1 -> {
                    Set<String> organizationIds = user1.getOrganizationIds();
                    if (organizationIds == null) {
                        organizationIds = new HashSet<>();
                        if (user1.getCurrentOrganizationId() != null) {
                            // If the list of organizationIds for a user is null, add the current user org
                            // to the new list as well
                            organizationIds.add(user1.getCurrentOrganizationId());
                        }
                    }
                    if (!organizationIds.contains(orgId)) {
                        // Only add to the organizationIds array if it's not already present
                        organizationIds.add(orgId);
                        user1.setOrganizationIds(organizationIds);
                    }
                    // Set the current organization to the newly added organization
                    user1.setCurrentOrganizationId(orgId);
                    return user1;
                })
                .flatMap(userRepository::save);
    }

    @Override
    public Mono<User> saveUser(User user) {
        return userRepository.save(user);
    }

    @Override
    public Mono<Organization> addUserRoleToOrganization(String orgId, UserRole userRole) {
        Mono<Organization> organizationMono = organizationRepository.findById(orgId, MANAGE_ORGANIZATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ORGANIZATION, orgId)));
        Mono<User> userMono = userRepository.findByEmail(userRole.getUsername())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER)));

        return Mono.zip(organizationMono, userMono)
                .flatMap(tuple -> {
                    Organization organization = tuple.getT1();
                    User user = tuple.getT2();
                    return addUserToOrganizationGivenUserObject(organization, user, userRole);
                });
    }

    @Override
    public Mono<Organization> addUserToOrganizationGivenUserObject(Organization organization, User user, UserRole userRole) {
        List<UserRole> userRoles = organization.getUserRoles();
        if (userRoles == null) {
            userRoles = new ArrayList<>();
        }

        // Do not add the user if the user already exists in the organization
        for (UserRole role : userRoles) {
            if (role.getUsername().equals(userRole.getUsername())) {
                return Mono.error(new AppsmithException(AppsmithError.USER_ALREADY_EXISTS_IN_ORGANIZATION, role.getUsername(), role.getRoleName()));
            }
        }
        // User was not found in the organization. Continue with adding it
        AppsmithRole role = AppsmithRole.generateAppsmithRoleFromName(userRole.getRoleName());
        userRole.setUserId(user.getId());
        userRole.setName(user.getName());
        userRole.setRole(role);

        // Add the user and its role to the organization
        userRoles.add(userRole);

        // Generate all the policies for Organization, Application, Page and Actions for the current user
        Set<AclPermission> rolePermissions = role.getPermissions();
        Map<String, Policy> orgPolicyMap = policyUtils.generatePolicyFromPermission(rolePermissions, user);
        Map<String, Policy> applicationPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(orgPolicyMap, Organization.class, Application.class);
        Map<String, Policy> datasourcePolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(orgPolicyMap, Organization.class, Datasource.class);
        Map<String, Policy> pagePolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(applicationPolicyMap, Application.class, Page.class);
        Map<String, Policy> actionPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(pagePolicyMap, Page.class, Action.class);

        //Now update the organization policies
        Organization updatedOrganization = policyUtils.addPoliciesToExistingObject(orgPolicyMap, organization);
        updatedOrganization.setUserRoles(userRoles);

        // Update the underlying application/page/action
        Flux<Datasource> updatedDatasourcesFlux = policyUtils.updateWithNewPoliciesToDatasourcesByOrgId(updatedOrganization.getId(), datasourcePolicyMap, true);
        Flux<Application> updatedApplicationsFlux = policyUtils.updateWithNewPoliciesToApplicationsByOrgId(updatedOrganization.getId(), applicationPolicyMap, true)
                .cache();
        Flux<NewPage> updatedPagesFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateWithApplicationPermissionsToAllItsPages(application.getId(), pagePolicyMap, true));
        Flux<NewAction> updatedActionsFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateWithPagePermissionsToAllItsActions(application.getId(), actionPolicyMap, true));

        return Mono.zip(updatedDatasourcesFlux.collectList(), updatedPagesFlux.collectList(), updatedActionsFlux.collectList(), Mono.just(updatedOrganization))
                .flatMap(tuple -> {
                    //By now all the datasources/applications/pages/actions have been updated. Just save the organization now
                    Organization updatedOrgBeforeSave = tuple.getT4();
                    return organizationRepository.save(updatedOrgBeforeSave);
                });
    }

    @Override
    public Mono<User> leaveOrganization(String orgId) {
        Mono<Organization> organizationMono = organizationRepository.findById(orgId);
        Mono<User> userMono = sessionUserService.getCurrentUser()
                    .flatMap(user1 -> userRepository.findByEmail(user1.getUsername()));

        return Mono.zip(organizationMono, userMono)
                .flatMap(tuple -> {
                    Organization organization = tuple.getT1();
                    User user = tuple.getT2();

                    UserRole userRole = new UserRole();
                    userRole.setUsername(user.getUsername());

                    user.getOrganizationIds().remove(organization.getId());
                    return this.updateMemberRole(
                            organization, user, userRole, user, null
                    ).thenReturn(user);
                });
    }

    @Override
    public Mono<Organization> removeUserRoleFromOrganizationGivenUserObject(Organization organization, User user) {
        List<UserRole> userRoles = organization.getUserRoles();
        if (userRoles == null) {
            return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER + " in organization", organization.getName()));
        }

        AppsmithRole role = null;
        for (UserRole userRole : userRoles) {
            if (userRole.getUsername().equals(user.getUsername())) {
                role = userRole.getRole();
                // Remove the user role from the organization
                userRoles.remove(userRole);
                break;
            }
        }

        // The user was not found in the organization.
        if (role == null) {
            return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER + " in organization", organization.getName()));
        }

        // Generate all the policies for Organization, Application, Page and Actions
        Set<AclPermission> rolePermissions = role.getPermissions();
        Map<String, Policy> orgPolicyMap = policyUtils.generatePolicyFromPermission(rolePermissions, user);
        Map<String, Policy> applicationPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(orgPolicyMap, Organization.class, Application.class);
        Map<String, Policy> datasourcePolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(orgPolicyMap, Organization.class, Datasource.class);
        Map<String, Policy> pagePolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(applicationPolicyMap, Application.class, Page.class);
        Map<String, Policy> actionPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(pagePolicyMap, Page.class, Action.class);
        Map<String, Policy> commentThreadPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(
                applicationPolicyMap, Application.class, CommentThread.class
        );

        //Now update the organization policies
        Organization updatedOrganization = policyUtils.removePoliciesFromExistingObject(orgPolicyMap, organization);
        updatedOrganization.setUserRoles(userRoles);

        // Update the underlying application/page/action
        Flux<Datasource> updatedDatasourcesFlux = policyUtils.updateWithNewPoliciesToDatasourcesByOrgId(updatedOrganization.getId(), datasourcePolicyMap, false);
        Flux<Application> updatedApplicationsFlux = policyUtils.updateWithNewPoliciesToApplicationsByOrgId(updatedOrganization.getId(), applicationPolicyMap, false)
                .cache();
        Flux<NewPage> updatedPagesFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateWithApplicationPermissionsToAllItsPages(application.getId(), pagePolicyMap, false));
        Flux<NewAction> updatedActionsFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateWithPagePermissionsToAllItsActions(application.getId(), actionPolicyMap, false));
        Flux<CommentThread> updatedThreadsFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateWithApplicationPermissionsToAllItsCommentThreads(application.getId(), commentThreadPolicyMap, false));

        return Mono.zip(
                updatedDatasourcesFlux.collectList(),
                updatedPagesFlux.collectList(),
                updatedActionsFlux.collectList(),
                updatedThreadsFlux.collectList(),
                Mono.just(updatedOrganization)
        ).flatMap(tuple -> {
                //By now all the datasources/applications/pages/actions have been updated. Just save the organization now
                Organization updatedOrgBeforeSave = tuple.getT5();
                return organizationRepository.save(updatedOrgBeforeSave);
        });
    }

    private Mono<UserRole> updateMemberRole(Organization organization, User user, UserRole userRole, User currentUser, String originHeader) {
        List<UserRole> userRoles = organization.getUserRoles();

        // count how many admins are there is this organization
        long orgAdminCount = userRoles.stream().filter(
                userRole1 -> userRole1.getRole() == AppsmithRole.ORGANIZATION_ADMIN
        ).count();

        for (UserRole role : userRoles) {
            if (role.getUsername().equals(userRole.getUsername())) {
                // User found in the organization.

                if (role.getRole().equals(userRole.getRole())) {
                    // No change in the role. Do nothing.
                    return Mono.just(userRole);
                } else if(role.getRole().equals(AppsmithRole.ORGANIZATION_ADMIN)) {
                    // user is currently admin, check if this user is the only admin
                    if(orgAdminCount == 1) {
                        return Mono.error(new AppsmithException(AppsmithError.REMOVE_LAST_ORG_ADMIN_ERROR));
                    }
                }

                // Step 1. Remove the existing role of the user from the organization
                Mono<Organization> userRemovedOrganizationMono = this.removeUserRoleFromOrganizationGivenUserObject(organization, user);

                // Step 2. Add the new role (if present) to the organization for the user
                Mono<Organization> finalUpdatedOrganizationMono = userRemovedOrganizationMono;
                if (userRole.getRoleName() != null) {
                    // If a userRole name has been specified, then it means that the user's role has been modified.
                    Mono<Organization> userAddedToOrganizationMono = userRemovedOrganizationMono
                            .flatMap(organization1 -> this.addUserToOrganizationGivenUserObject(organization1, user, userRole));
                    finalUpdatedOrganizationMono = userAddedToOrganizationMono.flatMap(addedOrganization -> {

                        Map<String, String> params = new HashMap<>();
                        params.put("Inviter_First_Name", currentUser.getName());
                        params.put("inviter_org_name", organization.getName());
                        params.put("inviteUrl", originHeader);
                        params.put("user_role_name", userRole.getRoleName());

                        Mono<Boolean> emailMono = emailSender.sendMail(user.getEmail(),
                                "Appsmith: Your Role has been changed",
                                UPDATE_ROLE_EXISTING_USER_TEMPLATE, params);
                        return emailMono
                                .thenReturn(addedOrganization);
                    });
                } else {
                    // If the roleName was not present, then it implies that the user is being removed from the org.
                    // Since at this point we have already removed the user from the organization,
                    // remove the organization from recent org list of UserData
                    // we also need to remove the org id from User.orgIdList
                    finalUpdatedOrganizationMono = userDataRepository
                            .removeOrgFromRecentlyUsedList(user.getId(), organization.getId())
                            .then(userRemovedOrganizationMono)
                            .flatMap(organization1 -> {
                                    if(user.getOrganizationIds() != null) {
                                        user.getOrganizationIds().remove(organization.getId());
                                        return userRepository.save(user).thenReturn(organization1);
                                    }
                                    return Mono.just(organization1);
                            });
                }

                return finalUpdatedOrganizationMono.thenReturn(userRole);
            }
        }
        // The user was not found in the organization. Return an error
        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, user.getUsername()
                + " in the organization " + organization.getName()));
    }

    /**
     * This method is used when an admin of an organization changes the role or removes a member.
     * Admin user can also remove himself from the organization, if there is another admin there in the organization.
     * @param orgId ID of the organization
     * @param userRole updated role of the target member. userRole.roleName will be null when removing a member
     * @param originHeader
     * @return The updated UserRole
     */
    @Override
    public Mono<UserRole> updateRoleForMember(String orgId, UserRole userRole, String originHeader) {
        if (userRole.getUsername() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "username"));
        }

        Mono<Organization> organizationMono = organizationRepository
                .findById(orgId, MANAGE_ORGANIZATIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED,
                        "Change role of a member")));
        Mono<User> userMono = userRepository.findByEmail(userRole.getUsername());
        Mono<User> currentUserMono = sessionUserService.getCurrentUser();

        return Mono.zip(organizationMono, userMono, currentUserMono)
                .flatMap(tuple -> {
                    Organization organization = tuple.getT1();
                    User user = tuple.getT2();
                    User currentUser = tuple.getT3();
                    return this.updateMemberRole(organization, user, userRole, currentUser, originHeader);
                });
    }

    @Override
    public Mono<Organization> bulkAddUsersToOrganization(Organization organization, List<User> users, String roleName) {
        List<UserRole> userRoles = organization.getUserRoles();
        if (userRoles == null) {
            userRoles = new ArrayList<>();
        }

        List<UserRole> newUserRoles = new ArrayList<>();
        AppsmithRole role = AppsmithRole.generateAppsmithRoleFromName(roleName);

        for (User user : users) {
            // If the user already exists in the organization, skip adding the user to the organization user roles
            if (userRoles.stream().anyMatch(orgRole -> orgRole.getUsername().equals(user.getUsername()))) {
                continue;
            }
            // User was not found in the organization. Continue with adding it
            UserRole userRole = new UserRole();
            userRole.setUserId(user.getId());
            userRole.setUsername(user.getUsername());
            userRole.setName(user.getName());
            userRole.setRole(role);
            userRole.setRoleName(role.getName());
            newUserRoles.add(userRole);
        }

        if (newUserRoles.isEmpty()) {
            // All the users being added to the organization already exist in the organization. Return without doing anything
            // Because we are not erroring out here, this ensures that an email would be sent everytime a user is invited
            // to an organization (whether or not the user is already part of the organization)
            return Mono.just(organization);
        }

        // Add the users to the organization roles
        userRoles.addAll(newUserRoles);

        // Generate all the policies for Organization, Application, Page and Actions for the current user
        Set<AclPermission> rolePermissions = role.getPermissions();
        Map<String, Policy> orgPolicyMap = policyUtils.generatePolicyFromPermissionForMultipleUsers(rolePermissions, users);
        Map<String, Policy> applicationPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(orgPolicyMap, Organization.class, Application.class);
        Map<String, Policy> datasourcePolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(orgPolicyMap, Organization.class, Datasource.class);
        Map<String, Policy> pagePolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(applicationPolicyMap, Application.class, Page.class);
        Map<String, Policy> commentThreadPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(
                applicationPolicyMap, Application.class, CommentThread.class
        );
        Map<String, Policy> actionPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(pagePolicyMap, Page.class, Action.class);

        //Now update the organization policies
        Organization updatedOrganization = policyUtils.addPoliciesToExistingObject(orgPolicyMap, organization);
        updatedOrganization.setUserRoles(userRoles);

        // Update the underlying application/page/action
        Flux<Datasource> updatedDatasourcesFlux = policyUtils.updateWithNewPoliciesToDatasourcesByOrgId(updatedOrganization.getId(), datasourcePolicyMap, true);
        Flux<Application> updatedApplicationsFlux = policyUtils.updateWithNewPoliciesToApplicationsByOrgId(updatedOrganization.getId(), applicationPolicyMap, true)
                .cache();
        Flux<NewPage> updatedPagesFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateWithApplicationPermissionsToAllItsPages(application.getId(), pagePolicyMap, true));
        Flux<NewAction> updatedActionsFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateWithPagePermissionsToAllItsActions(application.getId(), actionPolicyMap, true));
        Flux<CommentThread> updatedThreadsFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateWithApplicationPermissionsToAllItsCommentThreads(application.getId(), commentThreadPolicyMap, true));

        return Mono.when(
                updatedDatasourcesFlux.collectList(),
                updatedPagesFlux.collectList(),
                updatedActionsFlux.collectList(),
                updatedThreadsFlux.collectList())
                //By now all the datasources/applications/pages/actions have been updated. Just save the organization now
                .then(organizationRepository.save(updatedOrganization));
    }
}

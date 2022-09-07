package com.appsmith.server.services.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.notifications.EmailSender;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.repositories.UserDataRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Example;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_WORKSPACES;


@Slf4j
public class UserWorkspaceServiceCEImpl implements UserWorkspaceServiceCE {
    private final SessionUserService sessionUserService;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final UserDataRepository userDataRepository;
    private final PolicyUtils policyUtils;
    private final EmailSender emailSender;
    private final UserDataService userDataService;

    private static final String UPDATE_ROLE_EXISTING_USER_TEMPLATE = "email/updateRoleExistingUserTemplate.html";

    @Autowired
    public UserWorkspaceServiceCEImpl(SessionUserService sessionUserService,
                                         WorkspaceRepository workspaceRepository,
                                         UserRepository userRepository,
                                         UserDataRepository userDataRepository,
                                         PolicyUtils policyUtils,
                                         EmailSender emailSender,
                                         UserDataService userDataService) {
        this.sessionUserService = sessionUserService;
        this.workspaceRepository = workspaceRepository;
        this.userRepository = userRepository;
        this.userDataRepository = userDataRepository;
        this.policyUtils = policyUtils;
        this.emailSender = emailSender;
        this.userDataService = userDataService;
    }

    /**
     * This function adds an workspaceId to the user. This will allow users to switch between multiple workspace
     * and operate inside them independently.
     *
     * @param workspaceId The workspaceId being added to the user.
     * @param user
     * @return
     */
    @Override
    public Mono<User> addUserToWorkspace(String workspaceId, User user) {

        Mono<User> currentUserMono;
        if (user == null) {
            currentUserMono = sessionUserService.getCurrentUser()
                    .flatMap(user1 -> userRepository.findByEmail(user1.getUsername()));
        } else {
            currentUserMono = Mono.just(user);
        }

       // Querying by example here because the workspaceRepository.findById wasn't working when the user
        // signs up for a new account via Google SSO.
        Workspace exampleWorkspace = new Workspace();
        exampleWorkspace.setId(workspaceId);
        exampleWorkspace.setPolicies(null);

        return workspaceRepository.findOne(Example.of(exampleWorkspace))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)))
                .zipWith(currentUserMono)
                .map(tuple -> {
                        Workspace workspace = tuple.getT1();
                    User user1 = tuple.getT2();
                    log.debug("Adding workspace {} with id {} to user {}", workspace.getName(), workspace.getId(), user1.getEmail());
                    return user1;
                })
                .map(user1 -> {
                    Set<String> workspaceIds = user1.getWorkspaceIds();
                    if (workspaceIds == null) {
                        workspaceIds = new HashSet<>();
                        if (user1.getCurrentWorkspaceId() != null) {
                            // If the list of workspaceIds for a user is null, add the current user workspace
                            // to the new list as well
                            workspaceIds.add(user1.getCurrentWorkspaceId());
                        }
                    }
                    if (!workspaceIds.contains(workspaceId)) {
                        // Only add to the workspaceIds array if it's not already present
                        workspaceIds.add(workspaceId);
                        user1.setWorkspaceIds(workspaceIds);
                    }
                    // Set the current workspace to the newly added workspace
                    user1.setCurrentWorkspaceId(workspaceId);
                    return user1;
                })
                .flatMap(userRepository::save);
    }

    @Override
    public Mono<Workspace> addUserRoleToWorkspace(String workspaceId, UserRole userRole) {
        Mono<Workspace> workspaceMono = workspaceRepository.findById(workspaceId, MANAGE_WORKSPACES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)));
        Mono<User> userMono = userRepository.findByEmail(userRole.getUsername())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER)));

        return Mono.zip(workspaceMono, userMono)
                .flatMap(tuple -> {
                    Workspace workspace = tuple.getT1();
                    User user = tuple.getT2();
                    return addUserToWorkspaceGivenUserObject(workspace, user, userRole);
                });
    }

    @Override
    public Mono<Workspace> addUserToWorkspaceGivenUserObject(Workspace workspace, User user, UserRole userRole) {
        List<UserRole> userRoles = workspace.getUserRoles();
        if (userRoles == null) {
            userRoles = new ArrayList<>();
        }

        // Do not add the user if the user already exists in the workspace
        for (UserRole role : userRoles) {
            if (role.getUsername().equals(userRole.getUsername())) {
                return Mono.error(new AppsmithException(AppsmithError.USER_ALREADY_EXISTS_IN_WORKSPACE, role.getUsername(), role.getRoleName()));
            }
        }
        // User was not found in the workspace. Continue with adding it
        AppsmithRole role = AppsmithRole.generateAppsmithRoleFromName(userRole.getRoleName());
        userRole.setUserId(user.getId());
        userRole.setName(user.getName());
        userRole.setRole(role);

        // Add the user and its role to the workspace
        userRoles.add(userRole);

        // Generate all the policies for Workspace, Application, Page and Actions for the current user
        Set<AclPermission> rolePermissions = role.getPermissions();
        Map<String, Policy> workspacePolicyMap = policyUtils.generatePolicyFromPermission(rolePermissions, user);
        Map<String, Policy> applicationPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(workspacePolicyMap, Workspace.class, Application.class);
        Map<String, Policy> datasourcePolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(workspacePolicyMap, Workspace.class, Datasource.class);
        Map<String, Policy> pagePolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(applicationPolicyMap, Application.class, Page.class);
        Map<String, Policy> actionPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(pagePolicyMap, Page.class, Action.class);
        Map<String, Policy> commentThreadPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(
                applicationPolicyMap, Application.class, CommentThread.class
        );
        Map<String, Policy> themePolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(
                applicationPolicyMap, Application.class, Theme.class
        );
        //Now update the workspace policies
        Workspace updatedWorkspace = policyUtils.addPoliciesToExistingObject(workspacePolicyMap, workspace);
        updatedWorkspace.setUserRoles(userRoles);

        // Update the underlying application/page/action
        Flux<Datasource> updatedDatasourcesFlux = policyUtils.updateWithNewPoliciesToDatasourcesByWorkspaceId(updatedWorkspace.getId(), datasourcePolicyMap, true);
        Flux<Application> updatedApplicationsFlux = policyUtils.updateWithNewPoliciesToApplicationsByWorkspaceId(updatedWorkspace.getId(), applicationPolicyMap, true)
                .cache(); // .cache is very important, as we will execute once and reuse the results multiple times
        Flux<NewPage> updatedPagesFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateWithApplicationPermissionsToAllItsPages(application.getId(), pagePolicyMap, true));
        Flux<NewAction> updatedActionsFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateWithPagePermissionsToAllItsActions(application.getId(), actionPolicyMap, true));
        Flux<ActionCollection> updatedActionCollectionsFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateWithPagePermissionsToAllItsActionCollections(application.getId(), actionPolicyMap, true));
        Flux<CommentThread> updatedThreadsFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateCommentThreadPermissions(application.getId(), commentThreadPolicyMap, user.getUsername(), true));
        Flux<Theme> updatedThemesFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateThemePolicies(
                        application, themePolicyMap, true
                ));
        return Mono.zip(
                updatedDatasourcesFlux.collectList(),
                updatedPagesFlux.collectList(),
                updatedActionsFlux.collectList(),
                updatedActionCollectionsFlux.collectList(),
                Mono.just(updatedWorkspace),
                updatedThreadsFlux.collectList(),
                updatedThemesFlux.collectList()
        )
        .flatMap(tuple -> {
            //By now all the datasources/applications/pages/actions have been updated. Just save the workspace now
            Workspace updatedWorkspaceBeforeSave = tuple.getT5();
            return workspaceRepository.save(updatedWorkspaceBeforeSave);
        });
    }

    @Override
    public Mono<User> leaveWorkspace(String workspaceId) {
        Mono<Workspace> workspaceMono = workspaceRepository.findById(workspaceId);
        Mono<User> userMono = sessionUserService.getCurrentUser()
                    .flatMap(user1 -> userRepository.findByEmail(user1.getUsername()));

        return Mono.zip(workspaceMono, userMono)
                .flatMap(tuple -> {
                        Workspace workspace = tuple.getT1();
                    User user = tuple.getT2();

                    UserRole userRole = new UserRole();
                    userRole.setUsername(user.getUsername());

                    user.getWorkspaceIds().remove(workspace.getId());
                    return this.updateMemberRole(
                            workspace, user, userRole, user, null
                    ).thenReturn(user);
                });
    }

    private Mono<Workspace> removeUserRoleFromWorkspaceGivenUserObject(Workspace workspace, User user) {
        List<UserRole> userRoles = workspace.getUserRoles();
        if (userRoles == null) {
            return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER + " in workspace", workspace.getName()));
        }

        AppsmithRole role = null;
        for (UserRole userRole : userRoles) {
            if (userRole.getUsername().equals(user.getUsername())) {
                role = userRole.getRole();
                // Remove the user role from the workspace
                userRoles.remove(userRole);
                break;
            }
        }

        // The user was not found in the workspace.
        if (role == null) {
            return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER + " in workspace", workspace.getName()));
        }

        // Generate all the policies for Workspace, Application, Page and Actions
        Set<AclPermission> rolePermissions = role.getPermissions();
        Map<String, Policy> workspacePolicyMap = policyUtils.generatePolicyFromPermission(rolePermissions, user);
        Map<String, Policy> applicationPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(workspacePolicyMap, Workspace.class, Application.class);
        Map<String, Policy> datasourcePolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(workspacePolicyMap, Workspace.class, Datasource.class);
        Map<String, Policy> pagePolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(applicationPolicyMap, Application.class, Page.class);
        Map<String, Policy> actionPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(pagePolicyMap, Page.class, Action.class);
        Map<String, Policy> commentThreadPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(
                applicationPolicyMap, Application.class, CommentThread.class
        );
        Map<String, Policy> themePolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(
                applicationPolicyMap, Application.class, Theme.class
        );

        //Now update the workspace policies
        Workspace updatedWorkspace = policyUtils.removePoliciesFromExistingObject(workspacePolicyMap, workspace);
        updatedWorkspace.setUserRoles(userRoles);

        // Update the underlying application/page/action
        Flux<Datasource> updatedDatasourcesFlux = policyUtils.updateWithNewPoliciesToDatasourcesByWorkspaceId(updatedWorkspace.getId(), datasourcePolicyMap, false);
        Flux<Application> updatedApplicationsFlux = policyUtils.updateWithNewPoliciesToApplicationsByWorkspaceId(updatedWorkspace.getId(), applicationPolicyMap, false)
                .cache(); // .cache is very important, as we will execute once and reuse the results multiple times
        Flux<NewPage> updatedPagesFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateWithApplicationPermissionsToAllItsPages(application.getId(), pagePolicyMap, false));
        Flux<NewAction> updatedActionsFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateWithPagePermissionsToAllItsActions(application.getId(), actionPolicyMap, false));
        Flux<ActionCollection> updatedActionCollectionsFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateWithPagePermissionsToAllItsActionCollections(application.getId(), actionPolicyMap, true));
        Flux<CommentThread> updatedThreadsFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateCommentThreadPermissions(
                        application.getId(), commentThreadPolicyMap, user.getUsername(), false
                ));
        Flux<Theme> updatedThemesFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateThemePolicies(
                        application, themePolicyMap, false
                ));

        return Mono.zip(
                updatedDatasourcesFlux.collectList(),
                updatedPagesFlux.collectList(),
                updatedActionsFlux.collectList(),
                updatedActionCollectionsFlux.collectList(),
                updatedThreadsFlux.collectList(),
                Mono.just(updatedWorkspace),
                updatedThemesFlux.collectList()
        ).flatMap(tuple -> {
                //By now all the datasources/applications/pages/actions have been updated. Just save the workspace now
                Workspace updatedWorkspaceBeforeSave = tuple.getT6();
                return workspaceRepository.save(updatedWorkspaceBeforeSave);
        });
    }

    private Mono<UserRole> updateMemberRole(Workspace workspace, User user, UserRole userRole, User currentUser, String originHeader) {
        List<UserRole> userRoles = workspace.getUserRoles();

        // count how many admins are there is this workspace
        long workspaceAdminCount = userRoles.stream().filter(
                userRole1 -> userRole1.getRole() == AppsmithRole.ORGANIZATION_ADMIN
        ).count();

        for (UserRole role : userRoles) {
            if (role.getUsername().equals(userRole.getUsername())) {
                // User found in the workspace.

                if (role.getRole().equals(userRole.getRole())) {
                    // No change in the role. Do nothing.
                    return Mono.just(userRole);
                } else if(role.getRole().equals(AppsmithRole.ORGANIZATION_ADMIN)) {
                    // user is currently admin, check if this user is the only admin
                    if(workspaceAdminCount == 1) {
                        return Mono.error(new AppsmithException(AppsmithError.REMOVE_LAST_WORKSPACE_ADMIN_ERROR));
                    }
                }

                // Step 1. Remove the existing role of the user from the workspace
                Mono<Workspace> userRemovedWorkspaceMono = this.removeUserRoleFromWorkspaceGivenUserObject(workspace, user);

                // Step 2. Add the new role (if present) to the workspace for the user
                Mono<Workspace> finalUpdatedWorkspaceMono = userRemovedWorkspaceMono;
                if (userRole.getRoleName() != null) {
                    // If a userRole name has been specified, then it means that the user's role has been modified.
                    Mono<Workspace> userAddedToWorkspaceMono = userRemovedWorkspaceMono
                            .flatMap(workspace1 -> this.addUserToWorkspaceGivenUserObject(workspace1, user, userRole));
                    finalUpdatedWorkspaceMono = userAddedToWorkspaceMono.flatMap(addedWorkspace -> {

                        Map<String, String> params = new HashMap<>();
                        params.put("Inviter_First_Name", currentUser.getName());
                        params.put("inviter_org_name", workspace.getName());
                        params.put("inviteUrl", originHeader);
                        params.put("user_role_name", userRole.getRoleName());

                        Mono<Boolean> emailMono = emailSender.sendMail(user.getEmail(),
                                "Appsmith: Your Role has been changed",
                                UPDATE_ROLE_EXISTING_USER_TEMPLATE, params);
                        return emailMono
                                .thenReturn(addedWorkspace);
                    });
                } else {
                    // If the roleName was not present, then it implies that the user is being removed from the workspace.
                    // Since at this point we have already removed the user from the workspace,
                    // remove the workspace from recent workspace list of UserData
                    // we also need to remove the workspace id from User.workspaceIdList
                    finalUpdatedWorkspaceMono = userDataService
                            .removeRecentWorkspaceAndApps(user.getId(), workspace.getId())
                            .then(userRemovedWorkspaceMono)
                            .flatMap(workspace1 -> {
                                    if(user.getWorkspaceIds() != null) {
                                        user.getWorkspaceIds().remove(workspace.getId());
                                        return userRepository.save(user).thenReturn(workspace1);
                                    }
                                    return Mono.just(workspace1);
                            });
                }

                return finalUpdatedWorkspaceMono.thenReturn(userRole);
            }
        }
        // The user was not found in the workspace. Return an error
        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, user.getUsername()
                + " in the workspace " + workspace.getName()));
    }

    /**
     * This method is used when an admin of an workspace changes the role or removes a member.
     * Admin user can also remove himself from the workspace, if there is another admin there in the workspace.
     * @param workspaceId ID of the workspace
     * @param userRole updated role of the target member. userRole.roleName will be null when removing a member
     * @param originHeader
     * @return The updated UserRole
     */
    @Override
    public Mono<UserRole> updateRoleForMember(String workspaceId, UserRole userRole, String originHeader) {
        if (userRole.getUsername() == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "username"));
        }

        Mono<Workspace> workspaceMono = workspaceRepository
                .findById(workspaceId, MANAGE_WORKSPACES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED,
                        "Change role of a member")));
        Mono<User> userMono = userRepository.findByEmail(userRole.getUsername());
        Mono<User> currentUserMono = sessionUserService.getCurrentUser();

        return Mono.zip(workspaceMono, userMono, currentUserMono)
                .flatMap(tuple -> {
                        Workspace workspace = tuple.getT1();
                    User user = tuple.getT2();
                    User currentUser = tuple.getT3();
                    return this.updateMemberRole(workspace, user, userRole, currentUser, originHeader);
                });
    }

    @Override
    public Mono<Workspace> bulkAddUsersToWorkspace(Workspace workspace, List<User> users, String roleName) {
        List<UserRole> userRoles = workspace.getUserRoles();
        if (userRoles == null) {
            userRoles = new ArrayList<>();
        }

        List<UserRole> newUserRoles = new ArrayList<>();
        AppsmithRole role = AppsmithRole.generateAppsmithRoleFromName(roleName);

        for (User user : users) {
            // If the user already exists in the workspace, skip adding the user to the workspace user roles
            if (userRoles.stream().anyMatch(workspaceRole -> workspaceRole.getUsername().equals(user.getUsername()))) {
                continue;
            }
            // User was not found in the workspace. Continue with adding it
            UserRole userRole = new UserRole();
            userRole.setUserId(user.getId());
            userRole.setUsername(user.getUsername());
            userRole.setName(user.getName());
            userRole.setRole(role);
            userRole.setRoleName(role.getName());
            newUserRoles.add(userRole);
        }

        if (newUserRoles.isEmpty()) {
            // All the users being added to the workspace already exist in the workspace. Return without doing anything
            // Because we are not erroring out here, this ensures that an email would be sent everytime a user is invited
            // to an workspace (whether or not the user is already part of the workspace)
            return Mono.just(workspace);
        }

        // Add the users to the workspace roles
        userRoles.addAll(newUserRoles);

        // Generate all the policies for Workspace, Application, Page and Actions for the current user
        Set<AclPermission> rolePermissions = role.getPermissions();
        Map<String, Policy> workspacePolicyMap = policyUtils.generatePolicyFromPermissionForMultipleUsers(rolePermissions, users);
        Map<String, Policy> applicationPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(workspacePolicyMap, Workspace.class, Application.class);
        Map<String, Policy> datasourcePolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(workspacePolicyMap, Workspace.class, Datasource.class);
        Map<String, Policy> pagePolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(applicationPolicyMap, Application.class, Page.class);
        Map<String, Policy> commentThreadPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(
                applicationPolicyMap, Application.class, CommentThread.class
        );
        Map<String, Policy> actionPolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(pagePolicyMap, Page.class, Action.class);
        Map<String, Policy> themePolicyMap = policyUtils.generateInheritedPoliciesFromSourcePolicies(
                applicationPolicyMap, Application.class, Theme.class
        );

        // Now update the workspace policies
        Workspace updatedWorkspace = policyUtils.addPoliciesToExistingObject(workspacePolicyMap, workspace);
        updatedWorkspace.setUserRoles(userRoles);

        // Update the underlying application/page/action/action collection/comment thread
        Flux<Datasource> updatedDatasourcesFlux = policyUtils.updateWithNewPoliciesToDatasourcesByWorkspaceId(updatedWorkspace.getId(), datasourcePolicyMap, true);
        Flux<Application> updatedApplicationsFlux = policyUtils.updateWithNewPoliciesToApplicationsByWorkspaceId(updatedWorkspace.getId(), applicationPolicyMap, true)
                .cache();
        Flux<NewPage> updatedPagesFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateWithApplicationPermissionsToAllItsPages(application.getId(), pagePolicyMap, true));
        Flux<NewAction> updatedActionsFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateWithPagePermissionsToAllItsActions(application.getId(), actionPolicyMap, true));
        Flux<ActionCollection> updatedActionCollectionsFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateWithPagePermissionsToAllItsActionCollections(application.getId(), actionPolicyMap, true));
        Flux<CommentThread> updatedThreadsFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateCommentThreadPermissions(
                        application.getId(), commentThreadPolicyMap, null, true
                ));
        Flux<Theme> updatedThemesFlux = updatedApplicationsFlux
                .flatMap(application -> policyUtils.updateThemePolicies(
                        application, themePolicyMap, true
                ));

        return Mono.when(
                        updatedDatasourcesFlux.collectList(),
                        updatedPagesFlux.collectList(),
                        updatedActionsFlux.collectList(),
                        updatedActionCollectionsFlux.collectList(),
                        updatedThreadsFlux.collectList(),
                        updatedThemesFlux.collectList()
                )
                // By now all the
                // data sources/applications/pages/actions/action collections/comment threads
                // have been updated. Just save the workspace now
                .then(workspaceRepository.save(updatedWorkspace));
    }
}

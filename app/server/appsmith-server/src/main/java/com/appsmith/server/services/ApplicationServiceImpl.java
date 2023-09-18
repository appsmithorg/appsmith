package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Environment;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.InviteUsersToApplicationDTO;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UpdateApplicationRoleDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.services.ce.ApplicationServiceCEImpl;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.PolicySolution;
import com.appsmith.server.solutions.roles.RoleConfigurationSolution;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.SerializationUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.APPLICATION_DEVELOPER;
import static com.appsmith.server.constants.FieldName.APPLICATION_DEVELOPER_DESCRIPTION;
import static com.appsmith.server.constants.FieldName.APPLICATION_VIEWER;
import static com.appsmith.server.constants.FieldName.APPLICATION_VIEWER_DESCRIPTION;
import static com.appsmith.server.constants.FieldName.DEVELOPER;
import static com.appsmith.server.constants.FieldName.GROUP_ID;
import static com.appsmith.server.constants.FieldName.ROLE;
import static com.appsmith.server.constants.FieldName.USERNAME;
import static com.appsmith.server.constants.FieldName.VIEWER;
import static com.appsmith.server.helpers.AppsmithComparators.permissionGroupInfoWithEntityTypeComparator;
import static com.appsmith.server.helpers.TextUtils.generateDefaultRoleNameForResource;

@Slf4j
@Service
public class ApplicationServiceImpl extends ApplicationServiceCEImpl implements ApplicationService {

    private final PermissionGroupService permissionGroupService;
    private final PolicySolution policySolution;
    private final PermissionGroupRepository permissionGroupRepository;
    private final PermissionGroupPermission permissionGroupPermission;
    private final RoleConfigurationSolution roleConfigurationSolution;
    private final PolicyGenerator policyGenerator;
    private final UserService userService;
    private final UserGroupRepository userGroupRepository;
    private final ApplicationPermission applicationPermission;
    private final SessionUserService sessionUserService;
    private final EmailService emailService;
    private final ConfigService configService;

    public ApplicationServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            ApplicationRepository repository,
            AnalyticsService analyticsService,
            PolicySolution policySolution,
            ConfigService configService,
            ResponseUtils responseUtils,
            PermissionGroupService permissionGroupService,
            NewActionRepository newActionRepository,
            AssetService assetService,
            DatasourcePermission datasourcePermission,
            ApplicationPermission applicationPermission,
            PermissionGroupRepository permissionGroupRepository,
            PermissionGroupPermission permissionGroupPermission,
            RoleConfigurationSolution roleConfigurationSolution,
            PolicyGenerator policyGenerator,
            UserService userService,
            UserGroupRepository userGroupRepository,
            SessionUserService sessionUserService,
            EmailService emailService) {

        super(
                scheduler,
                validator,
                mongoConverter,
                reactiveMongoTemplate,
                repository,
                analyticsService,
                policySolution,
                configService,
                responseUtils,
                permissionGroupService,
                newActionRepository,
                assetService,
                datasourcePermission,
                applicationPermission);
        this.permissionGroupService = permissionGroupService;
        this.policySolution = policySolution;
        this.permissionGroupRepository = permissionGroupRepository;
        this.permissionGroupPermission = permissionGroupPermission;
        this.roleConfigurationSolution = roleConfigurationSolution;
        this.policyGenerator = policyGenerator;
        this.userService = userService;
        this.userGroupRepository = userGroupRepository;
        this.applicationPermission = applicationPermission;
        this.sessionUserService = sessionUserService;
        this.emailService = emailService;
        this.configService = configService;
    }

    /**
     * <p>
     * Generate a Default Application Role for given {@code application} and {@code roleType}.
     * <p>
     * If the {@code roleType} doesn't match {@code APPLICATION_DEVELOPER} or {@code APPLICATION_VIEWER}, then
     * an {@link AppsmithException} with error {@code INVALID_PARAMETER} is thrown.
     *
     * @param application {@link Application}
     * @param roleType    {@link String}
     * @return {@link Mono}<{@link PermissionGroup}>
     */
    @Override
    public Mono<PermissionGroup> createDefaultRole(Application application, String roleType) {
        Mono<PermissionGroup> createdDefaultRoleMono;
        if (roleType.equalsIgnoreCase(APPLICATION_DEVELOPER)) {
            createdDefaultRoleMono = createDefaultDeveloperRole(application);
        } else if (roleType.equalsIgnoreCase(APPLICATION_VIEWER)) {
            createdDefaultRoleMono = createDefaultViewerRole(application);
        } else {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Role Type"));
        }
        return createdDefaultRoleMono
                /*
                 * Now that the role has been created, we will update the policy of application and related resources
                 * with the created role, so that the resources are accessible to entities who will be assigned this
                 * role.
                 */
                .flatMap(role -> updatePoliciesForApplicationAndRelatedResources(application, role, roleType));
    }

    /**
     * <p>
     * The method is responsible for creating the application default role - Developer.
     * <br>
     * Steps:
     * <ol>
     *    <li>Create an empty role with auto-generated name.</li>
     *    <li>Give the workspace default roles permissions to assign/un-assign/read members for the created role.</li>
     *    <li>Generate and set policies for the created role to assign/un-assign/read members for itself.</li>
     * </ol>
     *
     * @param application {@link Application} for which we want to create the application default role - Developer.
     * @return {@link Mono}<{@link PermissionGroup}>
     */
    private Mono<PermissionGroup> createDefaultDeveloperRole(Application application) {
        PermissionGroup defaultDeveloperRole = new PermissionGroup();
        defaultDeveloperRole.setDefaultDomainId(application.getId());
        defaultDeveloperRole.setDefaultDomainType(Application.class.getSimpleName());
        defaultDeveloperRole.setName(generateDefaultRoleNameForResource(APPLICATION_DEVELOPER, application.getName()));
        defaultDeveloperRole.setDescription(APPLICATION_DEVELOPER_DESCRIPTION);
        return permissionGroupService
                .create(defaultDeveloperRole)
                /*
                 * Default workspace roles: Admin / Developer are given assign/un-assign/read members for
                 * defaultDeveloperRole.
                 */
                .flatMap(role -> giveDefaultWorkspaceRolesAccessToRole(application.getWorkspaceId(), role))
                .flatMap(role -> generateAndUpdatePoliciesForDefaultDeveloperRole(role, application));
    }

    /**
     * Method responsible for creating the application default role - App Viewer.
     * <br>
     * Steps:
     * <ol>
     *    <li>Create an empty role with auto-generated name.</li>
     *    <li>Give the workspace default roles permissions to assign/un-assign/read members for the created role.</li>
     *    <li>Generate and set policies for the created role to assign/un-assign/read members for itself.</li>
     * </ol>
     *
     * @param application {@link Application} for which we want to create the application default role - Viewer.
     * @return {@link Mono}<{@link PermissionGroup}>
     */
    private Mono<PermissionGroup> createDefaultViewerRole(Application application) {
        PermissionGroup defaultViewerRole = new PermissionGroup();
        defaultViewerRole.setDefaultDomainId(application.getId());
        defaultViewerRole.setDefaultDomainType(Application.class.getSimpleName());
        defaultViewerRole.setName(generateDefaultRoleNameForResource(APPLICATION_VIEWER, application.getName()));
        defaultViewerRole.setDescription(APPLICATION_VIEWER_DESCRIPTION);
        return permissionGroupService
                .create(defaultViewerRole)
                /*
                 * Default workspace roles: Admin / Developer / App Viewer are given assign/un-assign/read members for
                 * defaultViewerRole.
                 */
                .flatMap(role -> giveDefaultWorkspaceRolesAccessToRole(application.getWorkspaceId(), role))
                .flatMap(role -> generateAndUpdatePoliciesForDefaultViewerRole(role, application));
    }

    /**
     * <p>
     * The method is responsible for generating and adding policies to the application default role - Developer.
     * It is also responsible for updating the policies for the application default role - App Viewer as well, if it exists.
     * Method gives <b>{@code appDeveloperRole}</b>, access to following permissions for <b>{@code appDeveloperRole}</b> and
     * application default role - App Viewer (if it exists).
     * <li> {@link AclPermission}.{@code ASSIGN_PERMISSION_GROUPS}
     * <li> {@link AclPermission}.{@code UNASSIGN_PERMISSION_GROUPS}
     * <li> {@link AclPermission}.{@code READ_PERMISSION_GROUP_MEMBERS}
     *
     * @param appDeveloperRole
     * @param application
     * @implNote The return statement may look similar to the return statement of
     * {@linkplain ApplicationServiceImpl#generateAndUpdatePoliciesForDefaultViewerRole(PermissionGroup, Application)}
     * but there is a very minute difference, i.e., here {@code appViewerRole} is coming from the
     * {@code appViewerRoleFlux}.
     */
    private Mono<PermissionGroup> generateAndUpdatePoliciesForDefaultDeveloperRole(
            PermissionGroup appDeveloperRole, Application application) {
        /*
         * Generate policy map using assign permission group.
         * This way, it will generate a map, which will contain policies related to assign, un-assign and read members
         * permissions which will be added to it's existing policy.
         */
        Map<String, Policy> policyMap = policySolution.generatePolicyFromPermissionWithPermissionGroup(
                permissionGroupPermission.getAssignPermission(), appDeveloperRole.getId());
        policySolution.addPoliciesToExistingObject(policyMap, appDeveloperRole);
        Flux<PermissionGroup> appViewerRoleFlux = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(application.getId(), Application.class.getSimpleName())
                .filter(role -> role.getDefaultDomainType().equals(Application.class.getSimpleName())
                        && role.getName().startsWith(APPLICATION_VIEWER))
                .cache();
        return appViewerRoleFlux
                .hasElements()
                .flatMap(isAppViewerRolePresent -> {
                    if (isAppViewerRolePresent) {
                        return appViewerRoleFlux.single().flatMap(appViewerRole -> {
                            giveDevAppRolePermissionsToViewAppRole(appDeveloperRole, appViewerRole);
                            return permissionGroupService.save(appViewerRole);
                        });
                    }
                    return Mono.empty();
                })
                .then(permissionGroupService.save(appDeveloperRole));
    }

    /**
     * <p>
     * The method is responsible for generating and adding policies to the application default role - App Viewer
     * When updating the policies, it also takes into consideration, whether the Application Developer Role exists or
     * not. Method gives <b>{@code appViewerRole}</b> and application default role - Developer (if it exists) following
     * permissions for <b>{@code appViewerRole}</b>.
     * <li> {@link AclPermission}.{@code ASSIGN_PERMISSION_GROUPS}
     * <li> {@link AclPermission}.{@code UNASSIGN_PERMISSION_GROUPS}
     * <li> {@link AclPermission}.{@code READ_PERMISSION_GROUP_MEMBERS}
     *
     * @param appViewerRole
     * @param application
     * @implNote The return statement may look similar to the return statement of
     * {@linkplain ApplicationServiceImpl#generateAndUpdatePoliciesForDefaultDeveloperRole(PermissionGroup, Application)}
     * but there is a very minute difference, i.e., here {@code appViewerRole} is not coming from the
     * {@code appDeveloperRoleFlux} but from outside its context.
     */
    private Mono<PermissionGroup> generateAndUpdatePoliciesForDefaultViewerRole(
            PermissionGroup appViewerRole, Application application) {
        /*
         * Generate policy map using assign permission group.
         * This way, it will generate a map, which will contain policies related to assign, un-assign and read members
         * permissions which will be added to it's existing policy.
         */
        Map<String, Policy> policyMap = policySolution.generatePolicyFromPermissionWithPermissionGroup(
                permissionGroupPermission.getAssignPermission(), appViewerRole.getId());
        policySolution.addPoliciesToExistingObject(policyMap, appViewerRole);
        Flux<PermissionGroup> appDeveloperRoleFlux = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(application.getId(), Application.class.getSimpleName())
                .filter(role -> role.getDefaultDomainType().equals(Application.class.getSimpleName())
                        && role.getName().startsWith(APPLICATION_DEVELOPER))
                .cache();
        return appDeveloperRoleFlux
                .hasElements()
                .flatMap(isAppDeveloperRolePresent -> {
                    if (isAppDeveloperRolePresent) {
                        return appDeveloperRoleFlux.single().flatMap(developerRole -> {
                            giveDevAppRolePermissionsToViewAppRole(developerRole, appViewerRole);
                            return permissionGroupService.save(appViewerRole);
                        });
                    }
                    return Mono.empty();
                })
                .switchIfEmpty(permissionGroupService.save(appViewerRole));
    }

    /**
     * <p>
     * Method gives the application default role - Developer, access to following permissions for application default
     * role - App Viewer.
     * <ul>
     * <li> {@link AclPermission}.{@code ASSIGN_PERMISSION_GROUPS}
     * <li> {@link AclPermission}.{@code UNASSIGN_PERMISSION_GROUPS}
     * <li> {@link AclPermission}.{@code READ_PERMISSION_GROUP_MEMBERS}
     * </ul>
     *
     * @param devRole  {@link PermissionGroup}
     * @param viewRole {@link PermissionGroup}
     */
    private void giveDevAppRolePermissionsToViewAppRole(PermissionGroup devRole, PermissionGroup viewRole) {
        /*
         * Generate policy map using assign permission group.
         * This way, it will generate a map, which will contain policies related to assign, un-assign and read members
         * permissions which will be added to it's existing policy.
         */
        Map<String, Policy> policyMap = policySolution.generatePolicyFromPermissionWithPermissionGroup(
                permissionGroupPermission.getAssignPermission(), devRole.getId());
        policySolution.addPoliciesToExistingObject(policyMap, viewRole);
    }

    /**
     * Method gives default workspace roles permissions to assign, un-assign and read members permissions to default
     * application role.
     * Default workspace roles - Administrator and Developer are given permissions to default application roles - Developer and App Viewer.
     * Default workspace role - App Viewer is given permissions to default application role - App Viewer.
     * If the role doesn't begin with either <b>Developer</b> or <b>App Viewer</b>,
     * return an {@link AppsmithException} with Error as {@code UNSUPPORTED_OPERATION}.
     *
     * @param workspaceId
     * @param role
     * @return
     */
    private Mono<PermissionGroup> giveDefaultWorkspaceRolesAccessToRole(String workspaceId, PermissionGroup role) {
        Flux<PermissionGroup> allDefaultWorkspaceRoles =
                permissionGroupRepository.findByDefaultDomainIdAndDefaultDomainType(
                        workspaceId, Workspace.class.getSimpleName());
        /*
         * If the role is Application Developer Role, then we only give Workspace Admin and Developer roles, permissions to access it.
         * If the role is Application Viewer Role, then we give Workspace Admin / Developer / App Viewer roles, permissions to access it.
         */
        Flux<PermissionGroup> requiredDefaultWorkspaceRoles;
        if (role.getName().startsWith(APPLICATION_DEVELOPER)) {
            requiredDefaultWorkspaceRoles = allDefaultWorkspaceRoles
                    .filter(role1 -> role1.getName().startsWith(ADMINISTRATOR)
                            || role1.getName().startsWith(DEVELOPER))
                    .cache();
        } else if (role.getName().startsWith(APPLICATION_VIEWER)) {
            requiredDefaultWorkspaceRoles = allDefaultWorkspaceRoles;
        } else {
            return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
        }
        return requiredDefaultWorkspaceRoles.collectList().map(roles -> {
            Set<String> roleIds = roles.stream().map(PermissionGroup::getId).collect(Collectors.toSet());
            PermissionGroup adminPermissionGroup = roles.stream()
                    .filter(adminRoleCandidate -> adminRoleCandidate.getName().startsWith(ADMINISTRATOR))
                    .findFirst()
                    .get();

            /*
             * Making a deep copy of policies, to avoid unnecessary changes which can be reflected in other policies
             * because of the reason mentioned below.
             * At times there is a possibility that the permissionGroups data member inside policy for different policies
             * may have same reference. Due to this it is a possibility that the changes required for a certain policy
             * may end up reflecting in a different policy as well.
             */
            Set<Policy> copyPolicies =
                    role.getPolicies().stream().map(SerializationUtils::clone).collect(Collectors.toSet());
            // Add the workspace role ids to the policies which are related to assign and read members permissions.
            copyPolicies.stream()
                    .filter(policy -> policy.getPermission()
                                    .equals(permissionGroupPermission
                                            .getAssignPermission()
                                            .getValue())
                            || policy.getPermission()
                                    .equals(permissionGroupPermission
                                            .getMembersReadPermission()
                                            .getValue()))
                    .toList()
                    .forEach(policy -> policy.getPermissionGroups().addAll(roleIds));

            // Give the workspace admin role permission to un-assign the application role.
            copyPolicies.stream()
                    .filter(policy -> policy.getPermission()
                            .equals(permissionGroupPermission
                                    .getUnAssignPermission()
                                    .getValue()))
                    .toList()
                    .forEach(policy -> policy.getPermissionGroups().add(adminPermissionGroup.getId()));

            role.setPolicies(copyPolicies);
            return role;
        });
    }

    private Mono<PermissionGroup> updatePoliciesForApplicationAndRelatedResources(
            Application application, PermissionGroup applicationRole, String applicationRoleType) {
        Map<String, List<AclPermission>> permissionListMap =
                getPermissionListMapForDefaultApplicationRole(applicationRoleType);
        Mono<Long> updateAllResourcesWithPermissionForRoleMono = Mono.just(1L);
        Mono<Long> updateApplicationAndRelatedResourcesWithPermissionsForRoleMono =
                roleConfigurationSolution.updateApplicationAndRelatedResourcesWithPermissionsForRole(
                        application.getId(), applicationRole.getId(), permissionListMap, Map.of());
        Mono<Long> updateWorkspaceAndDatasourcesInWorkspaceWithPermissionsForRoleMono =
                roleConfigurationSolution.updateWorkspaceAndDatasourcesInWorkspaceWithPermissionsForRole(
                        application.getWorkspaceId(), applicationRole.getId(), permissionListMap, Map.of());
        Mono<Long> updateEnvironmentsInWorkspaceWithPermissionsForRoleMono =
                roleConfigurationSolution.updateEnvironmentsInWorkspaceWithPermissionsForRole(
                        application.getWorkspaceId(),
                        applicationRole.getId(),
                        applicationRoleType,
                        permissionListMap,
                        Map.of());
        if (APPLICATION_DEVELOPER.equals(applicationRoleType)) {
            /*
             * Updating the resources in sequence, because some common datasources are being updated in both the Monos.
             * This is happening because we are in first mono, we are updating only datasources, which the application
             * is using. In second one, we are updating all the datasources present in the workspace.
             */
            updateAllResourcesWithPermissionForRoleMono = updateApplicationAndRelatedResourcesWithPermissionsForRoleMono
                    .then(updateEnvironmentsInWorkspaceWithPermissionsForRoleMono)
                    .then(updateWorkspaceAndDatasourcesInWorkspaceWithPermissionsForRoleMono)
                    .thenReturn(1L);
        } else if (APPLICATION_VIEWER.equals(applicationRoleType)) {
            updateAllResourcesWithPermissionForRoleMono =
                    updateApplicationAndRelatedResourcesWithPermissionsForRoleMono.then(
                            updateEnvironmentsInWorkspaceWithPermissionsForRoleMono);
        }
        return updateAllResourcesWithPermissionForRoleMono.thenReturn(applicationRole);
    }

    private Map<String, List<AclPermission>> getPermissionListMapForDefaultApplicationRole(String applicationRoleType) {
        AppsmithRole appsmithRole;
        if (applicationRoleType.equals(APPLICATION_DEVELOPER)) {
            appsmithRole = AppsmithRole.APPLICATION_DEVELOPER;
        } else if (applicationRoleType.equals(APPLICATION_VIEWER)) {
            appsmithRole = AppsmithRole.APPLICATION_VIEWER;
        } else {
            throw new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION);
        }

        List<AclPermission> workspacePermissions = appsmithRole.getPermissions().stream()
                .filter(aclPermission -> aclPermission.getEntity().equals(Workspace.class))
                .toList();
        List<AclPermission> applicationPermissions = appsmithRole.getPermissions().stream()
                .filter(aclPermission -> aclPermission.getEntity().equals(Application.class))
                .toList();
        /*
         * Note: WORKSPACE_DATASOURCE_CREATE_DATASOURCE_ACTIONS (workspace permission) has a hierarchical relationship
         * with CREATE_DATASOURCE_ACTIONS (datasource permission), and is required by the application developer role so
         * that it has the permissions to create datasource actions in all the datasources within the workspace, we will
         * need to evaluate this special permission as an indirect datasource permission which is being given to the role.
         *
         * Also, in Application viewer role, we have a direct datasource permission EXECUTE_DATASOURCES.
         *
         * In order to keep the flow generic, we are separately calculating all direct and indirect permissions which
         * would be given to the datasource, and combine them.
         */
        List<AclPermission> directDatasourcePermissions = appsmithRole.getPermissions().stream()
                .filter(aclPermission -> aclPermission.getEntity().equals(Datasource.class))
                .toList();
        Set<AclPermission> indirectDatasourcePermissions =
                policyGenerator.getAllChildPermissions(workspacePermissions, Datasource.class);
        List<AclPermission> datasourcePermissions = new ArrayList<>();
        datasourcePermissions.addAll(directDatasourcePermissions);
        datasourcePermissions.addAll(indirectDatasourcePermissions);

        List<AclPermission> directEnvironmentPermissions = appsmithRole.getPermissions().stream()
                .filter(aclPermission -> aclPermission.getEntity().equals(Environment.class))
                .toList();
        Set<AclPermission> indirectEnvironmentPermissions =
                policyGenerator.getAllChildPermissions(workspacePermissions, Environment.class);
        List<AclPermission> environmentPermissions = new ArrayList<>();
        environmentPermissions.addAll(directEnvironmentPermissions);
        environmentPermissions.addAll(indirectEnvironmentPermissions);

        List<AclPermission> pagePermissions =
                policyGenerator.getAllChildPermissions(applicationPermissions, Page.class).stream()
                        .toList();
        List<AclPermission> actionPermissions =
                policyGenerator.getAllChildPermissions(pagePermissions, Action.class).stream()
                        .toList();

        return Map.of(
                Workspace.class.getSimpleName(),
                workspacePermissions,
                Application.class.getSimpleName(),
                applicationPermissions,
                Datasource.class.getSimpleName(),
                datasourcePermissions,
                Environment.class.getSimpleName(),
                environmentPermissions,
                NewPage.class.getSimpleName(),
                pagePermissions,
                NewAction.class.getSimpleName(),
                actionPermissions);
    }

    /**
     * The method is responsible for deleting a given default application role for application.
     * The role will be deleted if the role's defaultDomainId matches the application's ID, and
     * is either a Developer or App Viewer role.
     * Else it will return an {@link AppsmithException} with Error as {@code UNSUPPORTED_OPERATION}.
     *
     * @param application Application for which the default role is being deleted.
     * @param role        Role which is being deleted.
     */
    @Override
    public Mono<Void> deleteDefaultRole(Application application, PermissionGroup role) {
        if (StringUtils.isNotEmpty(role.getDefaultDomainId())
                && role.getDefaultDomainId().equals(application.getId())
                && (role.getName().startsWith(APPLICATION_VIEWER)
                        || role.getName().startsWith(APPLICATION_DEVELOPER))) {
            return permissionGroupService.deleteWithoutPermission(role.getId());
        } else {
            return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
        }
    }

    /**
     * Returns all the default role types, the logged-in user has access to.
     * If the user has access to assign permission for either default workspace roles - Admin/Developer or default
     * application role - Developer, we return Developer and Viewer role types.
     * If the user has access to assign permission for either default workspace role - App Viewer or  default
     * application role - App Viewer, we return App Viewer role.
     * If none of the default roles are assigned to the user, then we return an empty list.
     *
     * @param applicationId Application ID for which the role types would be fetched.
     * @return {@link Mono}<{@link List}<{@link PermissionGroupInfoDTO}>>
     */
    @Override
    public Mono<List<PermissionGroupInfoDTO>> fetchAllDefaultRoles(String applicationId) {
        Mono<Application> applicationMono = getById(applicationId).cache();

        Flux<PermissionGroup> defaultApplicationRolesFlux =
                applicationMono.flatMapMany(application -> permissionGroupService.getAllDefaultRolesForApplication(
                        application, Optional.of(permissionGroupPermission.getAssignPermission())));
        Flux<PermissionGroup> defaultWorkspaceRolesFlux =
                applicationMono.flatMapMany(application -> permissionGroupService.getByDefaultWorkspaces(
                        Set.of(application.getWorkspaceId()), permissionGroupPermission.getAssignPermission()));

        // Based on default application roles it creates a set of static application roles.
        Mono<Set<String>> accessibleApplicationRolesFromDefaultApplicationRolesMono = defaultApplicationRolesFlux
                .collectList()
                .map(defaultApplicationRoles -> {
                    Set<String> staticApplicationRoles = new HashSet<>();
                    defaultApplicationRoles.stream()
                            .map(this::getAccessibleStaticApplicationRoles)
                            .forEach(staticApplicationRoles::addAll);
                    return staticApplicationRoles;
                });

        // Based on default workspace roles it creates a set of static workspace roles.
        Mono<Set<String>> accessibleApplicationRolesFromDefaultWorkspaceRolesMono = defaultWorkspaceRolesFlux
                .collectList()
                .map(defaultApplicationRoles -> {
                    Set<String> staticApplicationRoles = new HashSet<>();
                    defaultApplicationRoles.stream()
                            .map(this::getAccessibleStaticApplicationRoles)
                            .forEach(staticApplicationRoles::addAll);
                    return staticApplicationRoles;
                });

        /*
         * Here, all the static application roles from accessibleApplicationRolesFromDefaultApplicationRolesMono is calculated first.
         * If the static application roles does not contain both APPLICATION_DEVELOPER & APPLICATION_VIEWER, then
         * static application roles are calculated from accessibleApplicationRolesFromDefaultWorkspaceRolesMono, and
         * appended to the already existing set.
         *
         * This ensures that an extra call to DB is only made, if all the static roles are not present.
         */
        Mono<Set<String>> allAccessibleApplicationRolesMono =
                accessibleApplicationRolesFromDefaultApplicationRolesMono.flatMap(accessibleApplicationRoles -> {
                    if (!areAllStaticApplicationRolesPresent(accessibleApplicationRoles)) {
                        return accessibleApplicationRolesFromDefaultWorkspaceRolesMono.map(
                                accessibleApplicationRoles1 -> {
                                    accessibleApplicationRoles.addAll(accessibleApplicationRoles1);
                                    return accessibleApplicationRoles;
                                });
                    }
                    return Mono.just(accessibleApplicationRoles);
                });

        return allAccessibleApplicationRolesMono.zipWith(applicationMono).map(tuple -> {
            Set<String> roleSet = tuple.getT1();
            Application application = tuple.getT2();
            List<PermissionGroupInfoDTO> roleDescriptionDTOS = new ArrayList<>();
            if (roleSet.contains(APPLICATION_DEVELOPER)) {
                PermissionGroupInfoDTO roleDescriptionDTO = new PermissionGroupInfoDTO();
                roleDescriptionDTO.setName(
                        generateDefaultRoleNameForResource(APPLICATION_DEVELOPER, application.getName()));
                roleDescriptionDTO.setDescription(APPLICATION_DEVELOPER_DESCRIPTION);
                roleDescriptionDTO.setAutoCreated(Boolean.TRUE);
                roleDescriptionDTOS.add(roleDescriptionDTO);
            }
            if (roleSet.contains(APPLICATION_VIEWER)) {
                PermissionGroupInfoDTO roleDescriptionDTO = new PermissionGroupInfoDTO();
                roleDescriptionDTO.setName(
                        generateDefaultRoleNameForResource(APPLICATION_VIEWER, application.getName()));
                roleDescriptionDTO.setDescription(APPLICATION_VIEWER_DESCRIPTION);
                roleDescriptionDTO.setAutoCreated(Boolean.TRUE);
                roleDescriptionDTOS.add(roleDescriptionDTO);
            }
            roleDescriptionDTOS.sort(permissionGroupInfoWithEntityTypeComparator());
            return roleDescriptionDTOS;
        });
    }

    private HashSet<String> getAccessibleStaticApplicationRoles(PermissionGroup role) {
        Set<String> accessibleStaticRoles = Set.of();
        if ((role.getName().startsWith(APPLICATION_DEVELOPER)
                        && role.getDefaultDomainType().equals(Application.class.getSimpleName()))
                || (role.getName().startsWith(ADMINISTRATOR)
                        && role.getDefaultDomainType().equals(Workspace.class.getSimpleName()))
                || (role.getName().startsWith(DEVELOPER)
                        && role.getDefaultDomainType().equals(Workspace.class.getSimpleName()))) {
            accessibleStaticRoles = Set.of(APPLICATION_DEVELOPER, APPLICATION_VIEWER);
        } else if ((role.getName().startsWith(APPLICATION_VIEWER)
                        && role.getDefaultDomainType().equals(Application.class.getSimpleName()))
                || (role.getName().startsWith(VIEWER)
                        && role.getDefaultDomainType().equals(Workspace.class.getSimpleName()))) {
            accessibleStaticRoles = Set.of(APPLICATION_VIEWER);
        }
        return new HashSet<>(accessibleStaticRoles);
    }

    private boolean areAllStaticApplicationRolesPresent(Set<String> staticDefaultRoles) {
        return staticDefaultRoles.containsAll(Set.of(APPLICATION_DEVELOPER, APPLICATION_VIEWER));
    }

    /**
     * The method is responsible for updating the application.
     * It also updates the names of default application roles which are associated with the application, if name of the
     * application is changed.
     *
     * @param applicationId ID of the application to be updated.
     * @param application   Resources to update.
     * @param branchName    updates application in a particular branch.
     * @return
     */
    @Override
    public Mono<Application> update(String applicationId, Application application, String branchName) {
        Mono<Application> updateApplicationMono = super.update(applicationId, application, branchName);
        if (StringUtils.isEmpty(application.getName())) {
            return updateApplicationMono;
        }
        String newApplicationName = application.getName();
        return updateApplicationMono.flatMap(application1 -> {
            /*
             * Here we check if the application which has been updated is the application from default branch, or not.
             * If the application is from any other branch other than the default branch, we don't update
             * the names of default application role.
             */
            if (!isDefaultBranchApplication(application1)) {
                return Mono.just(application1);
            }
            Flux<PermissionGroup> defaultApplicationRoles =
                    permissionGroupService.getAllDefaultRolesForApplication(application1, Optional.empty());
            Flux<PermissionGroup> updateDefaultApplicationRoles = defaultApplicationRoles.flatMap(role -> {
                role.setName(generateNewDefaultName(role.getName(), newApplicationName));
                return permissionGroupService.save(role);
            });
            return updateDefaultApplicationRoles.then(Mono.just(application1));
        });
    }

    private String generateNewDefaultName(String oldName, String applicationName) {
        if (oldName.startsWith(APPLICATION_DEVELOPER)) {
            return generateDefaultRoleNameForResource(APPLICATION_DEVELOPER, applicationName);
        } else if (oldName.startsWith(APPLICATION_VIEWER)) {
            return generateDefaultRoleNameForResource(APPLICATION_VIEWER, applicationName);
        }
        // If this is not a default group i.e. does not start with the expected prefix, don't update it.
        return oldName;
    }

    private boolean isDefaultBranchApplication(Application application) {
        return Objects.isNull(application.getGitApplicationMetadata())
                || application
                        .getGitApplicationMetadata()
                        .getDefaultApplicationId()
                        .equals(application.getId());
    }

    /**
     * The method is responsible for inviting users and user groups to a specific application.
     * This will also create User for usernames, if they don't already exist in the appsmith ecosystem.
     * <br>
     * Restrictions:
     * <ol>
     *     <li>Both usernames and groupsIds can't be null. One of them should be non-empty.</li>
     *     <li>applicationId can't be empty</li>
     *     <li>roleType should be either App Viewer or Developer</li>
     * </ol>
     *
     * @param inviteToApplicationDTO
     * @return {@link Mono}<{@link List}<{@link MemberInfoDTO}>> which contains details about the invited users and
     * user groups who have been invited.
     */
    @Override
    public Mono<List<MemberInfoDTO>> inviteToApplication(
            InviteUsersToApplicationDTO inviteToApplicationDTO, String originHeader) {
        Set<String> usernames = inviteToApplicationDTO.getUsernames();
        Set<String> groupIds = inviteToApplicationDTO.getGroups();
        String applicationId = inviteToApplicationDTO.getApplicationId();
        String appRoleType = inviteToApplicationDTO.getRoleType();

        validateInviteToApplicationDTO(inviteToApplicationDTO);

        Mono<Application> applicationMono = findById(applicationId);
        Mono<PermissionGroup> defaultAppRoleMono = getOrCreateDefaultAppRole(applicationId, appRoleType);

        /*
         * We are initialising the User and UserGroup Mono Lists with empty lists, so that they can be zipped with
         * other non-empty Mono, without any hidden Mono.empty() being returned.
         */
        Mono<List<User>> userListMono = Mono.just(List.of());
        Mono<List<User>> existingUsersMono = Mono.just(List.of());
        Mono<List<User>> newCreatedUsersMono = Mono.just(List.of());
        Mono<List<UserGroup>> groupListMono = Mono.just(List.of());
        Mono<Long> sendInviteUsersToApplicationEvent = Mono.just(1L);
        Mono<User> currentUserMono = sessionUserService.getCurrentUser();
        Mono<String> instanceIdMono = configService.getInstanceId();

        if (CollectionUtils.isNotEmpty(usernames)) {
            Mono<Tuple2<List<User>, List<User>>> usersMono = getExistingAndNewlyCreatedUsers(usernames);
            existingUsersMono =
                    usersMono.flatMap(tuple -> Mono.just(tuple.getT1())).cache();
            newCreatedUsersMono =
                    usersMono.flatMap(tuple -> Mono.just(tuple.getT2())).cache();
            Mono<List<User>> combinedUsersMono = existingUsersMono
                    .flatMapMany(Flux::fromIterable)
                    .concatWith(newCreatedUsersMono.flatMapMany(Flux::fromIterable))
                    .collectList();
            userListMono = combinedUsersMono.cache();
            sendInviteUsersToApplicationEvent = Mono.zip(applicationMono, currentUserMono)
                    .flatMap(tuple ->
                            sendEventAnalyticsForInviteUsersToApplication(tuple.getT2(), usernames, tuple.getT1()))
                    .thenReturn(1L);
        }

        if (CollectionUtils.isNotEmpty(groupIds)) {
            groupListMono =
                    userGroupRepository.findAllById(groupIds).collectList().cache();
        }

        Mono<List<User>> groupsUsersWithNoEmailsSentMono = Mono.zip(
                        getUniqueUsersFromGroupIds(groupListMono), userListMono)
                .flatMap(tuple -> {
                    List<User> usersFromGroups = tuple.getT1();
                    List<User> individualUserList = tuple.getT2();

                    List<String> idsToRemove =
                            individualUserList.stream().map(User::getId).toList();
                    List<User> filteredUsers = usersFromGroups.stream()
                            .filter(user -> !idsToRemove.contains(user.getId()))
                            .toList();

                    return Mono.just(filteredUsers);
                });

        Mono<Boolean> sendEmailsMono = Mono.zip(
                        newCreatedUsersMono,
                        existingUsersMono,
                        groupsUsersWithNoEmailsSentMono,
                        currentUserMono,
                        applicationMono,
                        instanceIdMono)
                .flatMap(tuple -> {
                    List<User> newUsers = tuple.getT1();
                    List<User> existingUsers = tuple.getT2();
                    List<User> groupsUsersWithNoEmailsSent = tuple.getT3();
                    User currentUser = tuple.getT4();
                    Application application = tuple.getT5();
                    String instanceId = tuple.getT6();

                    List<User> allExistingUsers = new ArrayList<>();
                    allExistingUsers.addAll(existingUsers);
                    allExistingUsers.addAll(groupsUsersWithNoEmailsSent);

                    Flux<Boolean> existingUsersFlux = Flux.fromIterable(allExistingUsers)
                            .flatMap(existingUser -> emailService.sendInviteUserToApplicationEmail(
                                    currentUser,
                                    existingUser,
                                    application,
                                    appRoleType,
                                    instanceId,
                                    originHeader,
                                    false));

                    Flux<Boolean> newUsersFlux = Flux.fromIterable(newUsers)
                            .flatMap(newUser -> emailService.sendInviteUserToApplicationEmail(
                                    currentUser, newUser, application, appRoleType, instanceId, originHeader, true));

                    return Flux.concat(existingUsersFlux, newUsersFlux)
                            .all(result -> result); // Check if all email sending operations were successful
                });

        Mono<List<MemberInfoDTO>> invitedMembersListMono =
                assignRolesToUsersAndGroups(defaultAppRoleMono, userListMono, groupListMono);
        Mono<Long> finalSendInviteUsersToApplicationEvent = sendInviteUsersToApplicationEvent;

        return Mono.zip(invitedMembersListMono, finalSendInviteUsersToApplicationEvent)
                .flatMap(tuple -> {
                    List<MemberInfoDTO> invitedMembersList = tuple.getT1();
                    return finalSendInviteUsersToApplicationEvent
                            .then(sendEmailsMono)
                            .thenReturn(invitedMembersList);
                });
    }

    private Mono<User> sendEventAnalyticsForInviteUsersToApplication(
            User currentUser, Set<String> invitedUserEmails, Application application) {
        Map<String, Object> analyticsProperties = new HashMap<>();
        long numberOfUsers = invitedUserEmails.size();
        analyticsProperties.put(FieldName.NUMBER_OF_USERS_INVITED, numberOfUsers);
        Map<String, Object> eventData =
                Map.of(FieldName.USER_EMAILS, invitedUserEmails, FieldName.APPLICATION, application.getName());
        Map<String, Object> extraPropsForCloudHostedInstance =
                Map.of(FieldName.USER_EMAILS, invitedUserEmails, FieldName.APPLICATION, application.getName());
        analyticsProperties.put(FieldName.EVENT_DATA, eventData);
        analyticsProperties.put(FieldName.CLOUD_HOSTED_EXTRA_PROPS, extraPropsForCloudHostedInstance);
        return analyticsService.sendObjectEvent(AnalyticsEvents.EXECUTE_INVITE_USERS, currentUser, analyticsProperties);
    }

    /**
     * The method will either get or create a default application role, based on applicationId and roleType.
     * Firstly we check if the role with the requested roleType exists for the applicationId. This is done, with the
     * assign permission filter, which will check if the user has the ability to assign the role or not.
     * We such a role exists, we return the role as is.
     * Else, we fetch all the static application roles the user has access to.
     * With these 2 conditions, we can determine whether the role needs to be created, or not and throw an error that
     * the user doesn't have permission to invite a user.
     *
     * @param applicationId
     * @param roleType
     * @return
     */
    private Mono<PermissionGroup> getOrCreateDefaultAppRole(String applicationId, String roleType) {
        if (StringUtils.isEmpty(roleType)
                || !(roleType.equals(APPLICATION_VIEWER) || roleType.equals(APPLICATION_DEVELOPER))) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, ROLE));
        }
        Mono<Application> applicationMono = findById(
                        applicationId, Optional.of(applicationPermission.getReadPermission()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, applicationId)))
                .cache();
        Flux<PermissionGroup> defaultAppRoleFlux = applicationMono
                .flatMapMany(application -> permissionGroupService.getAllDefaultRolesForApplication(
                        application, Optional.of(permissionGroupPermission.getAssignPermission())))
                .filter(role -> role.getName().startsWith(roleType))
                .cache();
        return defaultAppRoleFlux.hasElements().flatMap(defaultAppRoleExist -> {
            if (defaultAppRoleExist) {
                return defaultAppRoleFlux.single();
            }

            // This will get a list of all static default application roles, the user has access to.
            Mono<List<PermissionGroupInfoDTO>> userAssignableStaticApplicationRolesMono =
                    fetchAllDefaultRoles(applicationId);
            return Mono.zip(userAssignableStaticApplicationRolesMono, applicationMono)
                    .flatMap(tuple -> {
                        List<PermissionGroupInfoDTO> staticApplicationRoles = tuple.getT1();
                        Application application = tuple.getT2();
                        boolean requiredApplicationRoleCanBeCreated = staticApplicationRoles.stream()
                                .anyMatch(staticRole -> staticRole.getName().startsWith(roleType));
                        if (requiredApplicationRoleCanBeCreated) {
                            return createDefaultRole(application, roleType);
                        }
                        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    });
        });
    }

    /**
     * The method is used to update the default application roles for default application members.
     * Also, once the member has been unassigned from the oldRole, then if the oldRole, doesn't contain any more members
     * to which it has been assigned, then oldRole is deleted.
     * <br>
     * Restrictions:
     * <ol>
     *     <li>Both username and groupsId can't be null. One of them should be non-empty.</li>
     *     <li>oldRole should not be empty and have one of the 2 values: App Viewer or Developer</li>
     *     <li>If newRole is not empty, it should either be App Viewer or Developer</li>
     * </ol>
     *
     * @param applicationId
     * @param updateApplicationRoleDTO
     * @return {@link Mono}<{@link MemberInfoDTO}> updated member info
     */
    @Override
    public Mono<MemberInfoDTO> updateRoleForMember(
            String applicationId, UpdateApplicationRoleDTO updateApplicationRoleDTO) {
        String username = updateApplicationRoleDTO.getUsername();
        String groupId = updateApplicationRoleDTO.getUserGroupId();
        String newRole = updateApplicationRoleDTO.getNewRole();

        validateInputAndRole(username, groupId, newRole);

        MemberInfoDTO memberInfoForUnassignedMember = MemberInfoDTO.builder().build();

        Mono<MemberInfoDTO> unAssignUserAndGroupFromAppRoleAndDeleteRoleIfRequired =
                handleAssignmentAndDeletionIfEmpty(username, groupId, applicationId, memberInfoForUnassignedMember);

        Mono<List<MemberInfoDTO>> invitedToNewRoleMono = Mono.empty();
        if (StringUtils.isNotEmpty(newRole)) {
            invitedToNewRoleMono = inviteToApplicationRole(newRole, username, groupId, applicationId);
        }

        return unAssignUserAndGroupFromAppRoleAndDeleteRoleIfRequired
                .then(invitedToNewRoleMono.map(invitedToNewRole ->
                        invitedToNewRole.stream().findFirst().get()))
                .switchIfEmpty(Mono.just(memberInfoForUnassignedMember));
    }

    /**
     * The method deletes the role, if there are no users or user groups to which the defaultRole has been assigned.
     *
     * @param defaultRole
     * @return
     */
    private Mono<PermissionGroup> deleteDefaultRoleIfNoUserOrUserGroupAssigned(PermissionGroup defaultRole) {
        Mono<PermissionGroup> roleMono = permissionGroupService.findById(defaultRole.getId());
        return roleMono.flatMap(role -> {
            if (CollectionUtils.isEmpty(role.getAssignedToUserIds())
                    && CollectionUtils.isEmpty(role.getAssignedToGroupIds())) {
                return permissionGroupService
                        .deleteWithoutPermission(role.getId())
                        .thenReturn(role);
            }
            return Mono.just(role);
        });
    }

    /**
     * The method returns a hard coded list of all application default roles.
     * Note: We haven't used List.of() and instead used an ArrayList, because we are sorting the order of the roles.
     *
     * @return
     */
    @Override
    public Mono<List<PermissionGroupInfoDTO>> fetchAllDefaultRolesWithoutPermissions() {
        List<PermissionGroupInfoDTO> roleDescriptionDTOS = new ArrayList<>();

        PermissionGroupInfoDTO roleDescriptionDTODeveloper = new PermissionGroupInfoDTO();
        roleDescriptionDTODeveloper.setName(APPLICATION_DEVELOPER);
        roleDescriptionDTODeveloper.setDescription(APPLICATION_DEVELOPER_DESCRIPTION);
        roleDescriptionDTODeveloper.setAutoCreated(Boolean.TRUE);
        roleDescriptionDTOS.add(roleDescriptionDTODeveloper);

        PermissionGroupInfoDTO roleDescriptionDTOViewer = new PermissionGroupInfoDTO();
        roleDescriptionDTOViewer.setName(APPLICATION_VIEWER);
        roleDescriptionDTOViewer.setDescription(APPLICATION_VIEWER_DESCRIPTION);
        roleDescriptionDTOViewer.setAutoCreated(Boolean.TRUE);
        roleDescriptionDTOS.add(roleDescriptionDTOViewer);

        roleDescriptionDTOS.sort(permissionGroupInfoWithEntityTypeComparator());

        return Mono.just(roleDescriptionDTOS);
    }

    @Override
    protected List<Mono<Void>> updatePoliciesForIndependentDomains(
            Application application,
            String permissionGroupId,
            Boolean addViewAccess,
            Flux<String> otherApplicationsWithAccessFlux) {
        List<Mono<Void>> monos = super.updatePoliciesForIndependentDomains(
                application, permissionGroupId, addViewAccess, otherApplicationsWithAccessFlux);

        Map<String, Policy> environmentPolicyMap = policySolution.generatePolicyFromPermissionWithPermissionGroup(
                AclPermission.EXECUTE_ENVIRONMENTS, permissionGroupId);

        Mono<Void> updateEnvironmentMono = policySolution
                .updateDefaultEnvironmentPoliciesByWorkspaceId(
                        application.getWorkspaceId(), environmentPolicyMap, addViewAccess)
                .then();

        Mono<Void> environmentsMono = otherApplicationsWithAccessFlux.count().flatMap(count -> {
            if (count == 0) {
                return updateEnvironmentMono;
            }
            return Mono.empty().then();
        });

        monos.add(environmentsMono);

        return monos;
    }

    private void validateInviteToApplicationDTO(InviteUsersToApplicationDTO inviteToApplicationDTO) {
        if (CollectionUtils.isEmpty(inviteToApplicationDTO.getUsernames())
                && CollectionUtils.isEmpty(inviteToApplicationDTO.getGroups())) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, USERNAME + " or " + GROUP_ID);
        }

        String appRoleType = inviteToApplicationDTO.getRoleType();
        if (StringUtils.isEmpty(appRoleType)
                || !(appRoleType.equals(APPLICATION_VIEWER) || appRoleType.equals(APPLICATION_DEVELOPER))) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, ROLE);
        }

        if (StringUtils.isEmpty(inviteToApplicationDTO.getApplicationId())) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.APPLICATION);
        }
    }

    private Mono<List<MemberInfoDTO>> assignRolesToUsersAndGroups(
            Mono<PermissionGroup> defaultAppRoleMono,
            Mono<List<User>> userListMono,
            Mono<List<UserGroup>> groupListMono) {
        return Mono.zip(defaultAppRoleMono, userListMono, groupListMono)
                .flatMap(tuple -> {
                    PermissionGroup role = tuple.getT1();
                    List<User> users = tuple.getT2();
                    List<UserGroup> groups = tuple.getT3();

                    return permissionGroupService
                            .bulkAssignToUsersAndGroups(role, users, groups)
                            .map(updatedRole -> Tuples.of(updatedRole, users, groups));
                })
                .map(tuple -> {
                    PermissionGroup role = tuple.getT1();
                    List<User> users = tuple.getT2();
                    List<UserGroup> groups = tuple.getT3();

                    PermissionGroupInfoDTO roleInfoDTO = new PermissionGroupInfoDTO(
                            role.getId(),
                            role.getName(),
                            role.getDescription(),
                            role.getDefaultDomainId(),
                            role.getDefaultDomainType(),
                            null);

                    List<MemberInfoDTO> userMembers = users.stream()
                            .map(user -> MemberInfoDTO.builder()
                                    .username(user.getUsername())
                                    .userId(user.getId())
                                    .name(user.getName())
                                    .roles(List.of(roleInfoDTO))
                                    .build())
                            .toList();

                    List<MemberInfoDTO> groupMembers = groups.stream()
                            .map(group -> MemberInfoDTO.builder()
                                    .userGroupId(group.getId())
                                    .name(group.getName())
                                    .roles(List.of(roleInfoDTO))
                                    .build())
                            .toList();

                    return Stream.of(userMembers, groupMembers)
                            .flatMap(Collection::stream)
                            .toList();
                });
    }

    private Mono<List<User>> getOrCreateUsers(Set<String> usernames) {
        return Flux.fromIterable(usernames)
                .flatMap(username -> {
                    User newUser = new User();
                    newUser.setEmail(username.toLowerCase());
                    newUser.setIsEnabled(false);
                    return userService.findByEmail(username).switchIfEmpty(userService.userCreate(newUser, false));
                })
                .collectList()
                .cache();
    }

    private Mono<Tuple2<List<User>, List<User>>> getExistingAndNewlyCreatedUsers(Set<String> usernames) {
        return Flux.fromIterable(usernames)
                .flatMap(username -> {
                    User newUser = new User();
                    newUser.setEmail(username.toLowerCase());
                    newUser.setIsEnabled(false);
                    return userService
                            .findByEmail(username)
                            .flatMap(existingUser -> Mono.just(Tuples.of(existingUser, false)))
                            .switchIfEmpty(Mono.defer(() -> {
                                return userService
                                        .userCreate(newUser, false)
                                        .map(newCreatedUser -> Tuples.of(newCreatedUser, true));
                            }));
                })
                .collectList()
                .flatMap(mixedList -> {
                    List<User> existingUsers = new ArrayList<>();
                    List<User> newCreatedUsers = new ArrayList<>();
                    for (Tuple2<User, Boolean> tuple : mixedList) {
                        if (tuple.getT2()) {
                            newCreatedUsers.add(tuple.getT1());
                        } else {
                            existingUsers.add(tuple.getT1());
                        }
                    }
                    return Mono.just(Tuples.of(existingUsers, newCreatedUsers));
                })
                .cache();
    }

    private Mono<List<User>> combineUsers(Mono<Tuple2<List<User>, List<User>>> usersMono) {
        return usersMono.flatMap(tuple -> {
            List<User> combinedUsers = new ArrayList<>();
            combinedUsers.addAll(tuple.getT1());
            combinedUsers.addAll(tuple.getT2());
            return Mono.just(combinedUsers);
        });
    }

    private Mono<List<MemberInfoDTO>> inviteToApplicationRole(
            String newRole, String username, String groupId, String applicationId) {
        InviteUsersToApplicationDTO inviteToApplicationDTO = new InviteUsersToApplicationDTO();
        inviteToApplicationDTO.setApplicationId(applicationId);
        inviteToApplicationDTO.setRoleType(newRole);

        Set<String> usernames = StringUtils.isNotEmpty(username) ? Set.of(username) : Collections.emptySet();
        Set<String> groupIds = StringUtils.isNotEmpty(groupId) ? Set.of(groupId) : Collections.emptySet();

        Mono<Application> applicationMono = findById(applicationId);
        Mono<PermissionGroup> defaultAppRoleMono = getOrCreateDefaultAppRole(applicationId, newRole);
        Mono<List<User>> userListMono = getOrCreateUsers(usernames).cache();
        Mono<List<UserGroup>> groupListMono =
                userGroupRepository.findAllById(groupIds).collectList().cache();

        Mono<Long> sendInviteUsersToApplicationEvent = Mono.zip(applicationMono, sessionUserService.getCurrentUser())
                .flatMap(
                        tuple -> sendEventAnalyticsForInviteUsersToApplication(tuple.getT2(), usernames, tuple.getT1()))
                .thenReturn(1L);

        Mono<List<MemberInfoDTO>> invitedMembersListMono =
                assignRolesToUsersAndGroups(defaultAppRoleMono, userListMono, groupListMono);

        return invitedMembersListMono.flatMap(sendInviteUsersToApplicationEvent::thenReturn);
    }

    private void validateInputAndRole(String username, String groupId, String newRole) {
        if (StringUtils.isNotEmpty(newRole)
                && !(newRole.equals(APPLICATION_DEVELOPER) || newRole.equals(APPLICATION_VIEWER))) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, "New " + ROLE);
        }

        if ((StringUtils.isEmpty(username) && StringUtils.isEmpty(groupId))
                || (StringUtils.isNotEmpty(username) && StringUtils.isNotEmpty(groupId))) {
            String errorString = "Either " + USERNAME + " or " + GROUP_ID + " should be present.";
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, errorString);
        }
    }

    private Mono<MemberInfoDTO> handleAssignmentAndDeletionIfEmpty(
            String username, String groupId, String applicationId, MemberInfoDTO memberInfoForUnassignedMember) {
        if (StringUtils.isNotEmpty(username)) {
            return handleUserAssignmentAndPermissionGroupUpdate(username, applicationId, memberInfoForUnassignedMember);
        } else if (StringUtils.isNotEmpty(groupId)) {
            return handleGroupAssignmentAndPermissionGroupUpdate(groupId, applicationId, memberInfoForUnassignedMember);
        }
        // Handle the case when neither username nor groupId is provided
        return Mono.error(new AppsmithException(
                AppsmithError.INVALID_PARAMETER, "Either username or groupId should be present."));
    }

    private Mono<MemberInfoDTO> handleUserAssignmentAndPermissionGroupUpdate(
            String username, String applicationId, MemberInfoDTO memberInfoForUnassignedMember) {
        return userService
                .findByEmail(username)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER, username)))
                .flatMap(user -> {
                    Mono<PermissionGroup> oldDefaultRoleMono = permissionGroupRepository
                            .findAllByAssignedToUserIdAndDefaultDomainIdAndDefaultDomainType(
                                    user.getId(),
                                    applicationId,
                                    Application.class.getSimpleName(),
                                    Optional.of(permissionGroupPermission.getAssignPermission()))
                            .switchIfEmpty(Mono.error(new AppsmithException(
                                    AppsmithError.ACTION_IS_NOT_AUTHORIZED, "No application role assigned")))
                            .single();
                    return handleUnassignUserAndDeleteRole(oldDefaultRoleMono, user, memberInfoForUnassignedMember);
                });
    }

    private Mono<MemberInfoDTO> handleGroupAssignmentAndPermissionGroupUpdate(
            String groupId, String applicationId, MemberInfoDTO memberInfoForUnassignedMember) {
        Mono<PermissionGroup> oldDefaultRoleMono = permissionGroupRepository
                .findAllByAssignedToGroupIdAndDefaultDomainIdAndDefaultDomainType(
                        groupId,
                        applicationId,
                        Application.class.getSimpleName(),
                        Optional.of(permissionGroupPermission.getAssignPermission()))
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "No application role assigned")))
                .single();
        return userGroupRepository
                .findById(groupId)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.USER_GROUP, groupId)))
                .flatMap(group ->
                        handleUnassignGroupAndDeleteRole(oldDefaultRoleMono, group, memberInfoForUnassignedMember));
    }

    private Mono<MemberInfoDTO> handleUnassignUserAndDeleteRole(
            Mono<PermissionGroup> oldDefaultRoleMono, User user, MemberInfoDTO memberInfoForUnassignedMember) {
        return oldDefaultRoleMono.zipWith(Mono.just(user)).flatMap(pair -> {
            User assignedUser = pair.getT2();
            memberInfoForUnassignedMember.setUserId(assignedUser.getId());
            memberInfoForUnassignedMember.setUsername(assignedUser.getUsername());
            memberInfoForUnassignedMember.setName(assignedUser.getName());
            return permissionGroupService
                    .unAssignFromUserAndSendEvent(pair.getT1(), assignedUser)
                    .flatMap(this::deleteDefaultRoleIfNoUserOrUserGroupAssigned)
                    .thenReturn(memberInfoForUnassignedMember);
        });
    }

    private Mono<MemberInfoDTO> handleUnassignGroupAndDeleteRole(
            Mono<PermissionGroup> oldDefaultRoleMono,
            UserGroup userGroup,
            MemberInfoDTO memberInfoForUnassignedMember) {
        return oldDefaultRoleMono.zipWith(Mono.just(userGroup)).flatMap(pair -> {
            UserGroup assignedGroup = pair.getT2();
            memberInfoForUnassignedMember.setUserGroupId(assignedGroup.getId());
            memberInfoForUnassignedMember.setName(assignedGroup.getName());
            return permissionGroupService
                    .unAssignFromUserGroupAndSendEvent(pair.getT1(), assignedGroup)
                    .flatMap(this::deleteDefaultRoleIfNoUserOrUserGroupAssigned)
                    .thenReturn(memberInfoForUnassignedMember);
        });
    }

    private Mono<List<User>> getUniqueUsersFromGroupIds(Mono<List<UserGroup>> userGroupsMono) {
        return userGroupsMono
                .flatMapMany(Flux::fromIterable)
                .flatMap(userGroup -> Flux.fromIterable(userGroup.getUsers()))
                .distinct()
                .collectList()
                .flatMap(userIds ->
                        userService.findAllByIdsIn(new HashSet<>(userIds)).collectList());
    }
}

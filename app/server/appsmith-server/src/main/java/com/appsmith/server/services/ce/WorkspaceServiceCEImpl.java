package com.appsmith.server.services.ce;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.acl.RoleGraph;
import com.appsmith.server.constants.Constraint;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Asset;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.RbacPolicy;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.UserInGroup;
import com.appsmith.server.domains.UserRole;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.WorkspacePlugin;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.dtos.UserAndGroupDTO;
import com.appsmith.server.dtos.UserGroupInfoDTO;
import com.appsmith.server.dtos.WorkspacePluginStatus;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PolicyUtils;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.AssetService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.RbacPolicyService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.UserWorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.http.codec.multipart.Part;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import retrofit.http.HEAD;

import org.modelmapper.ModelMapper;

import javax.validation.Validator;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.INVITE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.READ_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.USER_MANAGE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_INVITE_USERS;
import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.DEVELOPER;
import static com.appsmith.server.constants.FieldName.VIEWER;
import static com.appsmith.server.constants.FieldName.WORKSPACE_ADMINISTRATOR_DESCRIPTION;
import static com.appsmith.server.constants.FieldName.WORKSPACE_DEVELOPER_DESCRIPTION;
import static com.appsmith.server.constants.FieldName.WORKSPACE_VIEWER_DESCRIPTION;
import static java.lang.Boolean.TRUE;

@Slf4j
public class WorkspaceServiceCEImpl extends BaseService<WorkspaceRepository, Workspace, String>
        implements WorkspaceServiceCE {

    private final PluginRepository pluginRepository;
    private final SessionUserService sessionUserService;
    private final UserWorkspaceService userWorkspaceService;
    private final UserRepository userRepository;
    private final RoleGraph roleGraph;
    private final AssetRepository assetRepository;
    private final AssetService assetService;
    private final ApplicationRepository applicationRepository;
    private final UserGroupService userGroupService;
    private final PermissionGroupService permissionGroupService;
    private final RbacPolicyService rbacPolicyService;
    private final PolicyUtils policyUtils;
    private final UserService userService;
    private final ModelMapper modelMapper;


    @Autowired
    public WorkspaceServiceCEImpl(Scheduler scheduler,
                                  Validator validator,
                                  MongoConverter mongoConverter,
                                  ReactiveMongoTemplate reactiveMongoTemplate,
                                  WorkspaceRepository repository,
                                  AnalyticsService analyticsService,
                                  PluginRepository pluginRepository,
                                  SessionUserService sessionUserService,
                                  UserWorkspaceService userWorkspaceService,
                                  UserRepository userRepository,
                                  RoleGraph roleGraph,
                                  AssetRepository assetRepository,
                                  AssetService assetService,
                                  ApplicationRepository applicationRepository,
                                  UserGroupService userGroupService,
                                  PermissionGroupService permissionGroupService,
                                  RbacPolicyService rbacPolicyService,
                                  PolicyUtils policyUtils,
                                  UserService userService,
                                  ModelMapper modelMapper) {

        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.pluginRepository = pluginRepository;
        this.sessionUserService = sessionUserService;
        this.userWorkspaceService = userWorkspaceService;
        this.userRepository = userRepository;
        this.roleGraph = roleGraph;
        this.assetRepository = assetRepository;
        this.assetService = assetService;
        this.applicationRepository = applicationRepository;
        this.userGroupService = userGroupService;
        this.permissionGroupService = permissionGroupService;
        this.rbacPolicyService = rbacPolicyService;
        this.policyUtils = policyUtils;
        this.userService = userService;
        this.modelMapper = modelMapper;
    }

    @Override
    public Flux<Workspace> get(MultiValueMap<String, String> params) {
        return sessionUserService.getCurrentUser()
                .flatMapMany(user -> {
                    Set<String> workspaceIds = user.getWorkspaceIds();
                    if (workspaceIds == null || workspaceIds.isEmpty()) {
                        log.error("No workspace set for user: {}. Returning empty list of workspaces", user.getEmail());
                        return Flux.empty();
                    }
                    return repository.findAllById(workspaceIds);
                });
    }

    /**
     * Creates the given workspace as a default workspace for the given user. That is, the workspace's name
     * is changed to "[username]'s apps" and then created. The current value of the workspace name
     * is discarded.
     *
     * @param workspace workspace object to be created.
     * @param user         User to whom this workspace will belong to, as a default workspace.
     * @return Publishes the saved workspace.
     */
    @Override
    public Mono<Workspace> createDefault(final Workspace workspace, User user) {
        workspace.setName(user.computeFirstName() + "'s apps");
        workspace.setIsAutoGeneratedWorkspace(true);
        return create(workspace, user);
    }

    /**
     * This function does the following:
     * 1. Creates the workspace for the user
     * 2. Installs all default plugins for the workspace
     * 3. Creates default groups for the workspace
     * 4. Adds the user to the newly created workspace
     * 5. Assigns the default groups to the user creating the workspace
     *
     * @param workspace Workspace object to be created.
     * @param user         User to whom this workspace will belong to.
     * @return Publishes the saved workspace.
     */
    @Override
    public Mono<Workspace> create(Workspace workspace, User user) {
        if (workspace == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE));
        }

        // Does the user have permissions to create a workspace?
        boolean isManageOrgPolicyPresent = user.getPolicies().stream()
                .anyMatch(policy -> policy.getPermission().equals(USER_MANAGE_WORKSPACES.getValue()));

        if (!isManageOrgPolicyPresent) {
            return Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Create organization"));
        }

        if (workspace.getEmail() == null) {
            workspace.setEmail(user.getEmail());
        }

        workspace.setSlug(TextUtils.makeSlug(workspace.getName()));
        workspace.setTenantId(user.getTenantId());

        return validateObject(workspace)
                // Install all the default plugins when the org is created
                /* TODO: This is a hack. We should ideally use the pluginService.installPlugin() function.
                    Not using it right now because of circular dependency b/w workspaceService and pluginService
                    Also, since all our deployments are single node, this logic will still work
                 */
                .flatMap(org -> pluginRepository.findByDefaultInstall(true)
                        .map(obj -> new WorkspacePlugin(obj.getId(), WorkspacePluginStatus.FREE))
                        .collect(Collectors.toSet())
                        .map(pluginList -> {
                            org.setPlugins(pluginList);
                            return org;
                        }))
                // Save the workspace in the db
                .flatMap(repository::save)
                // Generate the default workspace user & permission groups
                .flatMap(createdWorkspace1 -> {
                    return generateDefaultUserGroups(createdWorkspace1)
                            .zipWith(Mono.just(createdWorkspace1))
                            .flatMap(tuple -> {
                                Set<UserGroup> userGroups = tuple.getT1();
                                Workspace createdWorkspace = tuple.getT2();
                                // Now generate the permission groups and corresponding policies and finally return user groups and permission groups
                                return Mono.zip(
                                        Mono.just(userGroups),
                                        Mono.just(createdWorkspace),
                                        generateDefaultPermissionGroupsAndPolicy(createdWorkspace, userGroups)
                                );
                            })
                            .flatMap(tuple -> {
                                Set<UserGroup> userGroups = tuple.getT1();
                                Workspace createdWorkspace = tuple.getT2();
                                Set<PermissionGroup> permissionGroups = tuple.getT3();

                                createdWorkspace.setDefaultUserGroups(
                                        userGroups.stream()
                                                .map(UserGroup::getId)
                                                .collect(Collectors.toSet())
                                );

                                createdWorkspace.setDefaultPermissionGroups(
                                        permissionGroups.stream()
                                                .map(PermissionGroup::getId)
                                                .collect(Collectors.toSet())
                                );

                                UserGroup admin = userGroups.stream()
                                        .filter(group -> group.getName().startsWith(ADMINISTRATOR))
                                        .findFirst()
                                        .get();

                                // Add the user creating the workspace to the administrator user group
                                admin.setUsers(Set.of(new UserInGroup(user)));

                                // Apply the permissions to the workspace
                                for (PermissionGroup permissionGroup : permissionGroups) {
                                    Map<String, Policy> policyMap = policyUtils.generatePolicyFromPermissionForObject(permissionGroup, createdWorkspace.getId());

                                    createdWorkspace = policyUtils.addPoliciesToExistingObject(policyMap, createdWorkspace);
                                }

                                return Flux.fromIterable(userGroups)
                                        .flatMap(userGroup -> {
                                            // Apply the permissions to the user group
                                            for (PermissionGroup permissionGroup : permissionGroups) {
                                                Map<String, Policy> policyMap = policyUtils.generatePolicyFromPermissionForObject(permissionGroup, userGroup.getId());

                                                userGroup = policyUtils.addPoliciesToExistingObject(policyMap, userGroup);
                                            }

                                            return userGroupService.update(userGroup.getId(), userGroup);
                                        })
                                        .then(repository.save(createdWorkspace));
                            });
                });
    }

    private String generateNewDefaultName(String oldName, String workspaceName) {
        if (oldName.startsWith(ADMINISTRATOR)) {
            return getDefaultNameForGroupInWorkspace(ADMINISTRATOR, workspaceName);
        } else if (oldName.startsWith(DEVELOPER)) {
            return getDefaultNameForGroupInWorkspace(DEVELOPER, workspaceName);
        } else if (oldName.startsWith(VIEWER)) {
            return getDefaultNameForGroupInWorkspace(VIEWER, workspaceName);
        }

        // If this is not a default group aka does not start with the expected prefix, don't update it.
        return oldName;
    }

    @Override
    public String getDefaultNameForGroupInWorkspace(String prefix, String workspaceName) {
        return prefix + " - " + workspaceName;
    }
    private Mono<Set<UserGroup>> generateDefaultUserGroups(Workspace workspace) {
        String workspaceName = workspace.getName();

        // Administrator user group
        UserGroup adminUserGroup = new UserGroup();

        adminUserGroup.setName(getDefaultNameForGroupInWorkspace(ADMINISTRATOR, workspaceName));
        adminUserGroup.setDefaultWorkspaceId(workspace.getId());
        adminUserGroup.setTenantId(workspace.getTenantId());
        adminUserGroup.setDescription(WORKSPACE_ADMINISTRATOR_DESCRIPTION);

        UserGroup developerUserGroup = new UserGroup();
        developerUserGroup.setName(getDefaultNameForGroupInWorkspace(DEVELOPER, workspaceName));
        developerUserGroup.setDefaultWorkspaceId(workspace.getId());
        developerUserGroup.setTenantId(workspace.getTenantId());
        developerUserGroup.setDescription(WORKSPACE_DEVELOPER_DESCRIPTION);

        UserGroup viewerUserGroup = new UserGroup();
        viewerUserGroup.setName(getDefaultNameForGroupInWorkspace(VIEWER, workspaceName));
        viewerUserGroup.setDefaultWorkspaceId(workspace.getId());
        viewerUserGroup.setTenantId(workspace.getTenantId());
        viewerUserGroup.setDescription(WORKSPACE_VIEWER_DESCRIPTION);

        return Flux.fromIterable(List.of(adminUserGroup, developerUserGroup, viewerUserGroup))
                .flatMap(userGroup -> userGroupService.create(userGroup))
                .collect(Collectors.toSet());
    }

    private Mono<Set<PermissionGroup>> generateDefaultPermissionGroupsAndPolicy(Workspace workspace, Set<UserGroup> defaultUserGroups) {
        String workspaceName = workspace.getName();

        UserGroup adminUserGroup = defaultUserGroups.stream()
                .filter(userGroup -> userGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();

        UserGroup developerUserGroup = defaultUserGroups.stream()
                .filter(userGroup -> userGroup.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();

        UserGroup viewerUserGroup = defaultUserGroups.stream()
                .filter(userGroup -> userGroup.getName().startsWith(VIEWER))
                .findFirst()
                .get();

        Set<AclPermission> userGroupAclPermissions = Set.of(READ_USER_GROUPS, INVITE_USER_GROUPS);

        // Administrator permission group
        PermissionGroup adminPermissionGroup = new PermissionGroup();
        adminPermissionGroup.setName(getDefaultNameForGroupInWorkspace(ADMINISTRATOR, workspaceName));
        adminPermissionGroup.setIsDefault(TRUE);
        adminPermissionGroup.setTenantId(workspace.getTenantId());
        adminPermissionGroup.setDescription(WORKSPACE_ADMINISTRATOR_DESCRIPTION);
        Set<Permission> workspacePermissions = AppsmithRole.ORGANIZATION_ADMIN
                .getPermissions()
                .stream()
                .map(aclPermission -> new Permission(workspace.getId(), aclPermission))
                .collect(Collectors.toSet());

        // Give read & invite permissions to all the default user groups for administrator
        Set<Permission> adminUserGroupPermissions = new HashSet<>();
        defaultUserGroups.stream()
                .forEach(userGroup -> {
                    for (AclPermission permission : userGroupAclPermissions) {
                        adminUserGroupPermissions.add(new Permission(userGroup.getId(), permission));
                    }
                });

        Set<Permission> permissionGroup = new HashSet<>();
        permissionGroup.addAll(workspacePermissions);
        permissionGroup.addAll(adminUserGroupPermissions);
        adminPermissionGroup.setPermissions(permissionGroup);

        // Developer permission group
        PermissionGroup developerPermissionGroup = new PermissionGroup();
        developerPermissionGroup.setName(getDefaultNameForGroupInWorkspace(DEVELOPER, workspaceName));
        developerPermissionGroup.setIsDefault(TRUE);
        developerPermissionGroup.setTenantId(workspace.getTenantId());
        developerPermissionGroup.setDescription(WORKSPACE_DEVELOPER_DESCRIPTION);
        workspacePermissions = AppsmithRole.ORGANIZATION_DEVELOPER
                .getPermissions()
                .stream()
                .map(aclPermission -> new Permission(workspace.getId(), aclPermission))
                .collect(Collectors.toSet());

        // Give read & invite permissions to developer & app viewer user groups for developer
        Set<Permission> devUserGroupPermissions = new HashSet<Permission>();
        Set.of(developerUserGroup, viewerUserGroup)
                .stream()
                .forEach(userGroup -> {
                    for (AclPermission permission : userGroupAclPermissions) {
                        devUserGroupPermissions.add(new Permission(userGroup.getId(), permission));
                    }
                });

        permissionGroup = new HashSet<>();
        permissionGroup.addAll(workspacePermissions);
        permissionGroup.addAll(devUserGroupPermissions);
        developerPermissionGroup.setPermissions(permissionGroup);

        // App viewer permission group
        PermissionGroup viewerPermissionGroup = new PermissionGroup();
        viewerPermissionGroup.setName(getDefaultNameForGroupInWorkspace(VIEWER, workspaceName));
        viewerPermissionGroup.setIsDefault(TRUE);
        viewerPermissionGroup.setTenantId(workspace.getTenantId());
        viewerPermissionGroup.setDescription(WORKSPACE_VIEWER_DESCRIPTION);
        workspacePermissions = AppsmithRole.ORGANIZATION_VIEWER
                .getPermissions()
                .stream()
                .map(aclPermission -> new Permission(workspace.getId(), aclPermission))
                .collect(Collectors.toSet());

        // Give read & invite permissions to app viewer user group for developer
        Set<Permission> viewerUserGroupPermissions = new HashSet<Permission>();

        for (AclPermission permission : userGroupAclPermissions) {
            viewerUserGroupPermissions.add(new Permission(viewerUserGroup.getId(), permission));
        }

        permissionGroup = new HashSet<>();
        permissionGroup.addAll(workspacePermissions);
        permissionGroup.addAll(viewerUserGroupPermissions);
        viewerPermissionGroup.setPermissions(permissionGroup);

        return Flux.fromIterable(List.of(adminPermissionGroup, developerPermissionGroup, viewerPermissionGroup))
                .flatMap(permissionGroup1 -> permissionGroupService.create(permissionGroup1))
                .flatMap(savedPermissionGroup -> {
                    // Now create the policy mapping user groups and permission groups
                    RbacPolicy policy = new RbacPolicy();
                    policy.setPermissionGroupIds(Set.of(savedPermissionGroup.getId()));

                    String name = savedPermissionGroup.getName();

                    if (name.startsWith(ADMINISTRATOR)) {
                        policy.setUserGroupId(adminUserGroup.getId());
                    } else if (name.startsWith(DEVELOPER)) {
                        policy.setUserGroupId(developerUserGroup.getId());
                    } else if (name.startsWith(VIEWER)) {
                        policy.setUserGroupId(viewerUserGroup.getId());
                    } else {
                        // Unsupported state
                        return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                    }

                    return rbacPolicyService.create(policy)
                            .thenReturn(savedPermissionGroup);
                })
                .collect(Collectors.toSet());
    }

    /**
     * Create workspace needs to first fetch and embed Setting object in OrganizationSetting
     * for any settings that may have diverged from the default values. Once the
     * settings have been embedded in all the workspace settings, the library
     * function is called to store the enhanced workspace object back in the workspace object.
     */
    @Override
    public Mono<Workspace> create(Workspace workspace) {
        return sessionUserService.getCurrentUser()
                .flatMap(user -> create(workspace, user));
    }

    @Override
    public Mono<Workspace> update(String id, Workspace resource) {
        Mono<Workspace> findWorkspaceMono = repository.findById(id, MANAGE_WORKSPACES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, id)))
                .cache();

        // In case the update is not used to update the policies, then set the policies to null to ensure that the
        // existing policies are not overwritten.
        if (resource.getPolicies().isEmpty()) {
            resource.setPolicies(null);
        }

        Mono<Workspace> updateDefaultGroups_thenReturnWorkspaceMono = findWorkspaceMono;

        String newWorkspaceName = resource.getName();
        if(StringUtils.hasLength(newWorkspaceName)) {
            // There's a change in the workspace name.
            resource.setSlug(TextUtils.makeSlug(newWorkspaceName));
            updateDefaultGroups_thenReturnWorkspaceMono = findWorkspaceMono
                    .flatMap(workspace -> {
                        Set<String> defaultUserGroupsIds = workspace.getDefaultUserGroups();
                        Set<String> defaultPermissionGroupsIds = workspace.getDefaultPermissionGroups();

                        Flux<UserGroup> defaultUserGroupsFlux = userGroupService.findAllByIds(defaultUserGroupsIds);
                        Flux<PermissionGroup> defaultPermissionGroupsFlux = permissionGroupService.findAllByIds(defaultPermissionGroupsIds);

                        Flux<UserGroup> updatedUserGroupFlux = defaultUserGroupsFlux
                                .flatMap(userGroup -> {
                                    userGroup.setName(generateNewDefaultName(userGroup.getName(), newWorkspaceName));
                                    return userGroupService.save(userGroup);
                                });

                        Flux<PermissionGroup> updatedPermissionGroupFlux = defaultPermissionGroupsFlux
                                .flatMap(permissionGroup -> {
                                    permissionGroup.setName(generateNewDefaultName(permissionGroup.getName(), newWorkspaceName));
                                    return permissionGroupService.save(permissionGroup);
                                });

                        return Flux.zip(updatedUserGroupFlux, updatedPermissionGroupFlux)
                                .then(Mono.just(workspace));
                    });
        }

        return updateDefaultGroups_thenReturnWorkspaceMono
                .map(workspaceFromDb -> {
                    AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(resource, workspaceFromDb);
                    return workspaceFromDb;
                })
                .flatMap(this::validateObject)
                .flatMap(repository::save)
                .flatMap(analyticsService::sendUpdateEvent);
    }

    @Override
    public Mono<Workspace> getById(String id) {
        return findById(id, AclPermission.READ_WORKSPACES);
    }

    @Override
    public Mono<Workspace> findById(String id, AclPermission permission) {
        return repository.findById(id, permission);
    }

    @Override
    public Mono<Workspace> save(Workspace workspace) {
        if(StringUtils.hasLength(workspace.getName())) {
            workspace.setSlug(TextUtils.makeSlug(workspace.getName()));
        }
        return repository.save(workspace);
    }

    @Override
    public Mono<Workspace> findByIdAndPluginsPluginId(String workspaceId, String pluginId) {
        return repository.findByIdAndPluginsPluginId(workspaceId, pluginId);
    }

    @Override
    public Flux<Workspace> findByIdsIn(Set<String> ids, String tenantId, AclPermission permission) {
        Sort sort = Sort.by(FieldName.NAME);

        return repository.findByIdsIn(ids, tenantId, permission, sort);
    }

    @Override
    public Mono<List<UserGroupInfoDTO>> getUserGroupsForWorkspace(String workspaceId) {
        if (!StringUtils.hasLength(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        // Read the workspace
        Mono<Workspace> workspaceMono = repository.findById(workspaceId, AclPermission.READ_WORKSPACES);

        // Get default user group ids
        Mono<Set<String>> defaultUserGroups = workspaceMono
                .flatMap(workspace -> Mono.just(workspace.getDefaultUserGroups()));

        // Get default user groups
        Flux<UserGroup> userGroupFlux = defaultUserGroups
                .flatMapMany(userGroupIds -> userGroupService.getAllByIds(userGroupIds, AclPermission.READ_USER_GROUPS));

        // Map to UserGroupInfoDTO
        Flux<UserGroupInfoDTO> userGroupInfoFlux = userGroupFlux
                .map(userGroup -> modelMapper.map(userGroup, UserGroupInfoDTO.class));

        // Convert to List and return
        return userGroupInfoFlux.collectList();
    }

    private List<UserAndGroupDTO> mapUserGroupListToUserAndGroupDTOList(List<UserGroup> userGroupList) {
        Set<UserInGroup> userInGroups = new HashSet<>(); // Set of already collected users
        List<UserAndGroupDTO> userAndGroupDTOList = new ArrayList<>();
        userGroupList.forEach(userGroup -> {
            userGroup.getUsers().stream().filter(userInGroup -> !userInGroups.contains(userInGroup)).forEach(userInGroup -> {
                userAndGroupDTOList.add(UserAndGroupDTO.builder()
                        .username(userInGroup.getUsername())
                        .groupName(userGroup.getName())
                        .groupId(userGroup.getId())
                        .build()); // collect user
                userInGroups.add(userInGroup); // update set of already collected users
            });
        });
        return userAndGroupDTOList;
    }

    @Override
    public Mono<List<UserAndGroupDTO>> getWorkspaceMembers(String workspaceId) {
        if (!StringUtils.hasLength(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        // Read the workspace
        Mono<Workspace> workspaceMono = repository.findById(workspaceId, AclPermission.READ_WORKSPACES);

        // Get default user group ids
        Mono<Set<String>> defaultUserGroups = workspaceMono
                .flatMap(workspace -> Mono.just(workspace.getDefaultUserGroups()));

        // Get default user groups
        Flux<UserGroup> userGroupFlux = defaultUserGroups
                .flatMapMany(userGroupIds -> userGroupService.getAllByIds(userGroupIds, AclPermission.READ_USER_GROUPS));

        // Create a list of UserAndGroupDTO from UserGroup list
        Mono<List<UserAndGroupDTO>> userAndGroupDTOsMono = userGroupFlux
                .collectList()
                .map(this::mapUserGroupListToUserAndGroupDTOList).cache();

        // Create a map of User.username to User
        Mono<Map<String, User>> userMapMono = userAndGroupDTOsMono
                .flatMapMany(Flux::fromIterable)
                .map(UserAndGroupDTO::getUsername)
                .collect(Collectors.toSet())
                .flatMapMany(usernames -> userService.getAllByEmails(usernames, AclPermission.READ_USERS))
                .collectMap(User::getUsername).cache();

        // Update name in the list of UserAndGroupDTO
        userAndGroupDTOsMono = userAndGroupDTOsMono
                .flatMapMany(Flux::fromIterable)
                .zipWith(userMapMono)
                .map(tuple -> {
                    UserAndGroupDTO userAndGroupDTO = tuple.getT1();
                    Map<String, User> userMap = tuple.getT2();
                    userAndGroupDTO.setName(userMap.get(userAndGroupDTO.getUsername()).getName()); // update name
                    return userAndGroupDTO;
                }).collectList().cache();

        return userAndGroupDTOsMono;
    }

    @Override
    public Mono<Workspace> uploadLogo(String workspaceId, Part filePart) {
        final Mono<Workspace> findWorkspaceMono = repository.findById(workspaceId, MANAGE_WORKSPACES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)));

        // We don't execute the upload Mono if we don't find the workspace.
        final Mono<Asset> uploadAssetMono = assetService.upload(filePart, Constraint.WORKSPACE_LOGO_SIZE_KB, false);

        return findWorkspaceMono
                .flatMap(workspace -> Mono.zip(Mono.just(workspace), uploadAssetMono))
                .flatMap(tuple -> {
                    final Workspace workspace = tuple.getT1();
                    final Asset uploadedAsset = tuple.getT2();
                    final String prevAssetId = workspace.getLogoAssetId();

                    workspace.setLogoAssetId(uploadedAsset.getId());
                    return repository.save(workspace)
                            .flatMap(savedWorkspace -> {
                                if (StringUtils.isEmpty(prevAssetId)) {
                                    return Mono.just(savedWorkspace);
                                } else {
                                    return assetService.remove(prevAssetId).thenReturn(savedWorkspace);
                                }
                            });
                });
    }

    @Override
    public Mono<Workspace> deleteLogo(String workspaceId) {
        return repository
                .findById(workspaceId, MANAGE_WORKSPACES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)))
                .flatMap(workspace -> {
                    final String prevAssetId = workspace.getLogoAssetId();
                    if(prevAssetId == null) {
                        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ASSET, prevAssetId));
                    }
                    workspace.setLogoAssetId(null);
                    return assetRepository.findById(prevAssetId)
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ASSET, prevAssetId)))
                            .flatMap(asset -> assetRepository.delete(asset).thenReturn(asset))
                            .flatMap(analyticsService::sendDeleteEvent)
                            .then(repository.save(workspace));
                });
    }

    @Override
    public Flux<Workspace> getAll() {
        return repository.findAllWorkspaces();
    }

    @Override
    public Mono<Workspace> archiveById(String workspaceId) {
        return applicationRepository.countByWorkspaceId(workspaceId).flatMap(appCount -> {
            if(appCount == 0) { // no application found under this workspace
                // fetching the workspace first to make sure user has permission to archive
                return repository.findById(workspaceId, MANAGE_WORKSPACES)
                        .switchIfEmpty(Mono.error(new AppsmithException(
                                AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId
                        )))
                        .flatMap(repository::archive);
            } else {
                return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
            }
        });
    }

}

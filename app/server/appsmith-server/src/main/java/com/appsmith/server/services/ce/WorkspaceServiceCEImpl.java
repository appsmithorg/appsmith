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
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.WorkspacePlugin;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
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
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserWorkspaceService;
import lombok.extern.slf4j.Slf4j;

import org.modelmapper.ModelMapper;
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

import javax.validation.Validator;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_WORKSPACES;
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
    private final PermissionGroupService permissionGroupService;
    private final PolicyUtils policyUtils;
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
                                  PermissionGroupService permissionGroupService,
                                  PolicyUtils policyUtils,
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
        this.permissionGroupService = permissionGroupService;
        this.policyUtils = policyUtils;
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
     * @param user      User to whom this workspace will belong to, as a default workspace.
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
     * @param user      User to whom this workspace will belong to.
     * @return Publishes the saved workspace.
     */
    @Override
    public Mono<Workspace> create(Workspace workspace, User user) {
        if (workspace == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE));
        }

        // Does the user have permissions to create a workspace?
        Mono<Boolean> createWorkspaceAllowedMono = isCreateWorkspaceAllowed();

        if (workspace.getEmail() == null) {
            workspace.setEmail(user.getEmail());
        }

        workspace.setSlug(TextUtils.makeSlug(workspace.getName()));
        workspace.setTenantId(user.getTenantId());

        return createWorkspaceAllowedMono
                .flatMap(isCreateWorkspaceAllowed -> {
                    if (!isCreateWorkspaceAllowed) {
                        return Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Create workspace"));
                    }
                    return validateObject(workspace);
                })
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
                // Generate the default permission groups & policy for the current user
                .flatMap(createdWorkspace1 -> {
                    return Mono.zip(generateDefaultPermissionGroups(createdWorkspace1, user), Mono.just(createdWorkspace1))
                            .flatMap(tuple -> {

                                Set<PermissionGroup> permissionGroups = tuple.getT1();
                                Workspace createdWorkspace = tuple.getT2();

                                createdWorkspace.setDefaultPermissionGroups(
                                        permissionGroups.stream()
                                                .map(PermissionGroup::getId)
                                                .collect(Collectors.toSet())
                                );

                                // Apply the permissions to the workspace
                                for (PermissionGroup permissionGroup : permissionGroups) {
                                    Map<String, Policy> policyMap = policyUtils.generatePolicyFromPermissionGroupForObject(permissionGroup, createdWorkspace.getId());

                                    createdWorkspace = policyUtils.addPoliciesToExistingObject(policyMap, createdWorkspace);
                                }

                                return repository.save(createdWorkspace);
                            });
                })
                .flatMap(analyticsService::sendCreateEvent);
    }

    private Mono<Boolean> isCreateWorkspaceAllowed() {
        return Mono.just(TRUE);
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

    private Mono<Set<PermissionGroup>> generateDefaultPermissionGroupsWithoutPermissions(Workspace workspace) {
        String workspaceName = workspace.getName();
        String workspaceId = workspace.getId();
        // Administrator permission group
        PermissionGroup adminPermissionGroup = new PermissionGroup();
        adminPermissionGroup.setName(getDefaultNameForGroupInWorkspace(ADMINISTRATOR, workspaceName));
        adminPermissionGroup.setDefaultWorkspaceId(workspaceId);
        adminPermissionGroup.setTenantId(workspace.getTenantId());
        adminPermissionGroup.setDescription(WORKSPACE_ADMINISTRATOR_DESCRIPTION);
        adminPermissionGroup.setPermissions(Set.of());

        // Developer permission group
        PermissionGroup developerPermissionGroup = new PermissionGroup();
        developerPermissionGroup.setName(getDefaultNameForGroupInWorkspace(DEVELOPER, workspaceName));
        developerPermissionGroup.setDefaultWorkspaceId(workspaceId);
        developerPermissionGroup.setTenantId(workspace.getTenantId());
        developerPermissionGroup.setDescription(WORKSPACE_DEVELOPER_DESCRIPTION);
        developerPermissionGroup.setPermissions(Set.of());

        // App viewer permission group
        PermissionGroup viewerPermissionGroup = new PermissionGroup();
        viewerPermissionGroup.setName(getDefaultNameForGroupInWorkspace(VIEWER, workspaceName));
        viewerPermissionGroup.setDefaultWorkspaceId(workspaceId);
        viewerPermissionGroup.setTenantId(workspace.getTenantId());
        viewerPermissionGroup.setDescription(WORKSPACE_VIEWER_DESCRIPTION);
        viewerPermissionGroup.setPermissions(Set.of());

        return Flux.fromIterable(List.of(adminPermissionGroup, developerPermissionGroup, viewerPermissionGroup))
                .flatMap(permissionGroup1 -> permissionGroupService.create(permissionGroup1))
                .collect(Collectors.toSet());
    }

    Mono<Set<PermissionGroup>> generatePermissionsForDefaultPermissionGroups(Set<PermissionGroup> permissionGroups, Workspace workspace, User user) {
        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst().get();
        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst().get();
        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst().get();

        // Administrator permissions
        Set<Permission> workspacePermissions = AppsmithRole.ORGANIZATION_ADMIN
                .getPermissions()
                .stream()
                .filter(aclPermission -> aclPermission.getEntity().equals(Workspace.class))
                .map(aclPermission -> new Permission(workspace.getId(), aclPermission))
                .collect(Collectors.toSet());
        // The administrator should also be able to assign any of the three permissions groups
        Set<Permission> assignPermissionGroupPermissions = permissionGroups.stream()
                .map(permissionGroup -> new Permission(permissionGroup.getId(), AclPermission.ASSIGN_PERMISSION_GROUPS))
                .collect(Collectors.toSet());
        // All the default permission groups should be readable by all the members of the workspace
        Set<Permission> readPermissionGroupPermissions = permissionGroups.stream()
                .map(permissionGroup -> new Permission(permissionGroup.getId(), AclPermission.READ_PERMISSION_GROUPS))
                .collect(Collectors.toSet());
        Set<Permission> unassignPermissionGroupPermissions = permissionGroups.stream()
                .map(permissionGroup -> new Permission(permissionGroup.getId(), AclPermission.UNASSIGN_PERMISSION_GROUPS))
                .collect(Collectors.toSet());


        Set<Permission> permissions = new HashSet<>();
        permissions.addAll(workspacePermissions);
        permissions.addAll(assignPermissionGroupPermissions);
        permissions.addAll(readPermissionGroupPermissions);
        permissions.addAll(unassignPermissionGroupPermissions);
        adminPermissionGroup.setPermissions(permissions);

        // Assign the user creating the permission group to this permission group
        adminPermissionGroup.setAssignedToUserIds(Set.of(user.getId()));

        // Developer Permissions
        workspacePermissions = AppsmithRole.ORGANIZATION_DEVELOPER
                .getPermissions()
                .stream()
                .filter(aclPermission -> aclPermission.getEntity().equals(Workspace.class))
                .map(aclPermission -> new Permission(workspace.getId(), aclPermission))
                .collect(Collectors.toSet());
        // The developer should also be able to assign developer & viewer permission groups
        assignPermissionGroupPermissions = Set.of(developerPermissionGroup, viewerPermissionGroup).stream()
                .map(permissionGroup -> new Permission(permissionGroup.getId(), ASSIGN_PERMISSION_GROUPS))
                .collect(Collectors.toSet());
        permissions = new HashSet<>();
        permissions.addAll(workspacePermissions);
        permissions.addAll(assignPermissionGroupPermissions);
        permissions.addAll(readPermissionGroupPermissions);
        developerPermissionGroup.setPermissions(permissions);

        // App Viewer Permissions
        workspacePermissions = AppsmithRole.ORGANIZATION_VIEWER
                .getPermissions()
                .stream()
                .filter(aclPermission -> aclPermission.getEntity().equals(Workspace.class))
                .map(aclPermission -> new Permission(workspace.getId(), aclPermission))
                .collect(Collectors.toSet());
        // The app viewers should also be able to assign to viewer permission groups
        assignPermissionGroupPermissions = Set.of(viewerPermissionGroup).stream()
                .map(permissionGroup -> new Permission(permissionGroup.getId(), ASSIGN_PERMISSION_GROUPS))
                .collect(Collectors.toSet());
        permissions = new HashSet<>();
        permissions.addAll(workspacePermissions);
        permissions.addAll(assignPermissionGroupPermissions);
        permissions.addAll(readPermissionGroupPermissions);
        viewerPermissionGroup.setPermissions(permissions);

        Mono<Set<PermissionGroup>> savedPermissionGroupsMono = Flux.fromIterable(permissionGroups)
                .flatMap(permissionGroup -> permissionGroupService.save(permissionGroup))
                .collect(Collectors.toSet())
                .flatMapMany(savedPermissionGroups -> {
                    // Apply the permissions to the permission groups
                    for (PermissionGroup permissionGroup : savedPermissionGroups) {
                        for (PermissionGroup nestedPermissionGroup : savedPermissionGroups) {
                            Map<String, Policy> policyMap = policyUtils.generatePolicyFromPermissionGroupForObject(permissionGroup, nestedPermissionGroup.getId());
                            policyUtils.addPoliciesToExistingObject(policyMap, nestedPermissionGroup);
                        }
                    }

                    return Flux.fromIterable(savedPermissionGroups);
                })
                .flatMap(permissionGroup -> permissionGroupService.save(permissionGroup))
                .collect(Collectors.toSet());

        // Also evict the cache entry for the user creating the workspace to ensure that the user cache has the latest permissions
        Mono<Boolean> cleanPermissionGroupCacheForCurrentUser =
                permissionGroupService.cleanPermissionGroupCacheForUsers(List.of(user.getId()))
                        .thenReturn(TRUE);

        return Mono.zip(
                        savedPermissionGroupsMono,
                        cleanPermissionGroupCacheForCurrentUser
                )
                .map(tuple -> tuple.getT1());
    }

    private Mono<Set<PermissionGroup>> generateDefaultPermissionGroups(Workspace workspace, User user) {

        return generateDefaultPermissionGroupsWithoutPermissions(workspace)
                // Generate the permissions per permission group
                .flatMap(permissionGroups -> generatePermissionsForDefaultPermissionGroups(permissionGroups, workspace, user));
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
        if (StringUtils.hasLength(newWorkspaceName)) {
            // There's a change in the workspace name.
            resource.setSlug(TextUtils.makeSlug(newWorkspaceName));
            updateDefaultGroups_thenReturnWorkspaceMono = findWorkspaceMono
                    .flatMap(workspace -> {
                        Set<String> defaultPermissionGroupsIds = workspace.getDefaultPermissionGroups();

                        Flux<PermissionGroup> defaultPermissionGroupsFlux = permissionGroupService.findAllByIds(defaultPermissionGroupsIds);

                        Flux<PermissionGroup> updatedPermissionGroupFlux = defaultPermissionGroupsFlux
                                .flatMap(permissionGroup -> {
                                    permissionGroup.setName(generateNewDefaultName(permissionGroup.getName(), newWorkspaceName));
                                    return permissionGroupService.save(permissionGroup);
                                });

                        return updatedPermissionGroupFlux
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
        if (StringUtils.hasLength(workspace.getName())) {
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
    public Mono<List<PermissionGroupInfoDTO>> getPermissionGroupsForWorkspace(String workspaceId) {
        if (!StringUtils.hasLength(workspaceId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
        }

        // Read the workspace
        Mono<Workspace> workspaceMono = repository.findById(workspaceId, AclPermission.READ_WORKSPACES);

        // Get default permission groups
        Flux<PermissionGroup> permissionGroupFlux = workspaceMono
                .flatMapMany(workspace -> permissionGroupService.getByDefaultWorkspace(workspace, AclPermission.ASSIGN_PERMISSION_GROUPS));

        // Map to PermissionGroupInfoDTO
        Flux<PermissionGroupInfoDTO> permissionGroupInfoFlux = permissionGroupFlux
                .map(permissionGroup -> modelMapper.map(permissionGroup, PermissionGroupInfoDTO.class));

        Mono<List<PermissionGroupInfoDTO>> permissionGroupInfoDTOListMono = permissionGroupInfoFlux.collectList()
                .map(list -> {
                    PermissionGroupInfoDTO[] permissionGroupInfoDTOArray = new PermissionGroupInfoDTO[3];
                    
                    // populate array with admin at index 0, developer at index 1 and viewer at index 2
                    list.forEach(item -> {
                        if(item.getName().startsWith(FieldName.ADMINISTRATOR)) {
                            permissionGroupInfoDTOArray[0] = item;
                        } else if(item.getName().startsWith(FieldName.DEVELOPER)) {
                            permissionGroupInfoDTOArray[1] = item;
                        } else if(item.getName().startsWith(FieldName.VIEWER)) {
                            permissionGroupInfoDTOArray[2] = item;
                        }
                    });

                    // Convert to list removing null elements
                    return Arrays.asList(permissionGroupInfoDTOArray).stream()
                            .filter(Objects::nonNull)
                            .collect(Collectors.toList());
                });

       return permissionGroupInfoDTOListMono;
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
                    if (prevAssetId == null) {
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
            if (appCount == 0) { // no application found under this workspace
                // fetching the workspace first to make sure user has permission to archive
                return repository.findById(workspaceId, MANAGE_WORKSPACES)
                        .switchIfEmpty(Mono.error(new AppsmithException(
                                AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId
                        )))
                        .flatMap(repository::archive)
                        .flatMap(analyticsService::sendDeleteEvent);
            } else {
                return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
            }
        });
    }

    @Override
    public Flux<Workspace> getAll(AclPermission permission) {
        return repository.findAll(permission);
    }

}

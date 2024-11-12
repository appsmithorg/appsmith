package com.appsmith.server.services.ce;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.AppsmithRole;
import com.appsmith.server.constants.Constraint;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Asset;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.WorkspacePlugin;
import com.appsmith.server.dtos.AlloyWorkspaceTokenDTO;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.WorkspacePluginStatus;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.TextUtils;
import com.appsmith.server.helpers.WorkspaceServiceHelper;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.AssetRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.AssetService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.PermissionGroupPermission;
import com.appsmith.server.solutions.PolicySolution;
import com.appsmith.server.solutions.WorkspacePermission;
import com.appsmith.util.WebClientUtils;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.http.codec.multipart.Part;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.DEVELOPER;
import static com.appsmith.server.constants.FieldName.EMAIL;
import static com.appsmith.server.constants.FieldName.VIEWER;
import static com.appsmith.server.constants.FieldName.WEBSITE;
import static com.appsmith.server.constants.FieldName.WORKSPACE_ADMINISTRATOR_DESCRIPTION;
import static com.appsmith.server.constants.FieldName.WORKSPACE_DEVELOPER_DESCRIPTION;
import static com.appsmith.server.constants.FieldName.WORKSPACE_VIEWER_DESCRIPTION;
import static com.appsmith.server.constants.PatternConstants.EMAIL_PATTERN;
import static com.appsmith.server.constants.PatternConstants.WEBSITE_PATTERN;
import static com.appsmith.server.helpers.PermissionUtils.collateAllPermissions;
import static com.appsmith.server.helpers.TextUtils.generateDefaultRoleNameForResource;
import static java.lang.Boolean.TRUE;

@Slf4j
@Service
public class WorkspaceServiceCEImpl extends BaseService<WorkspaceRepository, Workspace, String>
        implements WorkspaceServiceCE {

    private final PluginRepository pluginRepository;
    private final SessionUserService sessionUserService;
    private final AssetRepository assetRepository;
    private final AssetService assetService;
    private final ApplicationRepository applicationRepository;
    protected final PermissionGroupService permissionGroupService;
    private final PolicySolution policySolution;
    private final ModelMapper modelMapper;
    private final WorkspacePermission workspacePermission;
    private final PermissionGroupPermission permissionGroupPermission;
    private final WorkspaceServiceHelper workspaceServiceHelper;

    @Value("${appsmith.alloy.api.key}")
    private String alloyApiKey;

    @Autowired
    public WorkspaceServiceCEImpl(
            Validator validator,
            WorkspaceRepository repository,
            AnalyticsService analyticsService,
            PluginRepository pluginRepository,
            SessionUserService sessionUserService,
            AssetRepository assetRepository,
            AssetService assetService,
            ApplicationRepository applicationRepository,
            PermissionGroupService permissionGroupService,
            PolicySolution policySolution,
            ModelMapper modelMapper,
            WorkspacePermission workspacePermission,
            PermissionGroupPermission permissionGroupPermission,
            WorkspaceServiceHelper workspaceServiceHelper) {

        super(validator, repository, analyticsService);
        this.pluginRepository = pluginRepository;
        this.sessionUserService = sessionUserService;
        this.assetRepository = assetRepository;
        this.assetService = assetService;
        this.applicationRepository = applicationRepository;
        this.permissionGroupService = permissionGroupService;
        this.policySolution = policySolution;
        this.modelMapper = modelMapper;
        this.workspacePermission = workspacePermission;
        this.permissionGroupPermission = permissionGroupPermission;
        this.workspaceServiceHelper = workspaceServiceHelper;
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
        return create(workspace, user, TRUE);
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
     * @param isDefault
     * @return Publishes the saved workspace.
     */
    @Override
    public Mono<Workspace> create(Workspace workspace, User user, Boolean isDefault) {
        if (workspace == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE));
        }

        // Does the user have permissions to create a workspace?
        Mono<Boolean> createWorkspaceAllowedMono = workspaceServiceHelper.isCreateWorkspaceAllowed(isDefault);

        // Populate all the required fields for a valid workspace
        prepareWorkspaceToCreate(workspace, user);

        return createWorkspaceAllowedMono
                .flatMap(isCreateWorkspaceAllowed -> {
                    if (!isCreateWorkspaceAllowed) {
                        return Mono.error(
                                new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "Create workspace"));
                    }
                    return validateObject(workspace);
                })
                // Install all the default plugins when the org is created
                /* TODO: This is a hack. We should ideally use the pluginService.installPlugin() function.
                   Not using it right now because of circular dependency b/w workspaceService and pluginService
                   Also, since all our deployments are single node, this logic will still work
                */
                .flatMap(org -> pluginRepository
                        .findByDefaultInstall(true)
                        .filter(plugin -> plugin.getId() != null)
                        .map(obj -> new WorkspacePlugin(obj.getId(), WorkspacePluginStatus.FREE))
                        .collect(Collectors.toSet())
                        .map(pluginList -> {
                            org.setPlugins(pluginList);
                            return org;
                        }))
                // Save the workspace in the db
                .flatMap(repository::save)
                .zipWhen(createdWorkspace -> generateDefaultPermissionGroups(createdWorkspace, user))
                .flatMap(tuple -> {
                    Workspace createdWorkspace = tuple.getT1();
                    Set<PermissionGroup> permissionGroups = tuple.getT2();
                    return addPoliciesAndSaveWorkspace(permissionGroups, createdWorkspace);
                })
                .flatMap(this::createWorkspaceDependents)
                .flatMap(analyticsService::sendCreateEvent);
    }

    protected void prepareWorkspaceToCreate(Workspace workspace, User user) {
        if (workspace.getEmail() == null) {
            workspace.setEmail(user.getEmail());
        }

        workspace.setSlug(TextUtils.makeSlug(workspace.getName()));
        workspace.setTenantId(user.getTenantId());
    }

    protected Mono<Workspace> createWorkspaceDependents(Workspace createdWorkspace) {
        // Nothing to create
        return Mono.just(createdWorkspace);
    }

    protected Mono<Workspace> addPoliciesAndSaveWorkspace(
            Set<PermissionGroup> permissionGroups, Workspace createdWorkspace) {
        createdWorkspace.setDefaultPermissionGroups(
                permissionGroups.stream().map(PermissionGroup::getId).collect(Collectors.toSet()));
        // Apply the permissions to the workspace
        for (PermissionGroup permissionGroup : permissionGroups) {
            Map<String, Policy> policyMap = policySolution.generatePolicyFromPermissionGroupForObject(
                    permissionGroup, createdWorkspace.getId());
            createdWorkspace = policySolution.addPoliciesToExistingObject(policyMap, createdWorkspace);
        }
        return repository.save(createdWorkspace);
    }

    @Override
    public Mono<String> getDefaultEnvironmentId(String workspaceId, AclPermission aclPermission) {
        return Mono.just(FieldName.UNUSED_ENVIRONMENT_ID);
    }

    private String generateNewDefaultName(String oldName, String workspaceName) {
        if (oldName.startsWith(ADMINISTRATOR)) {
            return generateDefaultRoleNameForResource(ADMINISTRATOR, workspaceName);
        } else if (oldName.startsWith(DEVELOPER)) {
            return generateDefaultRoleNameForResource(DEVELOPER, workspaceName);
        } else if (oldName.startsWith(VIEWER)) {
            return generateDefaultRoleNameForResource(VIEWER, workspaceName);
        }

        // If this is not a default group aka does not start with the expected prefix, don't update it.
        return oldName;
    }

    private Mono<Set<PermissionGroup>> generateDefaultPermissionGroupsWithoutPermissions(Workspace workspace) {
        String workspaceName = workspace.getName();
        String workspaceId = workspace.getId();
        // Administrator permission group
        PermissionGroup adminPermissionGroup = new PermissionGroup();
        adminPermissionGroup.setName(generateDefaultRoleNameForResource(ADMINISTRATOR, workspaceName));
        adminPermissionGroup.setDefaultDomainId(workspaceId);
        adminPermissionGroup.setDefaultDomainType(Workspace.class.getSimpleName());
        adminPermissionGroup.setTenantId(workspace.getTenantId());
        adminPermissionGroup.setDescription(WORKSPACE_ADMINISTRATOR_DESCRIPTION);
        adminPermissionGroup.setPermissions(Set.of());

        // Developer permission group
        PermissionGroup developerPermissionGroup = new PermissionGroup();
        developerPermissionGroup.setName(generateDefaultRoleNameForResource(DEVELOPER, workspaceName));
        developerPermissionGroup.setDefaultDomainId(workspaceId);
        developerPermissionGroup.setDefaultDomainType(Workspace.class.getSimpleName());
        developerPermissionGroup.setTenantId(workspace.getTenantId());
        developerPermissionGroup.setDescription(WORKSPACE_DEVELOPER_DESCRIPTION);
        developerPermissionGroup.setPermissions(Set.of());

        // App viewer permission group
        PermissionGroup viewerPermissionGroup = new PermissionGroup();
        viewerPermissionGroup.setName(generateDefaultRoleNameForResource(VIEWER, workspaceName));
        viewerPermissionGroup.setDefaultDomainId(workspaceId);
        viewerPermissionGroup.setDefaultDomainType(Workspace.class.getSimpleName());
        viewerPermissionGroup.setTenantId(workspace.getTenantId());
        viewerPermissionGroup.setDescription(WORKSPACE_VIEWER_DESCRIPTION);
        viewerPermissionGroup.setPermissions(Set.of());

        return Flux.fromIterable(List.of(adminPermissionGroup, developerPermissionGroup, viewerPermissionGroup))
                .flatMap(permissionGroup1 -> permissionGroupService.create(permissionGroup1))
                .collect(Collectors.toSet());
    }

    Mono<Set<PermissionGroup>> generatePermissionsForDefaultPermissionGroups(
            Set<PermissionGroup> permissionGroups, Workspace workspace, User user) {
        PermissionGroup adminPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();
        PermissionGroup developerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();
        PermissionGroup viewerPermissionGroup = permissionGroups.stream()
                .filter(permissionGroup -> permissionGroup.getName().startsWith(VIEWER))
                .findFirst()
                .get();

        // Administrator permissions
        Set<Permission> workspacePermissions = AppsmithRole.ORGANIZATION_ADMIN.getPermissions().stream()
                .filter(aclPermission -> aclPermission.getEntity().equals(Workspace.class))
                .map(aclPermission -> new Permission(workspace.getId(), aclPermission))
                .collect(Collectors.toSet());
        // The administrator should also be able to assign any of the three permissions groups
        Set<Permission> assignPermissionGroupPermissions = permissionGroups.stream()
                .map(permissionGroup -> new Permission(permissionGroup.getId(), AclPermission.ASSIGN_PERMISSION_GROUPS))
                .collect(Collectors.toSet());
        // All the default permission groups should be readable by all the members of the workspace
        Set<Permission> readPermissionGroupPermissions = permissionGroups.stream()
                .map(permissionGroup ->
                        new Permission(permissionGroup.getId(), AclPermission.READ_PERMISSION_GROUP_MEMBERS))
                .collect(Collectors.toSet());
        // All the default permission groups should be unassignable by the administrator role of the workspace
        Set<Permission> unassignPermissionGroupPermissions = permissionGroups.stream()
                .map(permissionGroup ->
                        new Permission(permissionGroup.getId(), AclPermission.UNASSIGN_PERMISSION_GROUPS))
                .collect(Collectors.toSet());

        Set<Permission> permissions = collateAllPermissions(
                workspacePermissions,
                assignPermissionGroupPermissions,
                readPermissionGroupPermissions,
                unassignPermissionGroupPermissions);
        adminPermissionGroup.setPermissions(permissions);

        // Assign the user creating the permission group to this permission group
        adminPermissionGroup.setAssignedToUserIds(Set.of(user.getId()));

        // Developer Permissions
        workspacePermissions = AppsmithRole.ORGANIZATION_DEVELOPER.getPermissions().stream()
                .filter(aclPermission -> aclPermission.getEntity().equals(Workspace.class))
                .map(aclPermission -> new Permission(workspace.getId(), aclPermission))
                .collect(Collectors.toSet());
        // The developer should also be able to assign developer & viewer permission groups
        assignPermissionGroupPermissions = Set.of(developerPermissionGroup, viewerPermissionGroup).stream()
                .map(permissionGroup -> new Permission(permissionGroup.getId(), ASSIGN_PERMISSION_GROUPS))
                .collect(Collectors.toSet());
        permissions = collateAllPermissions(
                workspacePermissions, assignPermissionGroupPermissions, readPermissionGroupPermissions);
        developerPermissionGroup.setPermissions(permissions);

        // App Viewer Permissions
        workspacePermissions = AppsmithRole.ORGANIZATION_VIEWER.getPermissions().stream()
                .filter(aclPermission -> aclPermission.getEntity().equals(Workspace.class))
                .map(aclPermission -> new Permission(workspace.getId(), aclPermission))
                .collect(Collectors.toSet());
        // The app viewers should also be able to assign to viewer permission groups
        assignPermissionGroupPermissions = Set.of(viewerPermissionGroup).stream()
                .map(permissionGroup -> new Permission(permissionGroup.getId(), ASSIGN_PERMISSION_GROUPS))
                .collect(Collectors.toSet());

        permissions = collateAllPermissions(
                workspacePermissions, assignPermissionGroupPermissions, readPermissionGroupPermissions);
        viewerPermissionGroup.setPermissions(permissions);

        Mono<Set<PermissionGroup>> savedPermissionGroupsMono = Flux.fromIterable(permissionGroups)
                .flatMap(permissionGroup -> permissionGroupService.save(permissionGroup))
                .collect(Collectors.toSet())
                .flatMapMany(savedPermissionGroups -> {
                    // Apply the permissions to the permission groups
                    for (PermissionGroup permissionGroup : savedPermissionGroups) {
                        for (PermissionGroup nestedPermissionGroup : savedPermissionGroups) {
                            Map<String, Policy> policyMap = policySolution.generatePolicyFromPermissionGroupForObject(
                                    permissionGroup, nestedPermissionGroup.getId());
                            policySolution.addPoliciesToExistingObject(policyMap, nestedPermissionGroup);
                        }
                    }

                    return Flux.fromIterable(savedPermissionGroups);
                })
                .flatMap(permissionGroup -> permissionGroupService.save(permissionGroup))
                .collect(Collectors.toSet());

        // Also evict the cache entry for the user creating the workspace to ensure that the user cache has the latest
        // permissions
        Mono<Boolean> cleanPermissionGroupCacheForCurrentUser = permissionGroupService
                .cleanPermissionGroupCacheForUsers(List.of(user.getId()))
                .thenReturn(TRUE);

        return savedPermissionGroupsMono.flatMap(
                savedPermissionGroups -> cleanPermissionGroupCacheForCurrentUser.thenReturn(savedPermissionGroups));
    }

    protected Mono<Set<PermissionGroup>> generateDefaultPermissionGroups(Workspace workspace, User user) {

        return generateDefaultPermissionGroupsWithoutPermissions(workspace)
                // Generate the permissions per permission group
                .flatMap(permissionGroups ->
                        generatePermissionsForDefaultPermissionGroups(permissionGroups, workspace, user));
    }

    /**
     * Create workspace needs to first fetch and embed Setting object in OrganizationSetting
     * for any settings that may have diverged from the default values. Once the
     * settings have been embedded in all the workspace settings, the library
     * function is called to store the enhanced workspace object back in the workspace object.
     */
    @Override
    public Mono<Workspace> create(Workspace workspace) {
        return sessionUserService.getCurrentUser().flatMap(user -> create(workspace, user, Boolean.FALSE));
    }

    @Override
    public Mono<Workspace> update(String id, Workspace resource) {

        this.validateIncomingWorkspace(resource);
        // Ensure the resource has the same ID as from the parameter.
        resource.setId(id);

        Mono<Workspace> findWorkspaceMono = repository
                .findById(id, workspacePermission.getEditPermission())
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, id)))
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
            updateDefaultGroups_thenReturnWorkspaceMono = findWorkspaceMono.flatMap(workspace -> {
                Set<String> defaultPermissionGroupsIds = workspace.getDefaultPermissionGroups();

                Flux<PermissionGroup> defaultPermissionGroupsFlux =
                        permissionGroupService.findAllByIds(defaultPermissionGroupsIds);

                Flux<PermissionGroup> updatedPermissionGroupFlux =
                        defaultPermissionGroupsFlux.flatMap(permissionGroup -> {
                            permissionGroup.setName(
                                    generateNewDefaultName(permissionGroup.getName(), newWorkspaceName));
                            return permissionGroupService.save(permissionGroup);
                        });

                return updatedPermissionGroupFlux.then(Mono.just(workspace));
            });
        }

        return updateDefaultGroups_thenReturnWorkspaceMono
                .map(workspaceFromDb -> {
                    AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(resource, workspaceFromDb);
                    return workspaceFromDb;
                })
                .flatMap(this::validateObject)
                .then(Mono.defer(() -> repository.updateById(id, resource, null)))
                .flatMap(analyticsService::sendUpdateEvent);
    }

    @Override
    public Mono<Workspace> getById(String id) {
        return findById(id, workspacePermission.getReadPermission());
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
        Mono<Workspace> workspaceMono = repository.findById(workspaceId, workspacePermission.getReadPermission());

        // Get default permission groups
        Flux<PermissionGroup> permissionGroupFlux =
                workspaceMono.flatMapMany(workspace -> permissionGroupService.getByDefaultWorkspace(
                        workspace, permissionGroupPermission.getAssignPermission()));

        // Map to PermissionGroupInfoDTO
        Flux<PermissionGroupInfoDTO> permissionGroupInfoFlux = permissionGroupFlux.map(
                permissionGroup -> modelMapper.map(permissionGroup, PermissionGroupInfoDTO.class));

        Mono<List<PermissionGroupInfoDTO>> permissionGroupInfoDTOListMono = permissionGroupInfoFlux
                .collectList()
                .map(list -> {
                    PermissionGroupInfoDTO[] permissionGroupInfoDTOArray = new PermissionGroupInfoDTO[3];

                    // populate array with admin at index 0, developer at index 1 and viewer at index 2
                    list.forEach(item -> {
                        if (item.getName().startsWith(FieldName.ADMINISTRATOR)) {
                            permissionGroupInfoDTOArray[0] = item;
                        } else if (item.getName().startsWith(FieldName.DEVELOPER)) {
                            permissionGroupInfoDTOArray[1] = item;
                        } else if (item.getName().startsWith(FieldName.VIEWER)) {
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
        if (filePart == null) {
            return Mono.error(new AppsmithException(AppsmithError.VALIDATION_FAILURE, "Please upload a valid image."));
        }

        final Mono<Workspace> findWorkspaceMono = repository
                .findById(workspaceId, workspacePermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)));

        // We don't execute the upload Mono if we don't find the workspace.
        final Mono<Asset> uploadAssetMono =
                assetService.upload(List.of(filePart), Constraint.WORKSPACE_LOGO_SIZE_KB, false);

        return findWorkspaceMono
                .flatMap(workspace -> Mono.zip(Mono.just(workspace), uploadAssetMono))
                .flatMap(tuple -> {
                    final Workspace workspace = tuple.getT1();
                    final Asset uploadedAsset = tuple.getT2();
                    final String prevAssetId = workspace.getLogoAssetId();

                    workspace.setLogoAssetId(uploadedAsset.getId());
                    return repository.save(workspace).flatMap(savedWorkspace -> {
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
                .findById(workspaceId, workspacePermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)))
                .flatMap(workspace -> {
                    final String prevAssetId = workspace.getLogoAssetId();
                    if (prevAssetId == null) {
                        return Mono.error(
                                new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ASSET, prevAssetId));
                    }
                    workspace.setLogoAssetId(null);
                    return assetRepository
                            .findById(prevAssetId)
                            .switchIfEmpty(Mono.error(new AppsmithException(
                                    AppsmithError.NO_RESOURCE_FOUND, FieldName.ASSET, prevAssetId)))
                            .flatMap(asset -> assetRepository.delete(asset).thenReturn(asset))
                            .flatMap(analyticsService::sendDeleteEvent)
                            .then(repository.save(workspace));
                });
    }

    @Override
    public Flux<Workspace> getAll() {
        return repository.findAll();
    }

    @Override
    public Mono<Workspace> archiveById(String workspaceId) {
        return applicationRepository.countByWorkspaceId(workspaceId).flatMap(appCount -> {
            if (appCount == 0) { // no application found under this workspace
                // fetching the workspace first to make sure user has permission to archive
                return repository
                        .findById(workspaceId, workspacePermission.getDeletePermission())
                        .switchIfEmpty(Mono.error(new AppsmithException(
                                AppsmithError.NO_RESOURCE_FOUND, FieldName.WORKSPACE, workspaceId)))
                        .flatMap(workspace -> {

                            // Delete permission groups associated with this workspace before deleting the workspace
                            // Since we have already asserted that the user has the delete permission on the workspace,
                            // lets go ahead with the cleanup without permissions for the default permission groups
                            // (roles)
                            // since we can't leave the permission groups in a state where they are not associated with
                            // any workspace

                            Set<String> defaultPermissionGroups = workspace.getDefaultPermissionGroups();
                            return Flux.fromIterable(defaultPermissionGroups)
                                    .flatMap(permissionGroupService::deleteWithoutPermission)
                                    .then(Mono.just(workspace));
                        })
                        .flatMap(this::archiveWorkspaceDependents)
                        .flatMap(repository::archive)
                        .flatMap(analyticsService::sendDeleteEvent);
            } else {
                return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
            }
        });
    }

    protected Mono<Workspace> archiveWorkspaceDependents(Workspace workspace) {
        // Nothing to archive
        return Mono.just(workspace);
    }

    private void validateIncomingWorkspace(Workspace workspace) {
        if (StringUtils.hasLength(workspace.getEmail()) && !Pattern.matches(EMAIL_PATTERN, workspace.getEmail())) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, EMAIL);
        }
        if (StringUtils.hasLength(workspace.getWebsite())
                && !Pattern.matches(WEBSITE_PATTERN, workspace.getWebsite())) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, WEBSITE);
        }
    }

    @Override
    public Flux<Workspace> getAll(AclPermission permission) {
        return repository.findAll(permission);
    }

    private Mono<String> createUserInAlloy(String workspaceId) {
        return WebClientUtils.builder()
                .build()
                .post()
                .uri("https://embedded.runalloy.com/2024-03/users/")
                .header("Authorization", String.format("Bearer %s", alloyApiKey))
                .bodyValue(Map.of("username", workspaceId, "fullName", workspaceId))
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> (String) response.get("userId"));
    }

    private Mono<String> createAlloyJWT(String userId) {
        return WebClientUtils.builder()
                .build()
                .get()
                .uri(String.format("https://embedded.runalloy.com/2024-03/users/%s/token", userId))
                .header("Authorization", String.format("Bearer %s", alloyApiKey))
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> (String) response.get("token"));
    }

    private Mono<Workspace> updateAlloyUserIdToWorkspace(Workspace workspace, String alloyUserId) {
        workspace.setAlloyUserId(alloyUserId);
        return repository.save(workspace);
    }

    @Override
    public Mono<AlloyWorkspaceTokenDTO> generateAlloyWorkspaceToken(String workspaceId) {
        // create user in alloy
        // create jwt token and return
        AlloyWorkspaceTokenDTO alloyWorkspaceTokenDTO = new AlloyWorkspaceTokenDTO();
        Mono<Workspace> findWorkspaceMono = repository.findById(workspaceId, workspacePermission.getEditPermission());

        return findWorkspaceMono
                .flatMap(workspace -> {
                    String alloyUserId = workspace.getAlloyUserId();
                    if (alloyUserId != null && !alloyUserId.trim().isEmpty()) {
                        alloyWorkspaceTokenDTO.setUserId(alloyUserId);
                        return createAlloyJWT(alloyUserId);
                    } else {
                        return createUserInAlloy(workspaceId).flatMap(userId -> {
                            alloyWorkspaceTokenDTO.setUserId(userId);
                            return updateAlloyUserIdToWorkspace(workspace, userId)
                                    .flatMap(updatedWorkspace -> createAlloyJWT(userId));
                        });
                    }
                })
                .flatMap(jwt -> {
                    alloyWorkspaceTokenDTO.setToken(jwt);
                    return Mono.just(alloyWorkspaceTokenDTO);
                });
    }
}

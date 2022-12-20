package com.appsmith.server.solutions.roles;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.GenericDatabaseOperation;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.solutions.roles.constants.PermissionViewableName;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.RoleTabDTO;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleConfigDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleEntityDTO;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.collections.ListUtils;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple3;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_THEMES;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.UNASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static com.appsmith.server.solutions.roles.constants.AclPermissionAndViewablePermissionConstantsMaps.getAclPermissionsFromViewableName;

@Component
@Slf4j
public class RoleConfigurationSolutionImpl implements RoleConfigurationSolution {

    private final WorkspaceResources workspaceResources;
    private final TenantResources tenantResources;
    private final GenericDatabaseOperation genericDatabaseOperation;
    private final ApplicationRepository applicationRepository;
    private final WorkspaceRepository workspaceRepository;
    private final PermissionGroupRepository permissionGroupRepository;
    private final ThemeRepository themeRepository;
    private final NewActionRepository newActionRepository;
    private final ActionCollectionRepository actionCollectionRepository;

    public RoleConfigurationSolutionImpl(WorkspaceResources workspaceResources,
                                         TenantResources tenantResources,
                                         GenericDatabaseOperation genericDatabaseOperation,
                                         ApplicationRepository applicationRepository,
                                         WorkspaceRepository workspaceRepository,
                                         PermissionGroupRepository permissionGroupRepository,
                                         ThemeRepository themeRepository,
                                         NewActionRepository newActionRepository,
                                         ActionCollectionRepository actionCollectionRepository) {

        this.workspaceResources = workspaceResources;
        this.tenantResources = tenantResources;
        this.genericDatabaseOperation = genericDatabaseOperation;
        this.applicationRepository = applicationRepository;
        this.workspaceRepository = workspaceRepository;
        this.permissionGroupRepository = permissionGroupRepository;
        this.themeRepository = themeRepository;
        this.newActionRepository = newActionRepository;
        this.actionCollectionRepository = actionCollectionRepository;
    }

    @Override
    public Mono<RoleViewDTO> getAllTabViews(String permissionGroupId) {
        CommonAppsmithObjectData dataFromRepositoryForAllTabs = workspaceResources.getDataFromRepositoryForAllTabs();
        return Mono.zip(
                        workspaceResources.createApplicationResourcesTabView(permissionGroupId, dataFromRepositoryForAllTabs),
                        workspaceResources.createDatasourceResourcesTabView(permissionGroupId, dataFromRepositoryForAllTabs),
                        tenantResources.createGroupsAndRolesTab(permissionGroupId),
                        tenantResources.createOthersTab(permissionGroupId, dataFromRepositoryForAllTabs)
                )
                .map(tuple -> {
                    RoleTabDTO applicationData = tuple.getT1();
                    RoleTabDTO datasourceData = tuple.getT2();
                    RoleTabDTO groupsRolesData = tuple.getT3();
                    RoleTabDTO othersData = tuple.getT4();

                    RoleViewDTO roleViewDTO = new RoleViewDTO();
                    LinkedHashMap<String, RoleTabDTO> tabs = new LinkedHashMap<>();
                    tabs.put(RoleTab.APPLICATION_RESOURCES.getName(), applicationData);
                    tabs.put(RoleTab.DATASOURCES_QUERIES.getName(), datasourceData);
                    tabs.put(RoleTab.GROUPS_ROLES.getName(), groupsRolesData);
                    tabs.put(RoleTab.OTHERS.getName(), othersData);

                    roleViewDTO.setTabs(tabs);

                    return roleViewDTO;
                });
    }

    @Override
    public Mono<RoleViewDTO> updateRoles(String permissionGroupId, UpdateRoleConfigDTO updateRoleConfigDTO) {

        /**
         * TODO :
         * 1. Add handling for application resources tab where actions and datasources permissions get updated
         * if edit/view permissions are given in application resources tab for workspaces, applications and pages
         *
         * 2. Also, if an application(s) are shared in application resources, also give read workspace permission
         */
        Mono<PermissionGroup> permissionGroupMono = permissionGroupRepository.findById(permissionGroupId, MANAGE_PERMISSION_GROUPS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACTION_IS_NOT_AUTHORIZED, "update roles")))
                .cache();

        String tabName = updateRoleConfigDTO.getTabName();
        RoleTab tab = RoleTab.getTabByValue(tabName);
        List<PermissionViewableName> viewablePermissions = tab.getViewablePermissions();
        List<Tuple3<String, Class<?>, List<AclPermission>>> duplicateEntities = tab.getDuplicateEntities();
        List<Mono<Long>> sideEffects = new ArrayList<>();
        List<Mono<Boolean>> postAllUpdatesSideEffects = new ArrayList<>();

        Set<UpdateRoleEntityDTO> entitiesChanged = updateRoleConfigDTO.getEntitiesChanged();

        List<String> applicationsRevokedInApplicationResourcesTab = new ArrayList<>();
        Set<String> workspaceReadGivenAsSideEffect = new HashSet<>();

        ConcurrentHashMap<String, List<AclPermission>> entityPermissionsAddedMap = new ConcurrentHashMap<>();
        ConcurrentHashMap<String, List<AclPermission>> entityPermissionsRemovedMap = new ConcurrentHashMap<>();
        ConcurrentHashMap<String, Class> entityClassMap = new ConcurrentHashMap<>();

        Flux<Long> updateEntityPoliciesFlux = Flux.fromIterable(entitiesChanged)
                .map(entity -> {
                    String id = entity.getId();
                    String type = entity.getType();
                    String name = entity.getName();
                    List<AclPermission> permissionsOfInterestIfDuplicate = new ArrayList<>();

                    Class<?> aClass = null;

                    try {
                        aClass = getClass(type);
                    } catch (ClassNotFoundException e) {
                        log.debug("DEBUG : Class not found for entity : {}", entity);
                        // This must be a custom header (aka same entity type but different name)
                        Optional<Tuple3<String, Class<?>, List<AclPermission>>> duplicateEntityClassOptional = duplicateEntities.stream()
                                .filter(entityTuple -> entityTuple.getT1().equals(name))
                                .findFirst();

                        if (duplicateEntityClassOptional.isPresent()) {
                            Tuple3<String, Class<?>, List<AclPermission>> entityTuple = duplicateEntityClassOptional.get();
                            aClass = (Class<?>) entityTuple.getT2();
                            permissionsOfInterestIfDuplicate = entityTuple.getT3();
                        }
                    }

                    // If we haven't been able to figure out the class so far, throw an error and return
                    if (aClass == null) {
                        return Flux.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                    }

                    if (!CollectionUtils.isEmpty(duplicateEntities)) {
                        for (Tuple3<String, Class<?>, List<AclPermission>> duplicateEntity : duplicateEntities) {
                            String entityName = duplicateEntity.getT1();
                            Class<?> entityClass = duplicateEntity.getT2();
                            if (entityName.equals(name) && entityClass.equals(aClass)) {
                                permissionsOfInterestIfDuplicate = duplicateEntity.getT3();
                            }
                        }
                    }

                    List<Integer> permissions = entity.getPermissions();
                    List<AclPermission> added = new ArrayList<>();
                    List<AclPermission> removed = new ArrayList<>();
                    ListIterator<Integer> permissionsIterator = permissions.listIterator();
                    while (permissionsIterator.hasNext()) {
                        int index = permissionsIterator.nextIndex();
                        Integer permission = permissionsIterator.next();
                        // If the permission is not applicable, move on
                        if (permission == -1) {
                            continue;
                        }
                        PermissionViewableName permissionViewableName = viewablePermissions.get(index);

                        // Get the acl permissions for the tab which are of interest.
                        List<AclPermission> aclPermissionsFromViewableName = getAclPermissionsFromViewableName(permissionViewableName, aClass)
                                .stream()
                                .filter(tab.getPermissions()::contains)
                                .collect(Collectors.toList());

                        if (aclPermissionsFromViewableName.size() != 1) {
                            // This can happen if we have a duplicate entity class representing multiple permissions with the
                            // same viewable name
                            aclPermissionsFromViewableName = aclPermissionsFromViewableName.stream()
                                    .filter(permissionsOfInterestIfDuplicate::contains)
                                    .collect(Collectors.toList());

                            if (aclPermissionsFromViewableName.size() != 1) {
                                // This is unexpected state where the translated permission is unclear
                                return Flux.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                            }
                        }
                        AclPermission aclPermission = aclPermissionsFromViewableName.get(0);
                        if (permission == 1) {
                            added.add(aclPermission);
                        } else {
                            removed.add(aclPermission);
                        }
                    }

                    // Compute the side effects for this entity and add to the list.
                    computeSideEffectOfPermissionChange(sideEffects, tab, aClass, id, permissions, permissionGroupId,
                            applicationsRevokedInApplicationResourcesTab, workspaceReadGivenAsSideEffect, added, removed);


                    // Add the entity to the map of entities to be updated
                    entityPermissionsAddedMap.merge(id, added, ListUtils::union);
                    entityPermissionsRemovedMap.merge(id, removed, ListUtils::union);
                    entityClassMap.put(id, aClass);

                    return true;
                })
                .collectList()
                .flatMapMany(bool -> Flux.fromIterable(entityPermissionsAddedMap.keySet())
                        .flatMap(id -> {
                            List<AclPermission> added = entityPermissionsAddedMap.get(id);
                            List<AclPermission> removed = entityPermissionsRemovedMap.get(id);
                            Class aClass = entityClassMap.get(id);
                            return genericDatabaseOperation.updatePolicies(id, permissionGroupId, added, removed, aClass);
                        }))
                .cache();


        Flux<Mono<Boolean>> postAllUpdatesEffectsFlux = Flux.defer(() -> {
            if (!CollectionUtils.isEmpty(applicationsRevokedInApplicationResourcesTab)) {
                // Permissions may have changed for applications. We want to remove read workspace permission from any workspace
                // where the current permission group has no permissions at the workspace level or atleast one read permission
                // at the application level.
                postAllUpdatesSideEffects.add(
                        removeWorkspaceReadIfRequired(permissionGroupId,
                                applicationsRevokedInApplicationResourcesTab)
                );

            }

            return Flux.fromIterable(postAllUpdatesSideEffects);
        });

        return permissionGroupMono
                .thenMany(updateEntityPoliciesFlux)
                .thenMany(Flux.fromIterable(sideEffects))
                .flatMap(obj -> obj)
                // Post all the entity updates and side effects, now do a cleanup for affected entities at the end
                .thenMany(postAllUpdatesEffectsFlux)
                .flatMap(obj -> obj)
                .then(getAllTabViews(permissionGroupId))
                .zipWith(permissionGroupMono)
                // Add the user permissions and other transient fields to the response before returning
                .map(tuple -> {
                    RoleViewDTO roleViewDTO = tuple.getT1();
                    PermissionGroup permissionGroup = tuple.getT2();

                    roleViewDTO.setId(permissionGroup.getId());
                    roleViewDTO.setName(permissionGroup.getName());
                    roleViewDTO.setDescription(permissionGroup.getDescription());
                    roleViewDTO.setUserPermissions(permissionGroup.getUserPermissions());
                    return roleViewDTO;
                });
    }

    private Mono<Long> addReadPermissionToWorkspaceGivenApplication(String applicationId, String permissionGroupId) {

        return applicationRepository.findById(applicationId)
                .flatMap(application -> {
                    String workspaceId = application.getWorkspaceId();
                    // If the workspace should be given READ permission, then we need to add the READ permission
                    return genericDatabaseOperation.updatePolicies(workspaceId, permissionGroupId, List.of(READ_WORKSPACES), List.of(), Workspace.class);
                });
    }

    private Mono<Long> removeReadPermissionFromWorkspace(String workspaceId, String permissionGroupId) {
        return genericDatabaseOperation.updatePolicies(workspaceId, permissionGroupId, List.of(), List.of(READ_WORKSPACES), Workspace.class);
    }


    private void computeSideEffectOfPermissionChange(List<Mono<Long>> sideEffects,
                                                     RoleTab tab,
                                                     Class<?> aClazz,
                                                     String id,
                                                     List<Integer> permissions,
                                                     String permissionGroupId,
                                                     List<String> applicationsRevokedInApplicationResourcesTab,
                                                     Set<String> workspaceReadGivenAsSideEffect,
                                                     List<AclPermission> added,
                                                     List<AclPermission> removed) {

        if (tab == RoleTab.APPLICATION_RESOURCES && Application.class.equals(aClazz)) {

            // If the tab is application resources, and the entity is an application, then we need to
            // update the READ_WORKSPACE permission for the workspace to ensure that if atleast view access is given
            // on an application, the said application loads up on the homepage.
            sideEffectOnReadWorkspaceGivenApplicationUpdate(sideEffects, id, permissions, permissionGroupId,
                    applicationsRevokedInApplicationResourcesTab, workspaceReadGivenAsSideEffect);

            // If the application is given permissions, we should give custom theme same permissions
            sideEffectOnCustomThemeGivenApplicationUpdate(sideEffects, id, permissionGroupId, added, removed);

        } else if (tab == RoleTab.APPLICATION_RESOURCES && NewPage.class.equals(aClazz)) {

            // If the tab is application resources, and the entity is a page, then we need to give actions and action
            // collections execute permission if view is given on the page.
            sideEffectOnActionsGivenPageUpdate(sideEffects, id, permissionGroupId, added, removed);

        } else if (tab == RoleTab.GROUPS_ROLES && PermissionGroup.class.equals(aClazz)) {

            sideEffectOnAssociateRoleGivenPermissionGroupUpdate(sideEffects, id, permissionGroupId, added, removed);
        } else if (tab == RoleTab.APPLICATION_RESOURCES && ActionCollection.class.equals(aClazz)) {

            // If the tab is application resources, and the entity is an Action Collection, then we need  to give all
            // associated actions the same permission as the entity.
            sideEffectOnActionsGivenActionCollectionUpdate(sideEffects, id, permissionGroupId, added, removed);
        }
    }

    private void sideEffectOnActionsGivenActionCollectionUpdate(List<Mono<Long>> sideEffects,
                                                                String actionCollectionId,
                                                                String permissionGroupId,
                                                                List<AclPermission> added,
                                                                List<AclPermission> removed) {
        List<String> includedFields = List.of(fieldName(QNewAction.newAction.id));
        Flux<String> actionFlux = newActionRepository
                .findAllByActionCollectionIdWithoutPermissions(List.of(actionCollectionId), includedFields)
                .map(NewAction::getId);

        Mono<Long> actionsUpdated = actionFlux.flatMap(actionId -> genericDatabaseOperation.updatePolicies(actionId, permissionGroupId, added, removed, NewAction.class))
                .reduce(0L, Long::sum);
        sideEffects.add(actionsUpdated);
    }

    private void sideEffectOnActionsGivenPageUpdate(List<Mono<Long>> sideEffects,
                                                    String pageId,
                                                    String permissionGroupId,
                                                    List<AclPermission> added,
                                                    List<AclPermission> removed) {

        Mono<Long> actionsUpdated = Mono.just(0L);
        Mono<Long> actionCollectionsUpdated = Mono.just(0L);

        Flux<String> actionFlux = newActionRepository.findByPageId(pageId).map(NewAction::getId);
        Flux<String> actionCollectionFlux = actionCollectionRepository.findByPageId(pageId).map(ActionCollection::getId);

        if (added.contains(READ_PAGES)) {
            actionsUpdated = actionFlux
                    .flatMap(actionId -> genericDatabaseOperation.updatePolicies(actionId, permissionGroupId, List.of(EXECUTE_ACTIONS), List.of(), NewAction.class))
                    .reduce(0L, Long::sum);
            actionCollectionsUpdated = actionCollectionFlux
                    .flatMap(actionCollectionId -> genericDatabaseOperation.updatePolicies(actionCollectionId, permissionGroupId, List.of(EXECUTE_ACTIONS), List.of(), ActionCollection.class))
                    .reduce(0L, Long::sum);

        } else if (removed.contains(READ_PAGES)) {
            actionsUpdated = actionFlux
                    .flatMap(actionId -> genericDatabaseOperation.updatePolicies(actionId, permissionGroupId, List.of(), List.of(EXECUTE_ACTIONS), NewAction.class))
                    .reduce(0L, Long::sum);
            actionCollectionsUpdated = actionCollectionFlux
                    .flatMap(actionCollectionId -> genericDatabaseOperation.updatePolicies(actionCollectionId, permissionGroupId, List.of(), List.of(EXECUTE_ACTIONS), ActionCollection.class))
                    .reduce(0L, Long::sum);
        }

        Mono<Long> updateAllActionsOnPageUpdateMono = Mono.zip(actionsUpdated, actionCollectionsUpdated)
                .map(tuple -> tuple.getT1() + tuple.getT2());

        sideEffects.add(updateAllActionsOnPageUpdateMono);

    }

    private void sideEffectOnAssociateRoleGivenPermissionGroupUpdate(List<Mono<Long>> sideEffects,
                                                                     String id,
                                                                     String permissionGroupId,
                                                                     List<AclPermission> added,
                                                                     List<AclPermission> removed) {
        // If assign permission is given/taken away, we must replicate the same for unassign permission as well
        if (added.contains(ASSIGN_PERMISSION_GROUPS)) {
            sideEffects.add(genericDatabaseOperation.updatePolicies(id, permissionGroupId, List.of(UNASSIGN_PERMISSION_GROUPS), List.of(), PermissionGroup.class));
        } else if (removed.contains(ASSIGN_PERMISSION_GROUPS)) {
            sideEffects.add(genericDatabaseOperation.updatePolicies(id, permissionGroupId, List.of(), List.of(UNASSIGN_PERMISSION_GROUPS), PermissionGroup.class));
        }
    }

    private void sideEffectOnCustomThemeGivenApplicationUpdate(List<Mono<Long>> sideEffects,
                                                               String applicationId,
                                                               String permissionGroupId,
                                                               List<AclPermission> added,
                                                               List<AclPermission> removed) {

        Mono<Long> themeUpdateSideEffectMono = applicationRepository.findById(applicationId)
                .flatMap(application -> {
                    String editModeThemeId = application.getEditModeThemeId();
                    String publishedModeThemeId = application.getPublishedModeThemeId();

                    if (editModeThemeId == null || publishedModeThemeId == null) {
                        // Do nothing. These are old applications which were created (and not yet edited) before theme feature
                        return Mono.empty();
                    }

                    Mono<Theme> editModeThemeMono = themeRepository.findById(editModeThemeId);
                    Mono<Theme> publishedModeThemeMono = themeRepository.findById(publishedModeThemeId);

                    return Mono.zip(editModeThemeMono, publishedModeThemeMono)
                            .flatMap(tuple -> {
                                Theme editModeTheme = tuple.getT1();
                                Theme publishedModeTheme = tuple.getT2();

                                Mono<Long> editModeThemeUpdateMono = Mono.empty();
                                Mono<Long> publishedModeThemeUpdateMono = Mono.empty();

                                if (editModeTheme.isSystemTheme() && publishedModeTheme.isSystemTheme()) {
                                    // Do nothing. These are system themes. We don't want to give system themes permissions
                                    // since they are already accessible to everyone.
                                    return Mono.empty();
                                }

                                // Translate application permissions to theme permissions
                                List<AclPermission> themeAdded = new ArrayList<>();
                                List<AclPermission> themeRemoved = new ArrayList<>();

                                for (AclPermission permission : added) {
                                    themeAdded.add(translateThemePermissionGivenApplicationPermission(permission));
                                }
                                for (AclPermission permission : removed) {
                                    themeRemoved.add(translateThemePermissionGivenApplicationPermission(permission));
                                }

                                if (!editModeTheme.isSystemTheme()) {
                                    editModeThemeUpdateMono = genericDatabaseOperation.updatePolicies(editModeThemeId,
                                            permissionGroupId, themeAdded, themeRemoved, Theme.class);
                                }
                                if (!publishedModeTheme.isSystemTheme()) {
                                    publishedModeThemeUpdateMono = genericDatabaseOperation.updatePolicies(publishedModeThemeId,
                                            permissionGroupId, themeAdded, themeRemoved, Theme.class);
                                }

                                return Mono.when(editModeThemeUpdateMono, publishedModeThemeUpdateMono)
                                        .thenReturn(1L);
                            })
                            .map(obj -> obj);

                });

        sideEffects.add(themeUpdateSideEffectMono);

    }

    private AclPermission translateThemePermissionGivenApplicationPermission(AclPermission permission) {
        if (permission == READ_APPLICATIONS) {
            return READ_THEMES;
        } else if (permission == MANAGE_APPLICATIONS) {
            return MANAGE_THEMES;
        }
        return permission;
    }

    private void sideEffectOnReadWorkspaceGivenApplicationUpdate(List<Mono<Long>> sideEffects,
                                                                 String id,
                                                                 List<Integer> permissions,
                                                                 String permissionGroupId,
                                                                 List<String> applicationsRevokedInApplicationResourcesTab,
                                                                 Set<String> workspaceReadGivenAsSideEffect) {

        // If any of the permissions are true in this tab for application, give workspace read so that
        // the application is visible on the home page.
        boolean anyPermissionTrue = permissions.stream().anyMatch(permission -> permission == 1);

        if (anyPermissionTrue && !workspaceReadGivenAsSideEffect.contains(id)) {
            sideEffects.add(addReadPermissionToWorkspaceGivenApplication(id, permissionGroupId));
            // Don't give the same workspace read permission again if done already.
            workspaceReadGivenAsSideEffect.add(id);
        }

        boolean allPermissionsFalse = permissions.stream().allMatch(permission -> permission == 0);

        if (allPermissionsFalse) {
            applicationsRevokedInApplicationResourcesTab.add(id);
        }
    }

    private Class<?> getClass(String name) throws ClassNotFoundException {
        String completeClassName = "com.appsmith.server.domains." + name;
        try {
            return Class.forName(completeClassName);
        } catch (ClassNotFoundException e) {
            completeClassName = "com.appsmith.external.models." + name;
            return Class.forName(completeClassName);
        }
    }

    private Mono<Boolean> removeWorkspaceReadIfRequired(String permissionGroupId, List<String> applicationsRevokedInApplicationResourcesTab) {

        Flux<Application> revokedApplicationsFlux = applicationRepository.findByIdIn(applicationsRevokedInApplicationResourcesTab);

        Mono<Set<String>> workspaceIdsOfRevokedApplicationsMono = revokedApplicationsFlux
                .map(Application::getWorkspaceId)
                .collect(Collectors.toSet())
                .cache();

        // This fetches all the workspaces where application access has been revoked.
        // TODO : Convert this to a single query which fetches the workspaces by ids as well as permissions where the current permission
        // group id does not provide any permission to this workspace (except read workspace).
        Flux<Workspace> workspaceFlux = workspaceIdsOfRevokedApplicationsMono
                .flatMapMany(workspaceIdsOfRevokedApplications ->
                        workspaceRepository.findAllById(workspaceIdsOfRevokedApplications)
                )
                .cache();

        Mono<Set<String>> interestingWorkspaceIdsMono = workspaceFlux
                .map(Workspace::getId)
                .collect(Collectors.toSet());

        Mono<Map<String, Collection<Application>>> applicationsByWorkspaceMapMono = interestingWorkspaceIdsMono
                .flatMap(workspaceIds -> applicationRepository.findAllByWorkspaceIdIn(workspaceIds)
                        .collectMultimap(
                                Application::getWorkspaceId, Function.identity()
                        ))
                .cache();

        return workspaceFlux.zipWith(applicationsByWorkspaceMapMono.repeat())
                .flatMap(tuple -> {
                    Workspace workspace = tuple.getT1();
                    Map<String, Collection<Application>> applicationsMap = tuple.getT2();

                    boolean workspaceAccess = workspace.getPolicies().stream()
                            .anyMatch(policy -> !policy.getPermission().equals(READ_WORKSPACES.getValue()) && policy.getPermissionGroups().contains(permissionGroupId));

                    if (workspaceAccess) {
                        // Atleast one permission (other than READ_WORKSPACES) is driven by this permission group for this workspace.
                        // Don't remove the READ_WORKSPACES permission
                        return Mono.just(0L);
                    }

                    // No permission at the workspace level. Now check permissions at the application level
                    Collection<Application> applications = applicationsMap.get(workspace.getId());
                    boolean anyApplicationAccess = applications.stream()
                            .map(Application::getPolicies)
                            .flatMap(Collection::stream)
                            .anyMatch(policy -> policy.getPermissionGroups().contains(permissionGroupId));

                    if (anyApplicationAccess) {
                        // Atleast one permission on atleast one application is driven by this permission group in this workspace.
                        // Don't remove the READ_WORKSPACES permission
                        return Mono.just(0L);
                    }

                    // No permission at the workspace level or application level. Remove the READ_WORKSPACES permission
                    return removeReadPermissionFromWorkspace(workspace.getId(), permissionGroupId);
                })
                .then(Mono.just(Boolean.TRUE));
    }

}

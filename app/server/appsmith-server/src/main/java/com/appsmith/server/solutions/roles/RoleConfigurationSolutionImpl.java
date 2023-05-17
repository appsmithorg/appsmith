package com.appsmith.server.solutions.roles;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.QDatasource;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GacEntityMetadata;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QActionCollection;
import com.appsmith.server.domains.QNewPage;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PermissionGroupUtils;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.GenericDatabaseOperation;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.services.AnalyticsService;
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
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import java.util.Map.Entry;
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
import static com.appsmith.server.constants.FieldName.ENTITY_UPDATED_PERMISSIONS;
import static com.appsmith.server.constants.FieldName.GAC_TAB;
import static com.appsmith.server.constants.FieldName.EVENT_DATA;
import static com.appsmith.server.exceptions.AppsmithError.ACTION_IS_NOT_AUTHORIZED;
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
    private final PermissionGroupUtils permissionGroupUtils;
    private final ThemeRepository themeRepository;
    private final NewActionRepository newActionRepository;
    private final ActionCollectionRepository actionCollectionRepository;
    private final AnalyticsService analyticsService;
    private final NewPageRepository newPageRepository;
    private final DatasourceRepository datasourceRepository;

    public RoleConfigurationSolutionImpl(WorkspaceResources workspaceResources,
                                         TenantResources tenantResources,
                                         GenericDatabaseOperation genericDatabaseOperation,
                                         ApplicationRepository applicationRepository,
                                         WorkspaceRepository workspaceRepository,
                                         PermissionGroupRepository permissionGroupRepository,
                                         PermissionGroupUtils permissionGroupUtils,
                                         ThemeRepository themeRepository,
                                         NewActionRepository newActionRepository,
                                         ActionCollectionRepository actionCollectionRepository,
                                         AnalyticsService analyticsService,
                                         NewPageRepository newPageRepository,
                                         DatasourceRepository datasourceRepository) {

        this.workspaceResources = workspaceResources;
        this.tenantResources = tenantResources;
        this.genericDatabaseOperation = genericDatabaseOperation;
        this.applicationRepository = applicationRepository;
        this.workspaceRepository = workspaceRepository;
        this.permissionGroupRepository = permissionGroupRepository;
        this.permissionGroupUtils = permissionGroupUtils;
        this.themeRepository = themeRepository;
        this.newActionRepository = newActionRepository;
        this.actionCollectionRepository = actionCollectionRepository;
        this.analyticsService = analyticsService;
        this.newPageRepository = newPageRepository;
        this.datasourceRepository = datasourceRepository;
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


        Set<UpdateRoleEntityDTO> entitiesChanged = updateRoleConfigDTO.getEntitiesChanged();

        List<String> applicationsRevokedInApplicationResourcesTab = new ArrayList<>();
        Set<String> workspaceReadGivenAsSideEffect = new HashSet<>();

        ConcurrentHashMap<String, List<AclPermission>> entityPermissionsAddedMap = new ConcurrentHashMap<>();
        ConcurrentHashMap<String, List<AclPermission>> entityPermissionsRemovedMap = new ConcurrentHashMap<>();
        ConcurrentHashMap<String, Class> entityClassMap = new ConcurrentHashMap<>();
        ConcurrentHashMap<String, List<AclPermission>> sideEffectsPermissionsAddedMap = new ConcurrentHashMap<>();
        ConcurrentHashMap<String, List<AclPermission>> sideEffectsPermissionsRemovedMap = new ConcurrentHashMap<>();
        ConcurrentHashMap<String, Class> sideEffectsClassMap = new ConcurrentHashMap<>();

        Mono<Map<Class, Set<String>>> preComputeMono = Flux.fromIterable(entitiesChanged)
                .map(entity -> {
                    List<AclPermission> added = new ArrayList<>();
                    List<AclPermission> removed = new ArrayList<>();
                    String id = entity.getId();
                    List<Integer> permissions = entity.getPermissions();
                    Class<?> aClass = generateClassAndPopulateAddedAndRemovedPermissions(entity, tab, added, removed);

                    // Compute the side effects for this entity and add to the list.
                    computeSideEffectOfPermissionChange(sideEffects, tab, aClass, id, permissions,
                            applicationsRevokedInApplicationResourcesTab, workspaceReadGivenAsSideEffect, added, removed,
                            sideEffectsPermissionsAddedMap, sideEffectsPermissionsRemovedMap, sideEffectsClassMap);


                    // Add the entity to the map of entities to be updated
                    entityPermissionsAddedMap.merge(id, added, ListUtils::union);
                    entityPermissionsRemovedMap.merge(id, removed, ListUtils::union);
                    entityClassMap.put(id, aClass);

                    return true;
                })
                .collectList()
                .then(Mono.defer(() -> Mono.just(entityClassMap.entrySet().stream().collect(
                        Collectors.groupingBy(Entry::getValue, Collectors.mapping(Entry::getKey, Collectors.toSet()))))));

        Mono<List<Boolean>> validatedEntities = preComputeMono
                .flatMapMany(entityObjectListMap -> Flux.fromIterable(entityObjectListMap.entrySet()))
                .flatMap(entry -> validatePermissionsChanged(entry.getKey(), entry.getValue(), entityPermissionsAddedMap, entityPermissionsRemovedMap))
                .collectList();
        Flux<Boolean> updateEntityPoliciesAndSideEffectsFlux = updateEntityPoliciesAndSideEffects(permissionGroupId, validatedEntities, sideEffects,
                entityPermissionsAddedMap, entityPermissionsRemovedMap, entityClassMap, sideEffectsPermissionsAddedMap,
                sideEffectsPermissionsRemovedMap, sideEffectsClassMap, applicationsRevokedInApplicationResourcesTab);

        Map<String, Object> roleUpdateProperties = getRoleUpdateMetadata(updateRoleConfigDTO);
        Map<String, Object> analyticsProperties = Map.of(GAC_TAB, updateRoleConfigDTO.getTabName(), EVENT_DATA, roleUpdateProperties);
        Mono<PermissionGroup> sendPermissionGroupUpdatedEventMono = permissionGroupMono
                .flatMap(permissionGroup -> analyticsService.sendUpdateEvent(permissionGroup, analyticsProperties));

        return permissionGroupMono
                .thenMany(updateEntityPoliciesAndSideEffectsFlux)
                .then(getAllTabViews(permissionGroupId))
                .zipWith(sendPermissionGroupUpdatedEventMono)
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

    private Class<?> generateClassAndPopulateAddedAndRemovedPermissions(UpdateRoleEntityDTO entity,
                                                                        RoleTab tab,
                                                                        List<AclPermission> added,
                                                                        List<AclPermission> removed) {
        String type = entity.getType();
        String name = entity.getName();
        List<AclPermission> permissionsOfInterestIfDuplicate = new ArrayList<>();
        List<Tuple3<String, Class<?>, List<AclPermission>>> duplicateEntities = tab.getDuplicateEntities();
        List<PermissionViewableName> viewablePermissions = tab.getViewablePermissions();

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
            throw new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR);
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
                    throw new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR);
                }
            }
            AclPermission aclPermission = aclPermissionsFromViewableName.get(0);
            if (permission == 1) {
                added.add(aclPermission);
            } else {
                removed.add(aclPermission);
            }
        }
        if (Workspace.class.equals(aClass)) {
            populateReadWorkspacePermissionForWorkspace(added, removed, tab);
        }
        return aClass;
    }

    private void populateReadWorkspacePermissionForWorkspace(List<AclPermission> addedPermissions,
                                                             List<AclPermission> removedPermissions,
                                                             RoleTab roleTab) {
        if (RoleTab.APPLICATION_RESOURCES.equals(roleTab)) {
            boolean anyWorkspaceApplicationPermissionAdded = getWorkspaceApplicationPermission().stream().
                    anyMatch(addedPermissions::contains);

            boolean allWorkspaceApplicationPermissionsRemoved = getWorkspaceApplicationPermission().stream()
                    .allMatch(removedPermissions::contains);

            boolean addReadWorkspacePermission = anyWorkspaceApplicationPermissionAdded || !allWorkspaceApplicationPermissionsRemoved;

            if (addReadWorkspacePermission){
                addedPermissions.add(READ_WORKSPACES);
            } else {
                removedPermissions.add(READ_WORKSPACES);
            }
        }
    }

    private Set<AclPermission> getWorkspaceApplicationPermission() {
        return RoleTab.APPLICATION_RESOURCES.getPermissions()
                .stream()
                .filter(permission -> AclPermission.isPermissionForEntity(permission, Workspace.class))
                .collect(Collectors.toSet());
    }

    private Flux<Boolean> updateEntityPoliciesAndSideEffects(String permissionGroupId,
                                                             Mono<List<Boolean>> validatedEntities,
                                                             List<Mono<Long>> sideEffects,
                                                             ConcurrentHashMap<String, List<AclPermission>> entityPermissionsAddedMap,
                                                             ConcurrentHashMap<String, List<AclPermission>> entityPermissionsRemovedMap,
                                                             ConcurrentHashMap<String, Class> entityClassMap,
                                                             ConcurrentHashMap<String, List<AclPermission>> sideEffectsPermissionsAddedMap,
                                                             ConcurrentHashMap<String, List<AclPermission>> sideEffectsPermissionsRemovedMap,
                                                             ConcurrentHashMap<String, Class> sideEffectsClassMap,
                                                             List<String> applicationsRevokedInApplicationResourcesTab) {
        /*
         * Before updating any of the entities, we are validating if the Entities have Correct Permissions changed or not.
         * If not, then we are fast failing, so that there is no partial update on any of the Entity.
         */
        Flux<Long> updateEntityPoliciesFlux = validatedEntities
                .flatMapMany(bool -> Flux.fromIterable(entityPermissionsAddedMap.keySet())
                        .flatMap(id -> {
                            List<AclPermission> added = entityPermissionsAddedMap.get(id);
                            List<AclPermission> removed = entityPermissionsRemovedMap.get(id);
                            Class aClass = entityClassMap.get(id);
                            return genericDatabaseOperation.updatePolicies(id, permissionGroupId, added, removed, aClass);
                        }))
                .cache();

        Mono<Long> computeSideEffects = Flux.fromIterable(sideEffects)
                .flatMap(value -> value)
                .collectList()
                .flatMapMany(sum -> {
                    List<Mono<Long>> dbOpList = new ArrayList<>();
                    sideEffectsClassMap.forEach((key, value) -> {
                        dbOpList.add(genericDatabaseOperation.updatePolicies(key, permissionGroupId,
                                sideEffectsPermissionsAddedMap.getOrDefault(key, List.of()),
                                sideEffectsPermissionsRemovedMap.getOrDefault(key, List.of()), value));
                    });
                    return Flux.fromIterable(dbOpList);
                }).flatMap(obj -> obj).reduce(0L, Long::sum);


        List<Mono<Boolean>> postAllUpdatesSideEffects = new ArrayList<>();
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

        return  updateEntityPoliciesFlux
                .then(computeSideEffects)
                // Post all the entity updates and side effects, now do a cleanup for affected entities at the end
                .thenMany(postAllUpdatesEffectsFlux)
                .flatMap(obj -> obj);
    }

    private Mono<Long> addReadPermissionToWorkspaceGivenApplication(String applicationId,
                                                                    ConcurrentHashMap<String, List<AclPermission>> sideEffectsAddedMap,
                                                                    ConcurrentHashMap<String, Class> sideEffectsClassMap) {

        return applicationRepository.findById(applicationId)
                .map(application -> {
                    String workspaceId = application.getWorkspaceId();
                    // If the workspace should be given READ permission, then we need to add the READ permission
                    sideEffectsClassMap.put(workspaceId, Workspace.class);
                    sideEffectsAddedMap.merge(workspaceId, List.of(READ_WORKSPACES), ListUtils::union);
                    return 1L;
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
                                                     List<String> applicationsRevokedInApplicationResourcesTab,
                                                     Set<String> workspaceReadGivenAsSideEffect,
                                                     List<AclPermission> added,
                                                     List<AclPermission> removed,
                                                     ConcurrentHashMap<String, List<AclPermission>> sideEffectsAddedMap,
                                                     ConcurrentHashMap<String, List<AclPermission>> sideEffectsRemovedMap,
                                                     ConcurrentHashMap<String, Class> sideEffectsClassMap) {

        if (tab == RoleTab.APPLICATION_RESOURCES && Application.class.equals(aClazz)) {

            // If the tab is application resources, and the entity is an application, then we need to
            // update the READ_WORKSPACE permission for the workspace to ensure that if atleast view access is given
            // on an application, the said application loads up on the homepage.
            sideEffectOnReadWorkspaceGivenApplicationUpdate(sideEffects, id, permissions,
                    applicationsRevokedInApplicationResourcesTab, workspaceReadGivenAsSideEffect,
                    sideEffectsAddedMap, sideEffectsClassMap);

            // If the application is given permissions, we should give custom theme same permissions
            sideEffectOnCustomThemeGivenApplicationUpdate(sideEffects, id, added, removed, sideEffectsAddedMap,
                    sideEffectsRemovedMap, sideEffectsClassMap);

        } else if (tab == RoleTab.APPLICATION_RESOURCES && NewPage.class.equals(aClazz)) {

            // If the tab is application resources, and the entity is a page, then we need to give actions and action
            // collections execute permission if view is given on the page.
            sideEffectOnActionsGivenPageUpdate(sideEffects, id, added, removed, sideEffectsAddedMap,
                    sideEffectsRemovedMap, sideEffectsClassMap);

        } else if (tab == RoleTab.GROUPS_ROLES && PermissionGroup.class.equals(aClazz)) {

            sideEffectOnAssociateRoleGivenPermissionGroupUpdate(id, added, removed, sideEffectsAddedMap,
                    sideEffectsRemovedMap, sideEffectsClassMap);
        } else if (tab == RoleTab.APPLICATION_RESOURCES && ActionCollection.class.equals(aClazz)) {

            // If the tab is application resources, and the entity is an Action Collection, then we need  to give all
            // associated actions the same permission as the entity.
            sideEffectOnActionsGivenActionCollectionUpdate(sideEffects, id, added, removed, sideEffectsAddedMap,
                    sideEffectsRemovedMap, sideEffectsClassMap);
        }
    }

    private void sideEffectOnActionsGivenActionCollectionUpdate(List<Mono<Long>> sideEffects,
                                                                String actionCollectionId,
                                                                List<AclPermission> added,
                                                                List<AclPermission> removed,
                                                                ConcurrentHashMap<String, List<AclPermission>> sideEffectsAddedMap,
                                                                ConcurrentHashMap<String, List<AclPermission>> sideEffectsRemovedMap,
                                                                ConcurrentHashMap<String, Class> sideEffectsClassMap) {
        List<String> includedFields = List.of(fieldName(QNewAction.newAction.id));
        Flux<String> actionFlux = newActionRepository
                .findAllByActionCollectionIdWithoutPermissions(List.of(actionCollectionId), includedFields)
                .map(NewAction::getId);

        Mono<Long> actionsUpdated = actionFlux.map(actionId -> {
            sideEffectsClassMap.put(actionId, NewAction.class);
            sideEffectsAddedMap.merge(actionId, added, ListUtils::union);
            sideEffectsRemovedMap.merge(actionId, removed, ListUtils::union);
            return 1L;
        }).reduce(0L, Long::sum);
        sideEffects.add(actionsUpdated);
    }

    private void sideEffectOnActionsGivenPageUpdate(List<Mono<Long>> sideEffects,
                                                    String pageId,
                                                    List<AclPermission> added,
                                                    List<AclPermission> removed,
                                                    ConcurrentHashMap<String, List<AclPermission>> sideEffectsAddedMap,
                                                    ConcurrentHashMap<String, List<AclPermission>> sideEffectsRemovedMap,
                                                    ConcurrentHashMap<String, Class> sideEffectsClassMap) {

        Mono<Long> actionsUpdated = Mono.just(0L);
        Mono<Long> actionCollectionsUpdated = Mono.just(0L);

        Flux<String> actionFlux = newActionRepository.findByPageId(pageId).map(NewAction::getId);
        Flux<String> actionCollectionFlux = actionCollectionRepository.findByPageId(pageId).map(ActionCollection::getId);

        if (added.contains(READ_PAGES)) {
            actionsUpdated = actionFlux
                    .map(actionId -> {
                        sideEffectsClassMap.put(actionId, NewAction.class);
                        sideEffectsAddedMap.merge(actionId, List.of(EXECUTE_ACTIONS), ListUtils::union);
                        return 1L;
                    })
                    .reduce(0L, Long::sum);
            actionCollectionsUpdated = actionCollectionFlux
                    .map(actionCollectionId -> {
                        sideEffectsClassMap.put(actionCollectionId, ActionCollection.class);
                        sideEffectsAddedMap.merge(actionCollectionId, List.of(EXECUTE_ACTIONS), ListUtils::union);
                        return 1L;
                    })
                    .reduce(0L, Long::sum);

        } else if (removed.contains(READ_PAGES)) {
            actionsUpdated = actionFlux
                    .map(actionId -> {
                        sideEffectsClassMap.put(actionId, NewAction.class);
                        sideEffectsRemovedMap.merge(actionId, List.of(EXECUTE_ACTIONS), ListUtils::union);
                        return 1L;
                    })
                    .reduce(0L, Long::sum);
            actionCollectionsUpdated = actionCollectionFlux
                    .map(actionCollectionId -> {
                        sideEffectsClassMap.put(actionCollectionId, ActionCollection.class);
                        sideEffectsRemovedMap.merge(actionCollectionId, List.of(EXECUTE_ACTIONS), ListUtils::union);
                        return 1L;
                    })
                    .reduce(0L, Long::sum);
        }

        Mono<Long> updateAllActionsOnPageUpdateMono = Mono.zip(actionsUpdated, actionCollectionsUpdated)
                .map(tuple -> tuple.getT1() + tuple.getT2());

        sideEffects.add(updateAllActionsOnPageUpdateMono);

    }

    private void sideEffectOnAssociateRoleGivenPermissionGroupUpdate(String id,
                                                                     List<AclPermission> added,
                                                                     List<AclPermission> removed,
                                                                     ConcurrentHashMap<String, List<AclPermission>> sideEffectsAddedMap,
                                                                     ConcurrentHashMap<String, List<AclPermission>> sideEffectsRemovedMap,
                                                                     ConcurrentHashMap<String, Class> sideEffectsClassMap) {
        // If assign permission is given/taken away, we must replicate the same for unassign permission as well
        if (added.contains(ASSIGN_PERMISSION_GROUPS)) {
            sideEffectsClassMap.put(id, PermissionGroup.class);
            sideEffectsAddedMap.merge(id, List.of(UNASSIGN_PERMISSION_GROUPS), ListUtils::union);
        } else if (removed.contains(ASSIGN_PERMISSION_GROUPS)) {
            sideEffectsClassMap.put(id, PermissionGroup.class);
            sideEffectsRemovedMap.merge(id, List.of(UNASSIGN_PERMISSION_GROUPS), ListUtils::union);
        }
    }

    private void sideEffectOnCustomThemeGivenApplicationUpdate(List<Mono<Long>> sideEffects,
                                                               String applicationId,
                                                               List<AclPermission> added,
                                                               List<AclPermission> removed,
                                                               ConcurrentHashMap<String, List<AclPermission>> sideEffectsAddedMap,
                                                               ConcurrentHashMap<String, List<AclPermission>> sideEffectsRemovedMap,
                                                               ConcurrentHashMap<String, Class> sideEffectsClassMap) {

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
                    Mono<List<Theme>> persistedThemeListMono = themeRepository.getPersistedThemesForApplication(applicationId, Optional.empty())
                            .collectList();

                    return Mono.zip(editModeThemeMono, publishedModeThemeMono, persistedThemeListMono)
                            .flatMap(tuple -> {
                                Theme editModeTheme = tuple.getT1();
                                Theme publishedModeTheme = tuple.getT2();
                                List<Theme> persistedThemeList = tuple.getT3();

                                Mono<Long> editModeThemeUpdateMono = Mono.empty();
                                Mono<Long> publishedModeThemeUpdateMono = Mono.empty();
                                Mono<Long> persistedListThemesUpdateMono = Mono.empty();

                                if (editModeTheme.isSystemTheme() && publishedModeTheme.isSystemTheme() && persistedThemeList.isEmpty()) {
                                    // Do nothing. These are system themes and persisted themes list for application is empty.
                                    // We don't want to give system themes permissions since they are already accessible to everyone.
                                    return Mono.empty();
                                }

                                // Translate application permissions to theme permissions
                                List<AclPermission> themeAdded = getRequiredThemePermissionsGivenPermissions(added);
                                List<AclPermission> themeRemoved = getRequiredThemePermissionsGivenPermissions(removed);

                                if (!editModeTheme.isSystemTheme()) {
                                    sideEffectsClassMap.put(editModeThemeId, Theme.class);
                                    sideEffectsAddedMap.merge(editModeThemeId, themeAdded, ListUtils::union);
                                    sideEffectsRemovedMap.merge(editModeThemeId, themeRemoved, ListUtils::union);
                                    editModeThemeUpdateMono = Mono.just(1L);
                                }
                                if (!publishedModeTheme.isSystemTheme()) {
                                    sideEffectsClassMap.put(publishedModeThemeId, Theme.class);
                                    sideEffectsAddedMap.merge(publishedModeThemeId, themeAdded, ListUtils::union);
                                    sideEffectsRemovedMap.merge(publishedModeThemeId, themeRemoved, ListUtils::union);
                                    publishedModeThemeUpdateMono = Mono.just(1L);
                                }

                                if (! persistedThemeList.isEmpty()) {
                                    persistedThemeList.forEach(persistedTheme -> {
                                        sideEffectsClassMap.put(persistedTheme.getId(), Theme.class);
                                        sideEffectsAddedMap.merge(persistedTheme.getId(), themeAdded, ListUtils::union);
                                        sideEffectsRemovedMap.merge(persistedTheme.getId(), themeRemoved, ListUtils::union);
                                    });
                                    persistedListThemesUpdateMono = Mono.just(1L);
                                }


                                return Mono.when(editModeThemeUpdateMono, publishedModeThemeUpdateMono, persistedListThemesUpdateMono)
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

    private List<AclPermission> getRequiredThemePermissionsGivenPermissions(List<AclPermission> permissionList) {
        Set<AclPermission> themePermissionSet = new HashSet<>();
        permissionList.forEach(givenPermission -> {
            if (givenPermission == READ_APPLICATIONS) {
                themePermissionSet.add(READ_THEMES);
            } else if (givenPermission == MANAGE_APPLICATIONS) {
                themePermissionSet.add(MANAGE_THEMES);
            }
        });
        return themePermissionSet.stream().toList();
    }

    private void sideEffectOnReadWorkspaceGivenApplicationUpdate(List<Mono<Long>> sideEffects,
                                                                 String id,
                                                                 List<Integer> permissions,
                                                                 List<String> applicationsRevokedInApplicationResourcesTab,
                                                                 Set<String> workspaceReadGivenAsSideEffect,
                                                                 ConcurrentHashMap<String, List<AclPermission>> sideEffectsAddedMap,
                                                                 ConcurrentHashMap<String, Class> sideEffectsClassMap) {

        // If any of the permissions are true in this tab for application, give workspace read so that
        // the application is visible on the home page.
        boolean anyPermissionTrue = permissions.stream().anyMatch(permission -> permission == 1);

        if (anyPermissionTrue && !workspaceReadGivenAsSideEffect.contains(id)) {
            sideEffects.add(addReadPermissionToWorkspaceGivenApplication(id, sideEffectsAddedMap, sideEffectsClassMap));
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

    private Map<String, Object> getRoleUpdateMetadata(UpdateRoleConfigDTO updateRoleConfigDTO) {
        Map<String, Object> roleUpdateMetadata = new HashMap<>();
        RoleTab tab = RoleTab.getTabByValue(updateRoleConfigDTO.getTabName());
        roleUpdateMetadata.put(GAC_TAB, updateRoleConfigDTO.getTabName());
        List<GacEntityMetadata> entityMetadataList = new ArrayList<>();
        updateRoleConfigDTO.getEntitiesChanged().forEach(entityChanged -> {
            GacEntityMetadata entityMetadata = new GacEntityMetadata();
            entityMetadata.setId(entityChanged.getId());
            entityMetadata.setName(entityChanged.getName());
            entityMetadata.setType(getGacEntityName(entityChanged.getType()));
            List<PermissionViewableName> newPermissions = new ArrayList<>();
            ListIterator<Integer> permissionsIterator = entityChanged.getPermissions().listIterator();
            while (permissionsIterator.hasNext()) {
                int index = permissionsIterator.nextIndex();
                Integer permission = permissionsIterator.next();
                if (permission == 1) {
                    newPermissions.add(tab.getViewablePermissions().get(index));
                }
            }
            entityMetadata.setPermissions(newPermissions);
            entityMetadataList.add(entityMetadata);
        });
        if (!entityMetadataList.isEmpty()) {
            roleUpdateMetadata.put(ENTITY_UPDATED_PERMISSIONS, entityMetadataList);
        }
        return roleUpdateMetadata;
    }

    private String getGacEntityName(String entityName) {
        String gacEntityName = "";
        if (entityName.equals(ActionCollection.class.getSimpleName())) {
            gacEntityName = "JS Object";
        } else if (entityName.equals(NewAction.class.getSimpleName())) {
            gacEntityName = "Action";
        } else if (entityName.equals(NewPage.class.getSimpleName())) {
            gacEntityName = "Page";
        } else {
            gacEntityName = entityName;
        }
        return gacEntityName;
    }
    private Flux<Boolean> validatePermissionsChanged(Class entityClass,
                                                     Set<String> objectIds,
                                                     Map<String, List<AclPermission>> addedPermissions,
                                                     Map<String, List<AclPermission>> removedPermissions) {
        /*
         * Permission Group validation for permission groups checks if any PermissionGroup has been given the
         * Permissions to Edit or Delete the AutoCreated Permission Groups and invalidates them.
         */
        if (entityClass.equals(PermissionGroup.class)) {
            return findPermissionGroupsByIds(objectIds)
                    .flatMap(permissionGroup -> Mono.zip(permissionGroupUtils.isAutoCreated(permissionGroup), Mono.just(permissionGroup)))
                    .map(tuple -> {
                        boolean autoCreated = tuple.getT1();
                        PermissionGroup permissionGroup = tuple.getT2();
                        List<AclPermission> added = addedPermissions.get(permissionGroup.getId());
                        List<AclPermission> removed = removedPermissions.get(permissionGroup.getId());
                        boolean areInvalidPermissionChanged = autoCreated && (added.contains(AclPermission.MANAGE_PERMISSION_GROUPS)
                                || added.contains(AclPermission.DELETE_PERMISSION_GROUPS));
                        if (areInvalidPermissionChanged) {
                            throw new AppsmithException(ACTION_IS_NOT_AUTHORIZED, "Update restricted permissions");
                        }
                        return Boolean.TRUE;
                    });
        }
        return Flux.just(Boolean.TRUE);

    }

    private Flux<PermissionGroup> findPermissionGroupsByIds(Set<String> ids) {
        List<String> includeFields = new ArrayList<>(
                List.of(
                        fieldName(QPermissionGroup.permissionGroup.id),
                        fieldName(QPermissionGroup.permissionGroup.defaultDomainId),
                        fieldName(QPermissionGroup.permissionGroup.defaultDomainType)
                )
        );
        return permissionGroupRepository.findAllByIdsWithoutPermission(ids, includeFields);
    }

    public Mono<Long> updateApplicationAndRelatedResourcesWithPermissionsForRole(String applicationId,
                                                                                 String roleId,
                                                                                 Map<String, List<AclPermission>> toBeAddedPermissions,
                                                                                 Map<String, List<AclPermission>> toBeRemovedPermissions) {
        List<String> includeFieldsForPage = List.of(fieldName(QNewPage.newPage.id));
        List<String> includeFieldsForAction = List.of(fieldName(QNewAction.newAction.id),
                fieldName(QNewAction.newAction.unpublishedAction) + "." + fieldName(QNewAction.newAction.unpublishedAction.datasource) + "." + fieldName(QNewAction.newAction.unpublishedAction.datasource.id),
                fieldName(QNewAction.newAction.publishedAction) + "." + fieldName(QNewAction.newAction.publishedAction.datasource) + "." + fieldName(QNewAction.newAction.publishedAction.datasource.id));
        List<String> includeFieldsForActionCollection = List.of(fieldName(QActionCollection.actionCollection.id));

        Mono<List<NewPage>> allPagesInApplicationMono = newPageRepository
                .findAllByApplicationIdsWithoutPermission(List.of(applicationId), includeFieldsForPage).collectList();
        Mono<List<NewAction>> allActionsInApplicationMono = newActionRepository
                .findAllByApplicationIdsWithoutPermission(List.of(applicationId), includeFieldsForAction).collectList()
                .cache();
        Mono<List<ActionCollection>> allActionCollectionInApplicationMono = actionCollectionRepository
                .findAllByApplicationIds(List.of(applicationId), includeFieldsForActionCollection).collectList();

        return Mono.zip(allPagesInApplicationMono, allActionsInApplicationMono, allActionCollectionInApplicationMono)
                .flatMap(tuple -> {
                    List<NewPage> newPages = tuple.getT1();
                    List<NewAction> newActions = tuple.getT2();
                    List<ActionCollection> actionCollections = tuple.getT3();
                    Set<String> datasourceIds = getAllDatasourceIdsFromActions(newActions);

                    Map<String, Class> entityIdEntityClassMap = new HashMap<>();
                    Map<String, List<AclPermission>> toBeAddedPermissionsForEntities = new HashMap<>();
                    Map<String, List<AclPermission>> toBeRemovedPermissionsForEntities = new HashMap<>();

                    entityIdEntityClassMap.put(applicationId, Application.class);
                    toBeAddedPermissionsForEntities.put(applicationId, toBeAddedPermissions.getOrDefault(Application.class.getSimpleName(), List.of()));
                    toBeRemovedPermissionsForEntities.put(applicationId, toBeRemovedPermissions.getOrDefault(Application.class.getSimpleName(), List.of()));

                    datasourceIds.forEach(datasourceId -> {
                        entityIdEntityClassMap.put(datasourceId, Datasource.class);
                        toBeAddedPermissionsForEntities.put(datasourceId, toBeAddedPermissions.getOrDefault(Datasource.class.getSimpleName(), List.of()));
                        toBeRemovedPermissionsForEntities.put(datasourceId, toBeRemovedPermissions.getOrDefault(Datasource.class.getSimpleName(), List.of()));
                    });

                    newPages.forEach(page -> {
                        entityIdEntityClassMap.put(page.getId(), NewPage.class);
                        toBeAddedPermissionsForEntities.put(page.getId(), toBeAddedPermissions.getOrDefault(NewPage.class.getSimpleName(), List.of()));
                        toBeRemovedPermissionsForEntities.put(page.getId(), toBeRemovedPermissions.getOrDefault(NewPage.class.getSimpleName(), List.of()));
                    });

                    newActions.forEach(newAction -> {
                        entityIdEntityClassMap.put(newAction.getId(), NewAction.class);
                        toBeAddedPermissionsForEntities.put(newAction.getId(), toBeAddedPermissions.getOrDefault(NewAction.class.getSimpleName(), List.of()));
                        toBeRemovedPermissionsForEntities.put(newAction.getId(), toBeRemovedPermissions.getOrDefault(NewPage.class.getSimpleName(), List.of()));
                    });

                    actionCollections.forEach(actionCollection -> {
                        entityIdEntityClassMap.put(actionCollection.getId(), ActionCollection.class);
                        toBeAddedPermissionsForEntities.put(actionCollection.getId(), toBeAddedPermissions.getOrDefault(ActionCollection.class.getSimpleName(), List.of()));
                        toBeRemovedPermissionsForEntities.put(actionCollection.getId(), toBeRemovedPermissions.getOrDefault(ActionCollection.class.getSimpleName(), List.of()));
                    });

                    return bulkUpdateEntityPoliciesForApplicationRole(entityIdEntityClassMap, roleId,
                            toBeAddedPermissionsForEntities, toBeRemovedPermissionsForEntities);
                });
    }

    private Set<String> getAllDatasourceIdsFromActions(List<NewAction> actions) {
        Set<String> datasourceIds = new HashSet<>();
        actions.forEach(action -> {
            ActionDTO unpublishedAction = action.getUnpublishedAction();
            ActionDTO publishedAction = action.getPublishedAction();

            if (unpublishedAction.getDatasource() != null &&
                    unpublishedAction.getDatasource().getId() != null) {
                datasourceIds.add(unpublishedAction.getDatasource().getId());
            }

            if (publishedAction != null &&
                    publishedAction.getDatasource() != null &&
                    publishedAction.getDatasource().getId() != null) {
                datasourceIds.add(publishedAction.getDatasource().getId());
            }
        });
        return datasourceIds;
    }

    private Mono<Long> bulkUpdateEntityPoliciesForApplicationRole(Map<String, Class> entityIdEntityClassMap,
                                                                  String roleId,
                                                                  Map<String, List<AclPermission>> toBeAddedPermissionsMap,
                                                                  Map<String, List<AclPermission>> toBeRemovedPermissionsMap) {
        List<Mono<Long>> sideEffects = new ArrayList<>();
        ConcurrentHashMap<String, List<AclPermission>> entityPermissionsAddedMap = new ConcurrentHashMap<>();
        ConcurrentHashMap<String, List<AclPermission>> entityPermissionsRemovedMap = new ConcurrentHashMap<>();
        ConcurrentHashMap<String, Class> entityClassMap = new ConcurrentHashMap<>();
        ConcurrentHashMap<String, List<AclPermission>> sideEffectsPermissionsAddedMap = new ConcurrentHashMap<>();
        ConcurrentHashMap<String, List<AclPermission>> sideEffectsPermissionsRemovedMap = new ConcurrentHashMap<>();
        ConcurrentHashMap<String, Class> sideEffectsClassMap = new ConcurrentHashMap<>();
        List<String> applicationsRevokedInApplicationResourcesTab = new ArrayList<>();

        Mono<List<Boolean>> collectEntitiesAndSideEffectEntities = Flux.fromIterable(entityIdEntityClassMap.entrySet())
                .map(entry -> {
                    String entityId = entry.getKey();
                    Class<?> clazz = entry.getValue();
                    List<AclPermission> toBeAddedPermissions = toBeAddedPermissionsMap.getOrDefault(entityId, List.of());
                    List<AclPermission> toBeRemovedPermissions = toBeRemovedPermissionsMap.getOrDefault(entityId, List.of());

                    entityPermissionsAddedMap.merge(entityId, toBeAddedPermissions, ListUtils::union);
                    entityPermissionsRemovedMap.merge(entityId, toBeRemovedPermissions, ListUtils::union);
                    entityClassMap.put(entityId, clazz);

                    if (clazz.equals(NewPage.class)) {
                        sideEffectOnActionsGivenPageUpdate(sideEffects, entityId, toBeAddedPermissions,
                                toBeRemovedPermissions, sideEffectsPermissionsAddedMap,
                                sideEffectsPermissionsRemovedMap, sideEffectsClassMap);
                    }
                    if (clazz.equals(Application.class)) {
                        sideEffectOnCustomThemeGivenApplicationUpdate(sideEffects, entityId, toBeAddedPermissions,
                                toBeRemovedPermissions, sideEffectsPermissionsAddedMap,
                                sideEffectsPermissionsRemovedMap, sideEffectsClassMap);
                        sideEffects.add(addReadPermissionToWorkspaceGivenApplication(entityId, sideEffectsPermissionsAddedMap, sideEffectsClassMap));
                    }
                    return Mono.just(Boolean.TRUE);
                })
                .map(value -> true)
                .collectList();

        Flux<Boolean> updateEntityPoliciesAndSideEffectsFlux = updateEntityPoliciesAndSideEffects(roleId, collectEntitiesAndSideEffectEntities, sideEffects,
                entityPermissionsAddedMap, entityPermissionsRemovedMap, entityClassMap, sideEffectsPermissionsAddedMap,
                sideEffectsPermissionsRemovedMap, sideEffectsClassMap, applicationsRevokedInApplicationResourcesTab);

        return updateEntityPoliciesAndSideEffectsFlux
                .then(Mono.just(1L));
    }

    @Override
    public Mono<Long> updateWorkspaceAndDatasourcesInWorkspaceWithPermissionsForRole(String workspaceId,
                                                                                     String roleId,
                                                                                     Map<String, List<AclPermission>> toBeAddedPermissions,
                                                                                     Map<String, List<AclPermission>> toBeRemovedPermissions) {
        List<String> includeFields = List.of(fieldName(QDatasource.datasource.id));
        Mono<List<Datasource>> allDatasourcesInWorkspaceMono = datasourceRepository.findAllByWorkspaceIdsWithoutPermission(Set.of(workspaceId), includeFields)
                .collectList();
        return allDatasourcesInWorkspaceMono
                .flatMap(datasources -> {
                    Map<String, Class> entityIdEntityClassMap = new HashMap<>();
                    Map<String, List<AclPermission>> toBeAddedPermissionsForEntities = new HashMap<>();
                    Map<String, List<AclPermission>> toBeRemovedPermissionsForEntities = new HashMap<>();
                    entityIdEntityClassMap.put(workspaceId, Workspace.class);
                    toBeAddedPermissionsForEntities.put(workspaceId, toBeAddedPermissions.getOrDefault(Workspace.class.getSimpleName(), List.of()));
                    toBeRemovedPermissionsForEntities.put(workspaceId, toBeRemovedPermissions.getOrDefault(Workspace.class.getSimpleName(), List.of()));
                    datasources.forEach(datasource -> {
                        entityIdEntityClassMap.put(datasource.getId(), Datasource.class);
                        toBeAddedPermissionsForEntities.put(datasource.getId(), toBeAddedPermissions.getOrDefault(Datasource.class.getSimpleName(), List.of()));
                        toBeRemovedPermissionsForEntities.put(datasource.getId(), toBeRemovedPermissions.getOrDefault(Datasource.class.getSimpleName(), List.of()));
                    });
                    return bulkUpdateEntityPoliciesForApplicationRole(entityIdEntityClassMap, roleId,
                            toBeAddedPermissionsForEntities, toBeRemovedPermissionsForEntities);
                });
    }
}
package com.appsmith.server.solutions.roles;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.GenericDatabaseOperation;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.WorkspaceRepository;
import com.appsmith.server.solutions.roles.constants.PermissionViewableName;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.RoleTabDTO;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleConfigDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleEntityDTO;
import org.apache.commons.collections.CollectionUtils;
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
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MANAGE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.solutions.roles.constants.AclPermissionAndViewablePermissionConstantsMaps.getAclPermissionsFromViewableName;

@Component
public class RoleConfigurationSolutionImpl implements RoleConfigurationSolution {

    private final WorkspaceResources workspaceResources;
    private final TenantResources tenantResources;
    private final GenericDatabaseOperation genericDatabaseOperation;
    private final ApplicationRepository applicationRepository;
    private final WorkspaceRepository workspaceRepository;
    private final PermissionGroupRepository permissionGroupRepository;

    public RoleConfigurationSolutionImpl(WorkspaceResources workspaceResources,
                                         TenantResources tenantResources,
                                         GenericDatabaseOperation genericDatabaseOperation,
                                         ApplicationRepository applicationRepository,
                                         WorkspaceRepository workspaceRepository,
                                         PermissionGroupRepository permissionGroupRepository) {


        this.workspaceResources = workspaceResources;
        this.tenantResources = tenantResources;
        this.genericDatabaseOperation = genericDatabaseOperation;
        this.applicationRepository = applicationRepository;
        this.workspaceRepository = workspaceRepository;
        this.permissionGroupRepository = permissionGroupRepository;
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
        List<Tuple3<String, Class, List<AclPermission>>> duplicateEntities = tab.getDuplicateEntities();
        List<Mono<Long>> sideEffects = new ArrayList<>();
        List<Mono<Boolean>> postAllUpdatesSideEffects = new ArrayList<>();

        Set<UpdateRoleEntityDTO> entitiesChanged = updateRoleConfigDTO.getEntitiesChanged();

        List<String> applicationsRevokedInApplicationResourcesTab = new ArrayList<>();
        Set<String> workspaceReadGivenAsSideEffect = new HashSet<>();

        Flux<Long> updateEntityPoliciesFlux = Flux.fromIterable(entitiesChanged)
                .flatMap(entity -> {
                    String id = entity.getId();
                    String type = entity.getType();
                    String name = entity.getName();
                    List<AclPermission> permissionsOfInterestIfDuplicate = new ArrayList<>();

                    Class<?> aClass = null;

                    try {
                        aClass = getClass(type);
                    } catch (ClassNotFoundException e) {
                        // This must be a custom header (aka same entity type but different name)
                        Optional<Tuple3<String, Class, List<AclPermission>>> duplicateEntityClassOptional = duplicateEntities.stream()
                                .filter(entityTuple -> entityTuple.getT1().equals(name))
                                .findFirst();

                        if (duplicateEntityClassOptional.isPresent()) {
                            Tuple3<String, Class, List<AclPermission>> entityTuple = duplicateEntityClassOptional.get();
                            aClass = (Class<?>) entityTuple.getT2();
                            permissionsOfInterestIfDuplicate = entityTuple.getT3();
                        }

                    }

                    // If we haven't been able to figure out the class so far, throw an error and return
                    if (aClass == null) {
                        return Flux.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                    }

                    List<Integer> permissions = entity.getPermissions();

                    // Compute the side effects for this entity and add to the list.
                    computeSideEffectOfPermissionChange(sideEffects, tab, aClass, id, permissions, permissionGroupId,
                            applicationsRevokedInApplicationResourcesTab, workspaceReadGivenAsSideEffect);

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

                    return genericDatabaseOperation.updatePolicies(id, permissionGroupId, added, removed, aClass);
                })
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
                                                     Class aClazz,
                                                     String id,
                                                     List<Integer> permissions,
                                                     String permissionGroupId,
                                                     List<String> applicationsRevokedInApplicationResourcesTab,
                                                     Set<String> workspaceReadGivenAsSideEffect) {

        if (tab == RoleTab.APPLICATION_RESOURCES && Application.class.equals(aClazz)) {
            // If the tab is application resources, and the entity is an application, then we need to
            // update the READ_WORKSPACE permission for the workspace

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
    }

    private Class getClass(String name) throws ClassNotFoundException {
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

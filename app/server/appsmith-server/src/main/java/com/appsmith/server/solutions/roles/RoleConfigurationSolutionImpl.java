package com.appsmith.server.solutions.roles;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.GenericDatabaseOperation;
import com.appsmith.server.solutions.roles.constants.PermissionViewableName;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.RoleTabDTO;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleConfigDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleEntityDTO;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple3;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.ListIterator;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.solutions.roles.constants.AclPermissionAndViewablePermissionConstantsMaps.getAclPermissionsFromViewableName;

@Component
public class RoleConfigurationSolutionImpl implements RoleConfigurationSolution {

    private final WorkspaceResources workspaceResources;
    private final TenantResources tenantResources;
    private final GenericDatabaseOperation genericDatabaseOperation;

    public RoleConfigurationSolutionImpl(WorkspaceResources workspaceResources,
                                         TenantResources tenantResources,
                                         GenericDatabaseOperation genericDatabaseOperation) {

        this.workspaceResources = workspaceResources;
        this.tenantResources = tenantResources;
        this.genericDatabaseOperation = genericDatabaseOperation;
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

        String tabName = updateRoleConfigDTO.getTabName();
        RoleTab tab = RoleTab.getTabByValue(tabName);
        List<PermissionViewableName> viewablePermissions = tab.getViewablePermissions();
        List<Tuple3<String, Class, List<AclPermission>>> duplicateEntities = tab.getDuplicateEntities();

        Set<UpdateRoleEntityDTO> entitiesChanged = updateRoleConfigDTO.getEntitiesChanged();

        Flux<Long> updateEntityPoliciesFlux = Flux.fromIterable(entitiesChanged)
                .flatMap(entity -> {
                    String id = entity.getId();
                    String type = entity.getType();
                    String name = entity.getName();
                    List<AclPermission> permissionsOfInterestIfDuplicate = new ArrayList<>();

                    Class<?> aClass = null;
                    String completeClassName = "com.appsmith.server.domains." + type;
                    try {
                        aClass = Class.forName(completeClassName);
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
                        throw new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR);
                    }
                    List<Integer> permissions = entity.getPermissions();
                    ListIterator<Integer> permissionsIterator = permissions.listIterator();
                    List<AclPermission> added = new ArrayList<>();
                    List<AclPermission> removed = new ArrayList<>();
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

                    return genericDatabaseOperation.updatePolicies(id, permissionGroupId, added, removed, aClass);
                });


        return updateEntityPoliciesFlux
                .then(getAllTabViews(permissionGroupId));
    }

}

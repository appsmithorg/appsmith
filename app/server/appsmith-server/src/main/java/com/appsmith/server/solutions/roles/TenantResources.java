package com.appsmith.server.solutions.roles;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QPermissionGroup;
import com.appsmith.server.domains.QUserGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.PermissionGroupUtils;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.solutions.roles.constants.PermissionViewableName;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.BaseView;
import com.appsmith.server.solutions.roles.dtos.EntityView;
import com.appsmith.server.solutions.roles.dtos.IdPermissionDTO;
import com.appsmith.server.solutions.roles.dtos.RoleTabDTO;
import com.google.common.collect.Sets;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.CREATE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.CREATE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.CREATE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.READ_TENANT_AUDIT_LOGS;
import static com.appsmith.server.acl.AclPermission.TENANT_ADD_USER_TO_ALL_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_DELETE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_DELETE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_MANAGE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_MANAGE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_READ_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_READ_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_REMOVE_USER_FROM_ALL_USER_GROUPS;
import static com.appsmith.server.constants.FieldName.AUDIT_LOGS;
import static com.appsmith.server.constants.FieldName.TENANT_GROUP;
import static com.appsmith.server.constants.FieldName.TENANT_ROLE;
import static com.appsmith.server.constants.FieldName.CUSTOM_ROLES;
import static com.appsmith.server.constants.FieldName.DEFAULT_ROLES;
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;
import static com.appsmith.server.solutions.roles.HelperUtil.generateLateralPermissionDTOsAndUpdateMap;
import static com.appsmith.server.solutions.roles.HelperUtil.getHierarchicalLateralPermMap;
import static com.appsmith.server.solutions.roles.HelperUtil.getLateralPermMap;
import static com.appsmith.server.solutions.roles.HelperUtil.getRoleViewPermissionDTO;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.ASSOCIATE_ROLE;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.INVITE_USER;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.REMOVE_USER;
import static java.lang.Boolean.TRUE;

@Component
public class TenantResources {

    private final TenantRepository tenantRepository;
    private final UserGroupRepository userGroupRepository;
    private final PermissionGroupRepository permissionGroupRepository;
    private final PolicyGenerator policyGenerator;
    private final PermissionGroupUtils permissionGroupUtils;

    Set<AclPermission> tenantGroupPermissions = Set.of(
            CREATE_USER_GROUPS,
            TENANT_MANAGE_USER_GROUPS,
            TENANT_READ_USER_GROUPS,
            TENANT_DELETE_USER_GROUPS,
            TENANT_ADD_USER_TO_ALL_USER_GROUPS,
            TENANT_REMOVE_USER_FROM_ALL_USER_GROUPS
    );

    Set<AclPermission> tenantRolePermissions = Set.of(
            CREATE_PERMISSION_GROUPS,
            TENANT_MANAGE_PERMISSION_GROUPS,
            TENANT_READ_PERMISSION_GROUPS,
            TENANT_DELETE_PERMISSION_GROUPS,
            TENANT_ASSIGN_PERMISSION_GROUPS
    );

    Set<AclPermission> tenantWorkspacePermissionsForOther = Set.of(CREATE_WORKSPACES);

    Set<AclPermission> tenantAuditLogPermissionForOther = Set.of(READ_TENANT_AUDIT_LOGS);

    public TenantResources(TenantRepository tenantRepository,
                           UserGroupRepository userGroupRepository,
                           PermissionGroupRepository permissionGroupRepository,
                           PolicyGenerator policyGenerator,
                           PermissionGroupUtils permissionGroupUtils) {

        this.tenantRepository = tenantRepository;
        this.userGroupRepository = userGroupRepository;
        this.permissionGroupRepository = permissionGroupRepository;
        this.policyGenerator = policyGenerator;
        this.permissionGroupUtils = permissionGroupUtils;
    }

    public Mono<RoleTabDTO> createOthersTab(String permissionGroupId, CommonAppsmithObjectData dataFromRepositoryForAllTabs) {

        EntityView entityView = new EntityView();
        entityView.setType(Tenant.class.getSimpleName());

        Flux<Workspace> workspaceFlux = dataFromRepositoryForAllTabs.getWorkspaceFlux();

        return tenantRepository.findBySlug(FieldName.DEFAULT)
                .flatMap(tenant -> {
                    Mono<BaseView> workspaceBaseViewMono = generateWorkspaceBaseViewForOther(tenant, permissionGroupId, workspaceFlux);
                    Mono<BaseView> auditLogViewMono = generateAuditLogBaseViewForOther(tenant, permissionGroupId);
                    // Commenting the calculation of the hover map today because there is no relationship between permissions on the tab. The same function
                    // call can be uncommented when newer related permissions are introduced in the tab which requires creation of hover map
//                    Mono<Map<String, Set<IdPermissionDTO>>> hoverMapMono = getLinkedPermissionsForOtherRoles(RoleTab.OTHERS, workspaceFlux);
                    Mono<Map<String, Set<IdPermissionDTO>>> hoverMapMono = Mono.just(Map.of());

                    return Mono.zip(workspaceBaseViewMono, auditLogViewMono, hoverMapMono)
                            .map(tuple -> {

                                entityView.setEntities(List.of(tuple.getT1(), tuple.getT2()));

                                RoleTabDTO roleTabDTO = new RoleTabDTO();
                                roleTabDTO.setData(entityView);
                                roleTabDTO.setPermissions(RoleTab.OTHERS.getViewablePermissions());
                                roleTabDTO.setHoverMap(tuple.getT3());
                                return roleTabDTO;
                            });
                });
    }

    Mono<BaseView> generateWorkspaceBaseViewForOther(Tenant tenant, String permissionGroupId, Flux<Workspace> workspaceFlux) {

        BaseView baseView = new BaseView();
        baseView.setId(tenant.getId());
        baseView.setName("Workspaces");
        Tuple2<List<Integer>, List<Integer>> roleViewPermissionDTO = getRoleViewPermissionDTO(permissionGroupId,
                Tenant.class, policyGenerator, tenant.getPolicies(), tenantWorkspacePermissionsForOther,
                RoleTab.OTHERS.getViewablePermissions());
        baseView.setEnabled(roleViewPermissionDTO.getT1());
        // Add the individual workspaces to the base view as children
        return workspaceFlux
                .map(workspace -> {
                    BaseView workspaceDto = new BaseView();
                    workspaceDto.setId(workspace.getId());
                    workspaceDto.setName(workspace.getName());
                    Tuple2<List<Integer>, List<Integer>> permissionsTuple =
                            getRoleViewPermissionDTO(RoleTab.OTHERS, permissionGroupId, workspace.getPolicies(),
                                    Workspace.class, policyGenerator);
                    workspaceDto.setEnabled(permissionsTuple.getT1());

                    return workspaceDto;
                })
                .collectList()
                .map(workspaceDtos -> {

                    EntityView workspaceEntityView = new EntityView();
                    workspaceEntityView.setType(Workspace.class.getSimpleName());
                    workspaceEntityView.setEntities(workspaceDtos);

                    baseView.setChildren(Set.of(workspaceEntityView));
                    return baseView;
                });
    }

    Mono<BaseView> generateAuditLogBaseViewForOther(Tenant tenant, String permissionGroupId) {

        BaseView baseView = new BaseView();
        baseView.setId(tenant.getId());
        baseView.setName(AUDIT_LOGS);
        Tuple2<List<Integer>, List<Integer>> roleViewPermissionDTO = getRoleViewPermissionDTO(permissionGroupId,
                Tenant.class, policyGenerator, tenant.getPolicies(), tenantAuditLogPermissionForOther,
                RoleTab.OTHERS.getViewablePermissions());
        baseView.setEnabled(roleViewPermissionDTO.getT1());

        return Mono.just(baseView);
    }

    public Mono<RoleTabDTO> createGroupsAndRolesTab(String permissionGroupId) {
        Mono<Tenant> defaultTenantMono = tenantRepository.findBySlug(FieldName.DEFAULT);

        EntityView entityView = new EntityView();
        entityView.setType(Tenant.class.getSimpleName());

        return tenantRepository.findBySlug(FieldName.DEFAULT)
                .flatMap(tenant -> {

                    Flux<UserGroup> userGroupFlux = getAllUserGroups(tenant.getId()).cache();
                    Flux<PermissionGroup> permissionGroupFlux = getAllPermissionGroups(tenant.getId()).cache();

                    // Get the permission hover map for the tab
                    Mono<Map<String, Set<IdPermissionDTO>>> linkedPermissionsMono =
                            getLinkedPermissionsForGroupsRoles(RoleTab.GROUPS_ROLES, tenant, userGroupFlux,
                                    permissionGroupFlux);

                    // Get the permission disable map for the tab
                    Mono<Map<String, Set<IdPermissionDTO>>> disablePermissionMapMono =
                            getDisableMapsForForGroupsRoles(RoleTab.GROUPS_ROLES, tenant, userGroupFlux,
                                    permissionGroupFlux);

                    Mono<BaseView> groupsBaseViewMono = generateGroupsBaseView(tenant, permissionGroupId, userGroupFlux);
                    Mono<BaseView> rolesBaseViewMono = generateRolesBaseView(tenant, permissionGroupId, permissionGroupFlux);

                    return Mono.zip(groupsBaseViewMono, rolesBaseViewMono, linkedPermissionsMono, disablePermissionMapMono)
                            .map(tuple -> {
                                // Add roles and groups tenant views to the entity as base views
                                entityView.setEntities(List.of(tuple.getT1(), tuple.getT2()));

                                RoleTabDTO roleTabDTO = new RoleTabDTO();
                                roleTabDTO.setData(entityView);
                                roleTabDTO.setPermissions(RoleTab.GROUPS_ROLES.getViewablePermissions());
                                roleTabDTO.setHoverMap(tuple.getT3());
                                roleTabDTO.setDisableHelperMap(tuple.getT4());

                                return roleTabDTO;
                            });
                });
    }

    Mono<BaseView> generateGroupsBaseView(Tenant tenant, String permissionGroupId, Flux<UserGroup> userGroupFlux) {

        BaseView baseView = new BaseView();
        baseView.setId(tenant.getId());
        baseView.setName("Groups");
        Tuple2<List<Integer>, List<Integer>> roleViewPermissionDTO = getRoleViewPermissionDTO(permissionGroupId,
                Tenant.class, policyGenerator, tenant.getPolicies(), tenantGroupPermissions,
                RoleTab.GROUPS_ROLES.getViewablePermissions());
        baseView.setEnabled(roleViewPermissionDTO.getT1());

        // Add the user groups to the base view as children
        return userGroupFlux
                .map(userGroup -> {
                    BaseView userGroupDto = new BaseView();
                    userGroupDto.setId(userGroup.getId());
                    userGroupDto.setName(userGroup.getName());
                    Tuple2<List<Integer>, List<Integer>> permissionsTuple =
                            getRoleViewPermissionDTO(RoleTab.GROUPS_ROLES, permissionGroupId, userGroup.getPolicies(),
                                    UserGroup.class, policyGenerator);
                    userGroupDto.setEnabled(permissionsTuple.getT1());

                    return userGroupDto;
                })
                .collectList()
                .map(userGroupDTOs -> {

                    EntityView userGroupEntityView = new EntityView();
                    userGroupEntityView.setType(UserGroup.class.getSimpleName());
                    userGroupEntityView.setEntities(userGroupDTOs);

                    baseView.setChildren(Set.of(userGroupEntityView));
                    return baseView;
                });
    }

    Mono<BaseView> generateRolesBaseView(Tenant tenant, String permissionGroupId, Flux<PermissionGroup> permissionGroupFlux) {

        BaseView baseView = new BaseView();
        baseView.setId(tenant.getId());
        baseView.setName("Roles");
        Tuple2<List<Integer>, List<Integer>> roleViewPermissionDTO = getRoleViewPermissionDTO(permissionGroupId,
                Tenant.class, policyGenerator, tenant.getPolicies(), tenantRolePermissions,
                RoleTab.GROUPS_ROLES.getViewablePermissions());
        baseView.setEnabled(roleViewPermissionDTO.getT1());

        // Add the roles to the base view as children
        return permissionGroupFlux
                .flatMap(permissionGroup -> {
                    BaseView permissionGroupDto = new BaseView();
                    permissionGroupDto.setId(permissionGroup.getId());
                    permissionGroupDto.setName(permissionGroup.getName());
                    Tuple2<List<Integer>, List<Integer>> permissionsTuple =
                            getRoleViewPermissionDTO(RoleTab.GROUPS_ROLES, permissionGroupId, permissionGroup.getPolicies(),
                                    PermissionGroup.class, policyGenerator);
                    permissionGroupDto.setEnabled(permissionsTuple.getT1());
                    return Mono.zip(Mono.just(permissionGroupDto), Mono.just(permissionGroup));
                })
                .flatMap(tuple -> {
                    BaseView permissionGroupDto = tuple.getT1();
                    PermissionGroup permissionGroup = tuple.getT2();
                    return updateEnabledForPermissionGroup(permissionGroupDto, permissionGroup);
                })
                .collectList()
                .map(pgBaseView -> {
                    List<BaseView> defaultPgBaseView = pgBaseView.stream().filter(Tuple2::getT2).map(Tuple2::getT1).toList();
                    List<BaseView> customPgBaseView = pgBaseView.stream().filter(tuple -> ! tuple.getT2()).map(Tuple2::getT1).toList();
                    return Tuples.of(defaultPgBaseView, customPgBaseView);
                })
                .map(pgBaseViewTuple -> {

                    EntityView header = new EntityView();
                    header.setType("Header");

                    EntityView defaultPgEntityView = new EntityView();
                    defaultPgEntityView.setType(PermissionGroup.class.getSimpleName());
                    defaultPgEntityView.setEntities(pgBaseViewTuple.getT1());

                    BaseView defaultPgBaseView = new BaseView();
                    defaultPgBaseView.setName(DEFAULT_ROLES);
                    defaultPgBaseView.setChildren(Set.of(defaultPgEntityView));

                    EntityView customPgEntityView = new EntityView();
                    customPgEntityView.setType(PermissionGroup.class.getSimpleName());
                    customPgEntityView.setEntities(pgBaseViewTuple.getT2());

                    BaseView customPgBaseView = new BaseView();
                    customPgBaseView.setName(CUSTOM_ROLES);
                    customPgBaseView.setChildren(Set.of(customPgEntityView));

                    header.setEntities(List.of(defaultPgBaseView, customPgBaseView));

                    baseView.setChildren(Set.of(header));
                    return baseView;
                });
    }

    private Flux<UserGroup> getAllUserGroups(String tenantId) {
        List<String> includeFields = new ArrayList<>(
                List.of(
                        fieldName(QUserGroup.userGroup.policies),
                        fieldName(QUserGroup.userGroup.name)
                )
        );
        return userGroupRepository.findAllByTenantIdWithoutPermission(tenantId, includeFields);
    }

    private Flux<PermissionGroup> getAllPermissionGroups(String tenantId) {
        List<String> includeFields = new ArrayList<>(
                List.of(
                        fieldName(QPermissionGroup.permissionGroup.policies),
                        fieldName(QPermissionGroup.permissionGroup.name),
                        fieldName(QPermissionGroup.permissionGroup.defaultWorkspaceId)
                )
        );
        return permissionGroupRepository.findAllByTenantIdWithoutPermission(tenantId, includeFields);
    }

    private Mono<Map<String, Set<IdPermissionDTO>>> getDisableMapsForForGroupsRoles(RoleTab roleTab,
                                                                                    Tenant tenant,
                                                                                    Flux<UserGroup> userGroupFlux,
                                                                                    Flux<PermissionGroup> permissionGroupFlux) {

        Set<AclPermission> tabPermissions = roleTab.getPermissions();

        Set<AclPermission> tenantPermissions = tabPermissions.stream().filter(permission -> permission.getEntity().equals(Tenant.class)).collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> tenantLateralMap = getLateralPermMap(tenantPermissions, policyGenerator, roleTab);

        Set<AclPermission> userGroupPermissions = tabPermissions.stream().filter(permission -> permission.getEntity().equals(UserGroup.class)).collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> userGroupLateralMap = getLateralPermMap(userGroupPermissions, policyGenerator, roleTab);

        Set<AclPermission> permissionGroupPermissions = tabPermissions.stream().filter(permission -> permission.getEntity().equals(PermissionGroup.class)).collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> permissionGroupLateralMap = getLateralPermMap(permissionGroupPermissions, policyGenerator, roleTab);

        String tenantId = tenant.getId();
        ConcurrentHashMap<String, Set<IdPermissionDTO>> disableMap = new ConcurrentHashMap<>();

        // Add lateral permissions interaction for tenant
        generateLateralPermissionDTOsAndUpdateMap(tenantLateralMap, disableMap, tenantId, tenantId, Tenant.class);

        // Add lateral permissions interaction for user groups
        Mono<Boolean> userGroupDisableMapMono = userGroupFlux
                .map(userGroup -> {
                    String userGroupId = userGroup.getId();
                    generateLateralPermissionDTOsAndUpdateMap(userGroupLateralMap, disableMap, userGroupId, userGroupId, UserGroup.class);
                    return userGroup;
                })
                .then(Mono.just(TRUE));

        // Add lateral permissions interaction for permission groups
        Mono<Boolean> permissionGroupDisableMapMono = permissionGroupFlux
                .map(permissionGroup -> {
                    String permissionGroupId = permissionGroup.getId();
                    generateLateralPermissionDTOsAndUpdateMap(permissionGroupLateralMap, disableMap, permissionGroupId, permissionGroupId, PermissionGroup.class);
                    return permissionGroup;
                })
                .then(Mono.just(TRUE));

        // Trim the hover map before returning
        Mono<Map<String, Set<IdPermissionDTO>>> trimmedHoverMapMono = Mono.just(disableMap)
                .map(disableMap1 -> {
                    disableMap1.values().removeIf(Set::isEmpty);
                    return disableMap1;
                });
        separateRolesAndGroupsDisableLateralPermission(disableMap, tenantId);

        return Mono.when(userGroupDisableMapMono, permissionGroupDisableMapMono)
                .then(trimmedHoverMapMono);

    }

    private void separateRolesAndGroupsDisableLateralPermission(ConcurrentHashMap<String, Set<IdPermissionDTO>> disableMap,
                                                                String tenantId) {
        Map<String, Set<IdPermissionDTO>> newDisableMap = new HashMap<>();
        disableMap.forEach((key, value) -> {
            if (key.startsWith(tenantId)) {
                String tenantGroupKey = key + "_" + TENANT_GROUP;
                String tenantRoleKey = key + "_" + TENANT_ROLE;
                Set<IdPermissionDTO> tenantGroupSet = value.stream()
                        .filter(idPermissionDTO -> PermissionViewableName.getAllGroupRelatedPermission().contains(idPermissionDTO.getP()))
                        .collect(Collectors.toSet());
                Set<IdPermissionDTO> tenantRoleSet = value.stream()
                        .filter(idPermissionDTO -> PermissionViewableName.getAllRoleRelatedPermission().contains(idPermissionDTO.getP()))
                        .collect(Collectors.toSet());
                if (key.endsWith(INVITE_USER.getName()) || key.endsWith(REMOVE_USER.getName())) {
                    newDisableMap.put(tenantGroupKey, tenantGroupSet);
                } else if (key.endsWith(ASSOCIATE_ROLE.getName())) {
                    newDisableMap.put(tenantRoleKey, tenantRoleSet);
                } else {
                    newDisableMap.put(tenantGroupKey, tenantGroupSet);
                    newDisableMap.put(tenantRoleKey, tenantRoleSet);
                }
            }
        });
        disableMap.entrySet().removeIf(entry -> entry.getKey().contains(tenantId));
        disableMap.putAll(newDisableMap);
    }

    /*
     * This method is used to calculate the Hover Map for the UserGroup.
     * Here we mark the Tenant ID Permissions with a suffix: _TenantGroup.
     * This will help the Client flow permissions to the respective groups only.
     * Earlier, the client would have to iterate over all the groups and roles and flow the permissions.
     */
    private Mono<Map<String, Set<IdPermissionDTO>>> getLinkedPermissionsForGroups(RoleTab roleTab,
                                                                                  String tenantId,
                                                                                  Flux<UserGroup> userGroupFlux) {
        Set<AclPermission> tabPermissions = roleTab.getPermissions();
        Set<AclPermission> tenantPermissions = tabPermissions.stream().filter(permission -> permission.getEntity().equals(Tenant.class)).collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> tenantHierarchicalLateralMap = getHierarchicalLateralPermMap(tenantPermissions, policyGenerator, roleTab);

        Set<AclPermission> userGroupPermissions = tabPermissions.stream().filter(permission -> permission.getEntity().equals(UserGroup.class)).collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> userGroupHierarchicalLateralMap = getHierarchicalLateralPermMap(userGroupPermissions, policyGenerator, roleTab);

        ConcurrentHashMap<String, Set<IdPermissionDTO>> hoverMap = new ConcurrentHashMap<>();
        // Add lateral permissions interaction for tenant
        generateLateralPermissionDTOsAndUpdateMap(tenantHierarchicalLateralMap, hoverMap, tenantId, tenantId, Tenant.class);

        // Add hierarchical and lateral permissions interaction for user groups
        Mono<Boolean> userGroupHoverMapMono = userGroupFlux
                .map(userGroup -> {
                    String userGroupId = userGroup.getId();
                    generateLateralPermissionDTOsAndUpdateMap(tenantHierarchicalLateralMap, hoverMap, tenantId, userGroupId, UserGroup.class);
                    generateLateralPermissionDTOsAndUpdateMap(userGroupHierarchicalLateralMap, hoverMap, userGroupId, userGroupId, UserGroup.class);
                    return userGroup;
                })
                .then(Mono.just(TRUE));

        // Trim the hover map before returning
        Mono<Map<String, Set<IdPermissionDTO>>> trimmedHoverMapMono = Mono.just(hoverMap)
                .map(hoverMap1 -> {
                    hoverMap1.values().removeIf(Set::isEmpty);
                    /*
                     * Remove the Associate Role permission, because the Groups have no use of this permission.
                     */
                    hoverMap1.entrySet().removeIf(entry -> entry.getKey().contains(ASSOCIATE_ROLE.getName()));
                    Map<String, Set<IdPermissionDTO>> updatedMap = new ConcurrentHashMap<>();
                    hoverMap1.forEach((key, value) -> {
                        if (key.startsWith(tenantId)) {
                            updatedMap.put(key + "_" + TENANT_GROUP, value);
                        }
                        else {
                            updatedMap.put(key, value);
                        }
                    });
                    return updatedMap;
                });

        return userGroupHoverMapMono.then(trimmedHoverMapMono);
    }

    /*
     * This method is used to calculate the Hover Map for the UserGroup.
     * Here we mark the Tenant ID Permissions with a suffix: _TenantRole.
     * This will help the Client flow permissions to the respective roles only.
     * Earlier, the client would have to iterate over all the groups and roles and flow the permissions.
     */
    private Mono<Map<String, Set<IdPermissionDTO>>> getLinkedPermissionsForRoles(RoleTab roleTab,
                                                                                 String tenantId,
                                                                                 Flux<PermissionGroup> permissionGroupFlux) {
        Set<AclPermission> tabPermissions = roleTab.getPermissions();
        Set<AclPermission> tenantPermissions = tabPermissions.stream().filter(permission -> permission.getEntity().equals(Tenant.class)).collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> tenantHierarchicalLateralMap = getHierarchicalLateralPermMap(tenantPermissions, policyGenerator, roleTab);

        Set<AclPermission> permissionGroupPermissions = tabPermissions.stream().filter(permission -> permission.getEntity().equals(PermissionGroup.class)).collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> permissionGroupHierarchicalLateralMap = getHierarchicalLateralPermMap(permissionGroupPermissions, policyGenerator, roleTab);

        ConcurrentHashMap<String, Set<IdPermissionDTO>> hoverMap = new ConcurrentHashMap<>();
        // Add lateral permissions interaction for tenant
        generateLateralPermissionDTOsAndUpdateMap(tenantHierarchicalLateralMap, hoverMap, tenantId, tenantId, Tenant.class);

        // Add hierarchical and lateral permissions interaction for permission groups
        Mono<Boolean> permissionGroupHoverMapMono = permissionGroupFlux
                .map(permissionGroup -> {
                    String permissionGroupId = permissionGroup.getId();
                    generateLateralPermissionDTOsAndUpdateMap(tenantHierarchicalLateralMap, hoverMap, tenantId, permissionGroupId, PermissionGroup.class);
                    generateLateralPermissionDTOsAndUpdateMap(permissionGroupHierarchicalLateralMap, hoverMap, permissionGroupId, permissionGroupId, PermissionGroup.class);
                    return permissionGroup;
                })
                .flatMap(permissionGroup -> updateHoverMapPermissionsForPermissionGroup(hoverMap, permissionGroup))
                .collectList()
                .then(Mono.just(TRUE));

        // Trim the hover map before returning
        Mono<Map<String, Set<IdPermissionDTO>>> trimmedHoverMapMono = Mono.just(hoverMap)
                .map(hoverMap1 -> {
                    hoverMap1.values().removeIf(Set::isEmpty);
                    /*
                     * Remove the Invite User and Remove User permission, because the Roles  have no use of these permissions.
                     */
                    hoverMap1.entrySet().removeIf(entry -> entry.getKey().contains(INVITE_USER.getName()) || entry.getKey().contains(REMOVE_USER.getName()));
                    Map<String, Set<IdPermissionDTO>> updatedMap = new ConcurrentHashMap<>();
                    hoverMap1.forEach((key, value) -> {
                        if (key.startsWith(tenantId)) {
                            updatedMap.put(key + "_" + TENANT_ROLE, value);
                        }
                        else {
                            updatedMap.put(key, value);
                        }
                    });
                    return updatedMap;
                });

        return permissionGroupHoverMapMono.then(trimmedHoverMapMono);
    }

    private Mono<Map<String, Set<IdPermissionDTO>>> getLinkedPermissionsForGroupsRoles(RoleTab roleTab,
                                                                                       Tenant tenant,
                                                                                       Flux<UserGroup> userGroupFlux,
                                                                                       Flux<PermissionGroup> permissionGroupFlux) {

        Mono<Map<String, Set<IdPermissionDTO>>> userGroupHoverPermissionMono = getLinkedPermissionsForGroups(roleTab, tenant.getId(), userGroupFlux);
        Mono<Map<String, Set<IdPermissionDTO>>> permissionGroupHoverPermissionMono = getLinkedPermissionsForRoles(roleTab, tenant.getId(), permissionGroupFlux);

        return Mono.zip(userGroupHoverPermissionMono, permissionGroupHoverPermissionMono)
                .map(tuple -> {
                    Map<String, Set<IdPermissionDTO>> userGroupHoverPermission = tuple.getT1();
                    Map<String, Set<IdPermissionDTO>> permissionGroupHoverPermission = tuple.getT2();
                    Map<String, Set<IdPermissionDTO>> groupsAndRoleHoverPermission = new HashMap<>();
                    groupsAndRoleHoverPermission.putAll(userGroupHoverPermission);
                    groupsAndRoleHoverPermission.putAll(permissionGroupHoverPermission);
                    return groupsAndRoleHoverPermission;
                });
    }

    /*
    This method is currently unused since the current relationships covered in the tab are unrelated. This method is kept for future use.
     */
    private Mono<Map<String, Set<IdPermissionDTO>>> getLinkedPermissionsForOtherRoles(RoleTab roleTab,
                                                                                      Flux<Workspace> workspaceFlux) {
        Set<AclPermission> tabPermissions = roleTab.getPermissions();

        Set<AclPermission> workspacePermissions = tabPermissions.stream().filter(permission -> permission.getEntity().equals(Workspace.class)).collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> workspaceHierarchicalLateralMap = getHierarchicalLateralPermMap(workspacePermissions, policyGenerator, roleTab);

        ConcurrentHashMap<String, Set<IdPermissionDTO>> hoverMap = new ConcurrentHashMap<>();

        // Add lateral permissions interaction for workspace
        Mono<Boolean> workspaceHoverMapMono = workspaceFlux
                .map(workspace -> {
                    String workspaceId = workspace.getId();
                    generateLateralPermissionDTOsAndUpdateMap(workspaceHierarchicalLateralMap, hoverMap, workspaceId, workspaceId, Workspace.class);
                    return workspace;
                })
                .then(Mono.just(TRUE));

        // Trim the hover map before returning
        Mono<Map<String, Set<IdPermissionDTO>>> trimmedHoverMapMono = Mono.just(hoverMap)
                .map(hoverMap1 -> {
                    hoverMap1.values().removeIf(Set::isEmpty);
                    return hoverMap1;
                });

        return workspaceHoverMapMono
                .then(trimmedHoverMapMono);
    }

    /*
     * Checks if the Permission Group is auto-created or not and disables the Delete and Edit permissions.
     */
    private Mono<Tuple2<BaseView, Boolean>> updateEnabledForPermissionGroup(BaseView permissionGroupDto,
                                                                            PermissionGroup permissionGroup) {
        return permissionGroupUtils.isAutoCreated(permissionGroup).map(autoCreated -> {
            if (autoCreated) {
                List<PermissionViewableName> viewablePermissions = RoleTab.GROUPS_ROLES.getViewablePermissions();
                int indexOfEditPermission = viewablePermissions.indexOf(PermissionViewableName.EDIT);
                int indexOfDeletePermission = viewablePermissions.indexOf(PermissionViewableName.DELETE);
                permissionGroupDto.getEnabled().set(indexOfDeletePermission, -1);
                permissionGroupDto.getEnabled().set(indexOfEditPermission, -1);
            }
            return Tuples.of(permissionGroupDto, autoCreated);
        });
    }

    /*
     * Checks if the Role is auto-created or not and
     * replace Edit and Delete from Parent Permissions for them with the respective permissions.
     * Example:
     * If the parent role has DELETE permission for auto-created role and
     * auto-created role's DELETE permission has VIEW permission, then
     * we replace DELETE permission for auto-created role in parent role with VIEW permission for auto-created role.
     */
    private Mono<Boolean> updateHoverMapPermissionsForPermissionGroup(Map<String, Set<IdPermissionDTO>> hoverMap,
                                                                      PermissionGroup permissionGroup) {
        return permissionGroupUtils.isAutoCreated(permissionGroup).map(autoCreated -> {
            if (autoCreated) {
                String deletePermissionKey = permissionGroup.getId() + "_" + PermissionViewableName.DELETE.getName();
                String editPermissionKey = permissionGroup.getId() + "_" + PermissionViewableName.EDIT.getName();

                hoverMap.forEach((key, value) -> {
                    if (value.contains(new IdPermissionDTO(permissionGroup.getId(), PermissionViewableName.EDIT))) {
                        hoverMap.merge(key, hoverMap.get(editPermissionKey), Sets::union);
                        hoverMap.put(key, hoverMap.get(key).stream()
                                .filter(setValue -> !setValue.equals(new IdPermissionDTO(permissionGroup.getId(), PermissionViewableName.EDIT)))
                                .collect(Collectors.toSet()));
                    }
                    if (value.contains(new IdPermissionDTO(permissionGroup.getId(), PermissionViewableName.DELETE))) {
                        hoverMap.merge(key, hoverMap.get(deletePermissionKey), Sets::union);
                        hoverMap.put(key, hoverMap.get(key).stream()
                                .filter(setValue -> !setValue.equals(new IdPermissionDTO(permissionGroup.getId(), PermissionViewableName.DELETE)))
                                .collect(Collectors.toSet()));
                    }
                });
                hoverMap.remove(editPermissionKey);
                hoverMap.remove(deletePermissionKey);
            }
            return TRUE;
        });
    }
}

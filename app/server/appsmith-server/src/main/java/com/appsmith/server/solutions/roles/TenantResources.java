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
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.BaseView;
import com.appsmith.server.solutions.roles.dtos.EntityView;
import com.appsmith.server.solutions.roles.dtos.IdPermissionDTO;
import com.appsmith.server.solutions.roles.dtos.RoleTabDTO;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
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
import static com.appsmith.server.repositories.BaseAppsmithRepositoryImpl.fieldName;
import static com.appsmith.server.solutions.roles.HelperUtil.generateLateralPermissionDTOsAndUpdateMap;
import static com.appsmith.server.solutions.roles.HelperUtil.getHierarchicalLateralPermMap;
import static com.appsmith.server.solutions.roles.HelperUtil.getLateralPermMap;
import static com.appsmith.server.solutions.roles.HelperUtil.getRoleViewPermissionDTO;
import static java.lang.Boolean.TRUE;

@Component
public class TenantResources {

    private final TenantRepository tenantRepository;
    private final UserGroupRepository userGroupRepository;
    private final PermissionGroupRepository permissionGroupRepository;
    private final PolicyGenerator policyGenerator;

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
                           PolicyGenerator policyGenerator) {

        this.tenantRepository = tenantRepository;
        this.userGroupRepository = userGroupRepository;
        this.permissionGroupRepository = permissionGroupRepository;
        this.policyGenerator = policyGenerator;
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
                .map(permissionGroup -> {
                    BaseView permissionGroupDto = new BaseView();
                    permissionGroupDto.setId(permissionGroup.getId());
                    permissionGroupDto.setName(permissionGroup.getName());
                    Tuple2<List<Integer>, List<Integer>> permissionsTuple =
                            getRoleViewPermissionDTO(RoleTab.GROUPS_ROLES, permissionGroupId, permissionGroup.getPolicies(),
                                    PermissionGroup.class, policyGenerator);
                    permissionGroupDto.setEnabled(permissionsTuple.getT1());

                    return permissionGroupDto;
                })
                .collectList()
                .map(permissionGroupDTOs -> {

                    EntityView permissionGroupEntityView = new EntityView();
                    permissionGroupEntityView.setType(PermissionGroup.class.getSimpleName());
                    permissionGroupEntityView.setEntities(permissionGroupDTOs);

                    baseView.setChildren(Set.of(permissionGroupEntityView));
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
                        fieldName(QPermissionGroup.permissionGroup.name)
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

        return Mono.when(userGroupDisableMapMono, permissionGroupDisableMapMono)
                .then(trimmedHoverMapMono);

    }

    private Mono<Map<String, Set<IdPermissionDTO>>> getLinkedPermissionsForGroupsRoles(RoleTab roleTab,
                                                                                       Tenant tenant,
                                                                                       Flux<UserGroup> userGroupFlux,
                                                                                       Flux<PermissionGroup> permissionGroupFlux) {
        Set<AclPermission> tabPermissions = roleTab.getPermissions();

        Set<AclPermission> tenantPermissions = tabPermissions.stream().filter(permission -> permission.getEntity().equals(Tenant.class)).collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> tenantHierarchicalLateralMap = getHierarchicalLateralPermMap(tenantPermissions, policyGenerator, roleTab);

        Set<AclPermission> userGroupPermissions = tabPermissions.stream().filter(permission -> permission.getEntity().equals(UserGroup.class)).collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> userGroupHierarchicalLateralMap = getHierarchicalLateralPermMap(userGroupPermissions, policyGenerator, roleTab);

        Set<AclPermission> permissionGroupPermissions = tabPermissions.stream().filter(permission -> permission.getEntity().equals(PermissionGroup.class)).collect(Collectors.toSet());
        Map<AclPermission, Set<AclPermission>> permissionGroupHierarchicalLateralMap = getHierarchicalLateralPermMap(permissionGroupPermissions, policyGenerator, roleTab);

        String tenantId = tenant.getId();
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

        // Add hierarchical and lateral permissions interaction for permission groups
        Mono<Boolean> permissionGroupHoverMapMono = permissionGroupFlux
                .map(permissionGroup -> {
                    String permissionGroupId = permissionGroup.getId();
                    generateLateralPermissionDTOsAndUpdateMap(tenantHierarchicalLateralMap, hoverMap, tenantId, permissionGroupId, PermissionGroup.class);
                    generateLateralPermissionDTOsAndUpdateMap(permissionGroupHierarchicalLateralMap, hoverMap, permissionGroupId, permissionGroupId, PermissionGroup.class);
                    return permissionGroup;
                })
                .then(Mono.just(TRUE));

        // Trim the hover map before returning
        Mono<Map<String, Set<IdPermissionDTO>>> trimmedHoverMapMono = Mono.just(hoverMap)
                .map(hoverMap1 -> {
                    hoverMap1.values().removeIf(Set::isEmpty);
                    return hoverMap1;
                });

        return Mono.when(userGroupHoverMapMono, permissionGroupHoverMapMono)
                .then(trimmedHoverMapMono);
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
}

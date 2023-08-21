package com.appsmith.server.solutions.roles;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleConfigDTO;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

public interface RoleConfigurationSolution {

    Mono<RoleViewDTO> getAllTabViews(String permissionGroupId);

    Mono<RoleViewDTO> updateRoles(String permissionGroupId, UpdateRoleConfigDTO updateRoleConfigDTO);

    Mono<Long> updateApplicationAndRelatedResourcesWithPermissionsForRole(
            String applicationId,
            String roleId,
            Map<String, List<AclPermission>> toBeAddedPermissions,
            Map<String, List<AclPermission>> toBeRemovedPermissions);

    Mono<Long> updateWorkspaceAndDatasourcesInWorkspaceWithPermissionsForRole(
            String workspaceId,
            String roleId,
            Map<String, List<AclPermission>> toBeAddedPermissions,
            Map<String, List<AclPermission>> toBeRemovedPermissions);

    Mono<Long> updateEnvironmentsInWorkspaceWithPermissionsForRole(
            String workspaceId,
            String roleId,
            String applicationRoleType,
            Map<String, List<AclPermission>> toBeAddedPermissions,
            Map<String, List<AclPermission>> toBeRemovedPermissions);
}

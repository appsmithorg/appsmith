package com.appsmith.server.solutions.roles.helpers.ce_compatible;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleConfigDTO;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Component
public class RoleConfigurationSolutionCECompatibleImpl implements RoleConfigurationSolutionCECompatible {
    @Override
    public Mono<RoleViewDTO> getAllTabViews(String permissionGroupId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<RoleViewDTO> updateRoles(String permissionGroupId, UpdateRoleConfigDTO updateRoleConfigDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Long> updateApplicationAndRelatedResourcesWithPermissionsForRole(
            String applicationId,
            String roleId,
            Map<String, List<AclPermission>> toBeAddedPermissions,
            Map<String, List<AclPermission>> toBeRemovedPermissions) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Long> updateWorkspaceAndDatasourcesInWorkspaceWithPermissionsForRole(
            String workspaceId,
            String roleId,
            Map<String, List<AclPermission>> toBeAddedPermissions,
            Map<String, List<AclPermission>> toBeRemovedPermissions) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Long> updateEnvironmentsInWorkspaceWithPermissionsForRole(
            String workspaceId,
            String roleId,
            String applicationRoleType,
            Map<String, List<AclPermission>> toBeAddedPermissions,
            Map<String, List<AclPermission>> toBeRemovedPermissions) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Long> updateWorkflowAndRelatedResourcesWithPermissionForRole(
            String workflowId,
            String workspaceId,
            String roleId,
            Map<String, List<AclPermission>> toBeAddedPermissions,
            Map<String, List<AclPermission>> toBeRemovedPermissions) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}

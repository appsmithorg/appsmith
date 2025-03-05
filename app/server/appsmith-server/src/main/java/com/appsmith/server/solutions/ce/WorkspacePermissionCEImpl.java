package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import org.springframework.stereotype.Component;

@Component
public class WorkspacePermissionCEImpl implements WorkspacePermissionCE, DomainPermissionCE {
    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_WORKSPACES;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_WORKSPACES;
    }

    @Override
    public AclPermission getExportPermission(boolean isGitSync, boolean exportWithConfiguration) {
        return null;
    }

    @Override
    public AclPermission getDeletePermission(String organizationId) {
        return AclPermission.MANAGE_WORKSPACES;
    }

    @Override
    public AclPermission getApplicationCreatePermission(String organizationId) {
        return AclPermission.WORKSPACE_MANAGE_APPLICATIONS;
    }

    @Override
    public AclPermission getDatasourceCreatePermission(String organizationId) {
        return AclPermission.WORKSPACE_MANAGE_DATASOURCES;
    }
}

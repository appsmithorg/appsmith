package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public class WorkspacePermissionCEImpl implements WorkspacePermissionCE {
    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_WORKSPACES;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_WORKSPACES;
    }

    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.MANAGE_WORKSPACES;
    }

    @Override
    public AclPermission getApplicationCreatePermission() {
        return AclPermission.WORKSPACE_MANAGE_APPLICATIONS;
    }

    @Override
    public AclPermission getApplicationEditPermission() {
        return AclPermission.WORKSPACE_MANAGE_APPLICATIONS;
    }

    @Override
    public AclPermission getDatasourceEditPermission() {
        return AclPermission.WORKSPACE_MANAGE_DATASOURCES;
    }
}

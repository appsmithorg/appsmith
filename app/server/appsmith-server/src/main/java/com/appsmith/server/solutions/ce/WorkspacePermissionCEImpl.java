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
        return AclPermission.DELETE_WORKSPACES;
    }

    @Override
    public AclPermission getApplicationCreatePermission() {
        return AclPermission.WORKSPACE_CREATE_APPLICATION;
    }

    @Override
    public AclPermission getApplicationEditPermission() {
        return AclPermission.WORKSPACE_MANAGE_APPLICATIONS;
    }

    @Override
    public AclPermission getApplicationReadPermission() {
        return AclPermission.WORKSPACE_READ_APPLICATIONS;
    }

    @Override
    public AclPermission getApplicationPublishPermission() {
        return AclPermission.WORKSPACE_PUBLISH_APPLICATIONS;
    }

    @Override
    public AclPermission getApplicationExportPermission() {
        return AclPermission.WORKSPACE_EXPORT_APPLICATIONS;
    }

    @Override
    public AclPermission getApplicationDeletePermission() {
        return AclPermission.WORKSPACE_DELETE_APPLICATIONS;
    }

    @Override
    public AclPermission getApplicationMakePublicPermission() {
        return AclPermission.WORKSPACE_MAKE_PUBLIC_APPLICATIONS;
    }

    @Override
    public AclPermission getDatasourceCreatePermission() {
        return AclPermission.WORKSPACE_CREATE_DATASOURCE;
    }

    @Override
    public AclPermission getDatasourceReadPermission() {
        return AclPermission.WORKSPACE_READ_DATASOURCES;
    }

    @Override
    public AclPermission getDatasourceEditPermission() {
        return AclPermission.WORKSPACE_MANAGE_DATASOURCES;
    }

    @Override
    public AclPermission getDatasourceDeletePermission() {
        return AclPermission.WORKSPACE_DELETE_DATASOURCES;
    }

    @Override
    public AclPermission getDatasourceExecutePermission() {
        return AclPermission.WORKSPACE_EXECUTE_DATASOURCES;
    }
}

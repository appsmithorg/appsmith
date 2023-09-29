package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.solutions.ce.WorkspacePermissionCEImpl;
import org.springframework.stereotype.Component;

@Component
public class WorkspacePermissionImpl extends WorkspacePermissionCEImpl implements WorkspacePermission {
    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.DELETE_WORKSPACES;
    }

    @Override
    public AclPermission getApplicationCreatePermission() {
        return AclPermission.WORKSPACE_CREATE_APPLICATION;
    }

    @Override
    public AclPermission getDatasourceCreatePermission() {
        return AclPermission.WORKSPACE_CREATE_DATASOURCE;
    }

    @Override
    public AclPermission getPackageCreatePermission() {
        return AclPermission.WORKSPACE_CREATE_PACKAGE;
    }
}

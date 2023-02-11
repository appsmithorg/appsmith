package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public class DatasourcePermissionCEImpl implements DatasourcePermissionCE {
    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_DATASOURCES;
    }

    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.MANAGE_DATASOURCES;
    }

    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_DATASOURCES;
    }

    @Override
    public AclPermission getExecutePermission() {
        return AclPermission.EXECUTE_DATASOURCES;
    }
}

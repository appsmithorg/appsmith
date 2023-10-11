package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

import static java.lang.Boolean.TRUE;

public class ActionPermissionCEImpl implements ActionPermissionCE, DomainPermissionCE {
    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_ACTIONS;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_ACTIONS;
    }

    @Override
    public AclPermission getExportPermission(boolean isGitSync, boolean exportWithConfiguration) {
        return isGitSync ? null : TRUE.equals(exportWithConfiguration) ? getReadPermission() : getEditPermission();
    }

    @Override
    public AclPermission getExecutePermission() {
        return AclPermission.EXECUTE_ACTIONS;
    }

    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.MANAGE_ACTIONS;
    }
}

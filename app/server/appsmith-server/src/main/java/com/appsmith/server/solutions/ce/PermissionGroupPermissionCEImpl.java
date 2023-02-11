package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public class PermissionGroupPermissionCEImpl implements PermissionGroupPermissionCE {
    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_PERMISSION_GROUPS;
    }

    @Override
    public AclPermission getMembersReadPermission() {
        return AclPermission.READ_PERMISSION_GROUP_MEMBERS;
    }

    @Override
    public AclPermission getAssignPermission() {
        return AclPermission.ASSIGN_PERMISSION_GROUPS;
    }

    @Override
    public AclPermission getUnAssignPermission() {
        return AclPermission.UNASSIGN_PERMISSION_GROUPS;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_PERMISSION_GROUPS;
    }
}

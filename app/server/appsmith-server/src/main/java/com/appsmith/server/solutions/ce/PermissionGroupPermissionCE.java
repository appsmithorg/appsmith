package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public interface PermissionGroupPermissionCE {
    AclPermission getMembersReadPermission();

    AclPermission getAssignPermission();

    AclPermission getUnAssignPermission();
}

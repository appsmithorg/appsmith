package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public interface PagePermissionCE {
    AclPermission getEditPermission();
    AclPermission getReadPermission();
    AclPermission getDeletePermission();
    AclPermission getActionCreatePermission();
}

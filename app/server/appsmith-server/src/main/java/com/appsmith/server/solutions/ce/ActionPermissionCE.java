package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public interface ActionPermissionCE {
    AclPermission getDeletePermission();
    AclPermission getExecutePermission();
}

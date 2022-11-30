package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public interface DatasourcePermissionCE {
    AclPermission getReadPermission();
    AclPermission getDeletePermission();
    AclPermission getEditPermission();
    AclPermission getExecutePermission();
}

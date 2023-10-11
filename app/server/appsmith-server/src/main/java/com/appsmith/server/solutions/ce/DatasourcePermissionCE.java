package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public interface DatasourcePermissionCE {
    AclPermission getDeletePermission();

    AclPermission getExecutePermission();

    AclPermission getActionCreatePermission();
}

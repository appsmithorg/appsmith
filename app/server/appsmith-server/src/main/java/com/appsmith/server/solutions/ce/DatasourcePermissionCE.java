package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public interface DatasourcePermissionCE {
    AclPermission getDeletePermission(String organizationId);

    AclPermission getExecutePermission();

    AclPermission getActionCreatePermission(String organizationId);
}

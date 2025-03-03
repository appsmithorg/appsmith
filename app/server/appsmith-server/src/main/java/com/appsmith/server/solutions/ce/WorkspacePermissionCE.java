package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public interface WorkspacePermissionCE {
    AclPermission getDeletePermission(String organizationId);

    AclPermission getApplicationCreatePermission(String organizationId);

    AclPermission getDatasourceCreatePermission(String organizationId);
}

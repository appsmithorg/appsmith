package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public interface WorkspacePermissionCE {
    AclPermission getEditPermission();
    AclPermission getReadPermission();
    AclPermission getDeletePermission();
    AclPermission getApplicationCreatePermission();
    AclPermission getApplicationEditPermission();
    AclPermission getApplicationReadPermission();
    AclPermission getApplicationPublishPermission();
    AclPermission getApplicationExportPermission();
    AclPermission getApplicationDeletePermission();
    AclPermission getApplicationMakePublicPermission();
    AclPermission getDatasourceCreatePermission();
    AclPermission getDatasourceReadPermission();
    AclPermission getDatasourceEditPermission();
    AclPermission getDatasourceDeletePermission();
    AclPermission getDatasourceExecutePermission();
}

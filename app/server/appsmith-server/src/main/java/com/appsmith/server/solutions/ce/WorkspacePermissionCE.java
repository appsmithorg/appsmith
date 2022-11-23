package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public interface WorkspacePermissionCE {
    AclPermission getManagePermission();
    AclPermission getReadPermission();
    AclPermission getDeletePermission();
    AclPermission getApplicationCreatePermission();
    AclPermission getApplicationManagePermission();
    AclPermission getApplicationReadPermission();
    AclPermission getApplicationPublishPermission();
    AclPermission getApplicationExportPermission();
    AclPermission getApplicationDeletePermission();
    AclPermission getApplicationMakePublicPermission();
    AclPermission getDatasourceCreatePermission();
    AclPermission getDatasourceReadPermission();
    AclPermission getDatasourceManagePermission();
    AclPermission getDatasourceDeletePermission();
    AclPermission getDatasourceExecutePermission();
}

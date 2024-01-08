package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public interface ContextPermissionCE {

    AclPermission getDeletePermission();

    AclPermission getGitConnectPermission();

    AclPermission getExportPermission();
}

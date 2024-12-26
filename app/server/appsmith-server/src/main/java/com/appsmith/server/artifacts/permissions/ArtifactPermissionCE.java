package com.appsmith.server.artifacts.permissions;

import com.appsmith.server.acl.AclPermission;

public interface ArtifactPermissionCE {

    AclPermission getEditPermission();

    AclPermission getDeletePermission();

    AclPermission getGitConnectPermission();

    AclPermission getExportPermission();
}

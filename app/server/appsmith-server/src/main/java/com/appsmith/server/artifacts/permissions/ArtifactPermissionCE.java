package com.appsmith.server.artifacts.permissions;

import com.appsmith.server.acl.AclPermission;

public interface ArtifactPermissionCE {

    AclPermission getEditPermission();

    AclPermission getDeletePermission(String organizationId);

    AclPermission getGitConnectPermission();

    AclPermission getExportPermission();
}

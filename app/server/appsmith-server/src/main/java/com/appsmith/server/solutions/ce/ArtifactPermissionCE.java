package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public interface ArtifactPermissionCE {

    AclPermission getDeletePermission();

    AclPermission getGitConnectPermission();

    AclPermission getExportPermission();
}

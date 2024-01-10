package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.solutions.ArtifactPermission;
import com.appsmith.server.solutions.DomainPermission;

public interface PackagePermissionCE extends DomainPermission, ArtifactPermission {

    AclPermission getModuleCreatePermission();

    AclPermission getPublishPermission();
}

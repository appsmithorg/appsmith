package com.appsmith.server.packages.permissions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.solutions.ArtifactPermission;
import com.appsmith.server.solutions.DomainPermission;

public interface PackagePermission extends DomainPermission, ArtifactPermission {
    AclPermission getDeletePermission();

    AclPermission getModuleCreatePermission();

    AclPermission getExportPermission();

    AclPermission getPublishPermission();

    AclPermission getCreatePackageModuleInstancePermission();

    AclPermission getReadPackageModuleInstancePermission();
}

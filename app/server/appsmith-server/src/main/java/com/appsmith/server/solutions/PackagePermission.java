package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;

public interface PackagePermission extends DomainPermission {
    AclPermission getDeletePermission();

    AclPermission getModuleCreatePermission();

    AclPermission getExportPermission();

    AclPermission getPublishPermission();
}

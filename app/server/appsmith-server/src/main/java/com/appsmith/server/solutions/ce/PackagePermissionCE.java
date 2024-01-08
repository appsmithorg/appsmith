package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.solutions.ContextPermission;
import com.appsmith.server.solutions.DomainPermission;

public interface PackagePermissionCE extends DomainPermission, ContextPermission {

    AclPermission getModuleCreatePermission();

    AclPermission getPublishPermission();
}

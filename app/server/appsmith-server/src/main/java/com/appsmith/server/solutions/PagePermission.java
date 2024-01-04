package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.solutions.ce.PagePermissionCE;

public interface PagePermission extends PagePermissionCE, DomainPermission {

    AclPermission getModuleInstanceCreatePermission();
}

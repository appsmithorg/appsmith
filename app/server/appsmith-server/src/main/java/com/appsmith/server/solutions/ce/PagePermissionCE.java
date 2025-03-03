package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public interface PagePermissionCE extends ContextPermissionCE {
    AclPermission getDeletePermission(String organizationId);
}

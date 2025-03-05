package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public interface ContextPermissionCE {

    AclPermission getEditPermission();

    default AclPermission getActionCreatePermission(String organizationId) {
        return null;
    }
}

package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;

public interface ModulePermission extends DomainPermission {
    AclPermission getDeletePermission();
}

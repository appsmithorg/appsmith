package com.appsmith.server.moduleinstances.permissions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.solutions.DomainPermission;

public interface ModuleInstancePermission extends DomainPermission {
    AclPermission getDeletePermission();

    AclPermission getExecutePermission();
}

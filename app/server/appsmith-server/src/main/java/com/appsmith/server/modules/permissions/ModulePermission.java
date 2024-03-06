package com.appsmith.server.modules.permissions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.solutions.ContextPermission;
import com.appsmith.server.solutions.DomainPermission;

public interface ModulePermission extends DomainPermission, ContextPermission {
    AclPermission getDeletePermission();

    AclPermission getCreateExecutablesPermission();

    AclPermission getCreateModuleInstancePermission();

    AclPermission getReadModuleInstancePermission();
}

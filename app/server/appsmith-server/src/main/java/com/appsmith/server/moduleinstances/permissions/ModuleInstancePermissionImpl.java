package com.appsmith.server.moduleinstances.permissions;

import com.appsmith.server.acl.AclPermission;
import org.springframework.stereotype.Component;

@Component
public class ModuleInstancePermissionImpl implements ModuleInstancePermission {
    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.DELETE_MODULE_INSTANCES;
    }

    @Override
    public AclPermission getExecutePermission() {
        return AclPermission.EXECUTE_MODULE_INSTANCES;
    }

    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_MODULE_INSTANCES;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_MODULE_INSTANCES;
    }

    @Override
    public AclPermission getExportPermission(boolean isGitSync, boolean exportWithConfiguration) {
        return null;
    }
}

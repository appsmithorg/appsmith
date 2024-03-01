package com.appsmith.server.modules.permissions;

import com.appsmith.server.acl.AclPermission;
import org.springframework.stereotype.Component;

@Component
public class ModulePermissionImpl implements ModulePermission {
    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.DELETE_MODULES;
    }

    @Override
    public AclPermission getCreateExecutablesPermission() {
        return AclPermission.CREATE_MODULE_EXECUTABLES;
    }

    @Override
    public AclPermission getCreateModuleInstancePermission() {
        return AclPermission.MODULE_CREATE_MODULE_INSTANCES;
    }

    @Override
    public AclPermission getReadModuleInstancePermission() {
        return AclPermission.MODULE_READ_MODULE_INSTANCES;
    }

    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_MODULES;
    }

    @Override
    public AclPermission getActionCreatePermission() {
        return AclPermission.MANAGE_MODULES;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_MODULES;
    }

    @Override
    public AclPermission getExportPermission(boolean isGitSync, boolean exportWithConfiguration) {
        return null;
    }
}

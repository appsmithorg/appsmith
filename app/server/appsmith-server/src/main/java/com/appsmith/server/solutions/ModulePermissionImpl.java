package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import org.springframework.stereotype.Component;

@Component
public class ModulePermissionImpl implements ModulePermission {
    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.DELETE_MODULES;
    }

    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_MODULES;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_MODULES;
    }
}

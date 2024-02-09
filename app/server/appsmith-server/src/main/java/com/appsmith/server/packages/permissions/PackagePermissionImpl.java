package com.appsmith.server.packages.permissions;

import com.appsmith.server.acl.AclPermission;
import org.springframework.stereotype.Component;

@Component
public class PackagePermissionImpl implements PackagePermission {
    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.DELETE_PACKAGES;
    }

    @Override
    public AclPermission getModuleCreatePermission() {
        return AclPermission.PACKAGE_CREATE_MODULES;
    }

    @Override
    public AclPermission getExportPermission() {
        return AclPermission.EXPORT_PACKAGES;
    }

    @Override
    public AclPermission getPublishPermission() {
        return AclPermission.PUBLISH_PACKAGES;
    }

    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_PACKAGES;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_PACKAGES;
    }

    @Override
    public AclPermission getCreatePackageModuleInstancePermission() {
        return AclPermission.PACKAGE_CREATE_MODULE_INSTANCES;
    }

    @Override
    public AclPermission getReadPackageModuleInstancePermission() {
        return AclPermission.PACKAGE_READ_MODULE_INSTANCES;
    }

    @Override
    public AclPermission getExportPermission(boolean isGitSync, boolean exportWithConfiguration) {
        // Check permissions depending upon the serialization objective:
        // Git-sync => Edit permission
        // Share package
        //      : Normal package => Export permission
        //      : Sample package where datasource config needs to be shared => Read permission
        // If Git-sync, then use edit permissions, else use EXPORT_PACKAGE permission to fetch package
        return isGitSync ? getEditPermission() : getExportPermission();
    }
}

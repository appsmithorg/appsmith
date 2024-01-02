package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public class PacakgePermissionCEImpl implements PackagePermissionCE {

    @Override
    public AclPermission getEditPermission() {
        return null;
    }

    @Override
    public AclPermission getReadPermission() {
        return null;
    }

    @Override
    public AclPermission getExportPermission(boolean isGitSync, boolean exportWithConfiguration) {
        return null;
    }

    @Override
    public AclPermission getDeletePermission() {
        return null;
    }

    @Override
    public AclPermission getModuleCreatePermission() {
        return null;
    }

    @Override
    public AclPermission getExportPermission() {
        return null;
    }

    @Override
    public AclPermission getPublishPermission() {
        return null;
    }
}

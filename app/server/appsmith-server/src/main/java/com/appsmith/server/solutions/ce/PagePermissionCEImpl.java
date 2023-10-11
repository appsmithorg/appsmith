package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

import static java.lang.Boolean.TRUE;

public class PagePermissionCEImpl implements PagePermissionCE, DomainPermissionCE {
    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_PAGES;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_PAGES;
    }

    @Override
    public AclPermission getExportPermission(boolean isGitSync, boolean exportWithConfiguration) {
        return isGitSync ? null : TRUE.equals(exportWithConfiguration) ? getReadPermission() : getEditPermission();
    }

    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.MANAGE_PAGES;
    }

    @Override
    public AclPermission getActionCreatePermission() {
        return AclPermission.MANAGE_PAGES;
    }
}

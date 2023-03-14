package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public class PagePermissionCEImpl implements PagePermissionCE {
    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_PAGES;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_PAGES;
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

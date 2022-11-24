package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public class ApplicationPermissionCEImpl implements ApplicationPermissionCE {
    @Override
    public AclPermission getManagePermission() {
        return AclPermission.MANAGE_APPLICATIONS;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_APPLICATIONS;
    }

    @Override
    public AclPermission getPublishPermission() {
        return AclPermission.PUBLISH_APPLICATIONS;
    }

    @Override
    public AclPermission getExportPermission() {
        return AclPermission.EXPORT_APPLICATIONS;
    }

    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.DELETE_APPLICATIONS;
    }

    @Override
    public AclPermission getMakePublicPermission() {
        return AclPermission.MAKE_PUBLIC_APPLICATIONS;
    }

    @Override
    public AclPermission getCanCommentPermission() {
        return AclPermission.COMMENT_ON_APPLICATIONS;
    }

    @Override
    public AclPermission getPageCreatePermission() {
        return AclPermission.APPLICATION_CREATE_PAGES;
    }
}

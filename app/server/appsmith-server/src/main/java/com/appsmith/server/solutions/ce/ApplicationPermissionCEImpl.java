package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import org.springframework.stereotype.Component;

@Component
public class ApplicationPermissionCEImpl implements ApplicationPermissionCE, DomainPermissionCE {
    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_APPLICATIONS;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_APPLICATIONS;
    }

    @Override
    public AclPermission getExportPermission(boolean isGitSync, boolean exportWithConfiguration) {
        // Check permissions depending upon the serialization objective:
        // Git-sync => Edit permission
        // Share application
        //      : Normal apps => Export permission
        //      : Sample apps where datasource config needs to be shared => Read permission
        // If Git-sync, then use edit permissions, else use EXPORT_APPLICATION permission to fetch application
        return isGitSync ? getEditPermission() : getExportPermission();
    }

    @Override
    public AclPermission getExportPermission() {
        return AclPermission.EXPORT_APPLICATIONS;
    }

    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.MANAGE_APPLICATIONS;
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
        return AclPermission.MANAGE_APPLICATIONS;
    }
}

package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public interface ApplicationPermissionCE {
    AclPermission getManagePermission();
    AclPermission getReadPermission();
    AclPermission getPublishPermission();
    AclPermission getExportPermission();
    AclPermission getDeletePermission();
    AclPermission getMakePublicPermission();
    AclPermission getCanCommentPermission();
    AclPermission getPageCreatePermission();
}

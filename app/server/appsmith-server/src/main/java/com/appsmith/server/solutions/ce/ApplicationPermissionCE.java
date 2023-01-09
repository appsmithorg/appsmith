package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public interface ApplicationPermissionCE {
    AclPermission getEditPermission();
    AclPermission getReadPermission();
    AclPermission getExportPermission();
    AclPermission getDeletePermission();
    AclPermission getMakePublicPermission();
    AclPermission getCanCommentPermission();
    AclPermission getPageCreatePermission();
}

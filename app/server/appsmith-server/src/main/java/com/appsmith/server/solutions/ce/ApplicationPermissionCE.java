package com.appsmith.server.solutions.ce;

import java.util.Optional;

import com.appsmith.server.acl.AclPermission;

public interface ApplicationPermissionCE {
    AclPermission getDeletePermission();
    AclPermission getExportPermission();
    AclPermission getMakePublicPermission();
    AclPermission getCanCommentPermission();
    AclPermission getPageCreatePermission();
}

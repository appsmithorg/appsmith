package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.solutions.ContextPermission;

public interface ApplicationPermissionCE extends ContextPermission {

    AclPermission getMakePublicPermission();

    AclPermission getCanCommentPermission();

    AclPermission getPageCreatePermission();

    AclPermission getManageProtectedBranchPermission();

    AclPermission getManageDefaultBranchPermission();

    AclPermission getManageAutoCommitPermission();
}

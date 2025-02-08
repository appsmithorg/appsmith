package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.artifacts.permissions.ArtifactPermission;

public interface ApplicationPermissionCE extends ArtifactPermission {

    AclPermission getMakePublicPermission();

    AclPermission getCanCommentPermission();

    AclPermission getPageCreatePermission();

    AclPermission getManageProtectedBranchPermission();

    AclPermission getManageDefaultBranchPermission();

    AclPermission getManageAutoCommitPermission();

    AclPermission getPublishPermission();

    AclPermission getApplicationDeletePagesPermission();
}

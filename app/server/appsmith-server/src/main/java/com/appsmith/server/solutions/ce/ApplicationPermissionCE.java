/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public interface ApplicationPermissionCE {
AclPermission getDeletePermission();

AclPermission getExportPermission();

AclPermission getMakePublicPermission();

AclPermission getCanCommentPermission();

AclPermission getPageCreatePermission();
}

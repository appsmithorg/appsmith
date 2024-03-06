package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.solutions.ce.WorkspacePermissionCE;

public interface WorkspacePermission extends WorkspacePermissionCE, DomainPermission {
    AclPermission getPackageCreatePermission();

    AclPermission getWorkflowCreatePermission();
}

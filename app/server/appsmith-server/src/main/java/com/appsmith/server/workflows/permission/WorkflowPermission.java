package com.appsmith.server.workflows.permission;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.solutions.DomainPermission;

public interface WorkflowPermission extends DomainPermission {
    AclPermission getDeletePermission();

    AclPermission getActionCreationPermission();

    AclPermission getPublishPermission();
}

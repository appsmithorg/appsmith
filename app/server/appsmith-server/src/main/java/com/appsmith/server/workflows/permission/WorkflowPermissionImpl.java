package com.appsmith.server.workflows.permission;

import com.appsmith.server.acl.AclPermission;
import org.springframework.stereotype.Component;

@Component
public class WorkflowPermissionImpl implements WorkflowPermission {
    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_WORKFLOWS;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_WORKFLOWS;
    }

    @Override
    public AclPermission getExportPermission(boolean isGitSync, boolean exportWithConfiguration) {
        return null;
    }

    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.DELETE_WORKFLOWS;
    }

    @Override
    public AclPermission getActionCreationPermission() {
        return AclPermission.WORKFLOW_CREATE_ACTIONS;
    }

    @Override
    public AclPermission getPublishPermission() {
        return AclPermission.PUBLISH_WORKFLOWS;
    }
}

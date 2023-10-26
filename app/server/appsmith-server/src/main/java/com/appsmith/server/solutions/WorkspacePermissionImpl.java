package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.solutions.ce.WorkspacePermissionCEImpl;
import org.springframework.stereotype.Component;

@Component
public class WorkspacePermissionImpl extends WorkspacePermissionCEImpl implements WorkspacePermission {
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public AclPermission getDeletePermission() {
        return AclPermission.DELETE_WORKSPACES;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public AclPermission getApplicationCreatePermission() {
        return AclPermission.WORKSPACE_CREATE_APPLICATION;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public AclPermission getDatasourceCreatePermission() {
        return AclPermission.WORKSPACE_CREATE_DATASOURCE;
    }

    @Override
    public AclPermission getPackageCreatePermission() {
        return AclPermission.WORKSPACE_CREATE_PACKAGE;
    }

    @Override
    public AclPermission getWorkflowCreatePermission() {
        return AclPermission.WORKSPACE_CREATE_WORKFLOW;
    }
}

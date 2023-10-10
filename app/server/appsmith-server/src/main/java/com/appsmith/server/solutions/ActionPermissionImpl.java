package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.solutions.ce.ActionPermissionCEImpl;
import org.springframework.stereotype.Component;

@Component
public class ActionPermissionImpl extends ActionPermissionCEImpl implements ActionPermission {

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public AclPermission getDeletePermission() {
        return AclPermission.DELETE_ACTIONS;
    }
}

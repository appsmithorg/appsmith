package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.solutions.ce.ApplicationPermissionCEImpl;
import org.springframework.stereotype.Component;

@Component
public class ApplicationPermissionImpl extends ApplicationPermissionCEImpl implements ApplicationPermission {

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public AclPermission getPageCreatePermission() {
        return AclPermission.APPLICATION_CREATE_PAGES;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public AclPermission getDeletePermission() {
        return AclPermission.DELETE_APPLICATIONS;
    }
}

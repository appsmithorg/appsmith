package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.solutions.ce.PagePermissionCEImpl;
import org.springframework.stereotype.Component;

@Component
public class PagePermissionImpl extends PagePermissionCEImpl implements PagePermission {
    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public AclPermission getActionCreatePermission() {
        return AclPermission.PAGE_CREATE_PAGE_ACTIONS;
    }

    @Override
    public AclPermission getModuleInstanceCreatePermission() {
        return AclPermission.PAGE_CREATE_MODULE_INSTANCES;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public AclPermission getDeletePermission() {
        return AclPermission.DELETE_PAGES;
    }
}

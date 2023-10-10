package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.solutions.ce.DatasourcePermissionCEImpl;
import org.springframework.stereotype.Component;

@Component
public class DatasourcePermissionImpl extends DatasourcePermissionCEImpl implements DatasourcePermission {

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public AclPermission getActionCreatePermission() {
        return AclPermission.CREATE_DATASOURCE_ACTIONS;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_gac_enabled)
    public AclPermission getDeletePermission() {
        return AclPermission.DELETE_DATASOURCES;
    }
}

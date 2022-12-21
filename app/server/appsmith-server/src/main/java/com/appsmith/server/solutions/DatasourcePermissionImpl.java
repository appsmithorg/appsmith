package com.appsmith.server.solutions;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.solutions.ce.DatasourcePermissionCEImpl;
import org.springframework.stereotype.Component;

@Component
public class DatasourcePermissionImpl extends DatasourcePermissionCEImpl implements DatasourcePermission {

    @Override
    public AclPermission getActionCreatePermission() {
        return AclPermission.CREATE_DATASOURCE_ACTIONS;
    }

    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.DELETE_DATASOURCES;
    }
}

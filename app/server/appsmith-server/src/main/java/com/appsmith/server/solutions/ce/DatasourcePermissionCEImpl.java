package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;
import org.springframework.stereotype.Component;

import static java.lang.Boolean.TRUE;

@Component
public class DatasourcePermissionCEImpl implements DatasourcePermissionCE, DomainPermissionCE {
    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_DATASOURCES;
    }

    @Override
    public AclPermission getExportPermission(boolean isGitSync, boolean exportWithConfiguration) {
        return isGitSync ? null : TRUE.equals(exportWithConfiguration) ? getReadPermission() : getEditPermission();
    }

    @Override
    public AclPermission getDeletePermission(String organizationId) {
        return AclPermission.MANAGE_DATASOURCES;
    }

    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_DATASOURCES;
    }

    @Override
    public AclPermission getExecutePermission() {
        return AclPermission.EXECUTE_DATASOURCES;
    }

    @Override
    public AclPermission getActionCreatePermission(String organizationId) {
        return AclPermission.MANAGE_DATASOURCES;
    }
}

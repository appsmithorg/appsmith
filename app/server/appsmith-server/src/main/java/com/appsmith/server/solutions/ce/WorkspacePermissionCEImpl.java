package com.appsmith.server.solutions.ce;

import java.util.Optional;

import org.hibernate.validator.internal.util.privilegedactions.GetClassLoader;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;

public class WorkspacePermissionCEImpl implements WorkspacePermissionCE, DomainPermissionCE {
    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_WORKSPACES;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_WORKSPACES;
    }

    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.MANAGE_WORKSPACES;
    }

    @Override
    public AclPermission getApplicationCreatePermission() {
        return AclPermission.WORKSPACE_MANAGE_APPLICATIONS;
    }

    @Override
    public AclPermission getDatasourceCreatePermission() {
        return AclPermission.WORKSPACE_MANAGE_DATASOURCES;
    }

    @Override
    public Optional<AclPermission> getAccessPermissionForImportExport(boolean isExport,
            SerialiseApplicationObjective serialiseFor) {
        if(serialiseFor == SerialiseApplicationObjective.SHARE) {
            return Optional.of(getApplicationCreatePermission());
        }
        throw new AppsmithException(AppsmithError.INVALID_PARAMETER, "getAccessPermissionForImportExport");
    }
}

package com.appsmith.server.solutions.ce;

import java.util.Optional;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;

public class ActionPermissionCEImpl implements ActionPermissionCE, DomainPermissionCE {
    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_ACTIONS;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_ACTIONS;
    }

    @Override
    public AclPermission getExecutePermission() {
        return AclPermission.EXECUTE_ACTIONS;
    }

    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.MANAGE_ACTIONS;
    }

    @Override
    public Optional<AclPermission> getAccessPermissionForImportExport(boolean isExport,
            SerialiseApplicationObjective serialiseFor) {
        if(serialiseFor == SerialiseApplicationObjective.VERSION_CONTROL) {
            return Optional.empty();
        } if(serialiseFor == SerialiseApplicationObjective.SHARE) {
            return Optional.of(getEditPermission());
        }
        throw new AppsmithException(AppsmithError.INVALID_PARAMETER, "getAccessPermissionForImportExport");
    }
}

package com.appsmith.server.solutions.ce;

import java.util.Optional;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;

public class ApplicationPermissionCEImpl implements ApplicationPermissionCE, DomainPermissionCE {
    @Override
    public AclPermission getEditPermission() {
        return AclPermission.MANAGE_APPLICATIONS;
    }

    @Override
    public AclPermission getReadPermission() {
        return AclPermission.READ_APPLICATIONS;
    }

    @Override
    public AclPermission getExportPermission() {
        return AclPermission.EXPORT_APPLICATIONS;
    }

    @Override
    public AclPermission getDeletePermission() {
        return AclPermission.MANAGE_APPLICATIONS;
    }

    @Override
    public AclPermission getMakePublicPermission() {
        return AclPermission.MAKE_PUBLIC_APPLICATIONS;
    }

    @Override
    public AclPermission getCanCommentPermission() {
        return AclPermission.COMMENT_ON_APPLICATIONS;
    }

    @Override
    public AclPermission getPageCreatePermission() {
        return AclPermission.MANAGE_APPLICATIONS;
    }

    @Override
    public Optional<AclPermission> getAccessPermissionForImportExport(boolean isExport,
            SerialiseApplicationObjective serialiseFor) {
        if(isExport) {
            if(serialiseFor == SerialiseApplicationObjective.SHARE) {
                return Optional.of(getExportPermission());
            } else if(serialiseFor == SerialiseApplicationObjective.VERSION_CONTROL) {
                return Optional.of(getEditPermission());
            }
        } else {
            return Optional.of(getEditPermission());
        }
        throw new AppsmithException(AppsmithError.INVALID_PARAMETER, "getAccessPermissionForImportExport");
    }
}

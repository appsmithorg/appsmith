package com.appsmith.server.solutions.ce;

import com.appsmith.server.acl.AclPermission;

public interface DomainPermissionCE {
    /**
     * Gets the permission required to edit the domain.
     *
     * @return The permission required to edit the domain.
     */
    AclPermission getEditPermission();

    /**
     * Gets the permission required to read the domain.
     *
     * @return The permission required to read the domain.
     */
    AclPermission getReadPermission();

    AclPermission getExportPermission(boolean isGitSync, boolean exportWithConfiguration);
}

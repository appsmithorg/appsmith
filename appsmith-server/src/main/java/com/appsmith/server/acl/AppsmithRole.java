package com.appsmith.server.acl;

import lombok.Getter;

import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ORGANIZATIONS;

@Getter
public enum AppsmithRole {
    APPLICATION_ADMIN("Application Administrator", "", Set.of(MANAGE_APPLICATIONS)),
    APPLICATION_VIEWER("Application Viewer", "",  Set.of(READ_APPLICATIONS)),
    ORGANIZATION_ADMIN("Administrator", "",  Set.of(MANAGE_ORGANIZATIONS)),
    ORGANIZATION_DEVELOPER("Developer", "",  Set.of(READ_ORGANIZATIONS, ORGANIZATION_MANAGE_APPLICATIONS)),
    ORGANIZATION_VIEWER("App Viewer", "",  Set.of(ORGANIZATION_READ_APPLICATIONS));

    private Set<AclPermission> permissions;
    private String name;
    private String description;

    AppsmithRole(String name, String description, Set<AclPermission> permissions) {
        this.name = name;
        this.description = description;
        this.permissions = permissions;
    }
}

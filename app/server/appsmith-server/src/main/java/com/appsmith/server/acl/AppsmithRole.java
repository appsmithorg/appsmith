package com.appsmith.server.acl;

import lombok.Getter;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_INVITE_USERS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_PUBLIC_APP;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_PUBLISH_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ORGANIZATIONS;

@Getter
public enum AppsmithRole {
    APPLICATION_ADMIN("Application Administrator", "", Set.of(MANAGE_APPLICATIONS)),
    APPLICATION_VIEWER("Application Viewer", "",  Set.of(READ_APPLICATIONS)),
    ORGANIZATION_ADMIN("Administrator", "Can edit, view applications and invite other user to organization",
            Set.of(MANAGE_ORGANIZATIONS, ORGANIZATION_INVITE_USERS, ORGANIZATION_PUBLIC_APP)),
    ORGANIZATION_DEVELOPER("Developer", "Can edit and view applications",  Set.of(READ_ORGANIZATIONS,
            ORGANIZATION_MANAGE_APPLICATIONS, ORGANIZATION_READ_APPLICATIONS, ORGANIZATION_PUBLISH_APPLICATIONS, ORGANIZATION_INVITE_USERS)),
    ORGANIZATION_VIEWER("App Viewer", "Can view applications",  Set.of(READ_ORGANIZATIONS, ORGANIZATION_READ_APPLICATIONS));

    private Set<AclPermission> permissions;
    private String name;
    private String description;

    AppsmithRole(String name, String description, Set<AclPermission> permissions) {
        this.name = name;
        this.description = description;
        this.permissions = permissions;
    }

    public static AppsmithRole generateAppsmithRoleFromName(String name) {
        List<AppsmithRole> appsmithRoles = Arrays.asList(AppsmithRole.values());
        for (AppsmithRole role : appsmithRoles) {
            if (role.getName().equals(name)) {
                return role;
            }
        }
        return null;
    }
}

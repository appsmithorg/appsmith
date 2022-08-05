package com.appsmith.server.acl;

import lombok.Getter;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_INVITE_USERS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_PUBLISH_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;

@Getter
public enum AppsmithRole {
    APPLICATION_ADMIN("Application Administrator", "", Set.of(MANAGE_APPLICATIONS)),
    APPLICATION_VIEWER("Application Viewer", "",  Set.of(READ_APPLICATIONS)),
    ORGANIZATION_ADMIN("Administrator", "Can modify all workspace settings including editing applications, " +
        "inviting other users to the workspace and exporting applications from the workspace",
        Set.of(MANAGE_WORKSPACES, WORKSPACE_INVITE_USERS, WORKSPACE_EXPORT_APPLICATIONS)),
    ORGANIZATION_DEVELOPER("Developer", "Can edit and view applications along with inviting other users to the workspace",
        Set.of(READ_WORKSPACES, WORKSPACE_MANAGE_APPLICATIONS, WORKSPACE_READ_APPLICATIONS,
            WORKSPACE_PUBLISH_APPLICATIONS, WORKSPACE_INVITE_USERS)),
    ORGANIZATION_VIEWER(
        "App Viewer",
        "Can view applications and invite other users to view applications",
        Set.of(READ_WORKSPACES, WORKSPACE_READ_APPLICATIONS, WORKSPACE_INVITE_USERS)),
    ;

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

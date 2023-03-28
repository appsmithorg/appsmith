package com.appsmith.server.acl;

import lombok.Getter;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.DELETE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_TENANT;
import static com.appsmith.server.acl.AclPermission.MANAGE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_APPLICATION;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_DATASOURCE;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_DELETE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_DELETE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_INVITE_USERS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_PUBLISH_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_APPLICATIONS;
import static com.appsmith.server.constants.FieldName.ADMINISTRATOR;
import static com.appsmith.server.constants.FieldName.DEVELOPER;
import static com.appsmith.server.constants.FieldName.VIEWER;
import static com.appsmith.server.constants.FieldName.WORKSPACE_ADMINISTRATOR_DESCRIPTION;
import static com.appsmith.server.constants.FieldName.WORKSPACE_DEVELOPER_DESCRIPTION;
import static com.appsmith.server.constants.FieldName.WORKSPACE_VIEWER_DESCRIPTION;

@Getter
public enum AppsmithRole {
    ORGANIZATION_ADMIN(ADMINISTRATOR, WORKSPACE_ADMINISTRATOR_DESCRIPTION,
            Set.of(MANAGE_WORKSPACES, WORKSPACE_INVITE_USERS, WORKSPACE_EXPORT_APPLICATIONS, WORKSPACE_CREATE_APPLICATION, WORKSPACE_CREATE_DATASOURCE,
                    WORKSPACE_DELETE_DATASOURCES, WORKSPACE_DELETE_APPLICATIONS, DELETE_WORKSPACES)),
    ORGANIZATION_DEVELOPER(DEVELOPER, WORKSPACE_DEVELOPER_DESCRIPTION,
            Set.of(READ_WORKSPACES, WORKSPACE_MANAGE_APPLICATIONS, WORKSPACE_MANAGE_DATASOURCES, WORKSPACE_READ_APPLICATIONS,
                    WORKSPACE_PUBLISH_APPLICATIONS, WORKSPACE_INVITE_USERS, WORKSPACE_CREATE_APPLICATION, WORKSPACE_CREATE_DATASOURCE,
                    WORKSPACE_DELETE_DATASOURCES, WORKSPACE_DELETE_APPLICATIONS)),
    ORGANIZATION_VIEWER(
            VIEWER,
            WORKSPACE_VIEWER_DESCRIPTION,
            Set.of(READ_WORKSPACES, WORKSPACE_READ_APPLICATIONS, WORKSPACE_INVITE_USERS, WORKSPACE_EXECUTE_DATASOURCES)
    ),
    TENANT_ADMIN("", "", Set.of(MANAGE_TENANT)),
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

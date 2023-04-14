package com.appsmith.server.acl;

import com.appsmith.server.constants.FieldName;
import lombok.Getter;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.APPLICATION_CREATE_PAGES;
import static com.appsmith.server.acl.AclPermission.CREATE_DATASOURCE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.CREATE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.CREATE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.CREATE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.DELETE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.DELETE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.DELETE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_TENANT;
import static com.appsmith.server.acl.AclPermission.MANAGE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_TENANT_AUDIT_LOGS;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.TENANT_MANAGE_ALL_USERS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_APPLICATION;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_DATASOURCE;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_DATASOURCE_CREATE_DATASOURCE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_DELETE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_DELETE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_INVITE_USERS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MAKE_PUBLIC_APPLICATIONS;
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
                    WORKSPACE_DELETE_DATASOURCES, WORKSPACE_DELETE_APPLICATIONS, DELETE_WORKSPACES, WORKSPACE_MAKE_PUBLIC_APPLICATIONS)),
    ORGANIZATION_DEVELOPER(DEVELOPER, WORKSPACE_DEVELOPER_DESCRIPTION,
            Set.of(READ_WORKSPACES, WORKSPACE_MANAGE_APPLICATIONS, WORKSPACE_MANAGE_DATASOURCES, WORKSPACE_READ_APPLICATIONS,
                    WORKSPACE_PUBLISH_APPLICATIONS, WORKSPACE_INVITE_USERS, WORKSPACE_CREATE_APPLICATION, WORKSPACE_CREATE_DATASOURCE,
                    WORKSPACE_DELETE_DATASOURCES, WORKSPACE_DELETE_APPLICATIONS)),
    ORGANIZATION_VIEWER(
            VIEWER,
            WORKSPACE_VIEWER_DESCRIPTION,
            Set.of(READ_WORKSPACES, WORKSPACE_READ_APPLICATIONS, WORKSPACE_INVITE_USERS, WORKSPACE_EXECUTE_DATASOURCES)
    ),

    // This is a role to create tenant admin policies. Since this is an internal construct, we wouldn't expose name and description
    TENANT_ADMIN("", "",
            Set.of(
                    CREATE_WORKSPACES, CREATE_PERMISSION_GROUPS, CREATE_USER_GROUPS,
                    READ_TENANT_AUDIT_LOGS, MANAGE_TENANT, TENANT_MANAGE_ALL_USERS
            )
    ),
    /**
     * Default Application Developer Role
     * The role's name will be of format <b>Developer - application_name</b>
     * The User with this role will be able to Edit, Delete and Read respective Application.
     */
    APPLICATION_DEVELOPER(
            FieldName.APPLICATION_DEVELOPER,
            FieldName.APPLICATION_DEVELOPER_DESCRIPTION,
            Set.of(MANAGE_APPLICATIONS, DELETE_APPLICATIONS, READ_APPLICATIONS, APPLICATION_CREATE_PAGES,
                    WORKSPACE_DATASOURCE_CREATE_DATASOURCE_ACTIONS)
    ),
    /**
     * Default Application Viewer Role
     * The role's name will be of format <b>App Viewer - application_name</b>
     * The User with this role will be able to Read respective Application.
     */
    APPLICATION_VIEWER(
            FieldName.APPLICATION_VIEWER,
            FieldName.APPLICATION_VIEWER_DESCRIPTION,
            Set.of(READ_APPLICATIONS, EXECUTE_DATASOURCES)
    )
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

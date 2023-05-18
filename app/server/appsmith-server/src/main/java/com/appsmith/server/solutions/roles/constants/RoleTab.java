package com.appsmith.server.solutions.roles.constants;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Tenant;
import lombok.Getter;
import reactor.util.function.Tuple3;
import reactor.util.function.Tuples;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.ADD_USERS_TO_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.APPLICATION_CREATE_PAGES;
import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.CREATE_DATASOURCE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.CREATE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.CREATE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.CREATE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.DELETE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.DELETE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.DELETE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.DELETE_PAGES;
import static com.appsmith.server.acl.AclPermission.DELETE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ENVIRONMENTS;
import static com.appsmith.server.acl.AclPermission.EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MAKE_PUBLIC_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.PAGE_CREATE_PAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_TENANT_AUDIT_LOGS;
import static com.appsmith.server.acl.AclPermission.READ_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.REMOVE_USERS_FROM_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_ADD_USER_TO_ALL_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_DELETE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_DELETE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_MANAGE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_MANAGE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_READ_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_READ_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_REMOVE_USER_FROM_ALL_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_APPLICATION;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_DATASOURCE;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_DELETE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_DELETE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MAKE_PUBLIC_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_DATASOURCES;
import static com.appsmith.server.constants.FieldName.AUDIT_LOGS;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.ASSOCIATE_ROLE;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.CREATE;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.DELETE;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.EDIT;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.EXECUTE;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.EXPORT;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.INVITE_USER;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.MAKE_PUBLIC;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.REMOVE_USER;
import static com.appsmith.server.solutions.roles.constants.PermissionViewableName.VIEW;

/**
 * This enum represents all the tabs in edit role screen
 */
@Getter
public enum RoleTab {

    APPLICATION_RESOURCES(
            "Application Resources",
            Set.of(
                    // Workspace level permissions
                    WORKSPACE_CREATE_APPLICATION,
                    WORKSPACE_MANAGE_APPLICATIONS,
                    WORKSPACE_DELETE_APPLICATIONS,
                    WORKSPACE_READ_APPLICATIONS,
                    WORKSPACE_MAKE_PUBLIC_APPLICATIONS,
                    WORKSPACE_EXPORT_APPLICATIONS,

                    // Application level permissions
                    APPLICATION_CREATE_PAGES,
                    MANAGE_APPLICATIONS,
                    DELETE_APPLICATIONS,
                    READ_APPLICATIONS,
                    MAKE_PUBLIC_APPLICATIONS,
                    EXPORT_APPLICATIONS,

                    // Page level permissions
                    PAGE_CREATE_PAGE_ACTIONS,
                    MANAGE_PAGES,
                    DELETE_PAGES,
                    READ_PAGES,

                    // Action level permissions
                    MANAGE_ACTIONS,
                    DELETE_ACTIONS,
                    READ_ACTIONS
            ),
            List.of(
                    CREATE,
                    EDIT,
                    DELETE,
                    VIEW,
                    MAKE_PUBLIC,
                    EXPORT
            ),
            // No duplicate entities for this tab
            null
    ),
    DATASOURCES_QUERIES(
            "Datasources & Queries",
            Set.of(
                    // Workspace level permissions
                    WORKSPACE_EXECUTE_DATASOURCES,
                    WORKSPACE_CREATE_DATASOURCE,
                    WORKSPACE_MANAGE_DATASOURCES,
                    WORKSPACE_DELETE_DATASOURCES,
                    WORKSPACE_READ_DATASOURCES,

                    // Datasources level permissions
                    EXECUTE_DATASOURCES,
                    CREATE_DATASOURCE_ACTIONS,
                    MANAGE_DATASOURCES,
                    DELETE_DATASOURCES,
                    READ_DATASOURCES,

                    // Application level permissions : none
                    // Page level permissions : none

                    // Action level permissions
                    EXECUTE_ACTIONS,

                    // environment level permissions
                    EXECUTE_ENVIRONMENTS
            ),
            List.of(
                    EXECUTE,
                    CREATE,
                    EDIT,
                    DELETE,
                    VIEW
            ),
            // No duplicate entities for this tab
            null
    ),
    GROUPS_ROLES(
            "Groups & Roles",
            Set.of(
                    // Tenant level User group permissions
                    CREATE_USER_GROUPS,
                    TENANT_MANAGE_USER_GROUPS,
                    TENANT_READ_USER_GROUPS,
                    TENANT_DELETE_USER_GROUPS,
                    TENANT_ADD_USER_TO_ALL_USER_GROUPS,
                    TENANT_REMOVE_USER_FROM_ALL_USER_GROUPS,

                    // User group permissions
                    MANAGE_USER_GROUPS,
                    DELETE_USER_GROUPS,
                    READ_USER_GROUPS,
                    ADD_USERS_TO_USER_GROUPS,
                    REMOVE_USERS_FROM_USER_GROUPS,

                    // Tenant level Role permissions
                    CREATE_PERMISSION_GROUPS,
                    TENANT_MANAGE_PERMISSION_GROUPS,
                    TENANT_READ_PERMISSION_GROUPS,
                    TENANT_DELETE_PERMISSION_GROUPS,
                    TENANT_ASSIGN_PERMISSION_GROUPS,

                    // Role permissions
                    MANAGE_PERMISSION_GROUPS,
                    DELETE_PERMISSION_GROUPS,
                    READ_PERMISSION_GROUPS,
                    ASSIGN_PERMISSION_GROUPS
            ),
            List.of(
                    CREATE,
                    EDIT,
                    DELETE,
                    VIEW,
                    INVITE_USER,
                    REMOVE_USER,
                    ASSOCIATE_ROLE
            ),
            List.of(
                    Tuples.of("Groups", Tenant.class,
                            List.of(CREATE_USER_GROUPS,
                                    TENANT_MANAGE_USER_GROUPS,
                                    TENANT_READ_USER_GROUPS,
                                    TENANT_DELETE_USER_GROUPS)
                    ),
                    Tuples.of("Roles", Tenant.class,
                            List.of(CREATE_PERMISSION_GROUPS,
                                    TENANT_MANAGE_PERMISSION_GROUPS,
                                    TENANT_READ_PERMISSION_GROUPS,
                                    TENANT_DELETE_PERMISSION_GROUPS)
                    )
            )
    ),
    OTHERS(
            "Others",
            Set.of(
                    // Tenant level permissions
                    CREATE_WORKSPACES,
                    READ_TENANT_AUDIT_LOGS,

                    // Workspace level permissions
                    MANAGE_WORKSPACES,
                    DELETE_WORKSPACES
            )
            ,
            List.of(
                    CREATE,
                    EDIT,
                    DELETE,
                    VIEW
            ),
            List.of(
                    Tuples.of("Workspaces", Tenant.class, List.of(CREATE_WORKSPACES)),
                    Tuples.of(AUDIT_LOGS, Tenant.class, List.of(READ_TENANT_AUDIT_LOGS))
            )
    ),
    ;

    private String name;
    private Set<AclPermission> permissions;

    private List<PermissionViewableName> viewablePermissions;

    // Add a representation of duplicate entities in a given tab and the entity type to differentiate the acl permissions
    // represented by simpler viewable names
    private List<Tuple3<String, Class<?>, List<AclPermission>>> duplicateEntities;

    RoleTab(String name,
            Set<AclPermission> permissions,
            List<PermissionViewableName> viewablePermissions,
            List<Tuple3<String, Class<?>, List<AclPermission>>> duplicateEntities) {

        this.name = name;
        this.permissions = permissions;
        this.viewablePermissions = viewablePermissions;
        this.duplicateEntities = duplicateEntities;
    }

    public static RoleTab getTabByValue(String name) {
        return Arrays.stream(RoleTab.values())
                .filter(roleTab -> roleTab.getName().equals(name))
                .findFirst()
                .orElse(null);
    }

}

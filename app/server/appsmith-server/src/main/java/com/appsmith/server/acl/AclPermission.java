package com.appsmith.server.acl;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import lombok.Getter;

@Getter
public enum AclPermission {
    /**
     * Notes :
     * 1. Composite permissions are more often than not used in the generation of the hierarchical graphs.
     * For example, USER_MANAGE_WORKSPACES, WORKSPACE_MANAGE_APPLICATIONS, etc.
     */

    // Instance level permissions
    // Does this user have permission to edit/read Instance Config UI?
    MANAGE_INSTANCE_CONFIGURATION("manageInstanceConfiguration:config", Config.class),
    READ_INSTANCE_CONFIGURATION("readInstanceConfiguration:config", Config.class),

    // Does the user have manage workspace permission
    @Deprecated
    USER_MANAGE_WORKSPACES("manage:userWorkspace", User.class),
    // Does the user have read workspace permissions
    @Deprecated
    USER_READ_WORKSPACES("read:userWorkspace", User.class),

    // Does this user have permission to access Instance Config UI?
    @Deprecated
    MANAGE_INSTANCE_ENV("manage:instanceEnv", User.class),

    // TODO: Add these permissions to PolicyGenerator to assign them to the user when they sign up
    // The following should be applied to Workspace and not User
    READ_USERS("read:users", User.class),
    MANAGE_USERS("manage:users", User.class),
    RESET_PASSWORD_USERS("resetPassword:users", User.class),

    MANAGE_WORKSPACES("manage:workspaces", Workspace.class),
    READ_WORKSPACES("read:workspaces", Workspace.class),
    DELETE_WORKSPACES("delete:workspace", Workspace.class),

    // Resource creation permissions for workspace
    WORKSPACE_CREATE_APPLICATION("create:applications", Workspace.class),
    WORKSPACE_CREATE_DATASOURCE("create:datasources", Workspace.class),

    // Was the user assigned a global permission at the workspace level to manage applications?
    WORKSPACE_MANAGE_APPLICATIONS("manage:workspaceApplications", Workspace.class),
    WORKSPACE_READ_APPLICATIONS("read:workspaceApplications", Workspace.class),
    WORKSPACE_PUBLISH_APPLICATIONS("publish:workspaceApplications", Workspace.class),
    WORKSPACE_EXPORT_APPLICATIONS("export:workspaceApplications", Workspace.class),
    WORKSPACE_DELETE_APPLICATIONS("delete:workspaceApplications", Workspace.class),
    WORKSPACE_MAKE_PUBLIC_APPLICATIONS("makePublic:workspaceApplications", Workspace.class),

    // Was the user assigned a global permission at the workspace level to manage datasources?
    WORKSPACE_MANAGE_DATASOURCES("manage:workspaceDatasources", Workspace.class),
    WORKSPACE_READ_DATASOURCES("read:workspaceDatasources", Workspace.class),
    WORKSPACE_DELETE_DATASOURCES("delete:workspaceDatasources", Workspace.class),
    WORKSPACE_EXECUTE_DATASOURCES("execute:workspaceDatasources", Workspace.class),

    // Invitation related permissions : TODO : Delete this since invitation would be led by user groups
    @Deprecated
    WORKSPACE_INVITE_USERS("inviteUsers:workspace", Workspace.class),

    MANAGE_APPLICATIONS("manage:applications", Application.class),
    READ_APPLICATIONS("read:applications", Application.class),
    PUBLISH_APPLICATIONS("publish:applications", Application.class),
    EXPORT_APPLICATIONS("export:applications", Application.class),
    DELETE_APPLICATIONS("delete:applications", Application.class),

    // Making an application public permission at Workspace level
    MAKE_PUBLIC_APPLICATIONS("makePublic:applications", Application.class),

    // Can the user create a comment thread on a given application?
    @Deprecated
    COMMENT_ON_APPLICATIONS("canComment:applications", Application.class),

    APPLICATION_CREATE_PAGES("create:pages", Application.class),

    /**
     * This permission would be used to provide delete permission to pages where the user does not have
     * permission to delete application.
     */
    APPLICATION_DELETE_PAGES("delete:applicationPages", Application.class),

    MANAGE_PAGES("manage:pages", NewPage.class),
    READ_PAGES("read:pages", NewPage.class),
    DELETE_PAGES("delete:pages", NewPage.class),

    PAGE_CREATE_PAGE_ACTIONS("create:pageActions", NewPage.class),

    MANAGE_ACTIONS("manage:actions", NewAction.class),
    READ_ACTIONS("read:actions", NewAction.class),
    EXECUTE_ACTIONS("execute:actions", NewAction.class),
    DELETE_ACTIONS("delete:actions", NewAction.class),

    MANAGE_DATASOURCES("manage:datasources", Datasource.class),
    READ_DATASOURCES("read:datasources", Datasource.class),
    EXECUTE_DATASOURCES("execute:datasources", Datasource.class),
    DELETE_DATASOURCES("delete:datasources", Datasource.class),
    CREATE_DATASOURCE_ACTIONS("create:datasourceActions", Datasource.class),

    READ_THEMES("read:themes", Theme.class),
    MANAGE_THEMES("manage:themes", Theme.class),

    // Permission Group Permissions
    MANAGE_PERMISSION_GROUPS("manage:permissionGroups", PermissionGroup.class),
    // This permission should only be used to read the members of a permission group
    READ_PERMISSION_GROUP_MEMBERS("read:permissionGroupMembers", PermissionGroup.class),
    ASSIGN_PERMISSION_GROUPS("assign:permissionGroups", PermissionGroup.class),
    UNASSIGN_PERMISSION_GROUPS("unassign:permissionGroups", PermissionGroup.class),
    @Deprecated
    READ_PERMISSION_GROUPS("read:permissionGroups", PermissionGroup.class),

    // Manage organization permissions
    MANAGE_ORGANIZATION("manage:organization", Organization.class),
    @Deprecated(forRemoval = true, since = "v1.62")
    MANAGE_TENANT("manage:tenant", Organization.class),

    CONNECT_TO_GIT("connectToGit:applications", Application.class),
    MANAGE_PROTECTED_BRANCHES("manageProtectedBranches:applications", Application.class),
    MANAGE_DEFAULT_BRANCHES("manageDefaultBranches:applications", Application.class),
    MANAGE_AUTO_COMMIT("manageAutoCommit:applications", Application.class),
    ;

    private final String value;
    private final Class<? extends BaseDomain> entity;

    AclPermission(String value, Class<? extends BaseDomain> entity) {
        this.value = value;
        this.entity = entity;
    }

    public static AclPermission getPermissionByValue(String value, Class<? extends BaseDomain> entity) {
        for (AclPermission permission : values()) {
            if (permission.getValue().equals(value) && permission.getEntity().equals(entity)) {
                return permission;
            }
        }
        return null;
    }

    public static boolean isPermissionForEntity(AclPermission aclPermission, Class<?> clazz) {
        Class<?> entityClass = clazz;
        /*
         * NewAction and ActionCollection are similar entities w.r.t. AclPermissions.
         * Hence, whenever we want to check for any Permission w.r.t. ActionCollection, we use NewAction.
         */
        if (entityClass.equals(ActionCollection.class)) {
            entityClass = NewAction.class;
        }
        return aclPermission.getEntity().equals(entityClass);
    }

    public static AclPermission getPermissionOrNull(AclPermission permission, Boolean operateWithoutPermission) {
        if (Boolean.TRUE.equals(operateWithoutPermission)) {
            return null;
        }
        return permission;
    }
}

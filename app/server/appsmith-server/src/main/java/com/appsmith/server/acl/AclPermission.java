package com.appsmith.server.acl;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import lombok.Getter;

@Getter
public enum AclPermission {
    /**
     * Notes :
     * 1. Composite permissions are more often than not used in the generation of the hierarchical graphs.
     * For example, USER_MANAGE_ORGANIZATIONS, ORGANIZATION_MANAGE_APPLICATIONS, etc.
     */

    // Tenant level permissions
    CREATE_WORKSPACES("create:workspace", Tenant.class),
    CREATE_USER_GROUPS("create:userGroups", Tenant.class),
    CREATE_PERMISSION_GROUPS("create:permissionGroups", Tenant.class),

    // Does the user have manage organization permission
    USER_MANAGE_ORGANIZATIONS("manage:userOrganization", User.class),
    //Does the user have read organization permissions
    USER_READ_ORGANIZATIONS("read:userOrganization", User.class),

    // Does this user have permission to access Instance Config UI?
    MANAGE_INSTANCE_ENV("manage:instanceEnv", User.class),

    // TODO: Add these permissions to PolicyGenerator to assign them to the user when they sign up
    // The following should be applied to Organization and not User
    READ_USERS("read:users", User.class),
    MANAGE_USERS("manage:users", User.class),
    RESET_PASSWORD_USERS("resetPassword:users", User.class),

    MANAGE_ORGANIZATIONS("manage:organizations", Workspace.class),
    READ_ORGANIZATIONS("read:organizations", Workspace.class),
    DELETE_WORKSPACES("delete:workspace", Workspace.class),

    // Resource creation permissions for workspace
    CREATE_APPLICATION("create:applications", Workspace.class),
    CREATE_DATASOURCE("create:datasources", Workspace.class),

    // Was the user assigned a global permission at the organization level to manage applications?
    ORGANIZATION_MANAGE_APPLICATIONS("manage:orgApplications", Workspace.class),
    ORGANIZATION_READ_APPLICATIONS("read:orgApplications", Workspace.class),
    ORGANIZATION_PUBLISH_APPLICATIONS("publish:orgApplications", Workspace.class),
    ORGANIZATION_EXPORT_APPLICATIONS("export:orgApplications", Workspace.class),
    WORKSPACE_DELETE_APPLICATIONS("delete:workspaceApplications", Workspace.class),
    WORKSPACE_MAKE_PUBLIC_APPLICATIONS("makePublic:workspaceApplications", Workspace.class),

    // Was the user assigned a global permission at the workspace level to manage datasources?
    WORKSPACE_MANAGE_DATASOURCES("manage:workspaceDatasources", Workspace.class),
    WORKSPACE_READ_DATASOURCES("read:workspaceDatasources", Workspace.class),
    WORKSPACE_DELETE_DATASOURCES("delete:workspaceDatasources", Workspace.class),
    WORKSPACE_EXECUTE_DATASOURCES("execute:workspaceDatasources", Workspace.class),

    // Invitation related permissions : TODO : Delete this since invitation would be led by user groups
    ORGANIZATION_INVITE_USERS("inviteUsers:organization", Workspace.class),

    MANAGE_APPLICATIONS("manage:applications", Application.class),
    READ_APPLICATIONS("read:applications", Application.class),
    PUBLISH_APPLICATIONS("publish:applications", Application.class),
    EXPORT_APPLICATIONS("export:applications", Application.class),
    DELETE_APPLICATIONS("delete:applications", Application.class),

    // Making an application public permission at Organization level
    MAKE_PUBLIC_APPLICATIONS("makePublic:applications", Application.class),

    // Can the user create a comment thread on a given application?
    COMMENT_ON_APPLICATIONS("canComment:applications", Application.class),

    CREATE_PAGES("create:pages", Application.class),

    MANAGE_PAGES("manage:pages", Page.class),
    READ_PAGES("read:pages", Page.class),
    DELETE_PAGES("delete:pages", Page.class),

    CREATE_PAGE_ACTIONS("create:pageActions", Page.class),

    MANAGE_ACTIONS("manage:actions", Action.class),
    READ_ACTIONS("read:actions", Action.class),
    EXECUTE_ACTIONS("execute:actions", Action.class),
    DELETE_ACTIONS("delete:actions", Action.class),

    MANAGE_DATASOURCES("manage:datasources", Datasource.class),
    READ_DATASOURCES("read:datasources", Datasource.class),
    EXECUTE_DATASOURCES("execute:datasources", Datasource.class),
    DELETE_DATASOURCES("delete:datasources", Datasource.class),
    CREATE_DATASOURCE_ACTIONS("create:datasourceActions", Datasource.class),

    COMMENT_ON_THREADS("canComment:commentThreads", CommentThread.class),
    READ_THREADS("read:commentThreads", CommentThread.class),
    MANAGE_THREADS("manage:commentThreads", CommentThread.class),

    READ_COMMENTS("read:comments", Comment.class),
    MANAGE_COMMENTS("manage:comments", Comment.class),

    READ_THEMES("read:themes", Theme.class),
    MANAGE_THEMES("manage:themes", Theme.class),

    // User Group Permissions
    MANAGE_USER_GROUPS("manage:userGroups", UserGroup.class),
    READ_USER_GROUPS("read:userGroups", UserGroup.class),
    DELETE_USER_GROUPS("delete:userGroups", UserGroup.class),
    INVITE_USER_GROUPS("invite:userGroups", UserGroup.class),

    // Permission Group Permissions
    MANAGE_PERMISSION_GROUPS("manage:permissionGroups", PermissionGroup.class),
    READ_PERMISSION_GROUPS("read:permissionGroups", PermissionGroup.class),
    DELETE_PERMISSION_GROUPS("delete:permissionGroups", UserGroup.class),

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
}

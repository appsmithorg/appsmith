package com.appsmith.server.acl;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.User;
import lombok.Getter;

@Getter
public enum AclPermission {
    /**
     * Notes :
     * 1. Composite permissions are more often than not used in the generation of the hierarchical graphs.
     * For example, USER_MANAGE_ORGANIZATIONS, ORGANIZATION_MANAGE_APPLICATIONS, etc.
     */

    // These are generic permissions created to make the transition to the new ACL format easy. They must be removed
    // TODO: These have a potential to throw NPEs in the `getPermissionByValue` method.
    CREATE("create", null),
    READ("read", null),
    UPDATE("update", null),
    DELETE("delete", null),

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

    MANAGE_ORGANIZATIONS("manage:organizations", Organization.class),
    READ_ORGANIZATIONS("read:organizations", Organization.class),

    // Was the user assigned a global permission at the organization level to manage applications?
    ORGANIZATION_MANAGE_APPLICATIONS("manage:orgApplications", Organization.class),
    ORGANIZATION_READ_APPLICATIONS("read:orgApplications", Organization.class),
    ORGANIZATION_PUBLISH_APPLICATIONS("publish:orgApplications", Organization.class),
    ORGANIZATION_EXPORT_APPLICATIONS("export:orgApplications", Organization.class),

    // Invitation related permissions
    ORGANIZATION_INVITE_USERS("inviteUsers:organization", Organization.class),

    MANAGE_APPLICATIONS("manage:applications", Application.class),
    READ_APPLICATIONS("read:applications", Application.class),
    PUBLISH_APPLICATIONS("publish:applications", Application.class),
    EXPORT_APPLICATIONS("export:applications", Application.class),

    // Making an application public permission at Organization level
    MAKE_PUBLIC_APPLICATIONS("makePublic:applications", Application.class),

    // Can the user create a comment thread on a given application?
    COMMENT_ON_APPLICATIONS("canComment:applications", Application.class),

    MANAGE_PAGES("manage:pages", Page.class),
    READ_PAGES("read:pages", Page.class),

    MANAGE_ACTIONS("manage:actions", Action.class),
    READ_ACTIONS("read:actions", Action.class),
    EXECUTE_ACTIONS("execute:actions", Action.class),

    MANAGE_DATASOURCES("manage:datasources", Datasource.class),
    READ_DATASOURCES("read:datasources", Datasource.class),
    EXECUTE_DATASOURCES("execute:datasources", Datasource.class),

    COMMENT_ON_THREAD("canComment:commentThreads", CommentThread.class),
    READ_THREAD("read:commentThreads", CommentThread.class),
    MANAGE_THREAD("manage:commentThreads", CommentThread.class),

    READ_COMMENT("read:comments", Comment.class),
    MANAGE_COMMENT("manage:comments", Comment.class),

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

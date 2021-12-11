package com.appsmith.server.acl.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentThread;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.User;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AclPermissionCE {
    /**
     * Notes :
     * 1. Composite permissions are more often than not used in the generation of the hierarchical graphs.
     * For example, USER_MANAGE_ORGANIZATIONS, ORGANIZATION_MANAGE_APPLICATIONS, etc.
     */

    // Does the user have manage organization permission
    public static final AclPermissionCE USER_MANAGE_ORGANIZATIONS = new AclPermissionCE("manage:userOrganization", User.class);
    //Does the user have read organization permissions
    public static final AclPermissionCE USER_READ_ORGANIZATIONS = new AclPermissionCE("read:userOrganization", User.class);

    // Does this user have permission to access Instance Config UI?
    public static final AclPermissionCE MANAGE_INSTANCE_ENV = new AclPermissionCE("manage:instanceEnv", User.class);

    // TODO: Add these permissions to PolicyGenerator to assign them to the user when they sign up
    // The following should be applied to Organization and not User
    public static final AclPermissionCE READ_USERS = new AclPermissionCE("read:users", User.class);
    public static final AclPermissionCE MANAGE_USERS = new AclPermissionCE("manage:users", User.class);
    public static final AclPermissionCE RESET_PASSWORD_USERS = new AclPermissionCE("resetPassword:users", User.class);

    public static final AclPermissionCE MANAGE_ORGANIZATIONS = new AclPermissionCE("manage:organizations", Organization.class);
    public static final AclPermissionCE READ_ORGANIZATIONS = new AclPermissionCE("read:organizations", Organization.class);

    // Was the user assigned a global permission at the organization level to manage applications?
    public static final AclPermissionCE ORGANIZATION_MANAGE_APPLICATIONS = new AclPermissionCE("manage:orgApplications", Organization.class);
    public static final AclPermissionCE ORGANIZATION_READ_APPLICATIONS = new AclPermissionCE("read:orgApplications", Organization.class);
    public static final AclPermissionCE ORGANIZATION_PUBLISH_APPLICATIONS = new AclPermissionCE("publish:orgApplications", Organization.class);
    public static final AclPermissionCE ORGANIZATION_EXPORT_APPLICATIONS = new AclPermissionCE("export:orgApplications", Organization.class);

    // Invitation related permissions
    public static final AclPermissionCE ORGANIZATION_INVITE_USERS = new AclPermissionCE("inviteUsers:organization", Organization.class);

    public static final AclPermissionCE MANAGE_APPLICATIONS = new AclPermissionCE("manage:applications", Application.class);
    public static final AclPermissionCE READ_APPLICATIONS = new AclPermissionCE("read:applications", Application.class);
    public static final AclPermissionCE PUBLISH_APPLICATIONS = new AclPermissionCE("publish:applications", Application.class);
    public static final AclPermissionCE EXPORT_APPLICATIONS = new AclPermissionCE("export:applications", Application.class);

    // Making an application public permission at Organization level
    public static final AclPermissionCE MAKE_PUBLIC_APPLICATIONS = new AclPermissionCE("makePublic:applications", Application.class);

    // Can the user create a comment thread on a given application?
    public static final AclPermissionCE COMMENT_ON_APPLICATIONS = new AclPermissionCE("canComment:applications", Application.class);

    public static final AclPermissionCE MANAGE_PAGES = new AclPermissionCE("manage:pages", Page.class);
    public static final AclPermissionCE READ_PAGES = new AclPermissionCE("read:pages", Page.class);

    public static final AclPermissionCE MANAGE_ACTIONS = new AclPermissionCE("manage:actions", Action.class);
    public static final AclPermissionCE READ_ACTIONS = new AclPermissionCE("read:actions", Action.class);
    public static final AclPermissionCE EXECUTE_ACTIONS = new AclPermissionCE("execute:actions", Action.class);

    public static final AclPermissionCE MANAGE_DATASOURCES = new AclPermissionCE("manage:datasources", Datasource.class);
    public static final AclPermissionCE READ_DATASOURCES = new AclPermissionCE("read:datasources", Datasource.class);
    public static final AclPermissionCE EXECUTE_DATASOURCES = new AclPermissionCE("execute:datasources", Datasource.class);

    public static final AclPermissionCE COMMENT_ON_THREAD = new AclPermissionCE("canComment:commentThreads", CommentThread.class);
    public static final AclPermissionCE READ_THREAD = new AclPermissionCE("read:commentThreads", CommentThread.class);
    public static final AclPermissionCE MANAGE_THREAD = new AclPermissionCE("manage:commentThreads", CommentThread.class);

    public static final AclPermissionCE READ_COMMENT = new AclPermissionCE("read:comments", Comment.class);
    public static final AclPermissionCE MANAGE_COMMENT = new AclPermissionCE("manage:comments", Comment.class);

    private final String value;
    private final Class<? extends BaseDomain> entity;

    public AclPermissionCE(String value, Class<? extends BaseDomain> entity) {
        this.value = value;
        this.entity = entity;
    }

}

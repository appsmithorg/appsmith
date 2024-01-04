package com.appsmith.server.acl;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Environment;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApprovalRequest;
import com.appsmith.server.domains.AuditLog;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Package;
import com.appsmith.server.domains.Page;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workflow;
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

    // Tenant level permissions
    CREATE_PERMISSION_GROUPS("createPermissionGroups:tenant", Tenant.class),
    TENANT_MANAGE_PERMISSION_GROUPS("tenantManagePermissionGroups:tenant", Tenant.class),
    TENANT_READ_PERMISSION_GROUPS("tenantReadPermissionGroups:tenant", Tenant.class),
    TENANT_DELETE_PERMISSION_GROUPS("tenantDeletePermissionGroups:tenant", Tenant.class),
    TENANT_ASSIGN_PERMISSION_GROUPS("tenantAssignPermissionGroups:tenant", Tenant.class),
    TENANT_UNASSIGN_PERMISSION_GROUPS("tenantUnassignPermissionGroups:tenant", Tenant.class),

    TENANT_MANAGE_USER_GROUPS("tenantManageUserGroups:tenant", Tenant.class),
    TENANT_READ_USER_GROUPS("tenantReadUserGroups:tenant", Tenant.class),
    TENANT_DELETE_USER_GROUPS("tenantDeleteUserGroups:tenant", Tenant.class),
    TENANT_ADD_USER_TO_ALL_USER_GROUPS("tenantAddUsersToGroups:tenant", Tenant.class),
    TENANT_REMOVE_USER_FROM_ALL_USER_GROUPS("tenantRemoveUserFromGroups:tenant", Tenant.class),
    TENANT_MANAGE_ALL_USERS("tenantManageAllUsers:tenant", Tenant.class),
    TENANT_DELETE_ALL_USERS("tenantDeleteAllUsers:tenant", Tenant.class),
    TENANT_READ_ALL_USERS("tenantReadAllUsers:tenant", Tenant.class),

    CREATE_USER_GROUPS("createUserGroups:tenant", Tenant.class),
    CREATE_WORKSPACES("createWorkspaces:tenant", Tenant.class),
    READ_TENANT_AUDIT_LOGS("readAuditLogs:tenant", Tenant.class),

    // Does the user have manage workspace permission
    @Deprecated
    USER_MANAGE_WORKSPACES("manage:userWorkspace", User.class),
    // Does the user have read workspace permissions
    @Deprecated
    USER_READ_WORKSPACES("read:userWorkspace", User.class),

    // Does this user have permission to access Instance Config UI?
    @Deprecated
    MANAGE_INSTANCE_ENV("manage:instanceEnv", User.class),

    TENANT_CREATE_USER_GROUPS("create:userGroups", Tenant.class),

    // TODO: Add these permissions to PolicyGenerator to assign them to the user when they sign up
    // The following should be applied to Workspace and not User
    READ_USERS("read:users", User.class),
    MANAGE_USERS("manage:users", User.class),
    RESET_PASSWORD_USERS("resetPassword:users", User.class),

    DELETE_USERS("delete:users", User.class),

    MANAGE_WORKSPACES("manage:workspaces", Workspace.class),
    READ_WORKSPACES("read:workspaces", Workspace.class),
    DELETE_WORKSPACES("delete:workspace", Workspace.class),

    // Resource creation permissions for workspace
    WORKSPACE_CREATE_APPLICATION("create:applications", Workspace.class),
    WORKSPACE_CREATE_DATASOURCE("create:datasources", Workspace.class),
    WORKSPACE_CREATE_ENVIRONMENT("create:environments", Workspace.class),
    WORKSPACE_CREATE_PACKAGE("create:packages", Workspace.class),
    WORKSPACE_CREATE_WORKFLOW("create:workflows", Workspace.class),

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

    // Was the user assigned a global permission at the workspace level to manage environments?
    WORKSPACE_MANAGE_ENVIRONMENTS("manage:workspaceEnvironments", Workspace.class),
    WORKSPACE_READ_ENVIRONMENTS("read:workspaceEnvironments", Workspace.class),
    WORKSPACE_DELETE_ENVIRONMENTS("delete:workspaceEnvironments", Workspace.class),
    WORKSPACE_EXECUTE_ENVIRONMENTS("execute:workspaceEnvironments", Workspace.class),

    // global permission on workspace level to give create actions on all datasources
    WORKSPACE_DATASOURCE_CREATE_DATASOURCE_ACTIONS("create:workspaceDatasourceActions", Workspace.class),

    // Was the user assigned a global permission at the workspace level to manage packages?
    WORKSPACE_MANAGE_PACKAGES("manage:workspacePackages", Workspace.class),
    WORKSPACE_READ_PACKAGES("read:workspacePackages", Workspace.class),
    WORKSPACE_PUBLISH_PACKAGES("publish:workspacePackages", Workspace.class),
    WORKSPACE_EXPORT_PACKAGES("export:workspacePackages", Workspace.class),
    WORKSPACE_DELETE_PACKAGES("delete:workspacePackages", Workspace.class),

    // Was the user assigned a global permission at the workspace level to manage workflows?
    WORKSPACE_MANAGE_WORKFLOWS("manage:workspaceWorkflows", Workspace.class),
    @Deprecated
    WORKSPACE_READ_WORKFLOWS("read:workspaceWorkflows", Workspace.class),
    WORKSPACE_READ_HISTORY_WORKFLOW("readHistory:workspaceWorkflows", Workspace.class),
    WORKSPACE_PUBLISH_WORKFLOWS("publish:workspaceWorkflows", Workspace.class),
    WORKSPACE_EXPORT_WORKFLOWS("export:workspaceWorkflows", Workspace.class),
    WORKSPACE_DELETE_WORKFLOWS("delete:workspaceWorkflows", Workspace.class),
    @Deprecated
    WORKSPACE_RESOLVE_WORKFLOWS("resolve:workspaceWorkflows", Workspace.class),
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

    // Gives users permission to invite users to application.
    INVITE_USERS_APPLICATIONS("inviteUsers:applications", Application.class),

    MANAGE_PACKAGES("manage:packages", Package.class),
    READ_PACKAGES("read:packages", Package.class),
    PUBLISH_PACKAGES("publish:packages", Package.class),
    EXPORT_PACKAGES("export:packages", Package.class),
    DELETE_PACKAGES("delete:packages", Package.class),

    APPLICATION_CREATE_PAGES("create:pages", Application.class),

    // Due to this edge in the hierarchy graph, access to creating module instances would be limited to default
    // workspace admins and workspace developers
    PACKAGE_CREATE_MODULES("create:modules", Package.class),

    MANAGE_PAGES("manage:pages", Page.class),
    READ_PAGES("read:pages", Page.class),
    DELETE_PAGES("delete:pages", Page.class),

    MANAGE_MODULES("manage:modules", Module.class),
    READ_MODULES("read:modules", Module.class),
    DELETE_MODULES("delete:modules", Module.class),

    CREATE_MODULE_INSTANCES("create:moduleInstances", Module.class),

    // This permission would be used to add actions, JS objects and other module instances to the module in the context
    // of creator
    CREATE_MODULE_EXECUTABLES("create:moduleExecutables", Module.class),

    PAGE_CREATE_PAGE_ACTIONS("create:pageActions", Page.class),
    PAGE_CREATE_MODULE_INSTANCES("create:moduleInstancesInPage", Page.class),

    MANAGE_ACTIONS("manage:actions", Action.class),
    READ_ACTIONS("read:actions", Action.class),
    EXECUTE_ACTIONS("execute:actions", Action.class),
    DELETE_ACTIONS("delete:actions", Action.class),

    MANAGE_MODULE_INSTANCES("manage:moduleInstances", ModuleInstance.class),
    READ_MODULE_INSTANCES("read:moduleInstances", ModuleInstance.class),
    EXECUTE_MODULE_INSTANCES("execute:moduleInstances", ModuleInstance.class),
    DELETE_MODULE_INSTANCES("delete:moduleInstances", ModuleInstance.class),

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
    READ_PERMISSION_GROUPS("read:permissionGroups", PermissionGroup.class),
    ASSIGN_PERMISSION_GROUPS("assign:permissionGroups", PermissionGroup.class),
    UNASSIGN_PERMISSION_GROUPS("unassign:permissionGroups", PermissionGroup.class),
    DELETE_PERMISSION_GROUPS("delete:permissionGroups", PermissionGroup.class),

    // User Group Permissions
    MANAGE_USER_GROUPS("manage:userGroups", UserGroup.class),
    READ_USER_GROUPS("read:userGroups", UserGroup.class),
    DELETE_USER_GROUPS("delete:userGroups", UserGroup.class),
    ADD_USERS_TO_USER_GROUPS("addUsers:userGroups", UserGroup.class),
    REMOVE_USERS_FROM_USER_GROUPS("removeUsers:userGroups", UserGroup.class),

    // Environment Permissions
    EXECUTE_ENVIRONMENTS("execute:environments", Environment.class),
    DELETE_ENVIRONMENTS("delete:environments", Environment.class),
    MANAGE_ENVIRONMENTS("manage:environments", Environment.class),

    // Manage tenant permissions
    MANAGE_TENANT("manage:tenants", Tenant.class),

    CONNECT_TO_GIT("connectToGit:applications", Application.class),
    MANAGE_PROTECTED_BRANCHES("manageProtectedBranches:applications", Application.class),
    MANAGE_DEFAULT_BRANCHES("manageDefaultBranches:applications", Application.class),
    MANAGE_AUTO_COMMIT("manageAutoCommit:applications", Application.class),

    // AuditLogs Permission
    READ_AUDIT_LOGS("read:auditLogs", AuditLog.class),

    // Workflow Permissions
    MANAGE_WORKFLOWS("manage:workflows", Workflow.class),
    @Deprecated
    READ_WORKFLOWS("read:workflows", Workflow.class),
    PUBLISH_WORKFLOWS("publish:workflows", Workflow.class),
    DELETE_WORKFLOWS("delete:workflows", Workflow.class),
    EXPORT_WORKFLOWS("export:workflows", Workflow.class),
    EXECUTE_WORKFLOWS("execute:workflows", Workflow.class),
    WORKFLOW_CREATE_ACTIONS("create:workflowActions", Workflow.class),
    READ_HISTORY_WORKFLOWS("readHistory:workflows", Workflow.class),

    // Approval Request Permissions
    RESOLVE_APPROVAL_REQUESTS("resolve:approvalRequests", ApprovalRequest.class),
    READ_APPROVAL_REQUESTS("read:approvalRequests", ApprovalRequest.class),
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

    public static boolean isPermissionForEntity(AclPermission aclPermission, Class clazz) {
        Class entityClass = clazz;
        /*
         * Action class has been deprecated, and we have started using NewAction class instead.
         * Page class has been deprecated, and we have started using NewPage class instead.
         * NewAction and ActionCollection are similar entities w.r.t. AclPermissions.
         * Hence, whenever we want to check for any Permission w.r.t. NewAction or Action Collection, we use Action, and
         * whenever we want to check for any Permission w.r.t. NewPage, we use Page.
         */
        if (entityClass.equals(NewAction.class) || entityClass.equals(ActionCollection.class)) {
            entityClass = Action.class;
        } else if (entityClass.equals(NewPage.class)) {
            entityClass = Page.class;
        }
        return aclPermission.getEntity().equals(entityClass);
    }
}

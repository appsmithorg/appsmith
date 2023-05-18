package com.appsmith.server.solutions.roles.constants;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
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

public class AclPermissionAndViewablePermissionConstantsMaps {
    private static final Map<AclPermission, PermissionViewableName> permissionViewableMap = Map.ofEntries(
            // Workspace level permissions
            Map.entry(WORKSPACE_CREATE_APPLICATION, CREATE),
            Map.entry(WORKSPACE_MANAGE_APPLICATIONS, EDIT),
            Map.entry(WORKSPACE_DELETE_APPLICATIONS, DELETE),
            Map.entry(WORKSPACE_READ_APPLICATIONS, VIEW),
            Map.entry(WORKSPACE_MAKE_PUBLIC_APPLICATIONS, MAKE_PUBLIC),
            Map.entry(WORKSPACE_EXPORT_APPLICATIONS, EXPORT),
            Map.entry(WORKSPACE_EXECUTE_DATASOURCES, EXECUTE),
            Map.entry(WORKSPACE_CREATE_DATASOURCE, CREATE),
            Map.entry(WORKSPACE_MANAGE_DATASOURCES, EDIT),
            Map.entry(WORKSPACE_DELETE_DATASOURCES, DELETE),
            Map.entry(WORKSPACE_READ_DATASOURCES, VIEW),
            Map.entry(MANAGE_WORKSPACES, EDIT),
            Map.entry(READ_WORKSPACES, VIEW),
            Map.entry(DELETE_WORKSPACES, DELETE),

            // Datasource level permissions
            Map.entry(EXECUTE_DATASOURCES, EXECUTE),
            Map.entry(CREATE_DATASOURCE_ACTIONS, CREATE),
            Map.entry(MANAGE_DATASOURCES, EDIT),
            Map.entry(DELETE_DATASOURCES, DELETE),
            Map.entry(READ_DATASOURCES, VIEW),

            // Application level permissions
            Map.entry(APPLICATION_CREATE_PAGES, CREATE),
            Map.entry(MANAGE_APPLICATIONS, EDIT),
            Map.entry(DELETE_APPLICATIONS, DELETE),
            Map.entry(READ_APPLICATIONS, VIEW),
            Map.entry(MAKE_PUBLIC_APPLICATIONS, MAKE_PUBLIC),
            Map.entry(EXPORT_APPLICATIONS, EXPORT),

            // Page level permissions
            Map.entry(PAGE_CREATE_PAGE_ACTIONS, CREATE),
            Map.entry(MANAGE_PAGES, EDIT),
            Map.entry(DELETE_PAGES, DELETE),
            Map.entry(READ_PAGES, VIEW),

            // Action level permissions
            Map.entry(MANAGE_ACTIONS, EDIT),
            Map.entry(DELETE_ACTIONS, DELETE),
            Map.entry(READ_ACTIONS, VIEW),
            Map.entry(EXECUTE_ACTIONS, EXECUTE),

            // Tenant level permissions
            Map.entry(CREATE_USER_GROUPS, CREATE),
            Map.entry(TENANT_MANAGE_USER_GROUPS, EDIT),
            Map.entry(TENANT_READ_USER_GROUPS, VIEW),
            Map.entry(TENANT_DELETE_USER_GROUPS, DELETE),
            Map.entry(TENANT_ADD_USER_TO_ALL_USER_GROUPS, INVITE_USER),
            Map.entry(TENANT_REMOVE_USER_FROM_ALL_USER_GROUPS, REMOVE_USER),
            Map.entry(CREATE_PERMISSION_GROUPS, CREATE),
            Map.entry(TENANT_MANAGE_PERMISSION_GROUPS, EDIT),
            Map.entry(TENANT_READ_PERMISSION_GROUPS, VIEW),
            Map.entry(TENANT_DELETE_PERMISSION_GROUPS, DELETE),
            Map.entry(TENANT_ASSIGN_PERMISSION_GROUPS, ASSOCIATE_ROLE),
            Map.entry(CREATE_WORKSPACES, CREATE),
            Map.entry(READ_TENANT_AUDIT_LOGS, VIEW),

            // User group permissions
            Map.entry(MANAGE_USER_GROUPS, EDIT),
            Map.entry(DELETE_USER_GROUPS, DELETE),
            Map.entry(READ_USER_GROUPS, VIEW),
            Map.entry(ADD_USERS_TO_USER_GROUPS, INVITE_USER),
            Map.entry(REMOVE_USERS_FROM_USER_GROUPS, REMOVE_USER),

            // Permission group
            Map.entry(MANAGE_PERMISSION_GROUPS, EDIT),
            Map.entry(DELETE_PERMISSION_GROUPS, DELETE),
            Map.entry(READ_PERMISSION_GROUPS, VIEW),
            Map.entry(ASSIGN_PERMISSION_GROUPS, ASSOCIATE_ROLE),

            //Environment level permissions
            Map.entry(EXECUTE_ENVIRONMENTS, EXECUTE)

    );

    private static final Map<PermissionViewableName, List<AclPermission>> viewableToPermissionsMap =
            permissionViewableMap.entrySet()
                    .stream()
                    .collect(
                            // Switch the keys and values to create a swapped map.
                            Collectors.groupingBy(
                                    Map.Entry::getValue,
                                    Collectors.mapping(Map.Entry::getKey, Collectors.toList()))
                    );

    public static PermissionViewableName getPermissionViewableName(AclPermission permission) {
        return permissionViewableMap.get(permission);
    }

    public static List<AclPermission> getAclPermissionsFromViewableName(PermissionViewableName viewableName, Class<?> aClass) {
        return viewableToPermissionsMap.get(viewableName)
                .stream()
                .filter(aclPermission -> {
                    Class entityClass = aClass;
                    if (aClass.equals(NewPage.class)) {
                        entityClass = Page.class;
                    } else if (aClass.equals(NewAction.class)) {
                        entityClass = Action.class;
                    } else if (aClass.equals(ActionCollection.class)) {
                        entityClass = Action.class;
                    }

                    if (aclPermission.getEntity().equals(entityClass)) {
                        return true;
                    }
                    return false;
                })
                .collect(Collectors.toList());
    }
}

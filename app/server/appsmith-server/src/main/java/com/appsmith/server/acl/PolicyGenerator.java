package com.appsmith.server.acl;

import com.appsmith.server.acl.ce.PolicyGeneratorCE;
import org.jgrapht.graph.DefaultEdge;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.ADD_USERS_TO_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.APPLICATION_CREATE_PAGES;
import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.CREATE_DATASOURCE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.CREATE_MODULE_EXECUTABLES;
import static com.appsmith.server.acl.AclPermission.CREATE_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.CREATE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.CREATE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.DELETE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.DELETE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.DELETE_ENVIRONMENTS;
import static com.appsmith.server.acl.AclPermission.DELETE_MODULES;
import static com.appsmith.server.acl.AclPermission.DELETE_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.DELETE_PACKAGES;
import static com.appsmith.server.acl.AclPermission.DELETE_PAGES;
import static com.appsmith.server.acl.AclPermission.DELETE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_USERS;
import static com.appsmith.server.acl.AclPermission.DELETE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.DELETE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ENVIRONMENTS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.EXECUTE_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.EXPORT_PACKAGES;
import static com.appsmith.server.acl.AclPermission.EXPORT_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.INVITE_USERS_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MAKE_PUBLIC_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_ENVIRONMENTS;
import static com.appsmith.server.acl.AclPermission.MANAGE_MODULES;
import static com.appsmith.server.acl.AclPermission.MANAGE_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PACKAGES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.MANAGE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.PACKAGE_CREATE_MODULES;
import static com.appsmith.server.acl.AclPermission.PAGE_CREATE_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.PAGE_CREATE_PAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.PUBLISH_PACKAGES;
import static com.appsmith.server.acl.AclPermission.PUBLISH_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPROVAL_REQUESTS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_HISTORY_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.READ_MODULES;
import static com.appsmith.server.acl.AclPermission.READ_MODULE_INSTANCES;
import static com.appsmith.server.acl.AclPermission.READ_PACKAGES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.READ_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.REMOVE_USERS_FROM_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.RESOLVE_APPROVAL_REQUESTS;
import static com.appsmith.server.acl.AclPermission.RESOLVE_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.TENANT_ADD_USER_TO_ALL_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_DELETE_ALL_USERS;
import static com.appsmith.server.acl.AclPermission.TENANT_DELETE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_DELETE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_MANAGE_ALL_USERS;
import static com.appsmith.server.acl.AclPermission.TENANT_MANAGE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_MANAGE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_READ_ALL_USERS;
import static com.appsmith.server.acl.AclPermission.TENANT_READ_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_READ_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_REMOVE_USER_FROM_ALL_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_UNASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.UNASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.WORKFLOW_CREATE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_DATASOURCE;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_ENVIRONMENT;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_PACKAGE;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_WORKFLOW;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_DATASOURCE_CREATE_DATASOURCE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_DELETE_ENVIRONMENTS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_DELETE_PACKAGES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_DELETE_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_EXECUTE_ENVIRONMENTS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_EXPORT_PACKAGES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_EXPORT_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_INVITE_USERS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MAKE_PUBLIC_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MANAGE_ENVIRONMENTS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MANAGE_PACKAGES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MANAGE_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_PUBLISH_PACKAGES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_PUBLISH_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_ENVIRONMENTS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_PACKAGES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_RESOLVE_WORKFLOWS;

@Component
public class PolicyGenerator extends PolicyGeneratorCE {

    @Override
    protected void createPolicyGraphForEachType() {
        super.createPolicyGraphForEachType();
        createEnvironmentPolicyGraph();
        createTenantPolicyGraph();
        createAuditLogPolicyGraph();
        createUserGroupPolicies();
        createPackagePolicyGraph();
        createModulePolicyGraph();
        createModuleInstancePolicyGraph();
        createWorkflowPolicyGraph();
        createApprovalRequestPolicyGraph();
    }

    private void createApprovalRequestPolicyGraph() {
        lateralGraph.addEdge(RESOLVE_APPROVAL_REQUESTS, READ_APPROVAL_REQUESTS);
    }

    private void createWorkflowPolicyGraph() {
        hierarchyGraph.addEdge(WORKSPACE_CREATE_WORKFLOW, WORKFLOW_CREATE_ACTIONS);
        hierarchyGraph.addEdge(WORKSPACE_MANAGE_WORKFLOWS, MANAGE_WORKFLOWS);
        hierarchyGraph.addEdge(WORKSPACE_READ_WORKFLOWS, READ_WORKFLOWS);
        hierarchyGraph.addEdge(WORKSPACE_DELETE_WORKFLOWS, DELETE_WORKFLOWS);
        hierarchyGraph.addEdge(WORKSPACE_PUBLISH_WORKFLOWS, PUBLISH_WORKFLOWS);
        hierarchyGraph.addEdge(WORKSPACE_EXPORT_WORKFLOWS, EXPORT_WORKFLOWS);
        hierarchyGraph.addEdge(WORKSPACE_RESOLVE_WORKFLOWS, RESOLVE_WORKFLOWS);

        lateralGraph.addEdge(MANAGE_WORKFLOWS, READ_WORKFLOWS);
        lateralGraph.addEdge(MANAGE_WORKFLOWS, EXECUTE_WORKFLOWS);
        lateralGraph.addEdge(WORKFLOW_CREATE_ACTIONS, MANAGE_WORKFLOWS);
        lateralGraph.addEdge(WORKFLOW_CREATE_ACTIONS, DELETE_WORKFLOWS);
        lateralGraph.addEdge(WORKFLOW_CREATE_ACTIONS, READ_WORKFLOWS);

        lateralGraph.addEdge(READ_WORKFLOWS, EXECUTE_WORKFLOWS);
        lateralGraph.addEdge(READ_WORKFLOWS, READ_HISTORY_WORKFLOWS);

        lateralGraph.addEdge(DELETE_WORKFLOWS, MANAGE_WORKFLOWS);
        lateralGraph.addEdge(DELETE_WORKFLOWS, READ_WORKFLOWS);

        lateralGraph.addEdge(PUBLISH_WORKFLOWS, READ_WORKFLOWS);
        lateralGraph.addEdge(PUBLISH_WORKFLOWS, MANAGE_WORKFLOWS);
        lateralGraph.addEdge(PUBLISH_WORKFLOWS, EXECUTE_WORKFLOWS);

        lateralGraph.addEdge(EXPORT_WORKFLOWS, READ_WORKFLOWS);
        lateralGraph.addEdge(EXPORT_WORKFLOWS, MANAGE_WORKFLOWS);
        lateralGraph.addEdge(EXPORT_WORKFLOWS, EXECUTE_WORKFLOWS);
    }

    protected void createEnvironmentPolicyGraph() {
        hierarchyGraph.addEdge(WORKSPACE_MANAGE_ENVIRONMENTS, MANAGE_ENVIRONMENTS);
        hierarchyGraph.addEdge(WORKSPACE_DELETE_ENVIRONMENTS, DELETE_ENVIRONMENTS);
        hierarchyGraph.addEdge(WORKSPACE_EXECUTE_ENVIRONMENTS, EXECUTE_ENVIRONMENTS);

        lateralGraph.addEdge(MANAGE_ENVIRONMENTS, EXECUTE_ENVIRONMENTS);
    }

    private void createTenantPolicyGraph() {
        // If given create, we must give all the other permissions for all permission groups
        lateralGraph.addEdge(CREATE_PERMISSION_GROUPS, TENANT_MANAGE_PERMISSION_GROUPS);
        lateralGraph.addEdge(CREATE_PERMISSION_GROUPS, TENANT_READ_PERMISSION_GROUPS);
        lateralGraph.addEdge(CREATE_PERMISSION_GROUPS, TENANT_DELETE_PERMISSION_GROUPS);
        lateralGraph.addEdge(CREATE_PERMISSION_GROUPS, TENANT_ASSIGN_PERMISSION_GROUPS);
        lateralGraph.addEdge(CREATE_PERMISSION_GROUPS, TENANT_UNASSIGN_PERMISSION_GROUPS);

        // If given create, we must give all the other permissions for all user groups
        lateralGraph.addEdge(CREATE_USER_GROUPS, TENANT_MANAGE_USER_GROUPS);
        lateralGraph.addEdge(CREATE_USER_GROUPS, TENANT_READ_USER_GROUPS);
        lateralGraph.addEdge(CREATE_USER_GROUPS, TENANT_DELETE_USER_GROUPS);
        lateralGraph.addEdge(CREATE_USER_GROUPS, TENANT_ADD_USER_TO_ALL_USER_GROUPS);
        lateralGraph.addEdge(CREATE_USER_GROUPS, TENANT_REMOVE_USER_FROM_ALL_USER_GROUPS);

        // Tenant permission group relationships
        lateralGraph.addEdge(TENANT_MANAGE_PERMISSION_GROUPS, TENANT_READ_PERMISSION_GROUPS);
        lateralGraph.addEdge(TENANT_MANAGE_PERMISSION_GROUPS, TENANT_ASSIGN_PERMISSION_GROUPS);
        lateralGraph.addEdge(TENANT_ASSIGN_PERMISSION_GROUPS, TENANT_UNASSIGN_PERMISSION_GROUPS);
        lateralGraph.addEdge(TENANT_DELETE_PERMISSION_GROUPS, TENANT_READ_PERMISSION_GROUPS);
        lateralGraph.addEdge(TENANT_READ_PERMISSION_GROUPS, TENANT_ASSIGN_PERMISSION_GROUPS);

        // Tenant user group relationships
        lateralGraph.addEdge(TENANT_DELETE_USER_GROUPS, TENANT_READ_USER_GROUPS);
        lateralGraph.addEdge(TENANT_MANAGE_USER_GROUPS, TENANT_ADD_USER_TO_ALL_USER_GROUPS);
        lateralGraph.addEdge(TENANT_MANAGE_USER_GROUPS, TENANT_REMOVE_USER_FROM_ALL_USER_GROUPS);
        lateralGraph.addEdge(TENANT_MANAGE_USER_GROUPS, TENANT_READ_USER_GROUPS);
        lateralGraph.addEdge(TENANT_ADD_USER_TO_ALL_USER_GROUPS, TENANT_READ_USER_GROUPS);
        lateralGraph.addEdge(TENANT_REMOVE_USER_FROM_ALL_USER_GROUPS, TENANT_ADD_USER_TO_ALL_USER_GROUPS);

        // Tenant user relationships
        lateralGraph.addEdge(TENANT_MANAGE_ALL_USERS, TENANT_DELETE_ALL_USERS);
        lateralGraph.addEdge(TENANT_DELETE_ALL_USERS, TENANT_READ_ALL_USERS);
        lateralGraph.addEdge(TENANT_MANAGE_ALL_USERS, TENANT_READ_ALL_USERS);
    }

    private void createAuditLogPolicyGraph() {
        hierarchyGraph.addEdge(AclPermission.READ_TENANT_AUDIT_LOGS, AclPermission.READ_AUDIT_LOGS);
    }

    @Override
    protected void createPermissionGroupPolicyGraph() {
        super.createPermissionGroupPolicyGraph();
        hierarchyGraph.addEdge(TENANT_MANAGE_PERMISSION_GROUPS, MANAGE_PERMISSION_GROUPS);
        hierarchyGraph.addEdge(TENANT_READ_PERMISSION_GROUPS, READ_PERMISSION_GROUPS);
        hierarchyGraph.addEdge(TENANT_DELETE_PERMISSION_GROUPS, DELETE_PERMISSION_GROUPS);
        hierarchyGraph.addEdge(TENANT_ASSIGN_PERMISSION_GROUPS, ASSIGN_PERMISSION_GROUPS);
        hierarchyGraph.addEdge(TENANT_UNASSIGN_PERMISSION_GROUPS, UNASSIGN_PERMISSION_GROUPS);

        lateralGraph.addEdge(MANAGE_PERMISSION_GROUPS, READ_PERMISSION_GROUPS);
        lateralGraph.addEdge(DELETE_PERMISSION_GROUPS, READ_PERMISSION_GROUPS);
        lateralGraph.addEdge(READ_PERMISSION_GROUPS, ASSIGN_PERMISSION_GROUPS);
    }

    private void createUserGroupPolicies() {
        hierarchyGraph.addEdge(TENANT_MANAGE_USER_GROUPS, MANAGE_USER_GROUPS);
        hierarchyGraph.addEdge(TENANT_READ_USER_GROUPS, READ_USER_GROUPS);
        hierarchyGraph.addEdge(TENANT_DELETE_USER_GROUPS, DELETE_USER_GROUPS);
        hierarchyGraph.addEdge(TENANT_ADD_USER_TO_ALL_USER_GROUPS, ADD_USERS_TO_USER_GROUPS);
        hierarchyGraph.addEdge(TENANT_REMOVE_USER_FROM_ALL_USER_GROUPS, REMOVE_USERS_FROM_USER_GROUPS);

        lateralGraph.addEdge(DELETE_USER_GROUPS, READ_USER_GROUPS);
        lateralGraph.addEdge(MANAGE_USER_GROUPS, ADD_USERS_TO_USER_GROUPS);
        lateralGraph.addEdge(MANAGE_USER_GROUPS, REMOVE_USERS_FROM_USER_GROUPS);
        lateralGraph.addEdge(MANAGE_USER_GROUPS, READ_USER_GROUPS);
        lateralGraph.addEdge(ADD_USERS_TO_USER_GROUPS, READ_USER_GROUPS);
        lateralGraph.addEdge(REMOVE_USERS_FROM_USER_GROUPS, READ_USER_GROUPS);
        lateralGraph.addEdge(REMOVE_USERS_FROM_USER_GROUPS, ADD_USERS_TO_USER_GROUPS);
    }

    @Override
    protected void createWorkspacePolicyGraph() {
        super.createWorkspacePolicyGraph();

        lateralGraph.addEdge(WORKSPACE_MAKE_PUBLIC_APPLICATIONS, WORKSPACE_READ_APPLICATIONS);

        // Add workspace package relationships
        lateralGraph.addEdge(MANAGE_WORKSPACES, WORKSPACE_MANAGE_PACKAGES);
        lateralGraph.addEdge(MANAGE_WORKSPACES, WORKSPACE_READ_PACKAGES);
        lateralGraph.addEdge(MANAGE_WORKSPACES, WORKSPACE_PUBLISH_PACKAGES);

        lateralGraph.addEdge(WORKSPACE_CREATE_PACKAGE, WORKSPACE_MANAGE_PACKAGES);
        lateralGraph.addEdge(WORKSPACE_CREATE_PACKAGE, WORKSPACE_DELETE_PACKAGES);

        lateralGraph.addEdge(WORKSPACE_MANAGE_PACKAGES, WORKSPACE_READ_PACKAGES);

        lateralGraph.addEdge(WORKSPACE_DELETE_PACKAGES, WORKSPACE_READ_PACKAGES);
        lateralGraph.addEdge(WORKSPACE_EXPORT_PACKAGES, WORKSPACE_READ_PACKAGES);

        lateralGraph.addEdge(DELETE_WORKSPACES, WORKSPACE_DELETE_PACKAGES);

        // Add workspace workflows relationships
        lateralGraph.addEdge(MANAGE_WORKSPACES, WORKSPACE_MANAGE_WORKFLOWS);
        lateralGraph.addEdge(MANAGE_WORKSPACES, WORKSPACE_READ_WORKFLOWS);
        lateralGraph.addEdge(MANAGE_WORKSPACES, WORKSPACE_PUBLISH_WORKFLOWS);

        lateralGraph.addEdge(WORKSPACE_CREATE_WORKFLOW, WORKSPACE_MANAGE_WORKFLOWS);
        lateralGraph.addEdge(WORKSPACE_CREATE_WORKFLOW, WORKSPACE_DELETE_WORKFLOWS);

        lateralGraph.addEdge(WORKSPACE_MANAGE_WORKFLOWS, WORKSPACE_READ_WORKFLOWS);

        lateralGraph.addEdge(WORKSPACE_DELETE_WORKFLOWS, WORKSPACE_MANAGE_WORKFLOWS);
        lateralGraph.addEdge(WORKSPACE_DELETE_WORKFLOWS, WORKSPACE_READ_WORKFLOWS);

        lateralGraph.addEdge(WORKSPACE_PUBLISH_WORKFLOWS, WORKSPACE_MANAGE_WORKFLOWS);
        lateralGraph.addEdge(WORKSPACE_PUBLISH_WORKFLOWS, WORKSPACE_READ_WORKFLOWS);

        lateralGraph.addEdge(WORKSPACE_EXPORT_WORKFLOWS, WORKSPACE_MANAGE_WORKFLOWS);
        lateralGraph.addEdge(WORKSPACE_EXPORT_WORKFLOWS, WORKSPACE_READ_WORKFLOWS);

        lateralGraph.addEdge(DELETE_WORKSPACES, WORKSPACE_DELETE_WORKFLOWS);

        // Workspace environments related permissions
        lateralGraph.addEdge(MANAGE_WORKSPACES, WORKSPACE_MANAGE_ENVIRONMENTS);
        lateralGraph.addEdge(READ_WORKSPACES, WORKSPACE_READ_ENVIRONMENTS);

        lateralGraph.addEdge(WORKSPACE_CREATE_ENVIRONMENT, WORKSPACE_MANAGE_ENVIRONMENTS);
        lateralGraph.addEdge(WORKSPACE_CREATE_ENVIRONMENT, WORKSPACE_DELETE_ENVIRONMENTS);
        lateralGraph.addEdge(WORKSPACE_CREATE_ENVIRONMENT, WORKSPACE_EXECUTE_ENVIRONMENTS);
        lateralGraph.addEdge(WORKSPACE_CREATE_ENVIRONMENT, WORKSPACE_READ_ENVIRONMENTS);
        lateralGraph.addEdge(WORKSPACE_MANAGE_ENVIRONMENTS, WORKSPACE_READ_ENVIRONMENTS);
        lateralGraph.addEdge(WORKSPACE_DELETE_ENVIRONMENTS, WORKSPACE_READ_ENVIRONMENTS);
        lateralGraph.addEdge(WORKSPACE_READ_ENVIRONMENTS, WORKSPACE_EXECUTE_ENVIRONMENTS);
    }

    @Override
    protected void createApplicationPolicyGraph() {
        super.createApplicationPolicyGraph();
        // Remove the edge which gives make public application from manage workspace and replace it with explicit
        // permission
        hierarchyGraph.removeEdge(MANAGE_WORKSPACES, MAKE_PUBLIC_APPLICATIONS);
        hierarchyGraph.addEdge(WORKSPACE_MAKE_PUBLIC_APPLICATIONS, MAKE_PUBLIC_APPLICATIONS);
        hierarchyGraph.addEdge(WORKSPACE_INVITE_USERS, INVITE_USERS_APPLICATIONS);

        lateralGraph.addEdge(APPLICATION_CREATE_PAGES, MANAGE_APPLICATIONS);
        lateralGraph.addEdge(APPLICATION_CREATE_PAGES, READ_APPLICATIONS);
        lateralGraph.addEdge(APPLICATION_CREATE_PAGES, DELETE_APPLICATIONS);
        lateralGraph.addEdge(DELETE_APPLICATIONS, READ_APPLICATIONS);
        lateralGraph.addEdge(MAKE_PUBLIC_APPLICATIONS, READ_APPLICATIONS);
        lateralGraph.addEdge(EXPORT_APPLICATIONS, READ_APPLICATIONS);
    }

    @Override
    protected void createPagePolicyGraph() {
        super.createPagePolicyGraph();

        hierarchyGraph.addEdge(APPLICATION_CREATE_PAGES, PAGE_CREATE_MODULE_INSTANCES);

        lateralGraph.addEdge(PAGE_CREATE_PAGE_ACTIONS, MANAGE_PAGES);
        lateralGraph.addEdge(PAGE_CREATE_PAGE_ACTIONS, READ_PAGES);
        lateralGraph.addEdge(PAGE_CREATE_PAGE_ACTIONS, DELETE_PAGES);
        lateralGraph.addEdge(DELETE_PAGES, READ_PAGES);
    }

    @Override
    protected void createActionPolicyGraph() {
        super.createActionPolicyGraph();
        hierarchyGraph.addEdge(EXECUTE_MODULE_INSTANCES, EXECUTE_ACTIONS);
        // creator
        hierarchyGraph.addEdge(MANAGE_MODULES, MANAGE_ACTIONS);
        hierarchyGraph.addEdge(READ_MODULES, EXECUTE_ACTIONS);
        hierarchyGraph.addEdge(DELETE_MODULES, DELETE_ACTIONS);

        hierarchyGraph.addEdge(MANAGE_WORKFLOWS, MANAGE_ACTIONS);
        hierarchyGraph.addEdge(EXECUTE_WORKFLOWS, EXECUTE_ACTIONS);
        hierarchyGraph.addEdge(DELETE_WORKFLOWS, DELETE_ACTIONS);

        lateralGraph.addEdge(DELETE_ACTIONS, READ_ACTIONS);
    }

    @Override
    protected void createDatasourcePolicyGraph() {
        super.createDatasourcePolicyGraph();

        hierarchyGraph.addEdge(WORKSPACE_EXECUTE_DATASOURCES, EXECUTE_DATASOURCES);
        hierarchyGraph.addEdge(WORKSPACE_CREATE_DATASOURCE, CREATE_DATASOURCE_ACTIONS);
        hierarchyGraph.addEdge(WORKSPACE_MANAGE_DATASOURCES, MANAGE_DATASOURCES);
        hierarchyGraph.addEdge(WORKSPACE_READ_DATASOURCES, READ_DATASOURCES);
        hierarchyGraph.addEdge(WORKSPACE_DATASOURCE_CREATE_DATASOURCE_ACTIONS, CREATE_DATASOURCE_ACTIONS);
        lateralGraph.addEdge(DELETE_DATASOURCES, READ_DATASOURCES);
        lateralGraph.addEdge(CREATE_DATASOURCE_ACTIONS, EXECUTE_DATASOURCES);
        lateralGraph.addEdge(CREATE_DATASOURCE_ACTIONS, READ_DATASOURCES);

        lateralGraph.addEdge(WORKSPACE_READ_DATASOURCES, WORKSPACE_EXECUTE_DATASOURCES);
    }

    @Override
    protected void createUserPolicyGraph() {
        super.createUserPolicyGraph();

        hierarchyGraph.addEdge(TENANT_DELETE_ALL_USERS, DELETE_USERS);
        hierarchyGraph.addEdge(TENANT_READ_ALL_USERS, READ_USERS);

        lateralGraph.addEdge(DELETE_USERS, READ_USERS);
    }

    protected void createPackagePolicyGraph() {
        hierarchyGraph.addEdge(WORKSPACE_MANAGE_PACKAGES, MANAGE_PACKAGES);
        hierarchyGraph.addEdge(WORKSPACE_READ_PACKAGES, READ_PACKAGES);
        hierarchyGraph.addEdge(WORKSPACE_PUBLISH_PACKAGES, PUBLISH_PACKAGES);
        hierarchyGraph.addEdge(WORKSPACE_EXPORT_PACKAGES, EXPORT_PACKAGES);
        hierarchyGraph.addEdge(WORKSPACE_CREATE_PACKAGE, PACKAGE_CREATE_MODULES);
        hierarchyGraph.addEdge(WORKSPACE_DELETE_PACKAGES, DELETE_PACKAGES);

        // If the user is being given MANAGE_PACKAGES permission, they must also be given READ_PACKAGES perm
        lateralGraph.addEdge(MANAGE_PACKAGES, READ_PACKAGES);
        lateralGraph.addEdge(DELETE_PACKAGES, READ_PACKAGES);
    }

    protected void createModulePolicyGraph() {
        hierarchyGraph.addEdge(MANAGE_PACKAGES, MANAGE_MODULES);
        hierarchyGraph.addEdge(READ_PACKAGES, READ_MODULES);
        hierarchyGraph.addEdge(DELETE_PACKAGES, DELETE_MODULES);
        hierarchyGraph.addEdge(PACKAGE_CREATE_MODULES, CREATE_MODULE_EXECUTABLES);
        hierarchyGraph.addEdge(PACKAGE_CREATE_MODULES, CREATE_MODULE_INSTANCES);

        lateralGraph.addEdge(MANAGE_MODULES, READ_MODULES);
        lateralGraph.addEdge(DELETE_MODULES, READ_MODULES);
    }

    protected void createModuleInstancePolicyGraph() {
        // creator
        hierarchyGraph.addEdge(MANAGE_MODULES, MANAGE_MODULE_INSTANCES);
        hierarchyGraph.addEdge(READ_MODULES, EXECUTE_MODULE_INSTANCES);
        hierarchyGraph.addEdge(DELETE_MODULES, DELETE_MODULE_INSTANCES);
        // consumer
        hierarchyGraph.addEdge(MANAGE_PAGES, MANAGE_MODULE_INSTANCES);
        hierarchyGraph.addEdge(READ_PAGES, EXECUTE_MODULE_INSTANCES);
        hierarchyGraph.addEdge(DELETE_PAGES, DELETE_MODULE_INSTANCES);

        lateralGraph.addEdge(MANAGE_MODULE_INSTANCES, READ_MODULE_INSTANCES);
        lateralGraph.addEdge(MANAGE_MODULE_INSTANCES, EXECUTE_MODULE_INSTANCES);
        lateralGraph.addEdge(READ_MODULE_INSTANCES, EXECUTE_MODULE_INSTANCES);
    }

    public Set<AclPermission> getLateralPermissions(
            AclPermission permission, Set<AclPermission> interestingPermissions) {
        Set<DefaultEdge> lateralEdges = lateralGraph.outgoingEdgesOf(permission);
        return lateralEdges.stream()
                .map(lateralGraph::getEdgeTarget)
                .filter(interestingPermissions::contains)
                .collect(Collectors.toSet());
    }

    public Set<AclPermission> getHierarchicalPermissions(
            AclPermission permission, Set<AclPermission> interestingPermissions) {
        Set<DefaultEdge> hierarchicalEdges = hierarchyGraph.outgoingEdgesOf(permission);
        return hierarchicalEdges.stream()
                .map(hierarchyGraph::getEdgeTarget)
                .filter(interestingPermissions::contains)
                .collect(Collectors.toSet());
    }
}

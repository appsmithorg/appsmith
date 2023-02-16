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
import static com.appsmith.server.acl.AclPermission.CREATE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.CREATE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.DELETE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.DELETE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.DELETE_PAGES;
import static com.appsmith.server.acl.AclPermission.DELETE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MAKE_PUBLIC_APPLICATIONS;
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
import static com.appsmith.server.acl.AclPermission.TENANT_UNASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.UNASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_DATASOURCE;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MAKE_PUBLIC_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_DATASOURCES;



@Component
public class PolicyGenerator extends PolicyGeneratorCE {

    @Override
    protected void createPolicyGraphForEachType() {
        super.createPolicyGraphForEachType();
        createEnvironmentPolicyGraph();
        createTenantPolicyGraph();
        createAuditLogPolicyGraph();
        createUserGroupPolicies();
    }

    protected void createEnvironmentPolicyGraph() {
        hierarchyGraph.addEdge(AclPermission.READ_WORKSPACES, AclPermission.READ_ENVIRONMENTS);
        hierarchyGraph.addEdge(AclPermission.WORKSPACE_EXECUTE_DATASOURCES, AclPermission.EXECUTE_ENVIRONMENTS);

        lateralGraph.addEdge(AclPermission.MANAGE_ENVIRONMENTS, AclPermission.READ_ENVIRONMENTS);
        lateralGraph.addEdge(AclPermission.MANAGE_ENVIRONMENTS, AclPermission.EXECUTE_ENVIRONMENTS);
        lateralGraph.addEdge(AclPermission.READ_ENVIRONMENTS, AclPermission.EXECUTE_ENVIRONMENTS);
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
        lateralGraph.addEdge(ASSIGN_PERMISSION_GROUPS, UNASSIGN_PERMISSION_GROUPS);
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
    }

    @Override
    protected void createApplicationPolicyGraph() {
        super.createApplicationPolicyGraph();
        // Remove the edge which gives make public application from manage workspace and replace it with explicit permission
        hierarchyGraph.removeEdge(MANAGE_WORKSPACES, MAKE_PUBLIC_APPLICATIONS);
        hierarchyGraph.addEdge(WORKSPACE_MAKE_PUBLIC_APPLICATIONS, MAKE_PUBLIC_APPLICATIONS);

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

        lateralGraph.addEdge(PAGE_CREATE_PAGE_ACTIONS, MANAGE_PAGES);
        lateralGraph.addEdge(PAGE_CREATE_PAGE_ACTIONS, READ_PAGES);
        lateralGraph.addEdge(PAGE_CREATE_PAGE_ACTIONS, DELETE_PAGES);
        lateralGraph.addEdge(DELETE_PAGES, READ_PAGES);
    }

    @Override
    protected void createActionPolicyGraph() {
        super.createActionPolicyGraph();

        lateralGraph.addEdge(DELETE_ACTIONS, READ_ACTIONS);
    }

    @Override
    protected void createDatasourcePolicyGraph() {
        super.createDatasourcePolicyGraph();

        hierarchyGraph.addEdge(WORKSPACE_EXECUTE_DATASOURCES, EXECUTE_DATASOURCES);
        hierarchyGraph.addEdge(WORKSPACE_CREATE_DATASOURCE, CREATE_DATASOURCE_ACTIONS);
        hierarchyGraph.addEdge(WORKSPACE_MANAGE_DATASOURCES, MANAGE_DATASOURCES);
        hierarchyGraph.addEdge(WORKSPACE_READ_DATASOURCES, READ_DATASOURCES);
        lateralGraph.addEdge(DELETE_DATASOURCES, READ_DATASOURCES);
        lateralGraph.addEdge(CREATE_DATASOURCE_ACTIONS, MANAGE_DATASOURCES);
        lateralGraph.addEdge(CREATE_DATASOURCE_ACTIONS, DELETE_DATASOURCES);
        lateralGraph.addEdge(CREATE_DATASOURCE_ACTIONS, READ_DATASOURCES);

        lateralGraph.addEdge(WORKSPACE_READ_DATASOURCES, WORKSPACE_EXECUTE_DATASOURCES);

    }

    public Set<AclPermission> getLateralPermissions(AclPermission permission, Set<AclPermission> interestingPermissions) {
        Set<DefaultEdge> lateralEdges = lateralGraph.outgoingEdgesOf(permission);
        return lateralEdges.stream()
                .map(lateralGraph::getEdgeTarget)
                .filter(interestingPermissions::contains)
                .collect(Collectors.toSet());

    }

    public Set<AclPermission> getHierarchicalPermissions(AclPermission permission, Set<AclPermission> interestingPermissions) {
        Set<DefaultEdge> hierarchicalEdges = hierarchyGraph.outgoingEdgesOf(permission);
        return hierarchicalEdges.stream()
                .map(hierarchyGraph::getEdgeTarget)
                .filter(interestingPermissions::contains)
                .collect(Collectors.toSet());
    }

}

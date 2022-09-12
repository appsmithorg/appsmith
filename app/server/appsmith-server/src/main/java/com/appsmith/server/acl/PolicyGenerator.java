package com.appsmith.server.acl;

import com.appsmith.server.acl.ce.PolicyGeneratorCE;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

import static com.appsmith.server.acl.AclPermission.ADD_USERS_TO_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.CREATE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.CREATE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_ADD_USER_TO_ALL_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_DELETE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_DELETE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_MANAGE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_MANAGE_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_READ_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_READ_USER_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_UNASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.UNASSIGN_PERMISSION_GROUPS;


@Component
public class PolicyGenerator extends PolicyGeneratorCE {

    @Override
    @PostConstruct
    public void createPolicyGraph() {
        super.createPolicyGraph();
        createTenantPolicyGraph();
        createUserGroupPolicies();
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

        // Given edit, we must give view
        lateralGraph.addEdge(TENANT_MANAGE_PERMISSION_GROUPS, TENANT_READ_PERMISSION_GROUPS);
        lateralGraph.addEdge(TENANT_MANAGE_USER_GROUPS, TENANT_READ_USER_GROUPS);
    }

    @Override
    protected void createPermissionGroupPolicyGraph() {
        super.createPermissionGroupPolicyGraph();
        hierarchyGraph.addEdge(TENANT_MANAGE_PERMISSION_GROUPS, MANAGE_PERMISSION_GROUPS);
        hierarchyGraph.addEdge(TENANT_READ_PERMISSION_GROUPS, READ_PERMISSION_GROUPS);
        hierarchyGraph.addEdge(TENANT_DELETE_PERMISSION_GROUPS, DELETE_PERMISSION_GROUPS);
        hierarchyGraph.addEdge(TENANT_ASSIGN_PERMISSION_GROUPS, ASSIGN_PERMISSION_GROUPS);
        hierarchyGraph.addEdge(TENANT_UNASSIGN_PERMISSION_GROUPS, UNASSIGN_PERMISSION_GROUPS);
    }

    private void createUserGroupPolicies() {
        hierarchyGraph.addEdge(TENANT_MANAGE_USER_GROUPS, MANAGE_USER_GROUPS);
        hierarchyGraph.addEdge(TENANT_READ_USER_GROUPS, READ_USER_GROUPS);
        hierarchyGraph.addEdge(TENANT_DELETE_USER_GROUPS, DELETE_USER_GROUPS);
        hierarchyGraph.addEdge(TENANT_ADD_USER_TO_ALL_USER_GROUPS, ADD_USERS_TO_USER_GROUPS);

        lateralGraph.addEdge(MANAGE_USER_GROUPS, ADD_USERS_TO_USER_GROUPS);
        lateralGraph.addEdge(MANAGE_USER_GROUPS, READ_USER_GROUPS);
        lateralGraph.addEdge(ADD_USERS_TO_USER_GROUPS, READ_USER_GROUPS);
    }
}

package com.appsmith.server.acl;

import com.appsmith.server.acl.ce.PolicyGeneratorCE;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

import static com.appsmith.server.acl.AclPermission.ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.CREATE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.DELETE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.READ_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_ASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_DELETE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_MANAGE_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_READ_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.TENANT_UNASSIGN_PERMISSION_GROUPS;
import static com.appsmith.server.acl.AclPermission.UNASSIGN_PERMISSION_GROUPS;


@Component
public class PolicyGenerator extends PolicyGeneratorCE {

    @Override
    @PostConstruct
    public void createPolicyGraph() {
        super.createPolicyGraph();
        createTenantPolicyGraph();
    }

    private void createTenantPolicyGraph() {
        // If given create, we must give all the other permissions for all permission groups
        lateralGraph.addEdge(CREATE_PERMISSION_GROUPS, TENANT_MANAGE_PERMISSION_GROUPS);
        lateralGraph.addEdge(CREATE_PERMISSION_GROUPS, TENANT_READ_PERMISSION_GROUPS);
        lateralGraph.addEdge(CREATE_PERMISSION_GROUPS, TENANT_DELETE_PERMISSION_GROUPS);
        lateralGraph.addEdge(CREATE_PERMISSION_GROUPS, TENANT_ASSIGN_PERMISSION_GROUPS);
        lateralGraph.addEdge(CREATE_PERMISSION_GROUPS, TENANT_UNASSIGN_PERMISSION_GROUPS);
        // Given edit, we must give view
        lateralGraph.addEdge(TENANT_MANAGE_PERMISSION_GROUPS, TENANT_READ_PERMISSION_GROUPS);

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

}

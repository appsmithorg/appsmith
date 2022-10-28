package com.appsmith.server.acl;

import com.appsmith.server.acl.ce.PolicyGeneratorCE;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

import static com.appsmith.server.acl.AclPermission.MANAGE_WORKSPACES;


@Component
public class PolicyGenerator extends PolicyGeneratorCE {

    @Override
    @PostConstruct
    public void createPolicyGraph() {
        super.createPolicyGraph();
        createEnvironmentPolicyGraph();
    }

    protected void createEnvironmentPolicyGraph() {
        hierarchyGraph.addEdge(MANAGE_WORKSPACES, AclPermission.MANAGE_ENVIRONMENTS);
        hierarchyGraph.addEdge(AclPermission.MANAGE_ENVIRONMENTS, AclPermission.MANAGE_ENVIRONMENT_VARIABLES);
        hierarchyGraph.addEdge(AclPermission.CREATE_ENVIRONMENTS, AclPermission.CREATE_ENVIRONMENT_VARIABLES);
        hierarchyGraph.addEdge(AclPermission.READ_ENVIRONMENTS, AclPermission.READ_ENVIRONMENT_VARIABLES);
        hierarchyGraph.addEdge(AclPermission.DELETE_ENVIRONMENTS, AclPermission.DELETE_ENVIRONMENT_VARIABLES);

        lateralGraph.addEdge(AclPermission.MANAGE_ENVIRONMENTS, AclPermission.READ_ENVIRONMENTS);
        lateralGraph.addEdge(AclPermission.MANAGE_ENVIRONMENTS, AclPermission.CREATE_ENVIRONMENTS);
        lateralGraph.addEdge(AclPermission.MANAGE_ENVIRONMENTS, AclPermission.EXECUTE_ENVIRONMENTS);
        lateralGraph.addEdge(AclPermission.READ_ENVIRONMENTS, AclPermission.EXECUTE_ENVIRONMENTS);

        lateralGraph.addEdge(AclPermission.MANAGE_ENVIRONMENT_VARIABLES, AclPermission.READ_ENVIRONMENT_VARIABLES);
        lateralGraph.addEdge(AclPermission.MANAGE_ENVIRONMENT_VARIABLES, AclPermission.CREATE_ENVIRONMENT_VARIABLES);
        lateralGraph.addEdge(AclPermission.CREATE_ENVIRONMENT_VARIABLES, AclPermission.READ_ENVIRONMENT_VARIABLES );
        lateralGraph.addEdge(AclPermission.MANAGE_ENVIRONMENT_VARIABLES, AclPermission.DELETE_ENVIRONMENT_VARIABLES);
    }

}

package com.appsmith.server.acl;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.User;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.jgrapht.Graph;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.graph.DirectedMultigraph;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_PUBLISH_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.PUBLISH_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.USER_MANAGE_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.USER_READ_ORGANIZATIONS;

@Getter
@Setter
@Slf4j
@Component
public class PolicyGenerator {

    /**
     * This graph defines the hierarchy of permissions from parent objects
     */
    Graph<AclPermission, DefaultEdge> hierarchyGraph = new DirectedMultigraph<>(DefaultEdge.class);

    /**
     * This graph defines the permissions that must be given to a user given that they have another permission
     * Eg: If the user is being given MANAGE_APPLICATION permission, they must also be given READ_APPLICATION permission
     */
    Graph<AclPermission, DefaultEdge> lateralGraph = new DirectedMultigraph<>(DefaultEdge.class);

    @PostConstruct
    public void createPolicyGraph() {

        EnumSet.allOf(AclPermission.class)
                .forEach(permission -> {
                    hierarchyGraph.addVertex(permission);
                    lateralGraph.addVertex(permission);
                });

        createUserPolicyGraph();
        createOrganizationPolicyGraph();
        createApplicationPolicyGraph();
        createPagePolicyGraph();
        createActionPolicyGraph();

        log.debug("Successfully created the createGraph & lateralGraph");
    }

    private void createUserPolicyGraph() {
        hierarchyGraph.addEdge(USER_MANAGE_ORGANIZATIONS, MANAGE_ORGANIZATIONS);
        hierarchyGraph.addEdge(USER_READ_ORGANIZATIONS, READ_ORGANIZATIONS);

        // If user is given manageOrg permission, they must also be able to read organizations
        lateralGraph.addEdge(USER_MANAGE_ORGANIZATIONS, USER_READ_ORGANIZATIONS);
        lateralGraph.addEdge(MANAGE_USERS, READ_USERS);
    }

    private void createOrganizationPolicyGraph() {
        lateralGraph.addEdge(MANAGE_ORGANIZATIONS, READ_ORGANIZATIONS);
        lateralGraph.addEdge(MANAGE_ORGANIZATIONS, ORGANIZATION_MANAGE_APPLICATIONS);
        lateralGraph.addEdge(MANAGE_ORGANIZATIONS, ORGANIZATION_READ_APPLICATIONS);
        lateralGraph.addEdge(MANAGE_ORGANIZATIONS, ORGANIZATION_PUBLISH_APPLICATIONS);
    }

    private void createApplicationPolicyGraph() {
        hierarchyGraph.addEdge(ORGANIZATION_MANAGE_APPLICATIONS, MANAGE_APPLICATIONS);
        hierarchyGraph.addEdge(ORGANIZATION_READ_APPLICATIONS, READ_APPLICATIONS);
        hierarchyGraph.addEdge(ORGANIZATION_PUBLISH_APPLICATIONS, PUBLISH_APPLICATIONS);

        // If the user is being given MANAGE_APPLICATION permission, they must also be given READ_APPLICATION perm
        lateralGraph.addEdge(MANAGE_APPLICATIONS, READ_APPLICATIONS);
    }

    private void createActionPolicyGraph() {
        hierarchyGraph.addEdge(MANAGE_PAGES, MANAGE_ACTIONS);
        hierarchyGraph.addEdge(READ_PAGES, READ_ACTIONS);

        lateralGraph.addEdge(MANAGE_PAGES, READ_PAGES);
    }

    private void createPagePolicyGraph() {
        hierarchyGraph.addEdge(MANAGE_APPLICATIONS, MANAGE_PAGES);
        hierarchyGraph.addEdge(READ_APPLICATIONS, READ_PAGES);

        lateralGraph.addEdge(MANAGE_PAGES, READ_PAGES);
    }

    public Set<Policy> getLateralPoliciesForUser(AclPermission permission, User user) {
        Set<DefaultEdge> lateralEdges = lateralGraph.outgoingEdgesOf(permission);
        return lateralEdges.stream()
                .map(lateralEdge -> {
                    AclPermission lateralPermission = lateralGraph.getEdgeTarget(lateralEdge);
                    return Policy.builder().permission(lateralPermission.getValue())
                            .users(Set.of(user.getUsername())).build();
                })
                .collect(Collectors.toSet());
    }

    /**
     * This function returns derives all the hierarchical and lateral policies for a given policy, aclPermission and user
     * Should be used in places where we are creating a document to ensure that the correct permissions are assigned
     * to the new document.
     *
     * @param policy
     * @param aclPermission
     * @param user
     * @return
     */
    public Set<Policy> getChildPolicies(Policy policy, AclPermission aclPermission, User user) {
        // Check the hierarchy graph to derive child permissions that must be given to this
        // document
        Set<Policy> childPolicySet = new HashSet<>();
        Set<DefaultEdge> edges = hierarchyGraph.outgoingEdgesOf(aclPermission);
        for (DefaultEdge edge: edges) {
            AclPermission childPermission = hierarchyGraph.getEdgeTarget(edge);
            childPolicySet.add(Policy.builder().permission(childPermission.getValue())
                    .users(policy.getUsers()).build());

            // Get the lateral permissions that must be applied given the child permission
            // This is applied at a user level and not from the parent object. Hence only the
            // current user gets these permissions
            childPolicySet.addAll(getLateralPoliciesForUser(childPermission, user));
        }

        return childPolicySet;
    }

}

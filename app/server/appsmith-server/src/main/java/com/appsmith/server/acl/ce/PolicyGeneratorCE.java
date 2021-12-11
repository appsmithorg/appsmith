package com.appsmith.server.acl.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.jgrapht.Graph;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.graph.DirectedMultigraph;

import javax.annotation.PostConstruct;
import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.COMMENT_ON_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.COMMENT_ON_THREAD;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MAKE_PUBLIC_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_PUBLISH_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.ORGANIZATION_READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.PUBLISH_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_COMMENT;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_THREAD;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.USER_MANAGE_ORGANIZATIONS;
import static com.appsmith.server.acl.AclPermission.USER_READ_ORGANIZATIONS;


@Getter
@Setter
@Slf4j
public class PolicyGeneratorCE {

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
        // Initialization of the hierarchical and lateral graphs by adding all the vertices
        for (AclPermission permission : AclPermission.values()) {
            hierarchyGraph.addVertex(permission);
            lateralGraph.addVertex(permission);
        }

        createUserPolicyGraph();
        createOrganizationPolicyGraph();
        createDatasourcePolicyGraph();
        createApplicationPolicyGraph();
        createPagePolicyGraph();
        createActionPolicyGraph();
        createCommentPolicyGraph();
    }

    /**
     * In this, we add permissions for a user to interact with organizations and other users inside the said organizations
     */
    private void createUserPolicyGraph() {
        hierarchyGraph.addEdge((AclPermission) USER_MANAGE_ORGANIZATIONS, (AclPermission) MANAGE_ORGANIZATIONS);
        hierarchyGraph.addEdge((AclPermission) USER_READ_ORGANIZATIONS, (AclPermission) READ_ORGANIZATIONS);

        // If user is given manageOrg permission, they must also be able to read organizations
        lateralGraph.addEdge((AclPermission) USER_MANAGE_ORGANIZATIONS, (AclPermission) USER_READ_ORGANIZATIONS);
        lateralGraph.addEdge((AclPermission) MANAGE_USERS, (AclPermission) READ_USERS);
    }

    private void createOrganizationPolicyGraph() {
        lateralGraph.addEdge((AclPermission) MANAGE_ORGANIZATIONS, (AclPermission) READ_ORGANIZATIONS);
        lateralGraph.addEdge((AclPermission) MANAGE_ORGANIZATIONS, (AclPermission) ORGANIZATION_MANAGE_APPLICATIONS);
        lateralGraph.addEdge((AclPermission) MANAGE_ORGANIZATIONS, (AclPermission) ORGANIZATION_READ_APPLICATIONS);
        lateralGraph.addEdge((AclPermission) MANAGE_ORGANIZATIONS, (AclPermission) ORGANIZATION_PUBLISH_APPLICATIONS);
    }

    private void createDatasourcePolicyGraph() {
        hierarchyGraph.addEdge((AclPermission) ORGANIZATION_MANAGE_APPLICATIONS, (AclPermission) MANAGE_DATASOURCES);
        hierarchyGraph.addEdge((AclPermission) ORGANIZATION_READ_APPLICATIONS, (AclPermission) READ_DATASOURCES);

        lateralGraph.addEdge((AclPermission) MANAGE_DATASOURCES, (AclPermission) READ_DATASOURCES);
        lateralGraph.addEdge((AclPermission) MANAGE_DATASOURCES, (AclPermission) EXECUTE_DATASOURCES);
        lateralGraph.addEdge((AclPermission) READ_DATASOURCES, (AclPermission) EXECUTE_DATASOURCES);
    }

    private void createApplicationPolicyGraph() {
        hierarchyGraph.addEdge((AclPermission) ORGANIZATION_MANAGE_APPLICATIONS, (AclPermission) MANAGE_APPLICATIONS);
        hierarchyGraph.addEdge((AclPermission) ORGANIZATION_READ_APPLICATIONS, (AclPermission) READ_APPLICATIONS);
        hierarchyGraph.addEdge((AclPermission) ORGANIZATION_PUBLISH_APPLICATIONS, (AclPermission) PUBLISH_APPLICATIONS);
        hierarchyGraph.addEdge((AclPermission) MANAGE_ORGANIZATIONS, (AclPermission) MAKE_PUBLIC_APPLICATIONS);
        hierarchyGraph.addEdge((AclPermission) ORGANIZATION_EXPORT_APPLICATIONS, (AclPermission) EXPORT_APPLICATIONS);

        // If the user is being given MANAGE_APPLICATION permission, they must also be given READ_APPLICATION perm
        lateralGraph.addEdge((AclPermission) MANAGE_APPLICATIONS, (AclPermission) READ_APPLICATIONS);

        // If the user can read an application, the should be able to comment on it.
        lateralGraph.addEdge((AclPermission) READ_APPLICATIONS, (AclPermission) COMMENT_ON_APPLICATIONS);
    }

    private void createActionPolicyGraph() {
        hierarchyGraph.addEdge((AclPermission) MANAGE_PAGES, (AclPermission) MANAGE_ACTIONS);
        hierarchyGraph.addEdge((AclPermission) READ_PAGES, (AclPermission) EXECUTE_ACTIONS);

        lateralGraph.addEdge((AclPermission) MANAGE_ACTIONS, (AclPermission) READ_ACTIONS);
        lateralGraph.addEdge((AclPermission) MANAGE_ACTIONS, (AclPermission) EXECUTE_ACTIONS);
        lateralGraph.addEdge((AclPermission) READ_ACTIONS, (AclPermission) EXECUTE_ACTIONS);
    }

    private void createPagePolicyGraph() {
        hierarchyGraph.addEdge((AclPermission) MANAGE_APPLICATIONS, (AclPermission) MANAGE_PAGES);
        hierarchyGraph.addEdge((AclPermission) READ_APPLICATIONS, (AclPermission) READ_PAGES);

        lateralGraph.addEdge((AclPermission) MANAGE_PAGES, (AclPermission) READ_PAGES);
    }

    private void createCommentPolicyGraph() {
        hierarchyGraph.addEdge((AclPermission) COMMENT_ON_APPLICATIONS, (AclPermission) COMMENT_ON_THREAD);

        lateralGraph.addEdge((AclPermission) COMMENT_ON_THREAD, (AclPermission) READ_THREAD);

        hierarchyGraph.addEdge((AclPermission) COMMENT_ON_THREAD, (AclPermission) READ_COMMENT);
    }

    public Set<Policy> getLateralPolicies(AclPermission permission, Set<String> userNames, Class<? extends BaseDomain> destinationEntity) {
        Set<DefaultEdge> lateralEdges = lateralGraph.outgoingEdgesOf(permission);
        return lateralEdges.stream()
                .map(edge -> lateralGraph.getEdgeTarget(edge))
                .filter(lateralPermission -> {
                    if (destinationEntity == null ||
                            lateralPermission.getEntity().equals(destinationEntity)) {
                        return true;
                    }
                    return false;
                })
                .map(lateralPermission -> Policy.builder().permission(lateralPermission.getValue())
                        .users(userNames).build())
                .collect(Collectors.toSet());
    }

    /**
     * This function returns derives all the hierarchical and lateral policies for a given policy, aclPermission and user
     * Should be used in places where we are creating a document to ensure that the correct permissions are assigned
     * to the new document.
     *
     * @param policy
     * @param aclPermission
     * @param destinationEntity
     * @return
     */
    public Set<Policy> getChildPolicies(Policy policy, AclPermission aclPermission, Class<? extends BaseDomain> destinationEntity) {
        // Check the hierarchy graph to derive child permissions that must be given to this
        // document
        Set<Policy> childPolicySet = new HashSet<>();
        Set<DefaultEdge> edges = hierarchyGraph.outgoingEdgesOf(aclPermission);
        for (DefaultEdge edge : edges) {
            AclPermission childPermission = hierarchyGraph.getEdgeTarget(edge);

            if (childPermission.getEntity().equals(destinationEntity)) {
                childPolicySet.add(Policy.builder().permission(childPermission.getValue())
                        .users(policy.getUsers()).build());
            }

            // Check the lateral graph to derive the child permissions that must be given to this document
            childPolicySet.addAll(getLateralPolicies(childPermission, policy.getUsers(), destinationEntity));
        }

        return childPolicySet;
    }

    public Set<Policy> getAllChildPolicies(Set<Policy> policySet, Class<? extends BaseDomain> sourceEntity, Class<? extends BaseDomain> destinationEntity) {
        Set<Policy> policies = policySet.stream()
                .map(policy -> {
                    AclPermission aclPermission = AclPermission
                            .getPermissionByValue(policy.getPermission(), sourceEntity);
                    // Get all the child policies for the given policy and aclPermission
                    return getChildPolicies(policy, aclPermission, destinationEntity);
                }).flatMap(Collection::stream)
                .collect(Collectors.toSet());

        Map<String, Policy> policyMap = new LinkedHashMap<>();

        for (Policy policy : policies) {
            if (policyMap.containsKey(policy.getPermission())) {
                Policy mergedPolicy = policyMap.get(policy.getPermission());

                HashSet<String> users = new HashSet<>(mergedPolicy.getUsers());
                users.addAll(policy.getUsers());
                mergedPolicy.setUsers(users);

                HashSet<String> groups = new HashSet<>(mergedPolicy.getGroups());
                groups.addAll(policy.getGroups());
                mergedPolicy.setGroups(groups);

                policyMap.put(policy.getPermission(), mergedPolicy);
            } else {
                policyMap.put(policy.getPermission(), policy);
            }
        }

        return new HashSet<>(policyMap.values());
    }
}

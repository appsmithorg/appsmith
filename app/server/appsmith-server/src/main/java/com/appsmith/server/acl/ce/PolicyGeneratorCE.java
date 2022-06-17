package com.appsmith.server.acl.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.google.common.collect.Sets;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.jgrapht.Graph;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.graph.DirectedMultigraph;

import javax.annotation.PostConstruct;
import java.util.Collection;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.COMMENT_ON_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.COMMENT_ON_THREADS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MAKE_PUBLIC_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.MANAGE_THEMES;
import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_PUBLISH_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.PUBLISH_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_COMMENTS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static com.appsmith.server.acl.AclPermission.READ_THREADS;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.USER_MANAGE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.USER_READ_WORKSPACES;


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
        EnumSet.allOf(AclPermission.class)
                .forEach(permission -> {
                    hierarchyGraph.addVertex(permission);
                    lateralGraph.addVertex(permission);
                });

        createUserPolicyGraph();
        createWorkspacePolicyGraph();
        createDatasourcePolicyGraph();
        createApplicationPolicyGraph();
        createPagePolicyGraph();
        createActionPolicyGraph();
        createCommentPolicyGraph();
        createThemePolicyGraph();
    }

    /**
     * In this, we add permissions for a user to interact with workspaces and other users inside the said workspaces
     */
    private void createUserPolicyGraph() {
        hierarchyGraph.addEdge(USER_MANAGE_WORKSPACES, MANAGE_WORKSPACES);
        hierarchyGraph.addEdge(USER_READ_WORKSPACES, READ_WORKSPACES);

        // If user is given manageOrg permission, they must also be able to read workspaces
        lateralGraph.addEdge(USER_MANAGE_WORKSPACES, USER_READ_WORKSPACES);
        lateralGraph.addEdge(MANAGE_USERS, READ_USERS);
    }

    private void createWorkspacePolicyGraph() {
        lateralGraph.addEdge(MANAGE_WORKSPACES, READ_WORKSPACES);
        lateralGraph.addEdge(MANAGE_WORKSPACES, WORKSPACE_MANAGE_APPLICATIONS);
        lateralGraph.addEdge(MANAGE_WORKSPACES, WORKSPACE_READ_APPLICATIONS);
        lateralGraph.addEdge(MANAGE_WORKSPACES, WORKSPACE_PUBLISH_APPLICATIONS);
    }

    private void createDatasourcePolicyGraph() {
        hierarchyGraph.addEdge(WORKSPACE_MANAGE_APPLICATIONS, MANAGE_DATASOURCES);
        hierarchyGraph.addEdge(WORKSPACE_READ_APPLICATIONS, READ_DATASOURCES);

        lateralGraph.addEdge(MANAGE_DATASOURCES, READ_DATASOURCES);
        lateralGraph.addEdge(MANAGE_DATASOURCES, EXECUTE_DATASOURCES);
        lateralGraph.addEdge(READ_DATASOURCES, EXECUTE_DATASOURCES);
    }

    private void createApplicationPolicyGraph() {
        hierarchyGraph.addEdge(WORKSPACE_MANAGE_APPLICATIONS, MANAGE_APPLICATIONS);
        hierarchyGraph.addEdge(WORKSPACE_READ_APPLICATIONS, READ_APPLICATIONS);
        hierarchyGraph.addEdge(WORKSPACE_PUBLISH_APPLICATIONS, PUBLISH_APPLICATIONS);
        hierarchyGraph.addEdge(MANAGE_WORKSPACES, MAKE_PUBLIC_APPLICATIONS);
        hierarchyGraph.addEdge(WORKSPACE_EXPORT_APPLICATIONS, EXPORT_APPLICATIONS);

        // If the user is being given MANAGE_APPLICATION permission, they must also be given READ_APPLICATION perm
        lateralGraph.addEdge(MANAGE_APPLICATIONS, READ_APPLICATIONS);

        // If the user can read an application, the should be able to comment on it.
        lateralGraph.addEdge(READ_APPLICATIONS, COMMENT_ON_APPLICATIONS);
    }

    private void createActionPolicyGraph() {
        hierarchyGraph.addEdge(MANAGE_PAGES, MANAGE_ACTIONS);
        hierarchyGraph.addEdge(READ_PAGES, EXECUTE_ACTIONS);

        lateralGraph.addEdge(MANAGE_ACTIONS, READ_ACTIONS);
        lateralGraph.addEdge(MANAGE_ACTIONS, EXECUTE_ACTIONS);
        lateralGraph.addEdge(READ_ACTIONS, EXECUTE_ACTIONS);
    }

    private void createPagePolicyGraph() {
        hierarchyGraph.addEdge(MANAGE_APPLICATIONS, MANAGE_PAGES);
        hierarchyGraph.addEdge(READ_APPLICATIONS, READ_PAGES);

        lateralGraph.addEdge(MANAGE_PAGES, READ_PAGES);
    }

    private void createCommentPolicyGraph() {
        hierarchyGraph.addEdge(COMMENT_ON_APPLICATIONS, COMMENT_ON_THREADS);

        lateralGraph.addEdge(COMMENT_ON_THREADS, READ_THREADS);

        hierarchyGraph.addEdge(COMMENT_ON_THREADS, READ_COMMENTS);
    }

    private void createThemePolicyGraph() {
        hierarchyGraph.addEdge(MANAGE_APPLICATIONS, MANAGE_THEMES);
        hierarchyGraph.addEdge(READ_APPLICATIONS, READ_THEMES);
        lateralGraph.addEdge(MANAGE_THEMES, READ_THEMES);
    }

    public Set<Policy> getLateralPolicies(AclPermission permission, Set<String> permissionGroups, Class<? extends BaseDomain> destinationEntity) {
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
                        .permissionGroups(permissionGroups).build())
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
                        .permissionGroups(policy.getPermissionGroups()).build());
            }

            // Check the lateral graph to derive the child permissions that must be given to this document
            childPolicySet.addAll(getLateralPolicies(childPermission, policy.getPermissionGroups(), destinationEntity));
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

                mergedPolicy.setPermissionGroups(Sets.union(mergedPolicy.getPermissionGroups(), policy.getPermissionGroups()));

                policyMap.put(policy.getPermission(), mergedPolicy);
            } else {
                policyMap.put(policy.getPermission(), policy);
            }
        }

        return new HashSet<>(policyMap.values());
    }
}

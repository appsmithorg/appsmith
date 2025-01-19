package com.appsmith.server.acl.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.google.common.collect.Sets;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.jgrapht.Graph;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.graph.DirectedAcyclicGraph;
import org.jgrapht.traverse.DepthFirstIterator;

import java.util.Collection;
import java.util.Collections;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.APPLICATION_CREATE_PAGES;
import static com.appsmith.server.acl.AclPermission.APPLICATION_DELETE_PAGES;
import static com.appsmith.server.acl.AclPermission.COMMENT_ON_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.CONNECT_TO_GIT;
import static com.appsmith.server.acl.AclPermission.DELETE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.DELETE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.DELETE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.DELETE_PAGES;
import static com.appsmith.server.acl.AclPermission.DELETE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.EXECUTE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.EXECUTE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MAKE_PUBLIC_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_AUTO_COMMIT;
import static com.appsmith.server.acl.AclPermission.MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.MANAGE_DEFAULT_BRANCHES;
import static com.appsmith.server.acl.AclPermission.MANAGE_INSTANCE_CONFIGURATION;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.acl.AclPermission.MANAGE_PROTECTED_BRANCHES;
import static com.appsmith.server.acl.AclPermission.MANAGE_THEMES;
import static com.appsmith.server.acl.AclPermission.MANAGE_USERS;
import static com.appsmith.server.acl.AclPermission.MANAGE_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.PAGE_CREATE_PAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.PUBLISH_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_ACTIONS;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.READ_INSTANCE_CONFIGURATION;
import static com.appsmith.server.acl.AclPermission.READ_PAGES;
import static com.appsmith.server.acl.AclPermission.READ_THEMES;
import static com.appsmith.server.acl.AclPermission.READ_USERS;
import static com.appsmith.server.acl.AclPermission.READ_WORKSPACES;
import static com.appsmith.server.acl.AclPermission.RESET_PASSWORD_USERS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_APPLICATION;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_CREATE_DATASOURCE;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_DELETE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_DELETE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_EXPORT_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_MANAGE_DATASOURCES;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_PUBLISH_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.WORKSPACE_READ_DATASOURCES;

@Getter
@Setter
@Slf4j
public class PolicyGeneratorCE {

    /**
     * This graph defines the hierarchy of permissions from parent objects
     */
    protected Graph<AclPermission, DefaultEdge> hierarchyGraph = new DirectedAcyclicGraph<>(DefaultEdge.class);

    /**
     * This graph defines the permissions that must be given to a user given that they have another permission
     * Eg: If the user is being given MANAGE_APPLICATION permission, they must also be given READ_APPLICATION permission
     */
    protected Graph<AclPermission, DefaultEdge> lateralGraph = new DirectedAcyclicGraph<>(DefaultEdge.class);

    @PostConstruct
    public void createPolicyGraph() {

        // Initialization of the hierarchical and lateral graphs by adding all the vertices
        addVertices();

        createPolicyGraphForEachType();

        addLateralEdgesForAllIndirectRelationships();
    }

    protected void addVertices() {
        // Initialization of the hierarchical and lateral graphs by adding all the vertices
        EnumSet.allOf(AclPermission.class).forEach(permission -> {
            hierarchyGraph.addVertex(permission);
            lateralGraph.addVertex(permission);
        });
    }

    protected void createPolicyGraphForEachType() {
        createInstancePolicyGraph();
        createUserPolicyGraph();
        createWorkspacePolicyGraph();
        createDatasourcePolicyGraph();
        createApplicationPolicyGraph();
        createPagePolicyGraph();
        createActionPolicyGraph();
        createThemePolicyGraph();
        createPermissionGroupPolicyGraph();
    }

    protected void addLateralEdgesForAllIndirectRelationships() {
        Set<AclPermission> vertices = lateralGraph.vertexSet();

        for (AclPermission vertex : vertices) {
            Set<AclPermission> allDescendants = getAllDescendants(vertex, lateralGraph);
            for (AclPermission descendant : allDescendants) {
                lateralGraph.addEdge(vertex, descendant);
            }
        }
    }

    private Set<AclPermission> getAllDescendants(AclPermission vertex, Graph<AclPermission, DefaultEdge> graph) {
        Iterator<AclPermission> iterator = new DepthFirstIterator<>(graph, vertex);
        Set<AclPermission> descendants = new HashSet<>();

        // Do not add start vertex to result.
        if (iterator.hasNext()) {
            iterator.next();
        }

        iterator.forEachRemaining(descendants::add);

        return descendants;
    }

    protected void createInstancePolicyGraph() {
        lateralGraph.addEdge(MANAGE_INSTANCE_CONFIGURATION, READ_INSTANCE_CONFIGURATION);
    }

    /**
     * In this, we add permissions for a user to interact with workspaces and other users inside the said workspaces
     */
    protected void createUserPolicyGraph() {
        lateralGraph.addEdge(MANAGE_USERS, READ_USERS);
        lateralGraph.addEdge(MANAGE_USERS, RESET_PASSWORD_USERS);
    }

    protected void createWorkspacePolicyGraph() {

        // Add the must-have side effects of edit on workspace
        lateralGraph.addEdge(MANAGE_WORKSPACES, READ_WORKSPACES);
        lateralGraph.addEdge(MANAGE_WORKSPACES, DELETE_WORKSPACES);
        lateralGraph.addEdge(MANAGE_WORKSPACES, WORKSPACE_MANAGE_DATASOURCES);
        lateralGraph.addEdge(MANAGE_WORKSPACES, WORKSPACE_READ_DATASOURCES);
        lateralGraph.addEdge(MANAGE_WORKSPACES, WORKSPACE_MANAGE_APPLICATIONS);
        lateralGraph.addEdge(MANAGE_WORKSPACES, WORKSPACE_READ_APPLICATIONS);
        lateralGraph.addEdge(MANAGE_WORKSPACES, WORKSPACE_PUBLISH_APPLICATIONS);

        lateralGraph.addEdge(WORKSPACE_CREATE_APPLICATION, WORKSPACE_MANAGE_APPLICATIONS);
        lateralGraph.addEdge(WORKSPACE_CREATE_APPLICATION, WORKSPACE_DELETE_APPLICATIONS);
        lateralGraph.addEdge(WORKSPACE_CREATE_APPLICATION, MANAGE_PROTECTED_BRANCHES);

        // Add the must-have side effects of manage all applications
        lateralGraph.addEdge(WORKSPACE_MANAGE_APPLICATIONS, WORKSPACE_READ_APPLICATIONS);
        lateralGraph.addEdge(WORKSPACE_MANAGE_APPLICATIONS, WORKSPACE_PUBLISH_APPLICATIONS);

        lateralGraph.addEdge(WORKSPACE_DELETE_APPLICATIONS, WORKSPACE_READ_APPLICATIONS);
        lateralGraph.addEdge(WORKSPACE_EXPORT_APPLICATIONS, WORKSPACE_READ_APPLICATIONS);
        // Add the must-have side effects of delete workspaces
        lateralGraph.addEdge(DELETE_WORKSPACES, WORKSPACE_DELETE_APPLICATIONS);
        lateralGraph.addEdge(DELETE_WORKSPACES, WORKSPACE_DELETE_DATASOURCES);
        // Add the must-have side effects of datasource permissions
        lateralGraph.addEdge(WORKSPACE_CREATE_DATASOURCE, WORKSPACE_MANAGE_DATASOURCES);
        lateralGraph.addEdge(WORKSPACE_CREATE_DATASOURCE, WORKSPACE_DELETE_DATASOURCES);
        lateralGraph.addEdge(WORKSPACE_MANAGE_DATASOURCES, WORKSPACE_READ_DATASOURCES);
        lateralGraph.addEdge(WORKSPACE_DELETE_DATASOURCES, WORKSPACE_READ_DATASOURCES);
    }

    protected void createDatasourcePolicyGraph() {
        hierarchyGraph.addEdge(WORKSPACE_MANAGE_APPLICATIONS, MANAGE_DATASOURCES);

        // If a viewer of all apps in the workspace, give execute permission on all the datasources
        hierarchyGraph.addEdge(WORKSPACE_READ_APPLICATIONS, EXECUTE_DATASOURCES);
        hierarchyGraph.addEdge(WORKSPACE_DELETE_DATASOURCES, DELETE_DATASOURCES);

        lateralGraph.addEdge(MANAGE_DATASOURCES, READ_DATASOURCES);
        lateralGraph.addEdge(MANAGE_DATASOURCES, EXECUTE_DATASOURCES);
        lateralGraph.addEdge(READ_DATASOURCES, EXECUTE_DATASOURCES);
    }

    protected void createApplicationPolicyGraph() {
        hierarchyGraph.addEdge(WORKSPACE_MANAGE_APPLICATIONS, MANAGE_APPLICATIONS);
        hierarchyGraph.addEdge(WORKSPACE_READ_APPLICATIONS, READ_APPLICATIONS);
        hierarchyGraph.addEdge(WORKSPACE_PUBLISH_APPLICATIONS, PUBLISH_APPLICATIONS);
        hierarchyGraph.addEdge(MANAGE_WORKSPACES, MAKE_PUBLIC_APPLICATIONS);
        hierarchyGraph.addEdge(WORKSPACE_EXPORT_APPLICATIONS, EXPORT_APPLICATIONS);
        hierarchyGraph.addEdge(WORKSPACE_CREATE_APPLICATION, APPLICATION_CREATE_PAGES);
        hierarchyGraph.addEdge(WORKSPACE_CREATE_APPLICATION, MANAGE_PROTECTED_BRANCHES);
        hierarchyGraph.addEdge(WORKSPACE_DELETE_APPLICATIONS, DELETE_APPLICATIONS);

        hierarchyGraph.addEdge(WORKSPACE_CREATE_APPLICATION, CONNECT_TO_GIT);
        hierarchyGraph.addEdge(WORKSPACE_CREATE_APPLICATION, MANAGE_DEFAULT_BRANCHES);
        hierarchyGraph.addEdge(WORKSPACE_CREATE_APPLICATION, MANAGE_AUTO_COMMIT);

        // If the user is being given MANAGE_APPLICATION permission, they must also be given READ_APPLICATION perm
        lateralGraph.addEdge(MANAGE_APPLICATIONS, READ_APPLICATIONS);
        // If the user has permission to delete application, they must have permission to delete application-pages,
        lateralGraph.addEdge(DELETE_APPLICATIONS, APPLICATION_DELETE_PAGES);
        // If the user can read an application, the should be able to comment on it.
        lateralGraph.addEdge(READ_APPLICATIONS, COMMENT_ON_APPLICATIONS);
    }

    protected void createActionPolicyGraph() {
        hierarchyGraph.addEdge(MANAGE_PAGES, MANAGE_ACTIONS);
        hierarchyGraph.addEdge(READ_PAGES, EXECUTE_ACTIONS);
        hierarchyGraph.addEdge(DELETE_PAGES, DELETE_ACTIONS);

        lateralGraph.addEdge(MANAGE_ACTIONS, READ_ACTIONS);
        lateralGraph.addEdge(MANAGE_ACTIONS, EXECUTE_ACTIONS);
        lateralGraph.addEdge(READ_ACTIONS, EXECUTE_ACTIONS);
    }

    protected void createPagePolicyGraph() {
        hierarchyGraph.addEdge(MANAGE_APPLICATIONS, MANAGE_PAGES);
        hierarchyGraph.addEdge(READ_APPLICATIONS, READ_PAGES);
        hierarchyGraph.addEdge(DELETE_APPLICATIONS, DELETE_PAGES);
        hierarchyGraph.addEdge(APPLICATION_DELETE_PAGES, DELETE_PAGES);
        hierarchyGraph.addEdge(APPLICATION_CREATE_PAGES, PAGE_CREATE_PAGE_ACTIONS);

        lateralGraph.addEdge(MANAGE_PAGES, READ_PAGES);
    }

    protected void createThemePolicyGraph() {
        hierarchyGraph.addEdge(MANAGE_APPLICATIONS, MANAGE_THEMES);
        hierarchyGraph.addEdge(READ_APPLICATIONS, READ_THEMES);
        lateralGraph.addEdge(MANAGE_THEMES, READ_THEMES);
    }

    protected void createPermissionGroupPolicyGraph() {
        lateralGraph.addEdge(AclPermission.MANAGE_PERMISSION_GROUPS, AclPermission.ASSIGN_PERMISSION_GROUPS);
        lateralGraph.addEdge(AclPermission.MANAGE_PERMISSION_GROUPS, AclPermission.UNASSIGN_PERMISSION_GROUPS);
        lateralGraph.addEdge(AclPermission.MANAGE_PERMISSION_GROUPS, AclPermission.READ_PERMISSION_GROUP_MEMBERS);
        lateralGraph.addEdge(AclPermission.ASSIGN_PERMISSION_GROUPS, AclPermission.READ_PERMISSION_GROUP_MEMBERS);
    }

    public Set<Policy> getLateralPolicies(
            AclPermission permission, Set<String> permissionGroups, Class<? extends BaseDomain> destinationEntity) {
        Set<DefaultEdge> lateralEdges = lateralGraph.outgoingEdgesOf(permission);
        return lateralEdges.stream()
                .map(edge -> lateralGraph.getEdgeTarget(edge))
                .filter(lateralPermission -> {
                    if (destinationEntity == null
                            || lateralPermission.getEntity().equals(destinationEntity)) {
                        return true;
                    }
                    return false;
                })
                .map(lateralPermission -> Policy.builder()
                        .permission(lateralPermission.getValue())
                        .permissionGroups(permissionGroups)
                        .build())
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
    public Set<Policy> getChildPolicies(
            Policy policy, AclPermission aclPermission, Class<? extends BaseDomain> destinationEntity) {

        // In case the calling function could not translate the string value to AclPermission, return an empty set to
        // handle
        // erroneous cases
        if (aclPermission == null) {
            return Collections.emptySet();
        }

        if (policy.getPermissionGroups() == null) {
            policy.setPermissionGroups(new HashSet<>());
        }
        // Check the hierarchy graph to derive child permissions that must be given to this
        // document
        Set<Policy> childPolicySet = new HashSet<>();
        Set<DefaultEdge> edges = hierarchyGraph.outgoingEdgesOf(aclPermission);
        for (DefaultEdge edge : edges) {
            AclPermission childPermission = hierarchyGraph.getEdgeTarget(edge);

            if (childPermission.getEntity().equals(destinationEntity)) {
                childPolicySet.add(Policy.builder()
                        .permission(childPermission.getValue())
                        .permissionGroups(policy.getPermissionGroups())
                        .build());
            }

            // Check the lateral graph to derive the child permissions that must be given to this document
            childPolicySet.addAll(getLateralPolicies(childPermission, policy.getPermissionGroups(), destinationEntity));
        }

        return childPolicySet;
    }

    public Set<Policy> getAllChildPolicies(
            Set<Policy> policySet,
            Class<? extends BaseDomain> sourceEntity,
            Class<? extends BaseDomain> destinationEntity) {
        if (policySet == null) {
            return new HashSet<>();
        }
        Set<Policy> policies = policySet.stream()
                .map(policy -> {
                    AclPermission aclPermission =
                            AclPermission.getPermissionByValue(policy.getPermission(), sourceEntity);
                    // Get all the child policies for the given policy and aclPermission
                    return getChildPolicies(policy, aclPermission, destinationEntity);
                })
                .flatMap(Collection::stream)
                .collect(Collectors.toSet());

        Map<String, Policy> policyMap = new LinkedHashMap<>();

        for (Policy policy : policies) {
            if (policyMap.containsKey(policy.getPermission())) {
                Policy mergedPolicy = policyMap.get(policy.getPermission());

                mergedPolicy.setPermissionGroups(
                        Sets.union(mergedPolicy.getPermissionGroups(), policy.getPermissionGroups()));

                policyMap.put(policy.getPermission(), mergedPolicy);
            } else {
                policyMap.put(policy.getPermission(), policy);
            }
        }

        return new HashSet<>(policyMap.values());
    }

    public Set<AclPermission> getChildPermissions(
            AclPermission aclPermission, Class<? extends BaseDomain> destinationEntity) {
        Set<AclPermission> childPermissionSet = new HashSet<>();
        Set<AclPermission> lateralPermissions = lateralGraph.outgoingEdgesOf(aclPermission).stream()
                .map(defaultEdge -> lateralGraph.getEdgeTarget(defaultEdge))
                .filter(permission ->
                        destinationEntity == null || permission.getEntity().equals(destinationEntity))
                .collect(Collectors.toSet());
        childPermissionSet.addAll(lateralPermissions);
        Set<AclPermission> directChildPermissions = hierarchyGraph.outgoingEdgesOf(aclPermission).stream()
                .map(defaultEdge -> hierarchyGraph.getEdgeTarget(defaultEdge))
                .filter(permission ->
                        destinationEntity == null || permission.getEntity().equals(destinationEntity))
                .collect(Collectors.toSet());
        childPermissionSet.addAll(directChildPermissions);
        childPermissionSet.addAll(getAllChildPermissions(directChildPermissions, destinationEntity));
        return childPermissionSet;
    }

    public Set<AclPermission> getAllChildPermissions(
            Collection<AclPermission> aclPermissions, Class<? extends BaseDomain> destinationEntity) {
        return aclPermissions.stream()
                .map(permission -> getChildPermissions(permission, destinationEntity))
                .flatMap(Set::stream)
                .collect(Collectors.toSet());
    }
}

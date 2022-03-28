package com.appsmith.server.acl.ce;

import com.appsmith.server.acl.AppsmithRole;
import lombok.extern.slf4j.Slf4j;
import org.jgrapht.Graph;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.graph.DirectedMultigraph;
import org.jgrapht.traverse.BreadthFirstIterator;

import javax.annotation.PostConstruct;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.Set;

import static com.appsmith.server.acl.AppsmithRole.APPLICATION_ADMIN;
import static com.appsmith.server.acl.AppsmithRole.APPLICATION_VIEWER;
import static com.appsmith.server.acl.AppsmithRole.ORGANIZATION_ADMIN;
import static com.appsmith.server.acl.AppsmithRole.ORGANIZATION_DEVELOPER;
import static com.appsmith.server.acl.AppsmithRole.ORGANIZATION_VIEWER;

@Slf4j
public class RoleGraphCE {
    /**
     * This graph defines the hierarchy of permissions from parent objects
     */
    Graph<AppsmithRole, DefaultEdge> hierarchyGraph = new DirectedMultigraph<>(DefaultEdge.class);

    @PostConstruct
    public void createPolicyGraph() {

        // Initialization of the hierarchical and lateral graphs by adding all the vertices
        EnumSet.allOf(AppsmithRole.class)
                .forEach(role -> {
                    hierarchyGraph.addVertex(role);
                });

        hierarchyGraph.addEdge(ORGANIZATION_ADMIN, ORGANIZATION_DEVELOPER);
        hierarchyGraph.addEdge(ORGANIZATION_DEVELOPER, ORGANIZATION_VIEWER);
        hierarchyGraph.addEdge(APPLICATION_ADMIN, APPLICATION_VIEWER);
    }

    public Set<AppsmithRole> generateHierarchicalRoles(String roleName) {
        AppsmithRole role = AppsmithRole.generateAppsmithRoleFromName(roleName);

        Set<AppsmithRole> childrenRoles = new LinkedHashSet<>();
        childrenRoles.add(role);
        BreadthFirstIterator<AppsmithRole, DefaultEdge> breadthFirstIterator = new BreadthFirstIterator<>(hierarchyGraph, role);
        while(breadthFirstIterator.hasNext()) {
            childrenRoles.add(breadthFirstIterator.next());
        }

        return childrenRoles;
    }
}

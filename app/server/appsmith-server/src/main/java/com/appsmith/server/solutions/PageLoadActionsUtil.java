package com.appsmith.server.solutions;

import com.appsmith.server.domains.ActionDependencyEdge;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.services.NewActionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.graph.DirectedAcyclicGraph;
import org.jgrapht.traverse.BreadthFirstIterator;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.helpers.MustacheHelper.extractWordsAndAddToSet;

@Slf4j
@Component
@RequiredArgsConstructor
public class PageLoadActionsUtil {

    private final NewActionService newActionService;

    public Mono<List<HashSet<DslActionDTO>>> findAllOnLoadActions(Set<String> bindings,
                                                                  Set<String> actionNames,
                                                                  String pageId,
                                                                  Set<ActionDependencyEdge> edges,
                                                                  Set<String> actionsUsedInDSL,
                                                                  List<ActionDTO> flatPageLoadActions) {
        Set<String> dynamicBindingNames = new HashSet<>();

        return newActionService.findUnpublishedActionsInPageByNames(bindings, pageId)
                // First find all the actions directly used in the DSL and get the graph started
                .flatMap(action -> {
                    ActionDTO unpublishedAction = action.getUnpublishedAction();

                    // If the user has explicity set an action to not run on page load, this action should be ignored
                    if (Boolean.TRUE.equals(unpublishedAction.getUserSetOnLoad()) && !Boolean.TRUE.equals(unpublishedAction.getExecuteOnLoad())) {
                        return Mono.empty();
                    }

                    String name = unpublishedAction.getName();
                    actionsUsedInDSL.add(name);
                    extractAndSetActionNameAndBindingsForGraph(actionNames, edges, dynamicBindingNames, unpublishedAction);
                    return Mono.just(unpublishedAction);
                })
                .collectMap(
                        action -> {
                            return action.getName();
                        },
                        action -> {
                            return action;
                        }
                )
                // Now add to the map, vertices, and edges the explicitly set user on load actions
                .flatMap(onLoadActionsMap -> findExplicitUserSetOnLoadActionsAndTheirDependents(pageId, actionNames, edges, dynamicBindingNames, onLoadActionsMap))
                // Now recursively walk the bindings to find other actions and their bindings till all the actions are identified and added
                // to the graph which would be on load actions.
                .flatMap(onLoadActionsMap -> recursivelyFindActionsAndTheirDependents(dynamicBindingNames, pageId, actionNames, edges, onLoadActionsMap))
                // Now that we have a global set of on load actions, create a DAG and find an offline schedule order in which the on load
                // actions should be triggered keeping in mind their dependencies on each other.
                .map(updatedMap -> {
                    DirectedAcyclicGraph<String, DefaultEdge> directedAcyclicGraph = constructDAG(actionNames, edges);
                    List<HashSet<String>> onPageLoadActionsSchedulingOrder = computeOnPageLoadActionsSchedulingOrder(directedAcyclicGraph);

                    List<HashSet<DslActionDTO>> onPageLoadActions = new ArrayList<>();

                    for (int i=0; i<onPageLoadActionsSchedulingOrder.size(); i++) {
                        HashSet<DslActionDTO> actionsInLevel = new HashSet<>();

                        HashSet<String> names = onPageLoadActionsSchedulingOrder.get(i);
                        for (String name : names) {
                            actionsInLevel.add(getDslAction(name, updatedMap));
                        }

                        onPageLoadActions.add(actionsInLevel);
                    }

                    // Also collect all the actions in the map in a flat list and update the list
                    flatPageLoadActions.addAll(updatedMap.values());

                    // Return the sequenced page load actions
                    return onPageLoadActions;

                });
    }

    private DslActionDTO getDslAction (String name, Map<String, ActionDTO> onLoadActionsMap) {
        ActionDTO action = onLoadActionsMap.get(name);
        DslActionDTO actionDTO = new DslActionDTO();
        actionDTO.setId(action.getId());
        actionDTO.setPluginType(action.getPluginType());
        actionDTO.setJsonPathKeys(action.getJsonPathKeys());
        actionDTO.setName(action.getName());
        if (action.getActionConfiguration() != null) {
            actionDTO.setTimeoutInMillisecond(action.getActionConfiguration().getTimeoutInMillisecond());
        }
        return actionDTO;
    }

    private void extractAndSetActionNameAndBindingsForGraph(Set<String> actionNames,
                                                            Set<ActionDependencyEdge> edges,
                                                            Set<String> dynamicBindings,
                                                            ActionDTO action) {
        String name = action.getName();
        actionNames.add(name);

        Set<String> dynamicBindingNamesInAction = new HashSet<>();
        Set<String> jsonPathKeys = action.getJsonPathKeys();
        if (!CollectionUtils.isEmpty(jsonPathKeys)) {
            for (String mustacheKey : jsonPathKeys) {
                extractWordsAndAddToSet(dynamicBindingNamesInAction, mustacheKey);
            }

            // If the action refers to itself in the json path keys, remove the same to circumvent
            // supposed circular dependency. This is possible in case of pagination with response url
            // where the action refers to its own data to find the next and previous URLs.
            dynamicBindingNamesInAction.remove(action.getName());

            // The relationship is represented as follows :
            // If A depends on B aka B exists in the dynamic bindings of A,
            // the corresponding edge would be B->A since B updates A and hence,
            // B should be executed before A.
            for (String source : dynamicBindingNamesInAction) {
                ActionDependencyEdge edge = new ActionDependencyEdge();
                edge.setSource(source);
                edge.setTarget(name);
                edges.add(edge);
            }

            // Update the global actions' dynamic bindings
            dynamicBindings.addAll(dynamicBindingNamesInAction);

        }
    }

    private Mono<Map<String, ActionDTO>> findExplicitUserSetOnLoadActionsAndTheirDependents(String pageId,
                                                                                            Set<String> actionNames,
                                                                                            Set<ActionDependencyEdge> edges,
                                                                                            Set<String> dynamicBindingNames,
                                                                                            Map<String, ActionDTO> onLoadActionsInMap) {

        //First fetch all the actions which have been tagged as on load by the user explicitly.
        return newActionService.findUnpublishedOnLoadActionsInPage(pageId)
                // Add the vertices and edges to the graph
                .map(newAction -> {
                    ActionDTO actionDTO = newAction.getUnpublishedAction();
                    extractAndSetActionNameAndBindingsForGraph(actionNames, edges, dynamicBindingNames, actionDTO);
                    return actionDTO;
                })
                .collectMap(
                        action -> {
                            return action.getName();
                        },
                        action -> {
                            return action;
                        }
                )
                .map(newActionsMap -> {
                    onLoadActionsInMap.putAll(newActionsMap);
                    return onLoadActionsInMap;
                });
    }

    private Mono<Map<String, ActionDTO>> recursivelyFindActionsAndTheirDependents(Set<String> dynamicBindingNames,
                                                                                  String pageId,
                                                                                  Set<String> actionNames,
                                                                                  Set<ActionDependencyEdge> edges,
                                                                                  Map<String, ActionDTO> onLoadActionsInMap) {
        if (dynamicBindingNames == null || dynamicBindingNames.isEmpty()) {
            return Mono.just(onLoadActionsInMap);
        }
        Set<String> bindingNames = new HashSet<>();
        // First fetch all the actions in the page whose name matches the words found in all the dynamic bindings
        Mono<Map<String, ActionDTO>> updatedActionsMapMono = newActionService.findUnpublishedActionsInPageByNames(dynamicBindingNames, pageId)
                .flatMap(newAction -> {
                    ActionDTO action = newAction.getUnpublishedAction();

                    // If the user has explicity set an action to not run on page load, this action should be ignored
                    if (Boolean.TRUE.equals(action.getUserSetOnLoad()) && !Boolean.TRUE.equals(action.getExecuteOnLoad())) {
                        return Mono.empty();
                    }

                    extractAndSetActionNameAndBindingsForGraph(actionNames, edges, bindingNames, action);
                    return Mono.just(action);
                })
                .collectMap(
                        action -> {
                            return action.getName();
                        },
                        action -> {
                            return action;
                        }
                )
                .map(newActionsMap -> {
                    onLoadActionsInMap.putAll(newActionsMap);
                    return onLoadActionsInMap;
                });

        return updatedActionsMapMono
                .then(Mono.just(bindingNames))
                .flatMap(bindings -> {
                    // Now that the next set of bindings have been found, find recursively all actions by these names
                    // and their bindings
                    return recursivelyFindActionsAndTheirDependents(bindings, pageId, actionNames, edges, onLoadActionsInMap);
                });
    }

    private DirectedAcyclicGraph<String, DefaultEdge> constructDAG(Set<String> actionNames, Set<ActionDependencyEdge> edges) {
        DirectedAcyclicGraph<String, DefaultEdge> actionSchedulingGraph =
                new DirectedAcyclicGraph<>(DefaultEdge.class);

        for (String name : actionNames) {
            actionSchedulingGraph.addVertex(name);
        }

        for (ActionDependencyEdge edge : edges) {
            // If the source of the edge is an action, only then add an edge
            // At this point we are guaranteed to find the action in the set because we have recursively found all
            // possible actions that should be on load
            if (actionNames.contains(edge.getSource())) {
                try {
                    actionSchedulingGraph.addEdge(edge.getSource(), edge.getTarget());
                } catch (IllegalArgumentException e) {
                    log.debug("Ignoring the edge ({},{}) because {}", edge.getSource(), edge.getTarget(), e.getMessage());
                }
            }
        }

        return actionSchedulingGraph;
    }

    private List<HashSet<String>> computeOnPageLoadActionsSchedulingOrder(DirectedAcyclicGraph<String, DefaultEdge> dag) {
        List<HashSet<String>> onPageLoadActions = new ArrayList<>();

        // Find all root nodes to start the BFS traversal from
        List<String> rootNodes = dag.vertexSet().stream()
                .filter(key -> dag.incomingEdgesOf(key).size() == 0)
                .collect(Collectors.toList());

        BreadthFirstIterator<String, DefaultEdge> bfsIterator = new BreadthFirstIterator<>(dag, rootNodes);

        // Implementation of offline scheduler by using level by level traversal. Level i+1 actions would be dependent
        // on Level i actions. All actions in a level can run independently and hence would get added to the same set.
        while(bfsIterator.hasNext()) {
            String vertex=bfsIterator.next();
            int level = bfsIterator.getDepth(vertex);
            if (onPageLoadActions.size() <= level) {
                onPageLoadActions.add(new HashSet<>());
            }
            log.debug("vertex : {}, level : {}", vertex, level);

            onPageLoadActions.get(level).add(vertex);
        }

        log.debug("On page load actions are : {}", onPageLoadActions);

        return onPageLoadActions;
    }

}

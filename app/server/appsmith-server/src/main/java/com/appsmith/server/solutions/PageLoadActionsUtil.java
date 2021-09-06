package com.appsmith.server.solutions;

import com.appsmith.external.models.DynamicBinding;
import com.appsmith.server.domains.ActionDependencyEdge;
import com.appsmith.server.domains.PluginType;
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
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.MustacheHelper.extractWordsAndAddToSet;

@Slf4j
@Component
@RequiredArgsConstructor
public class PageLoadActionsUtil {

    private final NewActionService newActionService;

    /**
     * This function takes all the words used in the DSL dynamic bindings and computes the sequenced on page load actions.
     *
     * !!!WARNING!!! : This function edits the parameters actionNames, edges, actionsUsedInDSL and flatPageLoadActions
     * and the same are used by the caller function for further processing.
     *
     * @param bindings : words used in the DSL dynamic bindings
     * @param actionNames : Set where this function adds all the on page load action names
     * @param pageId : Argument used for fetching actions in this page
     * @param edges : Set where this function adds all the relationships (dependencies) between actions
     * @param actionsUsedInDSL : Set where this function adds all the actions directly used in the DSL
     * @param flatPageLoadActions : A flat list of on page load actions (Not in the sequence in which these actions
     *                            would be called on page load)
     * @return : Returns page load actions which is a list of sets of actions. Inside a set, all actions can be
     * parallely executed. But one set of actions MUST finish execution before the next set of actions can be executed
     * in the list.
     */
    public Mono<List<HashSet<DslActionDTO>>> findAllOnLoadActions(Map<String, DynamicBinding> bindings,
                                                                  Set<String> actionNames,
                                                                  String pageId,
                                                                  Set<ActionDependencyEdge> edges,
                                                                  Set<String> actionsUsedInDSL,
                                                                  List<ActionDTO> flatPageLoadActions) {
        Map<String, DynamicBinding> dynamicBindings = new HashMap<>();
        Set<String> ignoredActions = new HashSet<>();

        return newActionService.findUnpublishedActionsInPageByNames(bindings.keySet(), pageId)
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                // First find all the actions directly used in the DSL and get the graph started
                .flatMap(unpublishedAction -> {

                    // If the user has explicitly set an action to not run on page load, this action should be ignored
                    if (isUserSetOnPageLoad(unpublishedAction)) {
                        return Mono.empty();
                    }

                    String name = unpublishedAction.getValidName();

                    final DynamicBinding dynamicBinding = bindings.get(name);

                    // Ignore an async js action if it is a function call
                    if (Boolean.TRUE.equals(dynamicBinding.getIsFunctionCall()) && isAsyncJSFunction(unpublishedAction)) {
                        return Mono.empty();
                    }

                    actionsUsedInDSL.add(name);

                    extractAndSetActionNameAndBindingsForGraph(actionNames, edges, dynamicBindings, unpublishedAction);

                    // If this is a js action that is synchronous and is called as a function, don't mark it to run on page load
                    if (Boolean.TRUE.equals(dynamicBinding.getIsFunctionCall()) && isSyncJSFunction(unpublishedAction)) {
                        actionNames.remove(name);
                        return Mono.empty();
                    }
                    return Mono.just(unpublishedAction);
                })
                .collectMap(
                        ActionDTO::getValidName,
                        action -> action
                )
                // Now add to the map, vertices, and edges the explicitly set user on load actions
                .flatMap(onLoadActionsMap -> findExplicitUserSetOnLoadActionsAndTheirDependents(pageId, actionNames, edges, dynamicBindings, onLoadActionsMap))
                // Now recursively walk the bindings to find other actions and their bindings till all the actions are identified and added
                // to the graph which would be on load actions.
                .flatMap(onLoadActionsMap -> recursivelyFindActionsAndTheirDependents(dynamicBindings, pageId, actionNames, edges, onLoadActionsMap, ignoredActions))
                // Now that we have a global set of on load actions, create a DAG and find an offline schedule order in which the on load
                // actions should be triggered keeping in mind their dependencies on each other.
                .map(updatedMap -> {
                    DirectedAcyclicGraph<String, DefaultEdge> directedAcyclicGraph = constructDAG(actionNames, edges);
                    List<HashSet<String>> onPageLoadActionsSchedulingOrder = computeOnPageLoadActionsSchedulingOrder(directedAcyclicGraph);

                    List<HashSet<DslActionDTO>> onPageLoadActions = new ArrayList<>();

                    for (HashSet<String> names : onPageLoadActionsSchedulingOrder) {
                        HashSet<DslActionDTO> actionsInLevel = new HashSet<>();

                        for (String name : names) {
                            if (!ignoredActions.contains(name)) {
                                final ActionDTO actionDTO = updatedMap.get(name);
                                actionsInLevel.add(getDslAction(actionDTO));
                            }
                        }

                        onPageLoadActions.add(actionsInLevel);
                    }

                    // Also collect all the actions in the map in a flat list and update the list
                    flatPageLoadActions.addAll(updatedMap.values());
                    flatPageLoadActions.removeAll(ignoredActions.stream().map(updatedMap::get).collect(Collectors.toUnmodifiableSet()));

                    // Return the sequenced page load actions
                    return onPageLoadActions;

                });
    }

    private boolean isAsyncJSFunction(ActionDTO unpublishedAction) {
        if (PluginType.JS.equals(unpublishedAction.getPluginType())
                && Boolean.TRUE.equals(unpublishedAction.getActionConfiguration().getIsAsync())) {
            return true;
        }

        return false;
    }

    private boolean isSyncJSFunction(ActionDTO unpublishedAction) {
        if (PluginType.JS.equals(unpublishedAction.getPluginType())
                && Boolean.FALSE.equals(unpublishedAction.getActionConfiguration().getIsAsync())) {
            return true;
        }

        return false;
    }

    private boolean isUserSetOnPageLoad(ActionDTO unpublishedAction) {
        if (Boolean.TRUE.equals(unpublishedAction.getUserSetOnLoad())
                && !Boolean.TRUE.equals(unpublishedAction.getExecuteOnLoad())) {
            return true;
        }

        return false;
    }

    private Mono<Map<String, ActionDTO>> findExplicitUserSetOnLoadActionsAndTheirDependents(String pageId,
                                                                                            Set<String> actionNames,
                                                                                            Set<ActionDependencyEdge> edges,
                                                                                            Map<String, DynamicBinding> dynamicBindings,
                                                                                            Map<String, ActionDTO> onLoadActionsInMap) {
        //First fetch all the actions which have been tagged as on load by the user explicitly.
        return newActionService.findUnpublishedOnLoadActionsExplicitSetByUserInPage(pageId)
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                // Add the vertices and edges to the graph
                .map(actionDTO -> {
                    extractAndSetActionNameAndBindingsForGraph(actionNames, edges, dynamicBindings, actionDTO);
                    return actionDTO;
                })
                .collectMap(
                        ActionDTO::getValidName,
                        action -> action
                )
                .map(newActionsMap -> {
                    onLoadActionsInMap.putAll(newActionsMap);
                    return onLoadActionsInMap;
                });
    }

    /**
     * This function gets a list of binding names that come from other actions. It looks for actions in the page with
     * the same names as words in the binding names set. If yes, it creates a new set of dynamicBindingNames, adds these newly
     * found actions' bindings in the set, adds the new actions and their bindings to actionNames and edges and
     * recursively calls itself with the new set of dynamicBindingNames.
     * This ensures that the DAG that we create is complete and contains all possible actions and their dependencies
     */
    private Mono<Map<String, ActionDTO>> recursivelyFindActionsAndTheirDependents(Map<String, DynamicBinding> dynamicBindings,
                                                                                  String pageId,
                                                                                  Set<String> actionNames,
                                                                                  Set<ActionDependencyEdge> edges,
                                                                                  Map<String, ActionDTO> onLoadActionsInMap,
                                                                                  Set<String> ignoredActions) {
        if (dynamicBindings == null || dynamicBindings.isEmpty()) {
            return Mono.just(onLoadActionsInMap);
        }
        Map<String, DynamicBinding> newDynamicBindings = new HashMap<>();

        // First fetch all the actions in the page whose name matches the words found in all the dynamic bindings
        Mono<Map<String, ActionDTO>> updatedActionsMapMono = newActionService.findUnpublishedActionsInPageByNames(dynamicBindings.keySet(), pageId)
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .flatMap(action -> {

                    // If the user has explicitly set an action to not run on page load, this action should be ignored
                    if (Boolean.TRUE.equals(action.getUserSetOnLoad()) && !Boolean.TRUE.equals(action.getExecuteOnLoad())) {
                        return Mono.empty();
                    }

                    extractAndSetActionNameAndBindingsForGraph(actionNames, edges, newDynamicBindings, action);
                    final DynamicBinding dynamicBinding = dynamicBindings.get(action.getValidName());
                    // Ignore an async js action if it is a function call
                    if (Boolean.TRUE.equals(dynamicBinding.getIsFunctionCall()) && isAsyncJSFunction(action)) {
                        return Mono.empty();
                    }
                    // If this is a js action that is synchronous and is called as a function, don't mark it to run on page load
                    if (Boolean.TRUE.equals(dynamicBinding.getIsFunctionCall()) && isSyncJSFunction(action)) {
                        ignoredActions.add(action.getValidName());
                    }
                    return Mono.just(action);
                })
                .collectMap(
                        ActionDTO::getValidName,
                        action -> action
                )
                .map(newActionsMap -> {
                    onLoadActionsInMap.putAll(newActionsMap);
                    return onLoadActionsInMap;
                });

        return updatedActionsMapMono
                .then(Mono.just(newDynamicBindings))
                .flatMap(bindings -> {
                    // Now that the next set of bindings have been found, find recursively all actions by these names
                    // and their bindings
                    return recursivelyFindActionsAndTheirDependents(newDynamicBindings, pageId, actionNames, edges, onLoadActionsInMap, ignoredActions);
                });
    }

    private DslActionDTO getDslAction(ActionDTO actionDTO) {
        DslActionDTO dslActionDTO = new DslActionDTO();
        dslActionDTO.setId(actionDTO.getId());
        dslActionDTO.setPluginType(actionDTO.getPluginType());
        dslActionDTO.setJsonPathKeys(actionDTO.getJsonPathKeys());
        dslActionDTO.setName(actionDTO.getValidName());
        if (actionDTO.getActionConfiguration() != null) {
            dslActionDTO.setTimeoutInMillisecond(actionDTO.getActionConfiguration().getTimeoutInMillisecond());
        }
        return dslActionDTO;
    }

    private void extractAndSetActionNameAndBindingsForGraph(Set<String> actionNames,
                                                            Set<ActionDependencyEdge> edges,
                                                            Map<String, DynamicBinding> dynamicBindings,
                                                            ActionDTO action) {

        // Check if the action has been deleted in unpublished state. If yes, ignore it.
        if (action.getDeletedAt() != null) {
            return;
        }

        String name = action.getValidName();

        // Check if the action has already been found (and exists in the global action names set of actionNames
        // If yes, then we might have circular dependency scenario. Don't add the actions' bindings in the edges
        if (actionNames.contains(name)) {
            return;
        }

        actionNames.add(name);

        Map<String, DynamicBinding> dynamicBindingNamesInAction = new HashMap<>();
        Set<String> jsonPathKeys = action.getJsonPathKeys();
        if (!CollectionUtils.isEmpty(jsonPathKeys)) {
            for (String mustacheKey : jsonPathKeys) {
                extractWordsAndAddToSet(dynamicBindingNamesInAction, mustacheKey);
            }

            // If the action refers to itself in the json path keys, remove the same to circumvent
            // supposed circular dependency. This is possible in case of pagination with response url
            // where the action refers to its own data to find the next and previous URLs.
            dynamicBindingNamesInAction.remove(name);

            // The relationship is represented as follows :
            // If A depends on B aka B exists in the dynamic bindings of A,
            // the corresponding edge would be B->A since B updates A and hence,
            // B should be executed before A.
            for (String source : dynamicBindingNamesInAction.keySet()) {
                ActionDependencyEdge edge = new ActionDependencyEdge();
                edge.setSource(source);
                edge.setTarget(name);
                edges.add(edge);
            }

            // Update the global actions' dynamic bindings
            dynamicBindings.putAll(dynamicBindingNamesInAction);

        }
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
        while (bfsIterator.hasNext()) {
            String vertex = bfsIterator.next();
            int level = bfsIterator.getDepth(vertex);
            if (onPageLoadActions.size() <= level) {
                onPageLoadActions.add(new HashSet<>());
            }

            onPageLoadActions.get(level).add(vertex);
        }

        return onPageLoadActions;
    }

}

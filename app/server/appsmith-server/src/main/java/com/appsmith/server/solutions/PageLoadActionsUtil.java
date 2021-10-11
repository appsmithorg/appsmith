package com.appsmith.server.solutions;

import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.Property;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionDependencyEdge;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.NewActionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.graph.DirectedAcyclicGraph;
import org.jgrapht.traverse.BreadthFirstIterator;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.MustacheHelper.getPossibleParents;
import static com.appsmith.external.helpers.MustacheHelper.getWordsFromMustache;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
@Component
@RequiredArgsConstructor
public class PageLoadActionsUtil {

    private final NewActionService newActionService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * The following regex finds the immediate parent of an entity path.
     * e.g. :
     * Dropdown1.options[1].value -> Dropdown1.options[1]
     * Dropdown1.options[1] -> Dropdown1.options
     * Dropdown1.options -> Dropdown1
     */
    private final String IMMEDIATE_PARENT_REGEX = "^(.*)(\\..*|\\[.*\\])$";
    private final Pattern parentPattern = Pattern.compile(IMMEDIATE_PARENT_REGEX);


    public Mono<List<Set<DslActionDTO>>> findAllOnLoadActions(String pageId,
                                                              Set<String> widgetNames,
                                                              Set<ActionDependencyEdge> edges,
                                                              Map<String, Set<String>> widgetDynamicBindingsMap,
                                                              List<ActionDTO> flatmapPageLoadActions,
                                                              Set<String> actionsUsedInDSL) {

        Set<String> possibleEntityNamesInDsl = new HashSet<>();
        Set<String> onPageLoadActionSet = new HashSet<>();
        Set<String> explicitUserSetOnLoadActions = new HashSet<>();
        Set<String> bindingsFromActions = new HashSet<>();
        Set<String> actionsFoundDuringWalk = new HashSet<>();
        Set<String> bindingsInWidgets = new HashSet<>();

        widgetDynamicBindingsMap.values().forEach(bindings -> bindingsInWidgets.addAll(bindings));

        bindingsInWidgets.stream().forEach(binding -> possibleEntityNamesInDsl.addAll(getPossibleParents(binding)));

        Flux<ActionDTO> allActionsByPageIdMono = newActionService.findByPageIdAndViewMode(pageId, false, MANAGE_ACTIONS)
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .cache();

        Mono<Map<String, ActionDTO>> actionNameToActionMapMono = allActionsByPageIdMono
                .collectMap(
                        ActionDTO::getValidName,
                        action -> action
                );

        Mono<Set<String>> actionsInPageMono = allActionsByPageIdMono
                .map(action -> action.getValidName())
                .collect(Collectors.toSet())
                .cache();


        // This publisher traverses the actions and widgets to add all possible edges between entity paths
        Mono<Boolean> createAllEdgesForPageMono = newActionService.findUnpublishedActionsInPageByNames(possibleEntityNamesInDsl, pageId)
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                // Add dependencies of the actions found in the DSL in the graph.
                .map(action -> {
                    // This action is directly referenced in the DSL. This action is an ideal candidate for on page load
                    actionsUsedInDSL.add(action.getValidName());
                    extractAndSetActionBindingsInGraphEdges(edges, action, bindingsFromActions, actionsFoundDuringWalk);
                    return action;
                })
                // Add dependencies of all on page load actions set by the user in the graph
                .then(findExplicitUserSetOnLoadActionsAndTheirDependents(pageId, edges, explicitUserSetOnLoadActions, actionsFoundDuringWalk, bindingsFromActions))
                .then(recursivelyFindActionsAndTheirDependents(pageId, edges, actionsFoundDuringWalk, bindingsFromActions))
                .then(addWidgetRelationshipToDAG(edges, widgetDynamicBindingsMap));


        // Create a graph given edges
        Mono<DirectedAcyclicGraph<String, DefaultEdge>> createGraphMono = actionsInPageMono
                .map(allActions -> constructDAG(allActions, widgetNames, edges))
                .cache();

        // Generate on page load actions
        Mono<List<Set<DslActionDTO>>> onPageLoadActionScheduleMono = Mono.zip(actionsInPageMono, createGraphMono, actionNameToActionMapMono)
                .map(tuple -> {
                    Set<String> actionNames = tuple.getT1();
                    DirectedAcyclicGraph<String, DefaultEdge> graph = tuple.getT2();
                    Map<String, ActionDTO> actionNameToActionMap = tuple.getT3();

                    return computeOnPageLoadActionsSchedulingOrder(graph, onPageLoadActionSet, actionNames, actionNameToActionMap);
                })
                .map(onPageLoadActionsSchedulingOrder -> {
                    // Find all explicitly turned on actions which haven't found their way into the scheduling order
                    // This scenario would happen if an explicitly turned on for page load action does not have any
                    // relationships in the page with any widgets/actions.
                    Set<String> pageLoadActionNames = new HashSet<>();
                    pageLoadActionNames.addAll(onPageLoadActionSet);
                    pageLoadActionNames.addAll(explicitUserSetOnLoadActions);
                    pageLoadActionNames.removeAll(onPageLoadActionSet);

                    // If any of the explicitly set on page load actions havent been added yet, add them to the 0th set
                    // of actions set since no relationships were found with any other appsmith entity
                    if (!pageLoadActionNames.isEmpty()) {
                        onPageLoadActionSet.addAll(explicitUserSetOnLoadActions);

                        // In case there are no page load actions, initialize the 0th set of page load actions list.
                        if (onPageLoadActionsSchedulingOrder.isEmpty()) {
                            onPageLoadActionsSchedulingOrder.add(new HashSet<>());
                        }

                        onPageLoadActionsSchedulingOrder.get(0).addAll(explicitUserSetOnLoadActions);
                    }

                    return onPageLoadActionsSchedulingOrder;
                })
                .zipWith(actionNameToActionMapMono)
                .map(tuple -> {
                    List<HashSet<String>> onPageLoadActionsSchedulingOrder = tuple.getT1();
                    Map<String, ActionDTO> actionMap = tuple.getT2();

                    List<Set<DslActionDTO>> onPageLoadActions = new ArrayList<>();

                    for (Set<String> names : onPageLoadActionsSchedulingOrder) {
                        Set<DslActionDTO> actionsInLevel = new HashSet<>();

                        for (String name : names) {
                            ActionDTO action = actionMap.get(name);
                            // TODO : Remove this check once JS actions on page load functionality has been
                            //  implemented on the client side
                            if (PluginType.JS.equals(action.getPluginType())) {
                                // trim out the JS actions in the on page load schedule
                                onPageLoadActionSet.remove(name);
                            } else {
                                actionsInLevel.add(getDslAction(action));
                            }
                        }

                        onPageLoadActions.add(actionsInLevel);
                    }

                    return onPageLoadActions;
                })
                .zipWith(actionNameToActionMapMono)
                // Now that we have the final on page load, also set the page load actions which need to be updated.
                .map(tuple -> {
                    Map<String, ActionDTO> actionMap = tuple.getT2();
                    onPageLoadActionSet
                            .stream()
                            .forEach(actionName -> flatmapPageLoadActions.add(actionMap.get(actionName)));
                    return tuple.getT1();
                });


        return createAllEdgesForPageMono
                .then(createGraphMono)
                .then(onPageLoadActionScheduleMono);

    }

    private DirectedAcyclicGraph<String, DefaultEdge> constructDAG(Set<String> actionNames,
                                                                   Set<String> widgetNames,
                                                                   Set<ActionDependencyEdge> edges) {

        DirectedAcyclicGraph<String, DefaultEdge> actionSchedulingGraph =
                new DirectedAcyclicGraph<>(DefaultEdge.class);

        Set<ActionDependencyEdge> implicitParentChildEdges = new HashSet<>();

        // Remove any edge which contains an unknown entity - aka neither a known action nor a known widget
        // Note : appsmith world objects like `appsmith` would also count as an unknown here.
        // TODO : Handle the above global variables provided by appsmith in the following filtering.
        edges = edges.stream().filter(edge -> {

                    String source = edge.getSource();
                    String target = edge.getTarget();

                    Set<String> vertices = Set.of(source, target);

                    AtomicReference<Boolean> isValidVertex = new AtomicReference<>(true);

                    // Assert that the vertices which are entire property paths have a possible parent which is either
                    // an action or a widget.
                    // TODO : Add a static set of global variables exposed on the client side and check for the same below.
                    vertices
                            .stream()
                            .forEach(vertex -> {
                                Optional<String> validEntity = getPossibleParents(vertex)
                                        .stream()
                                        .filter(parent -> {
                                            if (!actionNames.contains(parent) && !widgetNames.contains(parent)) {
                                                return false;
                                            }
                                            return true;
                                        }).findFirst();

                                // If any of the generated entity names from the path are valid appsmith entity name,
                                // the vertex is considered valid
                                if (validEntity.isPresent()) {
                                    isValidVertex.set(TRUE);
                                } else {
                                    isValidVertex.set(FALSE);
                                }
                            });

                    return isValidVertex.get();
                })
                .collect(Collectors.toSet());

        // Now add the relationship aka when a child gets updated, the parent should get updated as well. Aka
        // parent depends on the child.
        for (ActionDependencyEdge edge : edges) {
            String source = edge.getSource();
            String target = edge.getTarget();

            Set<String> vertices = Set.of(source, target);

            vertices.stream().forEach(vertex -> implicitParentChildEdges.addAll(generateParentChildRelationships(vertex)));

        }

        edges.addAll(implicitParentChildEdges);

        // Now create the graph from all the edges.
        for (ActionDependencyEdge edge : edges) {

            String source = edge.getSource();
            String target = edge.getTarget();

            actionSchedulingGraph.addVertex(source);
            actionSchedulingGraph.addVertex(target);

            try {
                actionSchedulingGraph.addEdge(source, target);
            } catch (IllegalArgumentException e) {
                // This error is also thrown when adding an edge which makes the graph cyclical
                if (e.getMessage().contains("Edge would induce a cycle")) {
                    throw new AppsmithException(AppsmithError.CYCLICAL_DEPENDENCY_ERROR, edge.toString(), actionSchedulingGraph.edgeSet());
                }
            }

        }

        return actionSchedulingGraph;
    }

    private List<HashSet<String>> computeOnPageLoadActionsSchedulingOrder(DirectedAcyclicGraph<String, DefaultEdge> dag,
                                                                          Set<String> onPageLoadActionSet,
                                                                          Set<String> actionNames,
                                                                          Map<String, ActionDTO> actionNameToActionMap) {
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

            Set<String> actionsFromBinding = actionCandidatesForPageLoadFromBinding(actionNames, actionNameToActionMap, vertex, onPageLoadActionSet);
            onPageLoadActions.get(level).addAll(actionsFromBinding);
            onPageLoadActionSet.addAll(actionsFromBinding);
        }

        // Trim all empty sets from the list before returning.
        return onPageLoadActions.stream().filter(setOfActions -> !setOfActions.isEmpty()).collect(Collectors.toList());
    }

    /**
     * This function gets a list of binding names that come from other actions. It looks for actions in the page with
     * the same names as words in the binding names set. If yes, it creates a new set of dynamicBindingNames, adds these newly
     * found actions' bindings in the set, adds the new actions and their bindings to actionNames and edges and
     * recursively calls itself with the new set of dynamicBindingNames.
     * This ensures that the DAG that we create is complete and contains all possible actions and their dependencies
     */
    private Mono<Boolean> recursivelyFindActionsAndTheirDependents(String pageId,
                                                                   Set<ActionDependencyEdge> edges,
                                                                   Set<String> actionsFoundDuringWalk,
                                                                   Set<String> dynamicBindings) {
        if (dynamicBindings == null || dynamicBindings.isEmpty()) {
            return Mono.just(TRUE);
        }

        Set<String> possibleActionNames = new HashSet<>();

        dynamicBindings.stream().forEach(binding -> possibleActionNames.addAll(getPossibleParents(binding)));

        // First fetch all the actions in the page whose name matches the words found in all the dynamic bindings
        Mono<Void> findAndAddActionsInBindingsMono = newActionService.findUnpublishedActionsInPageByNames(possibleActionNames, pageId)
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .map(action -> {

                    // Since this action was referred in an existing action which as been walked. Add it to the graph
                    extractAndSetActionBindingsInGraphEdges(edges, action, dynamicBindings, actionsFoundDuringWalk);

                    return action;
                })
                .then();

        return findAndAddActionsInBindingsMono
                .then(Mono.just(dynamicBindings))
                .flatMap(bindings -> {
                    // Now that the next set of bindings have been found, find recursively all actions by these names
                    // and their bindings
                    return recursivelyFindActionsAndTheirDependents(pageId, edges, actionsFoundDuringWalk, dynamicBindings);
                });
    }

    private Mono<Boolean> findExplicitUserSetOnLoadActionsAndTheirDependents(String pageId,
                                                                             Set<ActionDependencyEdge> edges,
                                                                             Set<String> explicitUserSetOnLoadActions,
                                                                             Set<String> actionsFoundDuringWalk,
                                                                             Set<String> bindingsFromActions) {
        //First fetch all the actions which have been tagged as on load by the user explicitly.
        return newActionService.findUnpublishedOnLoadActionsExplicitSetByUserInPage(pageId)
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                // Add the vertices and edges to the graph
                .map(actionDTO -> {
                    log.debug("Inspecting user set on true action {}", actionDTO.getName());
                    extractAndSetActionBindingsInGraphEdges(edges, actionDTO, bindingsFromActions, actionsFoundDuringWalk);
                    explicitUserSetOnLoadActions.add(actionDTO.getValidName());
                    return actionDTO;
                })
                .then(Mono.just(TRUE));
    }

    private void extractAndSetActionBindingsInGraphEdges(Set<ActionDependencyEdge> edges,
                                                         ActionDTO action, Set<String> bindingsFromActions,
                                                         Set<String> actionsFoundDuringWalk) {

        // Check if the action has been deleted in unpublished state. If yes, ignore it.
        if (action.getDeletedAt() != null) {
            return;
        }

        String name = action.getValidName();
        if (actionsFoundDuringWalk.contains(name)) {
            // This action has already been found in our walk. Ignore this.
            return;
        }
        actionsFoundDuringWalk.add(name);

        // If the user has explicitly set an action to not run on page load, this action should be ignored
        if (hasUserSetActionToNotRunOnPageLoad(action)) {
            log.debug("Ignoring action {} since user set on load false ", name);
            return;
        }

        Map<String, Set<String>> actionBindingMap = getActionBindingMap(action);

        Set<String> allBindings = new HashSet<>();
        actionBindingMap.values().stream().forEach(bindings -> allBindings.addAll(bindings));

        if (!allBindings.containsAll(action.getJsonPathKeys())) {
            log.error("Invalid dynamic binding pathlist for action id {}. Not taking the following bindings in " +
                            "consideration for computing on page load actions : {}",
                    action.getId(),
                    action.getJsonPathKeys().removeAll(allBindings));
        }

        Set<String> bindingPaths = actionBindingMap.keySet();

        for (String bindingPath : bindingPaths) {
            Set<String> dynamicBindings = actionBindingMap.get(bindingPath);
            for (String binding : dynamicBindings) {
                Set<String> entityPaths = getWordsFromMustache(binding);
                for (String source : entityPaths) {
                    ActionDependencyEdge edge = new ActionDependencyEdge(source, bindingPath);
                    edges.add(edge);
                }
                // Add all the binding words further examination for dependencies in the future.
                bindingsFromActions.addAll(entityPaths);
            }
        }
    }

    private Mono<Boolean> addWidgetRelationshipToDAG(Set<ActionDependencyEdge> edges,
                                                     Map<String, Set<String>> widgetBindingMap) {

        return Mono.just(widgetBindingMap)
                .map(widgetDynamicBindingsMap -> {
                    widgetDynamicBindingsMap.forEach((widgetPath, widgetDynamicBindings) -> {

                        // Given the widget path, add all the relationships between the binding to the path
                        widgetDynamicBindings.stream().forEach(binding -> {
                            Set<String> entityPaths = getWordsFromMustache(binding);
                            for (String source : entityPaths) {
                                ActionDependencyEdge edge = new ActionDependencyEdge(source, widgetPath);
                                edges.add(edge);
                            }
                        });

                    });

                    return widgetDynamicBindingsMap;
                })
                .then(Mono.just(TRUE));
    }


    private boolean hasUserSetActionToNotRunOnPageLoad(ActionDTO unpublishedAction) {
        if (TRUE.equals(unpublishedAction.getUserSetOnLoad())
                && !TRUE.equals(unpublishedAction.getExecuteOnLoad())) {
            return true;
        }

        return false;
    }

    private Map<String, Set<String>> getActionBindingMap(ActionDTO action) {
        List<Property> dynamicBindingPathList = action.getDynamicBindingPathList();
        Map<String, Set<String>> completePathToDynamicBindingMap = new HashMap<>();

        Map<String, Object> configurationObj = objectMapper.convertValue(action.getActionConfiguration(), Map.class);

        if (dynamicBindingPathList != null) {
            // Each of these might have nested structures, so we iterate through them to find the leaf node for each
            for (Object x : dynamicBindingPathList) {
                final String fieldPath = String.valueOf(((Map) x).get(FieldName.KEY));
                String[] fields = fieldPath.split("[].\\[]");
                // For nested fields, the parent dsl to search in would shift by one level every iteration
                Object parent = configurationObj;
                Iterator<String> fieldsIterator = Arrays.stream(fields).filter(fieldToken -> !fieldToken.isBlank()).iterator();
                boolean isLeafNode = false;
                // This loop will end at either a leaf node, or the last identified JSON field (by throwing an exception)
                // Valid forms of the fieldPath for this search could be:
                // root.field.list[index].childField.anotherList.indexWithDotOperator.multidimensionalList[index1][index2]
                while (fieldsIterator.hasNext()) {
                    String nextKey = fieldsIterator.next();
                    if (parent instanceof JSONObject) {
                        parent = ((JSONObject) parent).get(nextKey);
                    } else if (parent instanceof Map) {
                        parent = ((Map<String, ?>) parent).get(nextKey);
                    } else if (parent instanceof List) {
                        if (Pattern.matches(Pattern.compile("[0-9]+").toString(), nextKey)) {
                            try {
                                parent = ((List) parent).get(Integer.parseInt(nextKey));
                            } catch (IndexOutOfBoundsException e) {
                                // The index being referred does not exist. Hence the path would not exist. Ignore the
                                // binding
                            }
                        } else {
                            // The list configuration does not seem correct. Hence the path would not exist. Ignore the
                            // binding
                        }
                    }
                    // After updating the parent, check for the types
                    if (parent == null) {
                        // path doesnt seem to exist. Ignore.
                    } else if (parent instanceof String) {
                        // If we get String value, then this is a leaf node
                        isLeafNode = true;
                    }
                }
                // Only extract mustache keys from leaf nodes
                if (isLeafNode) {

                    // We found the path. But if the path has mustache bindings, record the same in the map
                    if (MustacheHelper.laxIsBindingPresentInString((String) parent)) {
                        // Stricter extraction of dynamic bindings
                        Set<String> mustacheKeysFromFields = MustacheHelper.extractMustacheKeysFromFields(parent);

                        String completePath = action.getValidName() + ".actionConfiguration." + fieldPath;
                        if (completePathToDynamicBindingMap.containsKey(completePath)) {
                            Set<String> mustacheKeysForWidget = completePathToDynamicBindingMap.get(completePath);
                            mustacheKeysFromFields.addAll(mustacheKeysForWidget);
                        }
                        completePathToDynamicBindingMap.put(completePath, mustacheKeysFromFields);
                    }

                }
            }
        }

        return completePathToDynamicBindingMap;
    }

    private Set<ActionDependencyEdge> generateParentChildRelationships(String path) {
        Set<ActionDependencyEdge> edges = new HashSet<>();

        String parent;

        while (true) {
            try {
                Matcher matcher = parentPattern.matcher(path);
                matcher.find();
                parent = matcher.group(1);
                edges.add(new ActionDependencyEdge(path, parent));
                path = parent;
            } catch (IllegalStateException | IndexOutOfBoundsException e) {
                // No matches being found. Break out of infinite loop
                break;
            }
        }

        return edges;
    }

    private Set<String> actionCandidatesForPageLoadFromBinding(Set<String> allActionNames,
                                                               Map<String, ActionDTO> actionNameToActionMap,
                                                               String dynamicBinding,
                                                               Set<String> existingActionsInOnPageLoad) {

        Set<String> onPageLoadCandidates = new HashSet<>();

        Set<String> possibleParents = getPossibleParents(dynamicBinding);

        for (String entity : possibleParents) {
            // if this generated entity name from the binding matches an action name which hasn't yet been added to the
            // on page load list, check for its eligibility
            if (allActionNames.contains(entity) && !existingActionsInOnPageLoad.contains(entity)) {
                // This is definitely an action which hasn't yet been discovered for on page load.
                ActionDTO action = actionNameToActionMap.get(entity);

                // If this is a JS action, sync functions should not be added to on page load since
                // they would be executed during evaluation.
                if (isSyncJSFunction(action)) {
                    // do nothing
                } else {
                    // Either this is not a JS function or if it is, it is async. Add it to the on page load action list
                    onPageLoadCandidates.add(entity);
                }
            }
        }

        return onPageLoadCandidates;
    }

    private boolean isSyncJSFunction(ActionDTO unpublishedAction) {
        if (PluginType.JS.equals(unpublishedAction.getPluginType())
                && FALSE.equals(unpublishedAction.getActionConfiguration().getIsAsync())) {
            return true;
        }

        return false;
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
}

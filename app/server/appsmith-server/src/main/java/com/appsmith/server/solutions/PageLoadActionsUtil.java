package com.appsmith.server.solutions;

import com.appsmith.external.models.DynamicBinding;
import com.appsmith.server.domains.ActionDependencyEdge;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.NewActionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.graph.DirectedAcyclicGraph;
import org.jgrapht.traverse.BreadthFirstIterator;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.MustacheHelper.extractActionNamesAndAddValidActionBindingsToSet;
import static com.appsmith.external.helpers.MustacheHelper.extractWords;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;

@Slf4j
@Component
@RequiredArgsConstructor
public class PageLoadActionsUtil {

    private final NewActionService newActionService;

    /**
     * The following regex finds the immediate parent of an entity path.
     * e.g. :
     * Dropdown1.options[1].value -> Dropdown1.options[1]
     * Dropdown1.options[1] -> Dropdown1.options
     * Dropdown1.options -> Dropdown1
     */
    private final String IMMEDIATE_PARENT_REGEX = "^(.*)(\\..*|\\[.*\\])$";
    private final Pattern parentPattern = Pattern.compile(IMMEDIATE_PARENT_REGEX);

    /**
     * This function takes all the words used in the DSL dynamic bindings and computes the sequenced on page load actions.
     * <p>
     * !!!WARNING!!! : This function edits the parameters actionNames, edges, actionsUsedInDSL and flatPageLoadActions
     * and the same are used by the caller function for further processing.
     *
     * @param bindings                 : words used in the DSL dynamic bindings
     * @param actionNames              : Set where this function adds all the on page load action names
     * @param widgetNames              : Set of widget names found after parsing the DSL
     * @param pageId                   : Argument used for fetching actions in this page
     * @param edges                    : Set where this function adds all the relationships (dependencies) between actions
     * @param actionsUsedInDSL         : Set where this function adds all the actions directly used in the DSL
     * @param flatPageLoadActions      : A flat list of on page load actions (Not in the sequence in which these actions
     *                                 would be called on page load)
     * @param widgetDynamicBindingsMap : A map of widgetName with all of the JS bindings found for the widgetName in the DSL
     * @return : Returns page load actions which is a list of sets of actions. Inside a set, all actions can be
     * parallely executed. But one set of actions MUST finish execution before the next set of actions can be executed
     * in the list.
     */
//    public Mono<List<HashSet<DslActionDTO>>> findAllOnLoadActions(Map<String, DynamicBinding> bindings,
//                                                                  Set<String> actionNames,
//                                                                  Set<String> widgetNames,
//                                                                  String pageId,
//                                                                  Set<ActionDependencyEdge> edges,
//                                                                  Set<String> actionsUsedInDSL,
//                                                                  List<ActionDTO> flatPageLoadActions,
//                                                                  Map<String, Set<String>> widgetDynamicBindingsMap) {
//        Map<String, DynamicBinding> dynamicBindings = new HashMap<>();
//        Set<String> ignoredActions = new HashSet<>();
//
//        return newActionService.findUnpublishedActionsInPageByNames(bindings.keySet(), pageId)
//                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
//                // First find all the actions directly used in the DSL and get the graph started
//                .flatMap(unpublishedAction -> {
//
//                    // If the user has explicitly set an action to not run on page load, this action should be ignored
//                    if (isUserSetOnPageLoad(unpublishedAction)) {
//                        log.debug("Ignoring action {} since user set on load true ", unpublishedAction.getName());
//                        return Mono.empty();
//                    }
//
//                    String name = unpublishedAction.getValidName();
//
//                    final DynamicBinding dynamicBinding = bindings.get(name);
//
//                    // Ignore an async js action if it is a function call
//                    if (Boolean.TRUE.equals(dynamicBinding.getIsFunctionCall()) && isAsyncJSFunction(unpublishedAction)) {
//                        return Mono.empty();
//                    }
//
//                    actionsUsedInDSL.add(name);
//
//                    extractAndSetActionBindingsInGraphEdges(actionNames, widgetNames, edges, dynamicBindings, unpublishedAction);
//
//                    // If this is a js action that is synchronous and is called as a function, don't mark it to run on page load
//                    if (Boolean.TRUE.equals(dynamicBinding.getIsFunctionCall()) && isSyncJSFunction(unpublishedAction)) {
//                        actionNames.remove(name);
//                        return Mono.empty();
//                    }
//                    return Mono.just(unpublishedAction);
//                })
//                .collectMap(
//                        ActionDTO::getValidName,
//                        action -> action
//                )
//                // Now add to the map, vertices, and edges the explicitly set user on load actions
//                .flatMap(onLoadActionsMap -> findExplicitUserSetOnLoadActionsAndTheirDependents(pageId, actionNames, widgetNames, edges, dynamicBindings, onLoadActionsMap))
//                // Now recursively walk the bindings to find other actions and their bindings till all the actions are identified and added
//                // to the graph which would be on load actions.
//                .flatMap(onLoadActionsMap -> recursivelyFindActionsAndTheirDependents(dynamicBindings, pageId, actionNames, widgetNames, edges, onLoadActionsMap, ignoredActions))
//                // Now that we have a global set of on load actions, create a DAG and find an offline schedule order in which the on load
//                // actions should be triggered keeping in mind their dependencies on each other.
//                .flatMap(onLoadActionsMap -> addWidgetRelationshipToDAG(actionNames, widgetNames, edges, widgetDynamicBindingsMap, onLoadActionsMap))
//                .map(updatedMap -> {
//                    DirectedAcyclicGraph<String, DefaultEdge> directedAcyclicGraph = constructDAG(actionNames, widgetNames, edges);
//                    List<HashSet<String>> onPageLoadActionsSchedulingOrder = computeOnPageLoadActionsSchedulingOrder(directedAcyclicGraph, actionNames);
//
//                    List<HashSet<DslActionDTO>> onPageLoadActions = new ArrayList<>();
//
//                    for (HashSet<String> names : onPageLoadActionsSchedulingOrder) {
//                        HashSet<DslActionDTO> actionsInLevel = new HashSet<>();
//
//                        for (String name : names) {
//                            if (!ignoredActions.contains(name)) {
//                                final ActionDTO actionDTO = updatedMap.get(name);
//                                actionsInLevel.add(getDslAction(actionDTO));
//                            }
//                        }
//
//                        onPageLoadActions.add(actionsInLevel);
//                    }
//
//                    // Also collect all the actions in the map in a flat list and update the list
//                    flatPageLoadActions.addAll(updatedMap.values());
//                    flatPageLoadActions.removeAll(ignoredActions.stream().map(updatedMap::get).collect(Collectors.toUnmodifiableSet()));
//
//                    // Return the sequenced page load actions
//                    return onPageLoadActions;
//
//                });
//    }
    public Mono<List<HashSet<DslActionDTO>>> findAllOnLoadActions(Map<String, DynamicBinding> bindings,
                                                                  Set<String> actionNames,
                                                                  Set<String> widgetNames,
                                                                  String pageId,
                                                                  Set<ActionDependencyEdge> edges,
                                                                  Set<String> actionsUsedInDSL,
                                                                  List<ActionDTO> flatPageLoadActions,
                                                                  Map<String, Set<String>> widgetDynamicBindingsMap) {
        log.debug("Computing on page load actions due to update layout");
        Map<String, DynamicBinding> dynamicBindings = new HashMap<>();
        Set<String> ignoredActions = new HashSet<>();

        Set<String> bindingWordsInDSL = new HashSet<>();

        bindings.keySet().stream().forEach(binding -> bindingWordsInDSL.addAll(extractWords(binding)));

        Flux<NewAction> allActionsByPageIdMono = newActionService.findByPageIdAndViewMode(pageId, false, MANAGE_ACTIONS)
                .cache();

        Mono<Map<String, ActionDTO>> actionNameToActionMapMono = allActionsByPageIdMono
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .collectMap(
                        ActionDTO::getValidName,
                        action -> action
                );

        Mono<Set<String>> actionsInPageMono = allActionsByPageIdMono
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .map(action -> action.getValidName())
                .collect(Collectors.toSet());

        return newActionService.findUnpublishedActionsInPageByNames(bindingWordsInDSL, pageId)
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .flatMap(unpublishedAction -> {
                    // If the user has explicitly set an action to not run on page load, this action should be ignored
                    if (isUserSetOnPageLoad(unpublishedAction)) {
                        log.debug("Ignoring action {} since user set on load true ", unpublishedAction.getName());
                        return Mono.empty();
                    }

                    String name = unpublishedAction.getValidName();

                    final DynamicBinding dynamicBinding = bindings.get(name);

                    // Ignore an async js action
                    if (isAsyncJSFunction(unpublishedAction)) {
                        return Mono.empty();
                    }

                    extractAndSetActionBindingsInGraphEdges(actionsUsedInDSL, widgetNames, edges, dynamicBindings, unpublishedAction);

//                    // If this is a js action that is synchronous and is called as a function, don't mark it to run on page load
//                    if (Boolean.TRUE.equals(dynamicBinding.getIsFunctionCall()) && isSyncJSFunction(unpublishedAction)) {
//                        actionNames.remove(name);
//                        return Mono.empty();
//                    }
                    return Mono.just(unpublishedAction);
                })
                .collectMap(
                        ActionDTO::getValidName,
                        action -> action
                )
                .zipWith(actionsInPageMono)
                // Now add to the map, vertices, and edges the explicitly set user on load actions
                .flatMap(tuple -> {
                    Map<String, ActionDTO> onLoadActionsMap = tuple.getT1();
                    Set<String> actionInPageNames = tuple.getT2();
                    return Mono.zip(findExplicitUserSetOnLoadActionsAndTheirDependents(pageId, actionInPageNames, widgetNames, edges, dynamicBindings, onLoadActionsMap), Mono.just(actionInPageNames));
                })
                // Now recursively walk the bindings to find other actions and their bindings till all the actions are identified and added
                // to the graph which would be on load actions.
                .flatMap(tuple -> {
                    Map<String, ActionDTO> onLoadActionsMap = tuple.getT1();
                    Set<String> actionInPageNames = tuple.getT2();
                    return Mono.zip(recursivelyFindActionsAndTheirDependents(dynamicBindings, pageId, actionInPageNames, widgetNames, edges, onLoadActionsMap, ignoredActions), Mono.just(actionInPageNames));
                })
                // Now that we have a global set of on load actions, create a DAG and find an offline schedule order in which the on load
                // actions should be triggered keeping in mind their dependencies on each other.
                .flatMap(tuple -> {
                    Map<String, ActionDTO> onLoadActionsMap = tuple.getT1();
                    Set<String> actionInPageNames = tuple.getT2();

                    return addWidgetRelationshipToDAG(actionInPageNames, widgetNames, edges, widgetDynamicBindingsMap, onLoadActionsMap)
                            .then(actionNameToActionMapMono.zipWith(Mono.just(actionInPageNames)));
                })
                .map(tuple -> {
                    Map<String, ActionDTO> allActionsInPageMap = tuple.getT1();
                    Set<String> actionInPageNames = tuple.getT2();

                    Set<String> onPageLoadActionNameSet = new HashSet<>();

                    DirectedAcyclicGraph<String, DefaultEdge> directedAcyclicGraph = constructDAG(actionInPageNames, widgetNames, edges);
                    List<HashSet<String>> onPageLoadActionsSchedulingOrder = computeOnPageLoadActionsSchedulingOrder(directedAcyclicGraph, actionInPageNames, onPageLoadActionNameSet);

                    List<HashSet<DslActionDTO>> onPageLoadActions = new ArrayList<>();

                    for (HashSet<String> names : onPageLoadActionsSchedulingOrder) {
                        HashSet<DslActionDTO> actionsInLevel = new HashSet<>();

                        for (String name : names) {
                            if (!ignoredActions.contains(name)) {
                                final ActionDTO actionDTO = allActionsInPageMap.get(name);
                                actionsInLevel.add(getDslAction(actionDTO));
                            }
                        }

                        onPageLoadActions.add(actionsInLevel);
                    }

                    // Also collect all the actions in the map in a flat list and update the list
                    flatPageLoadActions.addAll(allActionsInPageMap.values().stream().filter(action -> onPageLoadActionNameSet.contains(action.getName())).collect(Collectors.toList()));
                    flatPageLoadActions.removeAll(ignoredActions.stream().map(allActionsInPageMap::get).collect(Collectors.toUnmodifiableSet()));

                    // Return the sequenced page load actions
                    return onPageLoadActions;

                });
    }

    private Mono<Map<String, ActionDTO>> addWidgetRelationshipToDAG(Set<String> actionNames,
                                                                    Set<String> widgetNames,
                                                                    Set<ActionDependencyEdge> edges,
                                                                    Map<String, Set<String>> widgetBindingMap,
                                                                    Map<String, ActionDTO> onLoadActionsInMap) {

        return Mono.just(widgetBindingMap)
                .map(widgetDynamicBindingsMap -> {
                    widgetDynamicBindingsMap.forEach((widgetPath, widgetDynamicBindings) -> {

                        widgetDynamicBindings.stream().forEach(source -> {

                            // if the dynamic binding contains an action reference, only choose an action which matches
                            // the rules
                            AtomicReference<Boolean> isActionBinding = new AtomicReference<>(false);
                            actionNames.stream().forEach(actionName -> {
                                if (source.contains(actionName)) {
                                    isActionBinding.set(true);
                                }
                            });

                            if (isActionBinding.get()) {
                                Map<String, DynamicBinding> dynamicBindingNamesInWidget = new HashMap<>();
                                extractActionNamesAndAddValidActionBindingsToSet(dynamicBindingNamesInWidget, source);
                                Set<String> bindings = new HashSet<>();
                                dynamicBindingNamesInWidget.entrySet().stream().forEach(dbMap -> {
                                    DynamicBinding value = dbMap.getValue();
                                    if (!value.getIsFunctionCall()) {
                                        bindings.add(value.getBinding());
                                    }
                                    // if this is a function call, don't add it for on page load
                                });

                                bindings.stream().forEach(binding -> {
                                    log.debug("Adding edge for widget {} coming from action {}", widgetPath, binding);
                                    edges.add(new ActionDependencyEdge(binding, widgetPath));
                                });

                            } else {
                                // This is a widget binding
                                ActionDependencyEdge edge = new ActionDependencyEdge(source, widgetPath);
                                log.debug("Adding edge for widget {} coming from widget {}", widgetPath, source);
                                edges.add(edge);
                            }


                        });

//                        // Now find the actions which provide values to the widgets
//                        Set<String> intersectionOfActionNames = new HashSet<>(widgetDynamicBindings);
//                        Map<String, DynamicBinding> dynamicBindingNamesInWidget = new HashMap<>();
//                        intersectionOfActionNames.stream().forEach(mustacheKey -> {
//                            extractActionNamesAndAddValidActionBindingsToSet(dynamicBindingNamesInWidget, mustacheKey);
//                        });

//                        intersectionOfActionNames.retainAll(dynamicBindingNamesInWidget.keySet());

//                        Set<String> entityNames = new HashSet<>();
//                        dynamicBindingNamesInWidget.keySet().stream().forEach(binding -> {
//                            entityNames.addAll(extractWords(binding));
//                        });
//
//                        entityNames
//                                .stream()
//                                .forEach(source -> {
//                                    ActionDependencyEdge edge = new ActionDependencyEdge(source, widgetPath);
//                                    log.debug("Adding edge for widget {} going to possible action {}", widgetPath, source);
//                                    edges.add(edge);
//                                });

                    });

                    return edges;
                })
                .then(Mono.just(onLoadActionsInMap));
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
                                                                                            Set<String> widgetNames,
                                                                                            Set<ActionDependencyEdge> edges,
                                                                                            Map<String, DynamicBinding> dynamicBindings,
                                                                                            Map<String, ActionDTO> onLoadActionsInMap) {
        //First fetch all the actions which have been tagged as on load by the user explicitly.
        return newActionService.findUnpublishedOnLoadActionsExplicitSetByUserInPage(pageId)
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                // Add the vertices and edges to the graph
                .map(actionDTO -> {
                    log.debug("Inspecting user set on true action {}", actionDTO.getName());
                    extractAndSetActionBindingsInGraphEdges(actionNames, widgetNames, edges, dynamicBindings, actionDTO);
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
                                                                                  Set<String> widgetNames,
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

                    extractAndSetActionBindingsInGraphEdges(actionNames, widgetNames, edges, newDynamicBindings, action);
                    final DynamicBinding dynamicBinding = dynamicBindings.get(action.getValidName());
                    // Ignore an async js action if it is a function call
                    if (Boolean.TRUE.equals(dynamicBinding.getIsFunctionCall()) && isAsyncJSFunction(action)) {
                        return Mono.empty();
                    }
//                    // If this is a js action that is synchronous and is called as a function, don't mark it to run on page load
//                    if (Boolean.TRUE.equals(dynamicBinding.getIsFunctionCall()) && isSyncJSFunction(action)) {
//                        ignoredActions.add(action.getValidName());
//                    }
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
                    return recursivelyFindActionsAndTheirDependents(newDynamicBindings, pageId, actionNames, widgetNames, edges, onLoadActionsInMap, ignoredActions);
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

    private void extractAndSetActionBindingsInGraphEdges(Set<String> actionNames,
                                                         Set<String> widgetNames,
                                                         Set<ActionDependencyEdge> edges,
                                                         Map<String, DynamicBinding> dynamicBindings,
                                                         ActionDTO action) {

        // Check if the action has been deleted in unpublished state. If yes, ignore it.
        if (action.getDeletedAt() != null) {
            return;
        }

        String name = action.getValidName();

//        // Check if the action has already been found (and exists in the global action names set of actionNames
//        // If yes, then we might have circular dependency scenario. Don't add the actions' bindings in the edges
//        if (actionNames.contains(name)) {
//            return;
//        }

//        actionNames.add(name);

        Map<String, DynamicBinding> dynamicBindingNamesInAction = new HashMap<>();
        Set<String> widgetNamesInDynamicBindings = new HashSet<>();
        Set<String> jsonPathKeys = action.getJsonPathKeys();
        if (!CollectionUtils.isEmpty(jsonPathKeys)) {
            for (String mustacheKey : jsonPathKeys) {
                extractActionNamesAndAddValidActionBindingsToSet(dynamicBindingNamesInAction, mustacheKey);
                widgetNamesInDynamicBindings.addAll(extractWords(mustacheKey));
            }

            Set<String> entityNames = dynamicBindingNamesInAction.keySet();

            // If the action refers to itself in the json path keys, remove the same to circumvent
            // supposed circular dependency. This is possible in case of pagination with response url
            // where the action refers to its own data to find the next and previous URLs.
            entityNames.remove(name);

            // The relationship is represented as follows :
            // If A depends on B aka B exists in the dynamic bindings of A,
            // the corresponding edge would be B->A since B updates A and hence,
            // B should be executed before A.
            for (String source : entityNames) {
                ActionDependencyEdge edge = new ActionDependencyEdge(source, name);
                log.debug("Adding edge to action {} coming from entity {}", name, source);
                edges.add(edge);
            }

            // Update the global actions' dynamic bindings
            dynamicBindings.putAll(dynamicBindingNamesInAction);

//            // Check for action dependencies on widgets
//            widgetNamesInDynamicBindings.retainAll(widgetNames);
//            for (String source : widgetNamesInDynamicBindings) {
//                ActionDependencyEdge edge = new ActionDependencyEdge(source, name);
//                log.debug("Adding edge for action {} going to possible widget {}", name, source);
//                edges.add(edge);
//            }

        }
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

    private String getTopMostParent(String path) {
        while (true) {
            try {
                Matcher matcher = parentPattern.matcher(path);
                matcher.find();
                path = matcher.group(1);
            } catch (IllegalStateException | IndexOutOfBoundsException e) {
                // No matches being found. Break out of infinite loop
                break;
            }
        }

        return path;
    }

    private DirectedAcyclicGraph<String, DefaultEdge> constructDAG(Set<String> actionNames,
                                                                   Set<String> widgetNames,
                                                                   Set<ActionDependencyEdge> edges) {
        DirectedAcyclicGraph<String, DefaultEdge> actionSchedulingGraph =
                new DirectedAcyclicGraph<>(DefaultEdge.class);

        Set<ActionDependencyEdge> implicitParentChildEdges = new HashSet<>();

        for (ActionDependencyEdge edge : edges) {
            String source = edge.getSource();
            String target = edge.getTarget();

            // Add all the parent child relationships
            implicitParentChildEdges.addAll(generateParentChildRelationships(source));
            implicitParentChildEdges.addAll(generateParentChildRelationships(target));
        }

        edges.addAll(implicitParentChildEdges);

        // Remove any edge between which contains an uknown entity - aka neither a known action nor a known widget
        edges = edges.stream().filter(edge -> {

                    AtomicReference<Boolean> isValid = new AtomicReference<>(true);

                    String source = edge.getSource();
                    String target = edge.getTarget();

                    extractWords(source).stream().forEach(parent -> {
                        if (!actionNames.contains(parent) && !widgetNames.contains(parent)) {
                            isValid.set(false);
                        }
                    });

                    extractWords(target).stream().forEach(parent -> {
                        if (!actionNames.contains(parent) && !widgetNames.contains(parent)) {
                            isValid.set(false);
                        }
                    });

                    return isValid.get();
                })
                .collect(Collectors.toSet());

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

    private List<HashSet<String>> computeOnPageLoadActionsSchedulingOrder(DirectedAcyclicGraph<String,
                                                                          DefaultEdge> dag,
                                                                          Set<String> actionNames,
                                                                          Set<String> onPageLoadActionSet) {
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

            // Since we are not interested in widgets, check for action names before adding to the on page load actions
            // Also if an action name exists on level 0, then clearly it is not being used by a widget. Don't count it
            // as a page load action.
            String entity = getTopMostParent(vertex);
            if (actionNames.contains(entity) && !onPageLoadActionSet.contains(entity)) {
                onPageLoadActions.get(level).add(entity);
                onPageLoadActionSet.add(entity);
            }
        }

        return onPageLoadActions.stream().filter(setOfActions -> !setOfActions.isEmpty()).collect(Collectors.toList());
    }

}

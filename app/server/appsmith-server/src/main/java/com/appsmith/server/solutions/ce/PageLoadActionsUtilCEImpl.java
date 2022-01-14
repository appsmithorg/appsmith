package com.appsmith.server.solutions.ce;

import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.Property;
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
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.MustacheHelper.getPossibleParents;
import static com.appsmith.external.helpers.MustacheHelper.getWordsFromMustache;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
@RequiredArgsConstructor
public class PageLoadActionsUtilCEImpl implements PageLoadActionsUtilCE {

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

    // TODO : This should contain all the static global variables present on the page like `appsmith`, etc.
    // TODO : Add all the global variables exposed on the client side.
    private final Set<String> APPSMITH_GLOBAL_VARIABLES = Set.of();


    /**
     * This function computes the sequenced on page load actions.
     * <p>
     * !!!WARNING!!! : This function edits the parameters edges, actionsUsedInDSL and flatPageLoadActions
     * and the same are used by the caller function for further processing.
     *
     * @param pageId                   : Argument used for fetching actions in this page
     * @param widgetNames              : Set of widget names which SHOULD have been populated before calling this function.
     * @param edges                    : Set where this function adds all the relationships (dependencies) between actions
     * @param widgetDynamicBindingsMap : A map of widget path and the set of dynamic binding words in the mustache at the
     *                                 path in the widget (populated by the function `extractAllWidgetNamesAndDynamicBindingsFromDSL`
     *                                 <p>
     *                                 Example : If Table1's field tableData contains a mustache : {{Api1.data}}, the entry in the map would look like :
     *                                 Map.entry("Table1.tableData", Set.of("Api1.data"))
     * @param flatPageLoadActions      : A flat list of on page load actions (Not in the sequence in which these actions
     *                                 would be called on page load)
     * @param actionsUsedInDSL         : Set where this function adds all the actions directly used in the DSL
     * @return : Returns page load actions which is a list of sets of actions. Inside a set, all actions can be executed
     * in parallel. But one set of actions MUST finish execution before the next set of actions can be executed
     * in the list.
     */
    public Mono<List<Set<DslActionDTO>>> findAllOnLoadActions(String pageId,
                                                              Set<String> widgetNames,
                                                              Set<ActionDependencyEdge> edges,
                                                              Map<String, Set<String>> widgetDynamicBindingsMap,
                                                              List<ActionDTO> flatPageLoadActions,
                                                              Set<String> actionsUsedInDSL) {

        Set<String> onPageLoadActionSet = new HashSet<>();
        Set<String> explicitUserSetOnLoadActions = new HashSet<>();
        Set<String> bindingsFromActions = new HashSet<>();

        // Function `extractAndSetActionBindingsInGraphEdges` updates this set to keep a track of all the actions which
        // have been discovered while walking the actions to ensure that we don't end up in a recursive infinite loop
        // in case of a cyclical relationship between actions (and not specific paths) and helps us exit at the appropriate
        // junction.
        // e.g : Consider the following relationships :
        // Api1.actionConfiguration.body <- Api2.data.users[0].name
        // Api2.actionConfiguration.url <- Api1.actionConfiguration.url
        // In the above case, the two actions depend on each other without there being a real cyclical dependency.
        Set<String> actionsFoundDuringWalk = new HashSet<>();

        Set<String> bindingsInWidgets = new HashSet<>();

        // Create a global set of bindings found in ALL the widgets.
        widgetDynamicBindingsMap.values().forEach(bindings -> bindingsInWidgets.addAll(bindings));

        Flux<ActionDTO> allActionsByPageIdMono = newActionService.findByPageIdAndViewMode(pageId, false, MANAGE_ACTIONS)
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .cache();

        Mono<Map<String, ActionDTO>> actionNameToActionMapMono = allActionsByPageIdMono
                .collectMap(
                        ActionDTO::getValidName,
                        action -> action
                )
                .cache();

        Mono<Set<String>> actionsInPageMono = allActionsByPageIdMono
                .map(action -> action.getValidName())
                .collect(Collectors.toSet())
                .cache();

        Set<String> actionBindingsInDsl = new HashSet<>();
        Mono<Set<ActionDependencyEdge>> directlyReferencedActionsAddedToGraphMono = addDirectlyReferencedActionsToGraph(pageId,
                edges, actionsUsedInDSL, bindingsFromActions, actionsFoundDuringWalk, bindingsInWidgets,
                actionNameToActionMapMono, actionBindingsInDsl);

        // This following `createAllEdgesForPageMono` publisher traverses the actions and widgets to add all possible
        // edges between all possible entity paths

        // First find all the actions in the page whose name matches the possible entity names found in the bindings in the widget
        Mono<Set<ActionDependencyEdge>> createAllEdgesForPageMono = directlyReferencedActionsAddedToGraphMono
                // Add dependencies of all on page load actions set by the user in the graph
                .flatMap(updatedEdges -> addExplicitUserSetOnLoadActionsToGraph(pageId, updatedEdges, explicitUserSetOnLoadActions, actionsFoundDuringWalk, bindingsFromActions))
                // For all the actions found so far, recursively walk the dynamic bindings of the actions to find more relationships with other actions (& widgets)
                .flatMap(updatedEdges -> recursivelyAddActionsAndTheirDependentsToGraphFromBindings(pageId, updatedEdges, actionsFoundDuringWalk, bindingsFromActions))
                // At last, add all the widget relationships to the graph as well.
                .zipWith(actionsInPageMono)
                .flatMap(tuple -> {
                    Set<ActionDependencyEdge> updatedEdges = tuple.getT1();
                    Set<String> actionNames = tuple.getT2();
                    return addWidgetRelationshipToGraph(updatedEdges, widgetDynamicBindingsMap, actionNames);
                });


        // Create a graph given edges
        Mono<DirectedAcyclicGraph<String, DefaultEdge>> createGraphMono = Mono.zip(actionsInPageMono, createAllEdgesForPageMono)
                .map(tuple -> {
                    Set<String> allActions = tuple.getT1();
                    Set<ActionDependencyEdge> updatedEdges = tuple.getT2();
                    return constructDAG(allActions, widgetNames, updatedEdges, actionsFoundDuringWalk, actionBindingsInDsl);
                })
                .cache();

        // Generate on page load schedule
        Mono<List<Set<String>>> computeOnPageLoadScheduleNamesMono = Mono.zip(actionsInPageMono, createGraphMono)
                .map(tuple -> {
                    Set<String> actionNames = tuple.getT1();
                    DirectedAcyclicGraph<String, DefaultEdge> graph = tuple.getT2();

                    return computeOnPageLoadActionsSchedulingOrder(graph, onPageLoadActionSet, actionNames,
                            explicitUserSetOnLoadActions);
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
                });


        // Transform the schedule order into client feasible DTO
        Mono<List<Set<DslActionDTO>>> computeCompletePageLoadActionScheduleMono =
                filterAndTransformSchedulingOrderToDTO(onPageLoadActionSet, actionNameToActionMapMono, computeOnPageLoadScheduleNamesMono)
                        .cache();


        // With the final on page load scheduling order, also set the on page load actions which would be updated
        // by the caller function
        Mono<List<ActionDTO>> flatPageLoadActionsMono = computeCompletePageLoadActionScheduleMono
                .then(actionNameToActionMapMono)
                .map(actionMap -> {
                    onPageLoadActionSet
                            .stream()
                            .forEach(actionName -> flatPageLoadActions.add(actionMap.get(actionName)));
                    return flatPageLoadActions;
                });

        return createGraphMono
                .then(flatPageLoadActionsMono)
                .then(computeCompletePageLoadActionScheduleMono);

    }

    /**
     * This function takes the page load schedule consisting of only action names.
     * <p>
     * First it trims the order to remove any unwanted actions which shouldn't be run.
     * Following actions are filtered out :
     * 1. Any JS Action since they are not supported to run on page load currently. TODO : Remove this check once the
     * client implements execution of JS functions.
     * 2. Any action which has been marked to not run on page load by the user.
     * <p>
     * Next it creates a new schedule order consisting of DslActionDTO instead of just action names.
     *
     * @param onPageLoadActionSet
     * @param actionNameToActionMapMono
     * @param computeOnPageLoadScheduleNamesMono
     * @return
     */
    private Mono<List<Set<DslActionDTO>>> filterAndTransformSchedulingOrderToDTO(Set<String> onPageLoadActionSet,
                                                                                 Mono<Map<String, ActionDTO>> actionNameToActionMapMono,
                                                                                 Mono<List<Set<String>>> computeOnPageLoadScheduleNamesMono) {

        return Mono.zip(computeOnPageLoadScheduleNamesMono, actionNameToActionMapMono)
                .map(tuple -> {
                    List<Set<String>> onPageLoadActionsSchedulingOrder = tuple.getT1();
                    Map<String, ActionDTO> actionMap = tuple.getT2();

                    List<Set<DslActionDTO>> onPageLoadActions = new ArrayList<>();

                    for (Set<String> names : onPageLoadActionsSchedulingOrder) {
                        Set<DslActionDTO> actionsInLevel = new HashSet<>();

                        for (String name : names) {
                            ActionDTO action = actionMap.get(name);
                            if (hasUserSetActionToNotRunOnPageLoad(action)) {
                                onPageLoadActionSet.remove(name);
                            } else {
                                actionsInLevel.add(getDslAction(action));
                            }
                        }

                        onPageLoadActions.add(actionsInLevel);
                    }

                    return onPageLoadActions.stream().filter(setOfActions -> !setOfActions.isEmpty()).collect(Collectors.toList());
                });
    }

    /**
     * This function finds all the actions in the page whose name matches the possible entity names found in the
     * bindings in the widget. Caveat : It first removes all invalid bindings from the set of all bindings from the DSL
     * This today means only the usage of an async JS function as a call instead of referring to the `.data`.
     * <p>
     * !!! WARNING !!! : This function updates actionsUsedInDSL set which is used to store all the directly referenced
     * actions in the DSL.
     *
     * @param pageId
     * @param edges
     * @param actionsUsedInDSL
     * @param bindingsFromActions
     * @param actionsFoundDuringWalk
     * @param bindingsInWidgets
     * @param actionNameToActionMapMono
     * @return
     */
    private Mono<Set<ActionDependencyEdge>> addDirectlyReferencedActionsToGraph(String pageId,
                                                                                Set<ActionDependencyEdge> edges,
                                                                                Set<String> actionsUsedInDSL,
                                                                                Set<String> bindingsFromActions,
                                                                                Set<String> actionsFoundDuringWalk,
                                                                                Set<String> bindingsInWidgets,
                                                                                Mono<Map<String, ActionDTO>> actionNameToActionMapMono,
                                                                                Set<String> actionBindingsInDsl) {
        return actionNameToActionMapMono
                .map(actionMap -> {
                    Map<String, Set<String>> bindingToPossibleParentMap = bindingsInWidgets
                            .stream()
                            .collect(Collectors.toMap(Function.identity(), v -> getPossibleParents(v)));

                    Set<String> invalidBindings = new HashSet<>();

                    bindingsInWidgets
                            .stream()
                            .forEach(binding -> {
                                Set<String> possibleParents = bindingToPossibleParentMap.get(binding);

                                Optional<String> isAction = possibleParents
                                        .stream()
                                        .filter(parent -> actionMap.get(parent) != null)
                                        .findFirst();

                                // if the binding is referring to the action, ensure that for ASYNC JS functions, it
                                // shouldn't be a function call since that is not supported in dynamic bindings.
                                if (isAction.isPresent()) {
                                    actionBindingsInDsl.add(binding);
                                    ActionDTO action = actionMap.get(isAction.get());
                                    if (isAsyncJsFunctionCall(action, binding)) {
                                        invalidBindings.add(binding);
                                    }
                                }
                            });

                    return invalidBindings;
                })
                .map(invalidBindings -> {
                    Set<String> validBindings = new HashSet<>(bindingsInWidgets);
                    validBindings.removeAll(invalidBindings);

                    Set<String> possibleEntityNamesInDsl = new HashSet<>();

                    // From all the bindings found in the widget, extract all possible entity names.
                    validBindings.stream().forEach(binding -> possibleEntityNamesInDsl.addAll(getPossibleParents(binding)));

                    return possibleEntityNamesInDsl;
                })
                .flatMapMany(possibleEntityNamesInDsl -> newActionService.findUnpublishedActionsInPageByNames(possibleEntityNamesInDsl, pageId))
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                // Add dependencies of the actions found in the DSL in the graph.
                .map(action -> {
                    // This action is directly referenced in the DSL. This action is an ideal candidate for on page load
                    actionsUsedInDSL.add(action.getValidName());
                    extractAndSetActionBindingsInGraphEdges(edges, action, bindingsFromActions, actionsFoundDuringWalk);
                    return action;
                })
                .collectList()
                .thenReturn(edges);
    }

    /**
     * This function takes all the edges found and outputs a Directed Acyclic Graph. To create the complete graph, the
     * following steps are followed :
     * 1. Trim the edges to only contain relationships between property paths belonging to appsmith entities (actions,
     * widgets, global variables provided by appsmith). If any/all the vertices of the edge are unknown, the edge
     * is removed.
     * 2. Add implicit relationship between property paths and their immediate parents. This is to ensure that in the
     * DAG, all the relationships are considered.
     * e.g following are the implicit relationships generated for property path `Dropdown1.options[1].value`:
     * <p>
     * Dropdown1.options[1].value -> Dropdown1.options[1]
     * Dropdown1.options[1] -> Dropdown1.options
     * Dropdown1.options -> Dropdown1
     * <p>
     * 3. Now create the DAG using the edges after the two steps.
     *
     * @param actionNames
     * @param widgetNames
     * @param edges
     * @param actionsFoundDuringWalk
     * @param actionBindingsInDsl
     * @return
     */
    private DirectedAcyclicGraph<String, DefaultEdge> constructDAG(Set<String> actionNames,
                                                                   Set<String> widgetNames,
                                                                   Set<ActionDependencyEdge> edges,
                                                                   Set<String> actionsFoundDuringWalk,
                                                                   Set<String> actionBindingsInDsl) {

        DirectedAcyclicGraph<String, DefaultEdge> actionSchedulingGraph =
                new DirectedAcyclicGraph<>(DefaultEdge.class);

        // Add the vertices for all the actions found in the DSL
        for (String actionBindingInDsl : actionBindingsInDsl) {
            actionSchedulingGraph.addVertex(actionBindingInDsl);
        }

        Set<ActionDependencyEdge> implicitParentChildEdges = new HashSet<>();

        // Remove any edge which contains an unknown entity - aka neither a known action nor a known widget
        // Note : appsmith world objects like `appsmith` would also count as an unknown here.
        // TODO : Handle the above global variables provided by appsmith in the following filtering.
        edges = edges.stream().filter(edge -> {

                    String source = edge.getSource();
                    String target = edge.getTarget();

                    // Edges here are assumed to be non-null
                    // If an edge comprises vertices that depend on itself (caused by self-referencing),
                    // We want to throw an error before attempting to create the DAG
                    // Example: Text1.text has the value {{ Text1.text }}
                    if (source.equals(target)) {
                        throw new AppsmithException(AppsmithError.CYCLICAL_DEPENDENCY_ERROR, edge.toString());
                    }

                    Set<String> vertices = Set.of(source, target);

                    AtomicReference<Boolean> isValidVertex = new AtomicReference<>(true);

                    // Assert that the vertices which are entire property paths have a possible parent which is either
                    // an action or a widget or a static variable provided by appsmith at page/application level.
                    vertices
                            .stream()
                            .forEach(vertex -> {
                                Optional<String> validEntity = getPossibleParents(vertex)
                                        .stream()
                                        .filter(parent -> {
                                            if (!actionNames.contains(parent) && !widgetNames.contains(parent) && !APPSMITH_GLOBAL_VARIABLES.contains(parent)) {
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

        Set<String> actionDataPaths = actionNames
                .stream()
                .map(actionName ->  actionName + ".data")
                .collect(Collectors.toSet());

        Set<ActionDependencyEdge> actionDataFromConfigurationEdges = new HashSet<>();

        Set<String> vertices = new HashSet<>(actionSchedulingGraph.vertexSet());
        edges.stream().forEach(edge -> {
            vertices.add(edge.getSource());
            vertices.add(edge.getTarget());
        });


        // All actions data paths actually depend on the action configuration paths. Add this implicit relationship in the
        // graph as well
        // This also ensures that when an action.data vertex exists at two different levels in the graph, it gets a
        // single level because of a common relationship getting added to connect all actioConfiguration dependencies
        // to action.data
        vertices
                .stream()
                .forEach(vertex -> {
                    Optional<String> validActionParent = getPossibleParents(vertex)
                            .stream()
                            .filter(parent -> {
                                if (!actionNames.contains(parent)) {
                                    return false;
                                }
                                return true;
                            }).findFirst();

                    if (validActionParent.isPresent()) {
                        String actionName = validActionParent.get();
                        for (String actionDataPath : actionDataPaths) {
                            if (vertex.contains(actionDataPath)) {
                                // This vertex is actually a path on top of action.data (or equal to action.data)
                                // Add a relationship from action.actionConfiguration to action.data
                                String source = actionName + ".actionConfiguration";
                                String destination = vertex;
                                actionDataFromConfigurationEdges.add(new ActionDependencyEdge(source, destination));
                            }
                        }
                    }
                });

        edges.addAll(actionDataFromConfigurationEdges);

        // Now add the relationship aka when a child gets updated, the parent should get updated as well. Aka
        // parent depends on the child.
        for (ActionDependencyEdge edge : edges) {
            String source = edge.getSource();
            String target = edge.getTarget();

            Set<String> edgeVertices = Set.of(source, target);

            edgeVertices.stream().forEach(vertex -> implicitParentChildEdges.addAll(generateParentChildRelationships(vertex)));

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
                    throw new AppsmithException(AppsmithError.CYCLICAL_DEPENDENCY_ERROR, edge.toString());
                }
            }
        }

        return actionSchedulingGraph;
    }

    /**
     * This function takes a Directed Acyclic Graph and computes on page load actions. The final results is a list of set
     * of actions. The set contains all the independent actions which can be executed in parallel. The List represents
     * dependencies. The 0th index set contains actions which are executable immediately. The next index contains all
     * actions which depend on one or more of the actions which were executed from the 0th index set and so on.
     * Breadth First level by level traversal is used to compute each set of such independent actions.
     *
     * @param dag                   : The DAG graph containing all the edges representing dependencies between appsmith entities in the page.
     * @param pageLoadActionSet
     * @param onPageLoadActionSet
     * @param actionNames           : All the action names for the page
     * @return
     */
    private List<Set<String>> computeOnPageLoadActionsSchedulingOrder(DirectedAcyclicGraph<String, DefaultEdge> dag,
                                                                      Set<String> onPageLoadActionSet,
                                                                      Set<String> actionNames,
                                                                      Set<String> explicitUserSetOnLoadActions) {
        Map<String, Integer> pageLoadActionAndLevelMap = new HashMap<>();
        List<Set<String>> onPageLoadActions = new ArrayList<>();

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

            Set<String> actionsFromBinding = actionCandidatesForPageLoadFromBinding(actionNames, vertex,
                    pageLoadActionAndLevelMap, onPageLoadActions, explicitUserSetOnLoadActions);
            onPageLoadActions.get(level).addAll(actionsFromBinding);
            for (String action : actionsFromBinding) {
                pageLoadActionAndLevelMap.put(action, level);
            }
            onPageLoadActionSet.addAll(actionsFromBinding);
        }

        // Trim all empty sets from the list before returning.
        return onPageLoadActions.stream().filter(setOfActions -> !setOfActions.isEmpty()).collect(Collectors.toList());
    }


    /**
     * This function gets a set of binding names that come from other actions. It looks for actions in the page with
     * the same names as words in the binding names set. If yes, it creates a new set of dynamicBindingNames, adds these newly
     * found actions' bindings in the set, adds the new actions and their bindings to actionNames and edges and
     * recursively calls itself with the new set of dynamicBindingNames.
     * This ensures that the DAG that we create is complete and contains all possible actions and their dependencies
     *
     * @return
     */
    private Mono<Set<ActionDependencyEdge>> recursivelyAddActionsAndTheirDependentsToGraphFromBindings(String pageId,
                                                                                                       Set<ActionDependencyEdge> edges,
                                                                                                       Set<String> actionsFoundDuringWalk,
                                                                                                       Set<String> dynamicBindings) {
        if (dynamicBindings == null || dynamicBindings.isEmpty()) {
            return Mono.just(edges);
        }

        Set<String> possibleActionNames = new HashSet<>();

        dynamicBindings.stream().forEach(binding -> possibleActionNames.addAll(getPossibleParents(binding)));

        // All actions found from possibleActionNames set would add their dependencies in the following set for further
        // walk to find more actions recursively.
        Set<String> newBindings = new HashSet<>();

        // First fetch all the actions in the page whose name matches the words found in all the dynamic bindings
        Mono<List<ActionDTO>> findAndAddActionsInBindingsMono = newActionService.findUnpublishedActionsInPageByNames(possibleActionNames, pageId)
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .map(action -> {

                    extractAndSetActionBindingsInGraphEdges(edges, action, newBindings, actionsFoundDuringWalk);

                    return action;
                })
                .collectList();

        return findAndAddActionsInBindingsMono
                .flatMap(actions -> {
                    // Now that the next set of bindings have been found, find recursively all actions by these names
                    // and their bindings
                    return recursivelyAddActionsAndTheirDependentsToGraphFromBindings(pageId, edges, actionsFoundDuringWalk, newBindings);
                });
    }

    /**
     * This function finds all the actions which have been set to run on page load by the user and adds their
     * dependencies to the graph.
     * <p>
     * Note : If such an action has no dependencies and no interesting entity depends on it,
     * this action would still not get added to the output of page load scheduler. This function only ensures that the
     * dependencies of user set on page load actions are accounted for.
     * <p>
     * !!! WARNING !!! : This function updates the set `explicitUserSetOnLoadActions` and adds the names of all such
     * actions found in this function.
     *
     * @param pageId
     * @param edges
     * @param explicitUserSetOnLoadActions
     * @param actionsFoundDuringWalk
     * @param bindingsFromActions
     * @return
     */
    private Mono<Set<ActionDependencyEdge>> addExplicitUserSetOnLoadActionsToGraph(String pageId,
                                                                                   Set<ActionDependencyEdge> edges,
                                                                                   Set<String> explicitUserSetOnLoadActions,
                                                                                   Set<String> actionsFoundDuringWalk,
                                                                                   Set<String> bindingsFromActions) {

        //First fetch all the actions which have been tagged as on load by the user explicitly.
        return newActionService.findUnpublishedOnLoadActionsExplicitSetByUserInPage(pageId)
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                // Add the vertices and edges to the graph for these actions
                .map(actionDTO -> {
                    extractAndSetActionBindingsInGraphEdges(edges, actionDTO, bindingsFromActions, actionsFoundDuringWalk);
                    explicitUserSetOnLoadActions.add(actionDTO.getValidName());
                    return actionDTO;
                })
                .collectList()
                .thenReturn(edges);
    }

    /**
     * Given an action, this function adds all the dependencies the action to the graph edges. This is achieved by first
     * walking the action configuration and finding the paths and the mustache JS snippets found at the said path. Then
     * the relationship between the complete path and the property paths found in the mustache JS snippets are added to
     * the graph edges.
     * <p>
     * !!! WARNING !!! : This function updates the set actionsFoundDuringWalk since this function is called from all
     * places to add the action dependencies. If the action has already been discovered, this function exits by checking
     * in the actionsFoundDuringWalk, else, it adds it to the set.
     * This function also updates `edges` by adding all the new relationships for the said action in the set.
     *
     * @param edges
     * @param action
     * @param bindingsFromActions
     * @param actionsFoundDuringWalk
     */
    private void extractAndSetActionBindingsInGraphEdges(Set<ActionDependencyEdge> edges,
                                                         ActionDTO action,
                                                         Set<String> bindingsFromActions,
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

        Map<String, Set<String>> actionBindingMap = getActionBindingMap(action);

        Set<String> allBindings = new HashSet<>();
        actionBindingMap.values().stream().forEach(bindings -> allBindings.addAll(bindings));

        // TODO : Throw an error on action save when bindings from dynamic binding path list do not match the json path keys
        // and get the client to recompute the dynamic bidning pathlist and try again.
        if (!allBindings.containsAll(action.getJsonPathKeys())) {
            Set<String> invalidBindings = new HashSet<>(action.getJsonPathKeys());
            invalidBindings.removeAll(allBindings);
            log.error("Invalid dynamic binding path list for action id {}. Not taking the following bindings in " +
                            "consideration for computing on page load actions : {}",
                    action.getId(),
                    invalidBindings);
        }

        Set<String> bindingPaths = actionBindingMap.keySet();

        for (String bindingPath : bindingPaths) {
            Set<String> dynamicBindings = actionBindingMap.get(bindingPath);
            for (String binding : dynamicBindings) {
                Set<String> entityPaths = getWordsFromMustache(binding);
                for (String source : entityPaths) {
                    // TODO : Since its words from binding instead of possible parents Api1 would be recognized as
                    //  source instead of Api1.data (since getWordsFromMustache would split Api1 and data from Api1.data)
                    ActionDependencyEdge edge = new ActionDependencyEdge(source, bindingPath);
                    edges.add(edge);
                }
                // Add all the binding words further examination for dependencies in the future.
                bindingsFromActions.addAll(entityPaths);
            }
        }
    }

    /**
     * This function walks the widget bindings and adds all the relationships which have been discovered earlier while
     * walking the DSL and extracting all the relationships into edges between the widget path where there is a dynamic
     * binding and the entities in the bindings.
     *
     * @param edges
     * @param widgetBindingMap
     * @param allActionNames
     * @return
     */
    private Mono<Set<ActionDependencyEdge>> addWidgetRelationshipToGraph(Set<ActionDependencyEdge> edges,
                                                                         Map<String, Set<String>> widgetBindingMap,
                                                                         Set<String> allActionNames) {
        // This part will ensure that we are discovering widget to widget relationships.
        return Mono.just(widgetBindingMap)
                .map(widgetDynamicBindingsMap -> {
                    widgetDynamicBindingsMap.forEach((widgetPath, widgetDynamicBindings) -> {

                        // Given the widget path, add all the relationships between the binding to the path
                        widgetDynamicBindings.stream().forEach(binding -> {
                            Set<String> entityPaths = getWordsFromMustache(binding);
                            for (String source : entityPaths) {

                                // Only add widget to widget relationships. Skip adding the action to widget relationship
                                // since this has already been recognized in step 1 of addDirectlyReferencedActionsToGraph
                                Set<String> possibleParents = getPossibleParents(source);

                                Boolean interestingRelationship = TRUE;
                                for (String entity : possibleParents) {

                                    // if this generated entity name from the binding matches an action name, skip this
                                    // entityPath entirely since this relationship has already been captured.
                                    if (allActionNames.contains(entity)) {
                                        interestingRelationship = FALSE;
                                    }
                                }
                                if (interestingRelationship) {
                                    ActionDependencyEdge edge = new ActionDependencyEdge(source, widgetPath);
                                    edges.add(edge);
                                }
                            }
                        });

                    });

                    return widgetDynamicBindingsMap;
                })
                .thenReturn(edges);
    }


    private boolean hasUserSetActionToNotRunOnPageLoad(ActionDTO unpublishedAction) {
        if (TRUE.equals(unpublishedAction.getUserSetOnLoad())
                && !TRUE.equals(unpublishedAction.getExecuteOnLoad())) {
            return true;
        }

        return false;
    }

    /**
     * This function walks the action configuration and extracts a map of all the dynamic bindings present and the
     * action path where they exist.
     *
     * @param action
     * @return
     */
    private Map<String, Set<String>> getActionBindingMap(ActionDTO action) {

        List<Property> dynamicBindingPathList = action.getDynamicBindingPathList();
        Map<String, Set<String>> completePathToDynamicBindingMap = new HashMap<>();

        Map<String, Object> configurationObj = objectMapper.convertValue(action.getActionConfiguration(), Map.class);

        if (dynamicBindingPathList != null) {
            // Each of these might have nested structures, so we iterate through them to find the leaf node for each
            for (Property x : dynamicBindingPathList) {
                final String fieldPath = String.valueOf(x.getKey());

                // Ignore pagination configuration since paginatio technically does not belong to dynamic binding list.
                if (fieldPath.equals("prev") || fieldPath.equals("next")) {
                    continue;
                }

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

                    Boolean isBindingPresentInString = MustacheHelper.laxIsBindingPresentInString((String) parent);
                    // We found the path. But if the path has mustache bindings, record the same in the map
                    // In case
                    if (isBindingPresentInString || PluginType.JS.equals(action.getPluginType())) {
                        Set<String> mustacheKeysFromFields;
                        // Stricter extraction of dynamic bindings
                        if (isBindingPresentInString) {
                            mustacheKeysFromFields = MustacheHelper.extractMustacheKeysFromFields(parent);
                        } else {
                            // this must be a JS function. No need to extract mustache. The entire string is JS body
                            mustacheKeysFromFields = Set.of((String) parent);
                        }

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

    /**
     * This function creates all `child -> parent` edges given a path.
     * <p>
     * For example, given path `Dropdown1.options[1].value`, the following relationships are generated :
     * <p>
     * Dropdown1.options[1].value -> Dropdown1.options[1]
     * Dropdown1.options[1] -> Dropdown1.options
     * Dropdown1.options -> Dropdown1
     *
     * @param path
     * @return
     */
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

    /**
     * Given a dynamic binding, this function checks if it is a candidate for on page load. This is done by checking for
     * the following two conditions :
     * - Is it an action name (which has been found in the page). If not, ignore.
     * - Has this action already been found for page load? If yes, ignore.
     * - If JS, following two conditions are checked for :
     * - If sync function, ignore. This is because client would execute the same during dynamic binding eval
     * - If async function, it is a candidate only if the data for the function is referred in the dynamic binding.
     *
     * @param allActionNames
     * @param vertex
     * @param pageLoadActionsLevelMap
     * @param existingPageLoadActions
     * @return
     */
    private Set<String> actionCandidatesForPageLoadFromBinding(Set<String> allActionNames,
                                                               String vertex,
                                                               Map<String, Integer> pageLoadActionsLevelMap,
                                                               List<Set<String>> existingPageLoadActions,
                                                               Set<String> explicitUserSetOnLoadActions) {

        Set<String> onPageLoadCandidates = new HashSet<>();

        Set<String> possibleParents = getPossibleParents(vertex);

        for (String entity : possibleParents) {

            // if this generated entity name from the binding matches an action name check for its eligibility
            if (allActionNames.contains(entity)) {

                Boolean isCandidateForPageLoad = TRUE;

                /**
                 * Add action for page load if:
                 *  o it has been explicitly set to run on page load by the user (even if its data is not
                 *  referenced in any widget or action)
                 *  o or, it is not a function call i.e. the data of this call is being referred to in the binding.
                 */

                String validBinding;
                if (explicitUserSetOnLoadActions.contains(entity)) {
                    validBinding = entity + "." + "actionConfiguration";
                }
                else {
                    validBinding = entity + "." + "data";
                }

                if (!vertex.contains(validBinding)) {
                    isCandidateForPageLoad = FALSE;
                }

                if (isCandidateForPageLoad) {

                    // Check if this action has already been added to page load actions.
                    if (pageLoadActionsLevelMap.containsKey(entity)) {
                        // Remove this action from the existing level so that it can be added again at a deeper level.
                        Integer level = pageLoadActionsLevelMap.get(entity);
                        existingPageLoadActions.get(level).remove(entity);
                    }

                    onPageLoadCandidates.add(entity);
                }
            }
        }

        return onPageLoadCandidates;
    }

    private boolean isAsyncJsFunctionCall(ActionDTO action, String binding) {
        if (PluginType.JS.equals(action.getPluginType()) &&
                TRUE.equals(action.getActionConfiguration().getIsAsync())) {

            // This function is ASYNC. Now check if the binding is a function call. If yes, then this action would not
            // be a candidate for on page load.
            String name = action.getValidName();

            // Regex pattern to check for actionname(parameter1, parameter2..) where no parameters are also allowed.
            String regexForFunctionCall = name + "\\([^\\)]*\\)(\\.[^\\)]*\\))?";
            Pattern functionCallPattern = Pattern.compile(regexForFunctionCall);
            Matcher matcher = functionCallPattern.matcher(binding);

            if (matcher.find()) {
                return TRUE;
            }
        }

        return FALSE;
    }

    private DslActionDTO getDslAction(ActionDTO actionDTO) {

        DslActionDTO dslActionDTO = new DslActionDTO();

        dslActionDTO.setId(actionDTO.getId());
        dslActionDTO.setPluginType(actionDTO.getPluginType());
        dslActionDTO.setJsonPathKeys(actionDTO.getJsonPathKeys());
        dslActionDTO.setName(actionDTO.getValidName());
        dslActionDTO.setCollectionId(actionDTO.getCollectionId());
        dslActionDTO.setClientSideExecution(actionDTO.getClientSideExecution());
        if (actionDTO.getDefaultResources() != null) {
            dslActionDTO.setDefaultActionId(actionDTO.getDefaultResources().getActionId());
        }

        if (actionDTO.getActionConfiguration() != null) {
            dslActionDTO.setTimeoutInMillisecond(actionDTO.getActionConfiguration().getTimeoutInMillisecond());
        }

        return dslActionDTO;
    }

}

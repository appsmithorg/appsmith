package com.appsmith.server.solutions.ce;

import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.EntityDependencyNode;
import com.appsmith.external.models.EntityReferenceType;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Property;
import com.appsmith.server.domains.ActionDependencyEdge;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.AstService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.solutions.ActionPermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.graph.DirectedAcyclicGraph;
import org.jgrapht.traverse.BreadthFirstIterator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

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

import static com.appsmith.external.helpers.MustacheHelper.ACTION_ENTITY_REFERENCES;
import static com.appsmith.external.helpers.MustacheHelper.WIDGET_ENTITY_REFERENCES;
import static com.appsmith.external.helpers.MustacheHelper.getPossibleParents;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
@RequiredArgsConstructor
public class PageLoadActionsUtilCEImpl implements PageLoadActionsUtilCE {

    private final NewActionService newActionService;

    private final AstService astService;
    private final ActionPermission actionPermission;
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
     * @param evaluatedVersion         : Depending on the evaluated version, the way the AST parsing logic picks entities in the dynamic binding will change
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
     * @return Returns page load actions which is a list of sets of actions. Inside a set, all actions can be executed
     * in parallel. But one set of actions MUST finish execution before the next set of actions can be executed
     * in the list.
     */
    public Mono<List<Set<DslActionDTO>>> findAllOnLoadActions(String pageId,
                                                              Integer evaluatedVersion,
                                                              Set<String> widgetNames,
                                                              Set<ActionDependencyEdge> edges,
                                                              Map<String, Set<String>> widgetDynamicBindingsMap,
                                                              List<ActionDTO> flatPageLoadActions,
                                                              Set<String> actionsUsedInDSL) {

        Set<String> onPageLoadActionSet = new HashSet<>();
        Set<String> explicitUserSetOnLoadActions = new HashSet<>();
        Set<String> bindingsFromActions = new HashSet<>();

        // Function `extractAndSetActionBindingsInGraphEdges` updates this map to keep a track of all the actions which
        // have been discovered while walking the actions to ensure that we don't end up in a recursive infinite loop
        // in case of a cyclical relationship between actions (and not specific paths) and helps us exit at the appropriate
        // junction.
        // e.g : Consider the following relationships :
        // Api1.actionConfiguration.body <- Api2.data.users[0].name
        // Api2.actionConfiguration.url <- Api1.actionConfiguration.url
        // In the above case, the two actions depend on each other without there being a real cyclical dependency.
        Map<String, EntityDependencyNode> actionsFoundDuringWalk = new HashMap<>();

        Flux<ActionDTO> allActionsByPageIdFlux = newActionService
                .findByPageIdAndViewMode(pageId, false, actionPermission.getEditPermission())
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .cache();

        Mono<Map<String, ActionDTO>> actionNameToActionMapMono = allActionsByPageIdFlux.collectMap(ActionDTO::getValidName, action -> action).cache();

        Mono<Set<String>> actionsInPageMono = allActionsByPageIdFlux.map(ActionDTO::getValidName).collect(Collectors.toSet()).cache();

        Set<EntityDependencyNode> actionBindingsInDsl = new HashSet<>();
        Mono<Set<ActionDependencyEdge>> directlyReferencedActionsAddedToGraphMono =
                addDirectlyReferencedActionsToGraph(
                        edges,
                        actionsUsedInDSL,
                        bindingsFromActions,
                        actionsFoundDuringWalk,
                        widgetDynamicBindingsMap,
                        actionNameToActionMapMono,
                        actionBindingsInDsl,
                        evaluatedVersion);

        // This following `createAllEdgesForPageMono` publisher traverses the actions and widgets to add all possible
        // edges between all possible entity paths

        // First find all the actions in the page whose name matches the possible entity names found in the bindings in the widget
        Mono<Set<ActionDependencyEdge>> createAllEdgesForPageMono = directlyReferencedActionsAddedToGraphMono
                // Add dependencies of all on page load actions set by the user in the graph
                .flatMap(updatedEdges -> addExplicitUserSetOnLoadActionsToGraph(
                        pageId,
                        updatedEdges,
                        explicitUserSetOnLoadActions,
                        actionsFoundDuringWalk,
                        bindingsFromActions,
                        actionNameToActionMapMono,
                        actionBindingsInDsl,
                        evaluatedVersion))
                // For all the actions found so far, recursively walk the dynamic bindings of the actions to find more relationships with other actions (& widgets)
                .flatMap(updatedEdges -> recursivelyAddActionsAndTheirDependentsToGraphFromBindings(
                        updatedEdges,
                        actionsFoundDuringWalk,
                        bindingsFromActions,
                        actionNameToActionMapMono,
                        evaluatedVersion))
                // At last, add all the widget relationships to the graph as well.
                .zipWith(actionsInPageMono)
                .flatMap(tuple -> {
                    Set<ActionDependencyEdge> updatedEdges = tuple.getT1();
                    return addWidgetRelationshipToGraph(updatedEdges, widgetDynamicBindingsMap, evaluatedVersion);
                });


        // Create a graph given edges
        Mono<DirectedAcyclicGraph<String, DefaultEdge>> createGraphMono = Mono.zip(actionsInPageMono, createAllEdgesForPageMono)
                .map(tuple -> {
                    Set<String> allActions = tuple.getT1();
                    Set<ActionDependencyEdge> updatedEdges = tuple.getT2();
                    return constructDAG(allActions, widgetNames, updatedEdges, actionBindingsInDsl);
                }).cache();

        // Generate on page load schedule
        Mono<List<Set<String>>> computeOnPageLoadScheduleNamesMono = Mono.zip(actionNameToActionMapMono, createGraphMono)
                .map(tuple -> {
                    Map<String, ActionDTO> actionNameToActionMap = tuple.getT1();
                    DirectedAcyclicGraph<String, DefaultEdge> graph = tuple.getT2();

                    return computeOnPageLoadActionsSchedulingOrder(graph, onPageLoadActionSet, actionNameToActionMap, explicitUserSetOnLoadActions);
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
                        onPageLoadActionSet.addAll(pageLoadActionNames);

                        // In case there are no page load actions, initialize the 0th set of page load actions list.
                        if (onPageLoadActionsSchedulingOrder.isEmpty()) {
                            onPageLoadActionsSchedulingOrder.add(new HashSet<>());
                        }

                        onPageLoadActionsSchedulingOrder.get(0).addAll(pageLoadActionNames);
                    }

                    return onPageLoadActionsSchedulingOrder;
                });


        // Transform the schedule order into client feasible DTO
        Mono<List<Set<DslActionDTO>>> computeCompletePageLoadActionScheduleMono =
                filterAndTransformSchedulingOrderToDTO(
                        onPageLoadActionSet,
                        actionNameToActionMapMono,
                        computeOnPageLoadScheduleNamesMono)
                        .cache();


        // With the final on page load scheduling order, also set the on page load actions which would be updated
        // by the caller function
        Mono<List<ActionDTO>> flatPageLoadActionsMono = computeCompletePageLoadActionScheduleMono.then(actionNameToActionMapMono).map(actionMap -> {
            onPageLoadActionSet.stream().forEach(actionName -> flatPageLoadActions.add(actionMap.get(actionName)));
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

                    return onPageLoadActions.stream()
                            .filter(setOfActions -> !setOfActions.isEmpty())
                            .collect(Collectors.toList());
                });
    }

    /**
     * This method is used to find all possible global entity references in the given set of bindings.
     * We'll be able to find valid action references only at this point. For widgets, we just assume that all
     * references are possible candidates
     *
     * @param actionNameToActionMapMono : This map is used to filter only valid action references in bindings
     * @param bindings                  : The set of bindings to find references from
     * @param evalVersion               : Depending on the evaluated version, the way the AST parsing logic picks entities in the dynamic binding will change
     * @return A set of any possible reference found in the binding that qualifies as a global entity reference
     */
    private Mono<Set<EntityDependencyNode>> getPossibleEntityReferences(Mono<Map<String, ActionDTO>> actionNameToActionMapMono,
                                                                        Set<String> bindings,
                                                                        int evalVersion) {
        return getPossibleEntityReferences(actionNameToActionMapMono, bindings, evalVersion, null);
    }

    /**
     * Similar to the overridden method, this method is used to find all possible global entity references in the given set of bindings.
     * However, here we are assuming that the call came from when we were trying to analyze the DSL.
     * For such cases, we also want to capture entity references that would be qualified to run on page load first.
     *
     * @param actionNameToActionMapMono : This map is used to filter only valid action references in bindings
     * @param bindings                  : The set of bindings to find references from
     * @param evalVersion               : Depending on the evaluated version, the way the AST parsing logic picks entities in the dynamic binding will change
     * @param bindingsInDsl             : All references are also added to this set if they should be qualified to run on page load first.
     * @return A set of any possible reference found in the binding that qualifies as a global entity reference
     */
    private Mono<Set<EntityDependencyNode>> getPossibleEntityReferences(Mono<Map<String, ActionDTO>> actionNameToActionMapMono,
                                                                        Set<String> bindings,
                                                                        int evalVersion,
                                                                        Set<EntityDependencyNode> bindingsInDsl) {
        // We want to be finding both type of references
        final int entityTypes = ACTION_ENTITY_REFERENCES | WIDGET_ENTITY_REFERENCES;

        return actionNameToActionMapMono
                .zipWith(getPossibleEntityParentsMap(bindings, entityTypes, evalVersion))
                .map(tuple -> {
                    Map<String, ActionDTO> actionMap = tuple.getT1();
                    // For each binding, here we receive a set of possible references to global entities
                    // At this point we're guaranteed that these references are made to possible variables,
                    // but we do not know if those entities exist in the global namespace yet
                    Map<String, Set<EntityDependencyNode>> bindingToPossibleParentMap = tuple.getT2();

                    Set<EntityDependencyNode> possibleEntitiesReferences = new HashSet<>();

                    // From these references, we will try to validate action references at this point
                    // Each identified node is already annotated with the expected type of entity we need to search for
                    bindingToPossibleParentMap.entrySet()
                            .stream()
                            .forEach(entry -> {
                                Set<EntityDependencyNode> bindingsWithActionReference = new HashSet<>();
                                entry.getValue()
                                        .stream()
                                        .forEach(binding -> {
                                            // For each possible reference node, check if the reference was to an action
                                            ActionDTO actionDTO = actionMap.get(binding.getValidEntityName());

                                            if (actionDTO != null) {
                                                // If it was, and had been identified as the same type of action as what exists in this app,
                                                if ((PluginType.JS.equals(actionDTO.getPluginType()) && EntityReferenceType.JSACTION.equals(binding.getEntityReferenceType()))
                                                        || (!PluginType.JS.equals(actionDTO.getPluginType()) && EntityReferenceType.ACTION.equals(binding.getEntityReferenceType()))) {
                                                    // Copy over some data from the identified action, this ensures that we do not have to query the DB again later
                                                    binding.setIsAsync(actionDTO.getActionConfiguration().getIsAsync());
                                                    binding.setActionDTO(actionDTO);
                                                    bindingsWithActionReference.add(binding);
                                                    // Only if this is not an async JS function action and is not a direct JS function call,
                                                    // add it to a possible on page load action call.
                                                    // This discards the following type:
                                                    // {{ JSObject1.asyncFunc() }}
                                                    if (!(TRUE.equals(binding.getIsAsync()) && TRUE.equals(binding.getIsFunctionCall()))) {
                                                        possibleEntitiesReferences.add(binding);
                                                    }
                                                    // We're ignoring any reference that was identified as a widget but actually matched an action
                                                    // We wouldn't have discarded JS collection names here, but this is just an optimization, so it's fine
                                                }
                                            } else {
                                                // If the reference node was identified as a widget, directly add it as a possible reference
                                                // Because we are not doing any validations for widget references at this point
                                                if (EntityReferenceType.WIDGET.equals(binding.getEntityReferenceType())) {
                                                    possibleEntitiesReferences.add(binding);
                                                }
                                            }
                                        });

                                if (!bindingsWithActionReference.isEmpty() && bindingsInDsl != null) {
                                    bindingsInDsl.addAll(bindingsWithActionReference);
                                }
                            });

                    return possibleEntitiesReferences;
                });
    }

    /**
     * This method is an abstraction that queries the ast service for possible global references as string values,
     * and then uses the mustache helper utility to classify these global references into possible types of EntityDependencyNodes
     *
     * @param bindings    : A set of binding values as string to analyze
     * @param types       : The types of EntityDependencyNode references to look for
     * @param evalVersion : Depending on the evaluated version, the way the AST parsing logic picks entities in the dynamic binding will change
     * @return A mono of a map of each of the provided binding values to the possible set of EntityDependencyNodes found in the binding
     */
    private Mono<Map<String, Set<EntityDependencyNode>>> getPossibleEntityParentsMap(Set<String> bindings, int types, int evalVersion) {
        Flux<Tuple2<String, Set<String>>> findingToReferencesFlux =
                astService.getPossibleReferencesFromDynamicBinding(new ArrayList<>(bindings), evalVersion);
        return MustacheHelper.getPossibleEntityParentsMap(findingToReferencesFlux, types);
    }

    /**
     * This function finds all the actions in the page whose name matches the possible entity names found in the
     * bindings in the widget. Caveat : It first removes all invalid bindings from the set of all bindings from the DSL
     * This today means only the usage of an async JS function as a call instead of referring to the `.data`.
     * <p>
     * !!! WARNING !!! : This function updates actionsUsedInDSL set which is used to store all the directly referenced
     * actions in the DSL.
     *
     * @param edges
     * @param actionsUsedInDSL
     * @param bindingsFromActions
     * @param actionsFoundDuringWalk
     * @param widgetDynamicBindingsMap
     * @param actionNameToActionMapMono
     * @param actionBindingsInDsl
     * @param evalVersion
     * @return
     */
    private Mono<Set<ActionDependencyEdge>> addDirectlyReferencedActionsToGraph(Set<ActionDependencyEdge> edges,
                                                                                Set<String> actionsUsedInDSL,
                                                                                Set<String> bindingsFromActions,
                                                                                Map<String, EntityDependencyNode> actionsFoundDuringWalk,
                                                                                Map<String, Set<String>> widgetDynamicBindingsMap,
                                                                                Mono<Map<String, ActionDTO>> actionNameToActionMapMono,
                                                                                Set<EntityDependencyNode> actionBindingsInDsl,
                                                                                int evalVersion) {
        return Flux.fromIterable(widgetDynamicBindingsMap.entrySet())
                .flatMap(entry -> {
                    String widgetName = entry.getKey();
                    // For each widget in the DSL that has a dynamic binding, we define an entity dependency node beforehand
                    // This will be a leaf node in the DAG that is constructed for on page load dependencies
                    EntityDependencyNode widgetDependencyNode = new EntityDependencyNode(EntityReferenceType.WIDGET, widgetName, widgetName, null, null, null);
                    Set<String> bindingsInWidget = entry.getValue();
                    return getPossibleEntityReferences(actionNameToActionMapMono, bindingsInWidget, evalVersion, actionBindingsInDsl)
                            .flatMapMany(Flux::fromIterable)
                            // Add dependencies of the actions found in the DSL in the graph
                            // We are ignoring the widget references at this point
                            // TODO: Possible optimization in the future
                            .flatMap(possibleEntity -> {
                                if (EntityReferenceType.ACTION.equals(possibleEntity.getEntityReferenceType())
                                        || EntityReferenceType.JSACTION.equals(possibleEntity.getEntityReferenceType())) {
                                    edges.add(new ActionDependencyEdge(possibleEntity, widgetDependencyNode));
                                    // This action is directly referenced in the DSL. This action is an ideal candidate for on page load
                                    actionsUsedInDSL.add(possibleEntity.getValidEntityName());
                                    ActionDTO actionDTO = possibleEntity.getActionDTO();
                                    return newActionService.fillSelfReferencingDataPaths(actionDTO)
                                            .map(newActionDTO -> {
                                                possibleEntity.setActionDTO(newActionDTO);
                                                return newActionDTO;
                                            })
                                            .flatMap(newActionDTO -> extractAndSetActionBindingsInGraphEdges(possibleEntity,
                                                    edges,
                                                    bindingsFromActions,
                                                    actionNameToActionMapMono,
                                                    actionsFoundDuringWalk,
                                                    null,
                                                    evalVersion))
                                            .thenReturn(possibleEntity);
                                }
                                return Mono.just(possibleEntity);
                            });
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
     * @param actionBindingsInDsl
     * @return
     */
    private DirectedAcyclicGraph<String, DefaultEdge> constructDAG(Set<String> actionNames,
                                                                   Set<String> widgetNames,
                                                                   Set<ActionDependencyEdge> edges,
                                                                   Set<EntityDependencyNode> actionBindingsInDsl) {

        DirectedAcyclicGraph<String, DefaultEdge> actionSchedulingGraph = new DirectedAcyclicGraph<>(DefaultEdge.class);

        // Add the vertices for all the actions found in the DSL
        for (EntityDependencyNode actionBindingInDsl : actionBindingsInDsl) {
            actionSchedulingGraph.addVertex(actionBindingInDsl.getReferenceString());
        }

        Set<ActionDependencyEdge> implicitParentChildEdges = new HashSet<>();

        // Remove any edge which contains an unknown entity - aka neither a known action nor a known widget
        // Note : appsmith world objects like `appsmith` would also count as an unknown here.
        // TODO : Handle the above global variables provided by appsmith in the following filtering.
        edges = edges.stream()
                .filter(edge -> {

                    String source = edge.getSourceNode().getReferenceString();
                    String target = edge.getTargetNode().getReferenceString();

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
                    vertices.stream().forEach(vertex -> {
                        Optional<String> validEntity = getPossibleParents(vertex).stream().filter(parent -> {
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

        Set<ActionDependencyEdge> actionDataFromConfigurationEdges = new HashSet<>();

        edges.stream().forEach(edge -> {
            addImplicitActionConfigurationDependency(edge.getSourceNode(), actionDataFromConfigurationEdges);
            addImplicitActionConfigurationDependency(edge.getTargetNode(), actionDataFromConfigurationEdges);
        });

        edges.addAll(actionDataFromConfigurationEdges);

        // Now add the relationship aka when a child gets updated, the parent should get updated as well. Aka
        // parent depends on the child.
        for (ActionDependencyEdge edge : edges) {
            EntityDependencyNode source = edge.getSourceNode();
            EntityDependencyNode target = edge.getTargetNode();

            Set<EntityDependencyNode> edgeVertices = Set.of(source, target);

            edgeVertices.stream().forEach(vertex -> implicitParentChildEdges.addAll(generateParentChildRelationships(vertex)));

        }

        edges.addAll(implicitParentChildEdges);

        // Now create the graph from all the edges.
        for (ActionDependencyEdge edge : edges) {

            String source = edge.getSourceNode().getReferenceString();
            String target = edge.getTargetNode().getReferenceString();

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
     * All actions data paths actually depend on the action configuration paths.
     * Add this implicit relationship in the graph as well
     * This also ensures that when an action.data vertex exists at two different levels in the graph, it gets a
     * single level because of a common relationship getting added to connect all actionConfiguration dependencies
     * to action.data
     *
     * @param entityDependencyNode
     * @param actionDataFromConfigurationEdges
     */
    private void addImplicitActionConfigurationDependency(EntityDependencyNode entityDependencyNode, Set<ActionDependencyEdge> actionDataFromConfigurationEdges) {
        if (Set.of(EntityReferenceType.ACTION, EntityReferenceType.JSACTION).contains(entityDependencyNode.getEntityReferenceType())) {
            if (entityDependencyNode.isValidDynamicBinding()) {
                EntityDependencyNode sourceDependencyNode = new EntityDependencyNode(entityDependencyNode.getEntityReferenceType(), entityDependencyNode.getValidEntityName(), entityDependencyNode.getValidEntityName() + ".actionConfiguration", entityDependencyNode.getIsAsync(), entityDependencyNode.getIsFunctionCall(), entityDependencyNode.getActionDTO());
                actionDataFromConfigurationEdges.add(new ActionDependencyEdge(sourceDependencyNode, entityDependencyNode));
            }
        }
    }


    /**
     * This function takes a Directed Acyclic Graph and computes on page load actions. The final results is a list of set
     * of actions. The set contains all the independent actions which can be executed in parallel. The List represents
     * dependencies. The 0th index set contains actions which are executable immediately. The next index contains all
     * actions which depend on one or more of the actions which were executed from the 0th index set and so on.
     * Breadth First level by level traversal is used to compute each set of such independent actions.
     *
     * @param dag                   : The DAG graph containing all the edges representing dependencies between appsmith entities in the page.
     * @param onPageLoadActionSet
     * @param actionNameToActionMap : All the action names for the page
     * @return
     */
    private List<Set<String>> computeOnPageLoadActionsSchedulingOrder(DirectedAcyclicGraph<String, DefaultEdge> dag,
                                                                      Set<String> onPageLoadActionSet,
                                                                      Map<String, ActionDTO> actionNameToActionMap,
                                                                      Set<String> explicitUserSetOnLoadActions) {
        Map<String, Integer> pageLoadActionAndLevelMap = new HashMap<>();
        List<Set<String>> onPageLoadActions = new ArrayList<>();

        // Find all root nodes to start the BFS traversal from
        List<String> rootNodes = dag.vertexSet().stream().filter(key -> dag.incomingEdgesOf(key).size() == 0).collect(Collectors.toList());

        BreadthFirstIterator<String, DefaultEdge> bfsIterator = new BreadthFirstIterator<>(dag, rootNodes);

        // Implementation of offline scheduler by using level by level traversal. Level i+1 actions would be dependent
        // on Level i actions. All actions in a level can run independently and hence would get added to the same set.
        while (bfsIterator.hasNext()) {

            String vertex = bfsIterator.next();
            int level = bfsIterator.getDepth(vertex);
            if (onPageLoadActions.size() <= level) {
                onPageLoadActions.add(new HashSet<>());
            }

            Set<String> actionsFromBinding = actionCandidatesForPageLoadFromBinding(actionNameToActionMap, vertex, pageLoadActionAndLevelMap, onPageLoadActions, explicitUserSetOnLoadActions);
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
    private Mono<Set<ActionDependencyEdge>> recursivelyAddActionsAndTheirDependentsToGraphFromBindings(Set<ActionDependencyEdge> edges,
                                                                                                       Map<String, EntityDependencyNode> actionsFoundDuringWalk,
                                                                                                       Set<String> dynamicBindings,
                                                                                                       Mono<Map<String, ActionDTO>> actionNameToActionMapMono,
                                                                                                       int evalVersion) {
        if (dynamicBindings == null || dynamicBindings.isEmpty()) {
            return Mono.just(edges);
        }

        // All actions found from possibleActionNames set would add their dependencies in the following set for further
        // walk to find more actions recursively.
        Set<String> newBindings = new HashSet<>();

        // First fetch all the actions in the page whose name matches the words found in all the dynamic bindings
        Mono<List<EntityDependencyNode>> findAndAddActionsInBindingsMono = getPossibleEntityReferences(actionNameToActionMapMono, dynamicBindings, evalVersion).flatMapMany(Flux::fromIterable)
                // Add dependencies of the actions found in the DSL in the graph.
                .flatMap(possibleEntity -> {
                    if (Set.of(EntityReferenceType.JSACTION, EntityReferenceType.ACTION).contains(possibleEntity.getEntityReferenceType())) {
                        ActionDTO actionDTO = possibleEntity.getActionDTO();
                        return newActionService.fillSelfReferencingDataPaths(actionDTO).map(newActionDTO -> {
                            possibleEntity.setActionDTO(newActionDTO);
                            return newActionDTO;
                        }).then(extractAndSetActionBindingsInGraphEdges(possibleEntity, edges, newBindings, actionNameToActionMapMono, actionsFoundDuringWalk, null, evalVersion)).thenReturn(possibleEntity);
                    } else {
                        return Mono.empty();
                    }
                }).collectList();

        return findAndAddActionsInBindingsMono.flatMap(entityDependencyNodes -> {
            // Now that the next set of bindings have been found, find recursively all actions by these names
            // and their bindings
            return recursivelyAddActionsAndTheirDependentsToGraphFromBindings(edges, actionsFoundDuringWalk, newBindings, actionNameToActionMapMono, evalVersion);
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
                                                                                   Map<String, EntityDependencyNode> actionsFoundDuringWalk,
                                                                                   Set<String> bindingsFromActions,
                                                                                   Mono<Map<String, ActionDTO>> actionNameToActionMapMono,
                                                                                   Set<EntityDependencyNode> actionBindingsInDsl,
                                                                                   int evalVersion) {

        //First fetch all the actions which have been tagged as on load by the user explicitly.
        return newActionService.findUnpublishedOnLoadActionsExplicitSetByUserInPage(pageId)
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .flatMap(newActionService::fillSelfReferencingDataPaths)
                // Add the vertices and edges to the graph for these actions
                .flatMap(actionDTO -> {
                    EntityDependencyNode entityDependencyNode = new EntityDependencyNode(actionDTO.getPluginType().equals(PluginType.JS) ? EntityReferenceType.JSACTION : EntityReferenceType.ACTION, actionDTO.getValidName(), null, null, false, actionDTO);
                    explicitUserSetOnLoadActions.add(actionDTO.getValidName());
                    return extractAndSetActionBindingsInGraphEdges(
                            entityDependencyNode,
                            edges,
                            bindingsFromActions,
                            actionNameToActionMapMono,
                            actionsFoundDuringWalk,
                            actionBindingsInDsl,
                            evalVersion)
                            .thenReturn(actionDTO);
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
     * @param entityDependencyNode
     * @param bindingsFromActions
     * @param actionsFoundDuringWalk
     */
    private Mono<Void> extractAndSetActionBindingsInGraphEdges(EntityDependencyNode entityDependencyNode,
                                                               Set<ActionDependencyEdge> edges,
                                                               Set<String> bindingsFromActions,
                                                               Mono<Map<String, ActionDTO>> actionNameToActionMapMono,
                                                               Map<String, EntityDependencyNode> actionsFoundDuringWalk,
                                                               Set<EntityDependencyNode> bindingsInDsl,
                                                               int evalVersion) {

        ActionDTO action = entityDependencyNode.getActionDTO();

        // Check if the action has been deleted in unpublished state. If yes, ignore it.
        if (action.getDeletedAt() != null) {
            return Mono.empty().then();
        }

        String name = entityDependencyNode.getValidEntityName();

        if (actionsFoundDuringWalk.containsKey(name)) {
            // This action has already been found in our walk. Ignore this.
            return Mono.empty().then();
        }
        actionsFoundDuringWalk.put(name, entityDependencyNode);

        Map<String, Set<String>> actionBindingMap = getActionBindingMap(action);

        Set<String> allBindings = new HashSet<>();
        actionBindingMap.values().stream().forEach(bindings -> allBindings.addAll(bindings));

        // TODO : Throw an error on action save when bindings from dynamic binding path list do not match the json path keys
        //  and get the client to recompute the dynamic binding path list and try again.
        if (!allBindings.containsAll(action.getJsonPathKeys())) {
            Set<String> invalidBindings = new HashSet<>(action.getJsonPathKeys());
            invalidBindings.removeAll(allBindings);
            log.error("Invalid dynamic binding path list for action id {}. Not taking the following bindings in " + "consideration for computing on page load actions : {}", action.getId(), invalidBindings);
        }

        Set<String> bindingPaths = actionBindingMap.keySet();

        return Flux.fromIterable(bindingPaths).flatMap(bindingPath -> {
                    EntityDependencyNode actionDependencyNode = new EntityDependencyNode(entityDependencyNode.getEntityReferenceType(), entityDependencyNode.getValidEntityName(), bindingPath, null, false, action);
                    return getPossibleEntityReferences(actionNameToActionMapMono, actionBindingMap.get(bindingPath), evalVersion, bindingsInDsl)
                            .flatMapMany(Flux::fromIterable)
                            .map(relatedDependencyNode -> {
                                bindingsFromActions.add(relatedDependencyNode.getReferenceString());
                                ActionDependencyEdge edge = new ActionDependencyEdge(relatedDependencyNode, actionDependencyNode);
                                edges.add(edge);
                                return relatedDependencyNode;
                            })
                            .collectList();
                })
                .collectList()
                .then();

    }

    /**
     * This function walks the widget bindings and adds all the relationships which have been discovered earlier while
     * walking the DSL and extracting all the relationships into edges between the widget path where there is a dynamic
     * binding and the entities in the bindings.
     *
     * @param edges
     * @param widgetBindingMap
     * @return
     */
    private Mono<Set<ActionDependencyEdge>> addWidgetRelationshipToGraph(Set<ActionDependencyEdge> edges,
                                                                         Map<String, Set<String>> widgetBindingMap,
                                                                         int evalVersion) {
        final int entityTypes = WIDGET_ENTITY_REFERENCES;
        // This part will ensure that we are discovering widget to widget relationships.
        return Flux.fromIterable(widgetBindingMap.entrySet())
                .flatMap(widgetBindingEntries -> getPossibleEntityParentsMap(widgetBindingEntries.getValue(), entityTypes, evalVersion)
                        .map(possibleParentsMap -> {
                            possibleParentsMap.entrySet().stream().forEach(entry -> {

                                if (entry.getValue() == null || entry.getValue().isEmpty()) {
                                    return;
                                }
                                String widgetPath = widgetBindingEntries.getKey().trim();
                                String[] widgetPathParts = widgetPath.split("\\.");
                                String widgetName = widgetPath;
                                if (widgetPathParts.length > 0) {
                                    widgetName = widgetPathParts[0];
                                }
                                EntityDependencyNode entityDependencyNode = new EntityDependencyNode(EntityReferenceType.WIDGET, widgetName, widgetPath, null, null, null);
                                entry.getValue().stream().forEach(widgetDependencyNode -> {
                                    ActionDependencyEdge edge = new ActionDependencyEdge(widgetDependencyNode, entityDependencyNode);
                                    edges.add(edge);
                                });


                            });
                            return possibleParentsMap;

                        }))
                .collectList()
                .then(Mono.just(edges));

    }


    private boolean hasUserSetActionToNotRunOnPageLoad(ActionDTO unpublishedAction) {
        if (TRUE.equals(unpublishedAction.getUserSetOnLoad()) && !TRUE.equals(unpublishedAction.getExecuteOnLoad())) {
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
        Set<String> selfReferencingDataPaths = action.getActionConfiguration().getSelfReferencingDataPaths();
        if (dynamicBindingPathList != null) {
            // Each of these might have nested structures, so we iterate through them to find the leaf node for each
            for (Property x : dynamicBindingPathList) {
                final String fieldPath = String.valueOf(x.getKey());

                /**
                 * selfReferencingDataPaths is a set of paths that are expected to contain bindings that refer to the
                 * same action object i.e. a cyclic reference. e.g. A GraphQL API response can contain pagination
                 * cursors that are required to be configured in the pagination tab of the same API. We don't want to
                 * treat these cyclic references as cyclic dependency errors.
                 */
                if (selfReferencingDataPaths.contains(fieldPath)) {
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
                        // path doesn't seem to exist. Ignore.
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
                            mustacheKeysFromFields = MustacheHelper.extractMustacheKeysFromFields(parent).stream().map(token -> token.getValue()).collect(Collectors.toSet());
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
     * @param entityDependencyNode
     * @return
     */
    private Set<ActionDependencyEdge> generateParentChildRelationships(EntityDependencyNode entityDependencyNode) {
        Set<ActionDependencyEdge> edges = new HashSet<>();

        String parent;

        while (true) {
            try {
                Matcher matcher = parentPattern.matcher(entityDependencyNode.getReferenceString());
                matcher.find();
                parent = matcher.group(1);
                EntityDependencyNode parentDependencyNode = new EntityDependencyNode(entityDependencyNode.getEntityReferenceType(), entityDependencyNode.getValidEntityName(), parent, entityDependencyNode.getIsAsync(), entityDependencyNode.getIsFunctionCall(), entityDependencyNode.getActionDTO());
                edges.add(new ActionDependencyEdge(entityDependencyNode, parentDependencyNode));
                entityDependencyNode = parentDependencyNode;
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
     * @param actionNameToActionMap
     * @param vertex
     * @param pageLoadActionsLevelMap
     * @param existingPageLoadActions
     * @return
     */
    private Set<String> actionCandidatesForPageLoadFromBinding(Map<String, ActionDTO> actionNameToActionMap,
                                                               String vertex,
                                                               Map<String, Integer> pageLoadActionsLevelMap,
                                                               List<Set<String>> existingPageLoadActions,
                                                               Set<String> explicitUserSetOnLoadActions) {

        Set<String> onPageLoadCandidates = new HashSet<>();

        Set<String> possibleParents = getPossibleParents(vertex);

        for (String entity : possibleParents) {

            // if this generated entity name from the binding matches an action name check for its eligibility
            if (actionNameToActionMap.containsKey(entity)) {

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
                } else {
                    validBinding = entity + "." + "data";
                }

                // If the reference is to a sync JS function, discard it from the scheduling order
                ActionDTO actionDTO = actionNameToActionMap.get(entity);
                if (PluginType.JS.equals(actionDTO.getPluginType()) && FALSE.equals(actionDTO.getActionConfiguration().getIsAsync())) {
                    isCandidateForPageLoad = FALSE;
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

    private DslActionDTO getDslAction(ActionDTO actionDTO) {

        DslActionDTO dslActionDTO = new DslActionDTO();

        dslActionDTO.setId(actionDTO.getId());
        dslActionDTO.setPluginType(actionDTO.getPluginType());
        dslActionDTO.setJsonPathKeys(actionDTO.getJsonPathKeys());
        dslActionDTO.setName(actionDTO.getValidName());
        dslActionDTO.setCollectionId(actionDTO.getCollectionId());
        dslActionDTO.setClientSideExecution(actionDTO.getClientSideExecution());
        dslActionDTO.setConfirmBeforeExecute(actionDTO.getConfirmBeforeExecute());
        if (actionDTO.getDefaultResources() != null) {
            dslActionDTO.setDefaultActionId(actionDTO.getDefaultResources().getActionId());
            dslActionDTO.setDefaultCollectionId(actionDTO.getDefaultResources().getCollectionId());
        }

        if (actionDTO.getActionConfiguration() != null) {
            dslActionDTO.setTimeoutInMillisecond(actionDTO.getActionConfiguration().getTimeoutInMillisecond());
        }

        return dslActionDTO;
    }

}

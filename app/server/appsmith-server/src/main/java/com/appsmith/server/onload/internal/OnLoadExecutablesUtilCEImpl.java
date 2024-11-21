package com.appsmith.server.onload.internal;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.dtos.LayoutExecutableUpdateDTO;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.EntityDependencyNode;
import com.appsmith.external.models.EntityReferenceType;
import com.appsmith.external.models.Executable;
import com.appsmith.external.models.Property;
import com.appsmith.server.domains.ExecutableDependencyEdge;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ObservationHelperImpl;
import com.appsmith.server.onload.executables.ExecutableOnLoadService;
import com.appsmith.server.services.AstService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.observation.ObservationRegistry;
import io.micrometer.tracing.Span;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.graph.DirectedAcyclicGraph;
import org.jgrapht.traverse.BreadthFirstIterator;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.spans.LayoutSpan.ADD_WIDGET_RELATIONSHIP_TO_GRAPH;
import static com.appsmith.external.constants.spans.LayoutSpan.COMPUTE_ON_PAGE_LOAD_EXECUTABLES_SCHEDULING_ORDER;
import static com.appsmith.external.constants.spans.LayoutSpan.EXTRACT_AND_SET_EXECUTABLE_BINDINGS_IN_GRAPH_EDGES;
import static com.appsmith.external.constants.spans.LayoutSpan.FILTER_AND_TRANSFORM_SCHEDULING_ORDER_TO_DTO;
import static com.appsmith.external.constants.spans.LayoutSpan.RECURSIVELY_ADD_EXECUTABLES_AND_THEIR_DEPENDENTS_TO_GRAPH_FROM_BINDINGS;
import static com.appsmith.external.constants.spans.OnLoadSpan.ADD_DIRECTLY_REFERENCED_EXECUTABLES_TO_GRAPH;
import static com.appsmith.external.constants.spans.OnLoadSpan.ADD_EXPLICIT_USER_SET_ON_LOAD_EXECUTABLES_TO_GRAPH;
import static com.appsmith.external.constants.spans.OnLoadSpan.EXECUTABLE_NAME_TO_EXECUTABLE_MAP;
import static com.appsmith.external.constants.spans.OnLoadSpan.GET_ALL_EXECUTABLES_BY_CREATOR_ID;
import static com.appsmith.external.constants.spans.OnLoadSpan.GET_UNPUBLISHED_ON_LOAD_EXECUTABLES_EXPLICIT_SET_BY_USER_IN_CREATOR_CONTEXT;
import static com.appsmith.external.constants.spans.OnLoadSpan.UPDATE_EXECUTABLE_SELF_REFERENCING_PATHS;
import static com.appsmith.external.helpers.MustacheHelper.EXECUTABLE_ENTITY_REFERENCES;
import static com.appsmith.external.helpers.MustacheHelper.WIDGET_ENTITY_REFERENCES;
import static com.appsmith.external.helpers.MustacheHelper.getPossibleParents;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
@RequiredArgsConstructor
public class OnLoadExecutablesUtilCEImpl implements OnLoadExecutablesUtilCE {

    private final AstService astService;
    private final ObjectMapper objectMapper;
    private final ExecutableOnLoadService<NewPage> pageExecutableOnLoadService;

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
    private final ObservationRegistry observationRegistry;
    private final ObservationHelperImpl observationHelper;

    /**
     * This function computes the sequenced on page load executables.
     * <p>
     * !!!WARNING!!! : This function edits the parameters edges, executablesUsedInDSL and flatPageLoadExecutables
     * and the same are used by the caller function for further processing.
     *
     * @param creatorId                  : Argument used for fetching executables in this page
     * @param evaluatedVersion           : Depending on the evaluated version, the way the AST parsing logic picks entities in the dynamic binding will change
     * @param widgetNames                : Set of widget names which SHOULD have been populated before calling this function.
     * @param edgesRef                   : Set where this function adds all the relationships (dependencies) between executables
     * @param widgetDynamicBindingsMap   : A map of widget path and the set of dynamic binding words in the mustache at the
     *                                   path in the widget (populated by the function `extractAllWidgetNamesAndDynamicBindingsFromDSL`
     *                                   <p>
     *                                   Example : If Table1's field tableData contains a mustache : {{Api1.data}}, the entry in the map would look like :
     *                                   Map.entry("Table1.tableData", Set.of("Api1.data"))
     * @param flatPageLoadExecutablesRef : A flat list of on page load executables (Not in the sequence in which these executables
     *                                   would be called on page load)
     * @param executablesUsedInDSLRef    : Set where this function adds all the executables directly used in the DSL
     * @return Returns page load executables which is a list of sets of executables. Inside a set, all executables can be executed
     * in parallel. But one set of executables MUST finish execution before the next set of executables can be executed
     * in the list.
     */
    public Mono<List<Set<DslExecutableDTO>>> findAllOnLoadExecutables(
            String creatorId,
            Integer evaluatedVersion,
            Set<String> widgetNames,
            Set<ExecutableDependencyEdge> edgesRef,
            Map<String, Set<String>> widgetDynamicBindingsMap,
            List<Executable> flatPageLoadExecutablesRef,
            Set<String> executablesUsedInDSLRef,
            CreatorContextType creatorType) {

        Set<String> onLoadExecutableSetRef = new HashSet<>();
        Set<String> explicitUserSetOnLoadExecutablesRef = new HashSet<>();
        Set<String> bindingsFromExecutablesRef = ConcurrentHashMap.newKeySet();

        // Function `extractAndSetExecutableBindingsInGraphEdges` updates this map to keep a track of all the
        // executables which have been discovered while walking the executables to ensure that we don't end up in a
        // recursive infinite loop
        // in case of a cyclical relationship between executables (and not specific paths) and helps us exit at the
        // appropriate junction.
        // e.g : Consider the following relationships :
        // Api1.actionConfiguration.body <- Api2.data.users[0].name
        // Api2.actionConfiguration.url <- Api1.actionConfiguration.url
        // In the above case, the two executables depend on each other without there being a real cyclical dependency.
        Map<String, EntityDependencyNode> executablesFoundDuringWalkRef = new HashMap<>();

        Flux<Executable> allExecutablesByCreatorIdFlux = getAllExecutablesByCreatorIdFlux(creatorId, creatorType);

        Mono<Map<String, Executable>> executableNameToExecutableMapMono = allExecutablesByCreatorIdFlux
                .flatMapIterable(executable -> {
                    Set<String> executableNames = executable.getExecutableNames();
                    return executableNames.stream()
                            .map(executableName -> Tuples.of(executableName, executable))
                            .toList();
                })
                .collectMap(Tuple2::getT1, Tuple2::getT2)
                .name(EXECUTABLE_NAME_TO_EXECUTABLE_MAP)
                .tap(Micrometer.observation(observationRegistry))
                .cache();

        Mono<Set<String>> executablesInCreatorContextMono = allExecutablesByCreatorIdFlux
                .flatMapIterable(Executable::getExecutableNames)
                .collect(Collectors.toSet())
                .cache();

        Set<EntityDependencyNode> executableBindingsInDslRef = new HashSet<>();

        Mono<Set<ExecutableDependencyEdge>> directlyReferencedExecutablesToGraphMono =
                addDirectlyReferencedExecutablesToGraph(
                                edgesRef,
                                executablesUsedInDSLRef,
                                bindingsFromExecutablesRef,
                                executablesFoundDuringWalkRef,
                                widgetDynamicBindingsMap,
                                executableNameToExecutableMapMono,
                                executableBindingsInDslRef,
                                evaluatedVersion)
                        .name(ADD_DIRECTLY_REFERENCED_EXECUTABLES_TO_GRAPH)
                        .tap(Micrometer.observation(observationRegistry));

        // This following `createAllEdgesForPageMono` publisher traverses the executables and widgets to add all
        // possible edges between all possible entity paths

        // First find all the executables in the page whose name matches the possible entity names found in the bindings
        // in the widget
        Mono<Set<ExecutableDependencyEdge>> createAllEdgesForPageMono = directlyReferencedExecutablesToGraphMono
                // Add dependencies of all on page load executables set by the user in the graph
                .flatMap(updatedEdges -> addExplicitUserSetOnLoadExecutablesToGraph(
                                creatorId,
                                updatedEdges,
                                explicitUserSetOnLoadExecutablesRef,
                                executablesFoundDuringWalkRef,
                                bindingsFromExecutablesRef,
                                executableNameToExecutableMapMono,
                                executableBindingsInDslRef,
                                evaluatedVersion,
                                creatorType)
                        .name(ADD_EXPLICIT_USER_SET_ON_LOAD_EXECUTABLES_TO_GRAPH)
                        .tap(Micrometer.observation(observationRegistry)))
                // For all the executables found so far, recursively walk the dynamic bindings of the executables to
                // find more relationships with other executables (& widgets)
                .flatMap(updatedEdges -> recursivelyAddExecutablesAndTheirDependentsToGraphFromBindings(
                        updatedEdges,
                        executablesFoundDuringWalkRef,
                        bindingsFromExecutablesRef,
                        executableNameToExecutableMapMono,
                        evaluatedVersion))
                .name(RECURSIVELY_ADD_EXECUTABLES_AND_THEIR_DEPENDENTS_TO_GRAPH_FROM_BINDINGS)
                .tap(Micrometer.observation(observationRegistry))
                // At last, add all the widget relationships to the graph as well.
                .zipWith(executablesInCreatorContextMono)
                .flatMap(tuple -> {
                    Set<ExecutableDependencyEdge> updatedEdges = tuple.getT1();
                    return addWidgetRelationshipToGraph(updatedEdges, widgetDynamicBindingsMap, evaluatedVersion)
                            .name(ADD_WIDGET_RELATIONSHIP_TO_GRAPH)
                            .tap(Micrometer.observation(observationRegistry));
                });

        // Create a graph given edges
        Mono<DirectedAcyclicGraph<String, DefaultEdge>> createGraphMono = Mono.zip(
                        executablesInCreatorContextMono, createAllEdgesForPageMono)
                .map(tuple -> {
                    Set<String> allExecutables = tuple.getT1();
                    Set<ExecutableDependencyEdge> updatedEdges = tuple.getT2();
                    return constructDAG(allExecutables, widgetNames, updatedEdges, executableBindingsInDslRef);
                })
                .cache();

        // Generate on page load schedule
        Mono<List<Set<String>>> computeOnPageLoadScheduleNamesMono = Mono.zip(
                        executableNameToExecutableMapMono, createGraphMono)
                .map(tuple -> {
                    Map<String, Executable> executableNameToExecutableMap = tuple.getT1();
                    DirectedAcyclicGraph<String, DefaultEdge> graph = tuple.getT2();

                    Span computeOnPageLoadExecutablesSchedulingOrderSpan =
                            observationHelper.createSpan(COMPUTE_ON_PAGE_LOAD_EXECUTABLES_SCHEDULING_ORDER);

                    observationHelper.startSpan(computeOnPageLoadExecutablesSchedulingOrderSpan, true);

                    List<Set<String>> executablesList = computeOnPageLoadExecutablesSchedulingOrder(
                            graph,
                            onLoadExecutableSetRef,
                            executableNameToExecutableMap,
                            explicitUserSetOnLoadExecutablesRef);

                    observationHelper.endSpan(computeOnPageLoadExecutablesSchedulingOrderSpan, true);

                    return executablesList;
                })
                .map(onPageLoadExecutablesSchedulingOrder -> {
                    // Find all explicitly turned on executables which haven't found their way into the scheduling order
                    // This scenario would happen if an explicitly turned on for page load executable does not have any
                    // relationships in the page with any widgets/executables.
                    Set<String> pageLoadExecutableNames = new HashSet<>();
                    pageLoadExecutableNames.addAll(onLoadExecutableSetRef);
                    pageLoadExecutableNames.addAll(explicitUserSetOnLoadExecutablesRef);
                    pageLoadExecutableNames.removeAll(onLoadExecutableSetRef);

                    // If any of the explicitly set on page load executables havent been added yet, add them to the 0th
                    // set
                    // of executables set since no relationships were found with any other appsmith entity
                    if (!pageLoadExecutableNames.isEmpty()) {
                        onLoadExecutableSetRef.addAll(pageLoadExecutableNames);

                        // In case there are no page load executables, initialize the 0th set of page load executables
                        // list.
                        if (onPageLoadExecutablesSchedulingOrder.isEmpty()) {
                            onPageLoadExecutablesSchedulingOrder.add(new HashSet<>());
                        }

                        onPageLoadExecutablesSchedulingOrder.get(0).addAll(pageLoadExecutableNames);
                    }

                    return onPageLoadExecutablesSchedulingOrder;
                });

        // Transform the schedule order into client feasible DTO
        Mono<List<Set<DslExecutableDTO>>> computeCompletePageLoadExecutableScheduleMono =
                filterAndTransformSchedulingOrderToDTO(
                                onLoadExecutableSetRef,
                                executableNameToExecutableMapMono,
                                computeOnPageLoadScheduleNamesMono)
                        .name(FILTER_AND_TRANSFORM_SCHEDULING_ORDER_TO_DTO)
                        .tap(Micrometer.observation(observationRegistry))
                        .cache();

        // With the final on page load scheduling order, also set the on page load executables which would be updated
        // by the caller function
        Mono<List<Executable>> flatPageLoadExecutablesMono = computeCompletePageLoadExecutableScheduleMono
                .then(executableNameToExecutableMapMono)
                .map(executableMap -> {
                    onLoadExecutableSetRef.stream()
                            .forEach(executableName ->
                                    flatPageLoadExecutablesRef.add(executableMap.get(executableName)));
                    return flatPageLoadExecutablesRef;
                });

        return createGraphMono.then(flatPageLoadExecutablesMono).then(computeCompletePageLoadExecutableScheduleMono);
    }

    @Override
    public Mono<Boolean> updateExecutablesExecuteOnLoad(
            List<Executable> onLoadExecutables,
            String creatorId,
            List<LayoutExecutableUpdateDTO> executableUpdatesRef,
            List<String> messagesRef,
            CreatorContextType creatorType) {
        List<Executable> toUpdateExecutables = new ArrayList<>();

        // Fetch all the actions which exist in this page.
        Flux<Executable> creatorContextExecutablesFlux =
                this.getAllExecutablesByCreatorIdFlux(creatorId, creatorType).cache();

        // Before we update the actions, fetch all the actions which are currently set to execute on load.
        Mono<List<Executable>> existingOnLoadExecutablesMono = creatorContextExecutablesFlux
                .flatMap(executable -> {
                    if (TRUE.equals(executable.getExecuteOnLoad())) {
                        return Mono.just(executable);
                    }
                    return Mono.empty();
                })
                .collectList();

        return existingOnLoadExecutablesMono
                .zipWith(creatorContextExecutablesFlux.collectList())
                .flatMap(tuple -> {
                    List<Executable> existingOnLoadExecutables = tuple.getT1();
                    List<Executable> creatorContextExecutables = tuple.getT2();

                    // There are no actions in this page. No need to proceed further since no actions would get updated
                    if (creatorContextExecutables.isEmpty()) {
                        return Mono.just(FALSE);
                    }

                    // No actions require an update if no actions have been found as page load actions as well as
                    // existing on load page actions are empty
                    if (existingOnLoadExecutables.isEmpty()
                            && (onLoadExecutables == null || onLoadExecutables.isEmpty())) {
                        return Mono.just(FALSE);
                    }

                    // Extract names of existing page load actions and new page load actions for quick lookup.
                    Set<String> existingOnLoadExecutableNames = existingOnLoadExecutables.stream()
                            .map(Executable::getUserExecutableName)
                            .collect(Collectors.toSet());

                    Set<String> newOnLoadExecutableNames = onLoadExecutables.stream()
                            .map(Executable::getUserExecutableName)
                            .collect(Collectors.toSet());

                    // Calculate the actions which would need to be updated from execute on load TRUE to FALSE.
                    Set<String> turnedOffExecutableNames = new HashSet<>();
                    turnedOffExecutableNames.addAll(existingOnLoadExecutableNames);
                    turnedOffExecutableNames.removeAll(newOnLoadExecutableNames);

                    // Calculate the actions which would need to be updated from execute on load FALSE to TRUE
                    Set<String> turnedOnExecutableNames = new HashSet<>();
                    turnedOnExecutableNames.addAll(newOnLoadExecutableNames);
                    turnedOnExecutableNames.removeAll(existingOnLoadExecutableNames);

                    for (Executable executable : creatorContextExecutables) {

                        String executableName = executable.getUserExecutableName();
                        // If a user has ever set execute on load, this field can not be changed automatically. It has
                        // to be explicitly changed by the user again. Add the executable to update only if this
                        // condition is false.
                        if (FALSE.equals(executable.getUserSetOnLoad())) {

                            // If this executable is no longer an onload executable, turn the execute on load to false
                            if (turnedOffExecutableNames.contains(executableName)) {
                                executable.setExecuteOnLoad(FALSE);
                                toUpdateExecutables.add(executable);
                            }

                            // If this executable is newly found to be on load, turn execute on load to true
                            if (turnedOnExecutableNames.contains(executableName)) {
                                executable.setExecuteOnLoad(TRUE);
                                toUpdateExecutables.add(executable);
                            }

                        } else {
                            // Remove the executable name from either of the lists (if present) because this executable
                            // should not be updated
                            turnedOnExecutableNames.remove(executableName);
                            turnedOffExecutableNames.remove(executableName);
                        }
                    }

                    // Add newly turned on page actions to report back to the caller
                    executableUpdatesRef.addAll(
                            addExecutableUpdatesForExecutableNames(creatorContextExecutables, turnedOnExecutableNames));

                    // Add newly turned off page actions to report back to the caller
                    executableUpdatesRef.addAll(addExecutableUpdatesForExecutableNames(
                            creatorContextExecutables, turnedOffExecutableNames));

                    for (Executable executable : creatorContextExecutables) {
                        String executableName = executable.getUserExecutableName();
                        if (Boolean.FALSE.equals(executable.isOnLoadMessageAllowed())) {
                            turnedOffExecutableNames.remove(executableName);
                            turnedOnExecutableNames.remove(executableName);
                        }
                    }

                    // Now add messagesRef that would eventually be displayed to the developer user informing them
                    // about the action setting change.
                    if (!turnedOffExecutableNames.isEmpty()) {
                        messagesRef.add(
                                turnedOffExecutableNames.toString() + " will no longer be executed on page load");
                    }

                    if (!turnedOnExecutableNames.isEmpty()) {
                        messagesRef.add(
                                turnedOnExecutableNames.toString() + " will be executed automatically on page load");
                    }

                    // Finally update the actions which require an update
                    return Flux.fromIterable(toUpdateExecutables)
                            .flatMap(executable -> this.updateUnpublishedExecutable(executable.getId(), executable))
                            .then(Mono.just(TRUE));
                });
    }

    @Override
    public Mono<Layout> findAndUpdateLayout(
            String creatorId, CreatorContextType creatorType, String layoutId, Layout layout) {
        return pageExecutableOnLoadService.findAndUpdateLayout(creatorId, layoutId, layout);
    }

    private Mono<Executable> updateUnpublishedExecutable(String id, Executable executable) {
        if (executable instanceof ActionDTO actionDTO) {
            return pageExecutableOnLoadService.updateUnpublishedExecutable(id, actionDTO);
        } else return Mono.just(executable);
    }

    private List<LayoutExecutableUpdateDTO> addExecutableUpdatesForExecutableNames(
            List<Executable> executables, Set<String> updatedExecutableNames) {

        return executables.stream()
                .filter(executable -> updatedExecutableNames.contains(executable.getUserExecutableName()))
                .map(Executable::createLayoutExecutableUpdateDTO)
                .collect(Collectors.toList());
    }

    protected Flux<Executable> getAllExecutablesByCreatorIdFlux(String creatorId, CreatorContextType creatorType) {
        return pageExecutableOnLoadService
                .getAllExecutablesByCreatorIdFlux(creatorId)
                .name(GET_ALL_EXECUTABLES_BY_CREATOR_ID)
                .tap(Micrometer.observation(observationRegistry));
    }

    /**
     * This function takes the page load schedule consisting of only executable names.
     * <p>
     * First it trims the order to remove any unwanted executables which shouldn't be run.
     * Following executables are filtered out :
     * 1. Any JS executable since they are not supported to run on page load currently. TODO : Remove this check once the
     * client implements execution of JS functions.
     * 2. Any executable which has been marked to not run on page load by the user.
     * <p>
     * Next it creates a new schedule order consisting of DslExecutableDTO instead of just executable names.
     *
     * @param onPageLoadExecutableSet
     * @param executableNameToExecutableMapMono
     * @param computeOnPageLoadScheduleNamesMono
     * @return
     */
    private Mono<List<Set<DslExecutableDTO>>> filterAndTransformSchedulingOrderToDTO(
            Set<String> onPageLoadExecutableSet,
            Mono<Map<String, Executable>> executableNameToExecutableMapMono,
            Mono<List<Set<String>>> computeOnPageLoadScheduleNamesMono) {

        return Mono.zip(computeOnPageLoadScheduleNamesMono, executableNameToExecutableMapMono)
                .map(tuple -> {
                    List<Set<String>> onPageLoadExecutablesSchedulingOrder = tuple.getT1();
                    Map<String, Executable> executableMap = tuple.getT2();

                    List<Set<DslExecutableDTO>> onPageLoadExecutables = new ArrayList<>();

                    for (Set<String> names : onPageLoadExecutablesSchedulingOrder) {
                        Set<DslExecutableDTO> executablesInLevel = new HashSet<>();

                        for (String name : names) {
                            Executable executable = executableMap.get(name);
                            if (hasUserSetExecutableToNotRunOnPageLoad(executable)) {
                                onPageLoadExecutableSet.remove(name);
                            } else {
                                executablesInLevel.add(executable.getDslExecutable());
                            }
                        }

                        onPageLoadExecutables.add(executablesInLevel);
                    }

                    return onPageLoadExecutables.stream()
                            .filter(setOfExecutables -> !setOfExecutables.isEmpty())
                            .collect(Collectors.toList());
                });
    }

    private Mono<Set<EntityDependencyNode>> getPossibleEntityReferences(
            Mono<Map<String, Executable>> executableNameToExecutableMapMono, Set<String> bindings, int evalVersion) {
        return getPossibleEntityReferences(executableNameToExecutableMapMono, bindings, evalVersion, null);
    }

    /**
     * Similar to the overridden method, this method is used to find all possible global entity references in the given set of bindings.
     * However, here we are assuming that the call came from when we were trying to analyze the DSL.
     * For such cases, we also want to capture entity references that would be qualified to run on page load first.
     *
     * @param executableNameToExecutableMono : This map is used to filter only valid executable references in bindings
     * @param bindings                       : The set of bindings to find references from
     * @param evalVersion                    : Depending on the evaluated version, the way the AST parsing logic picks entities in the dynamic binding will change
     * @param bindingsInDsl                  : All references are also added to this set if they should be qualified to run on page load first.
     * @return A set of any possible reference found in the binding that qualifies as a global entity reference
     */
    private Mono<Set<EntityDependencyNode>> getPossibleEntityReferences(
            Mono<Map<String, Executable>> executableNameToExecutableMono,
            Set<String> bindings,
            int evalVersion,
            Set<EntityDependencyNode> bindingsInDsl) {
        // We want to be finding both type of references
        final int entityTypes = EXECUTABLE_ENTITY_REFERENCES | WIDGET_ENTITY_REFERENCES;

        return executableNameToExecutableMono
                .zipWith(getPossibleEntityParentsMap(new ArrayList<>(bindings), entityTypes, evalVersion))
                .map(tuple -> {
                    Map<String, Executable> executableMap = tuple.getT1();
                    Map<String, Set<EntityDependencyNode>> bindingToPossibleParentMap = tuple.getT2();
                    return processBindingToParentMap(
                            bindingToPossibleParentMap,
                            executableMap,
                            bindingsInDsl,
                            true // do not aggregate into a single set
                            );
                });
    }

    /**
     * This function is used to get all executable possibleEntities for the bindings. It first finds all the possible entity
     * references in the widget bindings and then processes them to find the possible entity references that are executable.
     *
     * @param executableNameToExecutableMono
     * @param bindings
     * @param evalVersion
     * @param bindingsInDsl
     * @return
     */
    private Mono<Map<String, Set<EntityDependencyNode>>> getPossibleEntityReferencesMap(
            Mono<Map<String, Executable>> executableNameToExecutableMono,
            List<String> bindings,
            int evalVersion,
            Set<EntityDependencyNode> bindingsInDsl) {
        // We want to be finding both type of references
        final int entityTypes = EXECUTABLE_ENTITY_REFERENCES | WIDGET_ENTITY_REFERENCES;

        return executableNameToExecutableMono
                .zipWith(getPossibleEntityParentsMap(bindings, entityTypes, evalVersion))
                .map(tuple -> {
                    Map<String, Executable> executableMap = tuple.getT1();
                    // For each binding, here we receive a set of possible references to global entities
                    // At this point we're guaranteed that these references are made to possible variables,
                    // but we do not know if those entities exist in the global namespace yet
                    Map<String, Set<EntityDependencyNode>> bindingToPossibleParentMap = tuple.getT2();
                    return processBindingToParentMap(
                            bindingToPossibleParentMap,
                            executableMap,
                            bindingsInDsl,
                            false // do not aggregate into a single set
                            );
                });
    }

    /**
     * This method filters out the possibleParents to make sure only the parents that are part of executableMap are kept.
     * According to the type of the parent,
     * - the parent is added to the set of possibleEntitiesReferences or
     * - the parent is added to the set of possibleEntitiesReferencesToBindingMap with the binding as the key
     *
     * @param bindingToPossibleParentMap
     * @param executableMap
     * @param bindingsInDsl
     * @param aggregateToSet
     * @param <T>
     * @return
     */
    private <T> T processBindingToParentMap(
            Map<String, Set<EntityDependencyNode>> bindingToPossibleParentMap,
            Map<String, Executable> executableMap,
            Set<EntityDependencyNode> bindingsInDsl,
            boolean aggregateToSet) {
        Map<String, Set<EntityDependencyNode>> possibleEntitiesReferencesToBindingMap = new HashMap<>();
        Set<EntityDependencyNode> possibleEntitiesReferences = new HashSet<>();

        bindingToPossibleParentMap.forEach((binding, possibleParents) -> {
            Set<EntityDependencyNode> bindingsWithExecutableReference = new HashSet<>();
            Set<EntityDependencyNode> currentBindingReferences = new HashSet<>();

            for (EntityDependencyNode possibleParent : possibleParents) {
                Executable executable = executableMap.get(possibleParent.getValidEntityName());

                if (executable != null
                        && possibleParent.getEntityReferenceType().equals(executable.getEntityReferenceType())) {
                    possibleParent.setExecutable(executable);
                    bindingsWithExecutableReference.add(possibleParent);

                    if (!TRUE.equals(possibleParent.getIsFunctionCall())) {
                        currentBindingReferences.add(possibleParent);
                    }
                } else if (EntityReferenceType.WIDGET.equals(possibleParent.getEntityReferenceType())) {
                    currentBindingReferences.add(possibleParent);
                }
            }

            if (!bindingsWithExecutableReference.isEmpty() && bindingsInDsl != null) {
                bindingsInDsl.addAll(bindingsWithExecutableReference);
            }

            if (aggregateToSet) {
                possibleEntitiesReferences.addAll(currentBindingReferences);
            } else {
                possibleEntitiesReferencesToBindingMap.put(binding, currentBindingReferences);
            }
        });

        return aggregateToSet ? (T) possibleEntitiesReferences : (T) possibleEntitiesReferencesToBindingMap;
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
    private Mono<Map<String, Set<EntityDependencyNode>>> getPossibleEntityParentsMap(
            List<String> bindings, int types, int evalVersion) {
        Flux<Tuple2<String, Set<String>>> findingToReferencesFlux =
                astService.getPossibleReferencesFromDynamicBinding(bindings, evalVersion);
        return MustacheHelper.getPossibleEntityParentsMap(findingToReferencesFlux, types);
    }

    /**
     * This function finds all the executables in the page whose name matches the possible entity names found in the
     * bindings in the widget. Caveat : It first removes all invalid bindings from the set of all bindings from the DSL
     * This today means only the usage of an async JS function as a call instead of referring to the `.data`.
     * <p>
     * !!! WARNING !!! : This function updates executablesUsedInDSL set which is used to store all the directly referenced
     * executables in the DSL.
     *
     * @param edgesRef
     * @param executablesUsedInDSLRef
     * @param bindingsFromExecutablesRef
     * @param executablesFoundDuringWalkRef
     * @param widgetDynamicBindingsMap
     * @param executableNameToExecutableMapMono
     * @param executableBindingsInDslRef
     * @param evalVersion
     * @return
     */
    private Mono<Set<ExecutableDependencyEdge>> addDirectlyReferencedExecutablesToGraph(
            Set<ExecutableDependencyEdge> edgesRef,
            Set<String> executablesUsedInDSLRef,
            Set<String> bindingsFromExecutablesRef,
            Map<String, EntityDependencyNode> executablesFoundDuringWalkRef,
            Map<String, Set<String>> widgetDynamicBindingsMap,
            Mono<Map<String, Executable>> executableNameToExecutableMapMono,
            Set<EntityDependencyNode> executableBindingsInDslRef,
            int evalVersion) {

        Map<String, Set<EntityDependencyNode>> bindingToWidgetNodesMap = new HashMap<>();
        List<String> allBindings = new ArrayList<>();

        widgetDynamicBindingsMap.forEach((widgetPropertyPath, bindingsInWidget) -> {
            EntityDependencyNode widgetDependencyNode = new EntityDependencyNode(
                    EntityReferenceType.WIDGET, widgetPropertyPath, widgetPropertyPath, null, null);

            bindingsInWidget.forEach(binding -> {
                bindingToWidgetNodesMap
                        .computeIfAbsent(binding, bindingKey -> new HashSet<>())
                        .add(widgetDependencyNode);
                allBindings.add(binding);
            });
        });

        Mono<Map<String, Set<EntityDependencyNode>>> bindingToPossibleEntityMapMono = getPossibleEntityReferencesMap(
                executableNameToExecutableMapMono, allBindings, evalVersion, executableBindingsInDslRef);

        return bindingToPossibleEntityMapMono
                .flatMapMany(bindingToPossibleEntityMap -> Flux.fromIterable(bindingToPossibleEntityMap.entrySet()))
                .flatMap(bindingEntry -> {
                    String binding = bindingEntry.getKey();
                    Set<EntityDependencyNode> possibleEntities = bindingEntry.getValue();

                    // Get all widget nodes associated with the binding
                    Set<EntityDependencyNode> widgetDependencyNodes =
                            bindingToWidgetNodesMap.getOrDefault(binding, Set.of());

                    // Process each possibleEntity for the current binding
                    return Flux.fromIterable(possibleEntities).flatMap(possibleEntity -> Flux.fromIterable(
                                    widgetDependencyNodes) // Iterate all associated widgets
                            .flatMap(widgetDependencyNode -> {
                                if (getExecutableTypes().contains(possibleEntity.getEntityReferenceType())) {
                                    edgesRef.add(new ExecutableDependencyEdge(possibleEntity, widgetDependencyNode));
                                    executablesUsedInDSLRef.add(possibleEntity.getValidEntityName());

                                    return updateExecutableSelfReferencingPaths(possibleEntity)
                                            .name(UPDATE_EXECUTABLE_SELF_REFERENCING_PATHS)
                                            .tap(Micrometer.observation(observationRegistry))
                                            .flatMap(executable -> extractAndSetExecutableBindingsInGraphEdges(
                                                    possibleEntity,
                                                    edgesRef,
                                                    bindingsFromExecutablesRef,
                                                    executableNameToExecutableMapMono,
                                                    executablesFoundDuringWalkRef,
                                                    null,
                                                    evalVersion))
                                            .name(EXTRACT_AND_SET_EXECUTABLE_BINDINGS_IN_GRAPH_EDGES)
                                            .tap(Micrometer.observation(observationRegistry))
                                            .thenReturn(possibleEntity);
                                }
                                return Mono.just(possibleEntity);
                            }));
                })
                .collectList()
                .thenReturn(edgesRef);
    }

    protected Mono<Executable> updateExecutableSelfReferencingPaths(EntityDependencyNode possibleEntity) {
        return this.fillSelfReferencingPaths(possibleEntity.getExecutable()).map(executable -> {
            possibleEntity.setExecutable(executable);
            return executable;
        });
    }

    protected <T extends Executable> Mono<Executable> fillSelfReferencingPaths(T executable) {
        if (executable instanceof ActionDTO actionDTO) {
            return pageExecutableOnLoadService.fillSelfReferencingPaths(actionDTO);
        } else return Mono.just(executable);
    }

    protected Set<EntityReferenceType> getExecutableTypes() {
        return Set.of(EntityReferenceType.ACTION, EntityReferenceType.JSACTION);
    }

    /**
     * This function takes all the edges found and outputs a Directed Acyclic Graph. To create the complete graph, the
     * following steps are followed :
     * 1. Trim the edges to only contain relationships between property paths belonging to appsmith entities (executables,
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
     * @param executableNames
     * @param widgetNames
     * @param edges
     * @param executableBindingsInDsl
     * @return
     */
    private DirectedAcyclicGraph<String, DefaultEdge> constructDAG(
            Set<String> executableNames,
            Set<String> widgetNames,
            Set<ExecutableDependencyEdge> edges,
            Set<EntityDependencyNode> executableBindingsInDsl) {

        DirectedAcyclicGraph<String, DefaultEdge> executableSchedulingGraph =
                new DirectedAcyclicGraph<>(DefaultEdge.class);

        // Add the vertices for all the executables found in the DSL
        for (EntityDependencyNode executableBindingInDsl : executableBindingsInDsl) {
            executableSchedulingGraph.addVertex(executableBindingInDsl.getReferenceString());
        }

        Set<ExecutableDependencyEdge> implicitParentChildEdges = new HashSet<>();

        // Remove any edge which contains an unknown entity - aka neither a known executable nor a known widget
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

                    boolean isValidEdge = true;

                    // Assert that the vertices which are entire property paths have a possible parent which is either
                    // an executable or a widget or a static variable provided by appsmith at page/application level.
                    for (String vertex : vertices) {
                        Optional<String> validEntity = getPossibleParents(vertex).stream()
                                .filter(parent -> {
                                    if (!executableNames.contains(parent)
                                            && !widgetNames.contains(parent)
                                            && !APPSMITH_GLOBAL_VARIABLES.contains(parent)) {
                                        return false;
                                    }
                                    return true;
                                })
                                .findFirst();
                        // If any of the generated entity names from the path are valid appsmith entity name,
                        // the vertex is considered valid
                        if (!validEntity.isPresent()) {
                            isValidEdge = FALSE;
                            break;
                        }
                    }

                    return isValidEdge;
                })
                .collect(Collectors.toSet());

        Set<ExecutableDependencyEdge> executableDataFromConfigurationEdges = new HashSet<>();

        edges.stream().forEach(edge -> {
            addImplicitExecutableConfigurationDependency(edge.getSourceNode(), executableDataFromConfigurationEdges);
            addImplicitExecutableConfigurationDependency(edge.getTargetNode(), executableDataFromConfigurationEdges);
        });

        edges.addAll(executableDataFromConfigurationEdges);

        // Now add the relationship aka when a child gets updated, the parent should get updated as well. Aka
        // parent depends on the child.
        for (ExecutableDependencyEdge edge : edges) {
            EntityDependencyNode source = edge.getSourceNode();
            EntityDependencyNode target = edge.getTargetNode();

            Set<EntityDependencyNode> edgeVertices = Set.of(source, target);

            edgeVertices.stream()
                    .forEach(vertex -> implicitParentChildEdges.addAll(generateParentChildRelationships(vertex)));
        }

        edges.addAll(implicitParentChildEdges);

        // Now create the graph from all the edges.
        for (ExecutableDependencyEdge edge : edges) {

            String source = edge.getSourceNode().getReferenceString();
            String target = edge.getTargetNode().getReferenceString();

            executableSchedulingGraph.addVertex(source);
            executableSchedulingGraph.addVertex(target);

            try {
                executableSchedulingGraph.addEdge(source, target);
            } catch (IllegalArgumentException e) {
                // This error is also thrown when adding an edge which makes the graph cyclical
                if (e.getMessage().contains("Edge would induce a cycle")) {
                    throw new AppsmithException(AppsmithError.CYCLICAL_DEPENDENCY_ERROR, edge.toString());
                }
            }
        }

        return executableSchedulingGraph;
    }

    /**
     * All executables data paths actually depend on the executable configuration paths.
     * Add this implicit relationship in the graph as well
     * This also ensures that when an executable.data vertex exists at two different levels in the graph, it gets a
     * single level because of a common relationship getting added to connect all executableConfiguration dependencies
     * to executable.data
     *
     * @param entityDependencyNode
     * @param executableDataFromConfigurationEdges
     */
    private void addImplicitExecutableConfigurationDependency(
            EntityDependencyNode entityDependencyNode,
            Set<ExecutableDependencyEdge> executableDataFromConfigurationEdges) {
        if (getExecutableTypes().contains(entityDependencyNode.getEntityReferenceType())) {
            if (entityDependencyNode.isValidDynamicBinding()) {
                EntityDependencyNode sourceDependencyNode = new EntityDependencyNode(
                        entityDependencyNode.getEntityReferenceType(),
                        entityDependencyNode.getValidEntityName(),
                        entityDependencyNode.getExecutable().getConfigurationPath(),
                        entityDependencyNode.getIsFunctionCall(),
                        entityDependencyNode.getExecutable());
                executableDataFromConfigurationEdges.add(
                        new ExecutableDependencyEdge(sourceDependencyNode, entityDependencyNode));
            }
        }
    }

    /**
     * This function takes a Directed Acyclic Graph and computes on page load executables. The final results is a list of set
     * of executables. The set contains all the independent executables which can be executed in parallel. The List represents
     * dependencies. The 0th index set contains executables which are executable immediately. The next index contains all
     * executables which depend on one or more of the executables which were executed from the 0th index set and so on.
     * Breadth First level by level traversal is used to compute each set of such independent executables.
     *
     * @param dag                           : The DAG graph containing all the edges representing dependencies between appsmith entities in the page.
     * @param onPageLoadExecutableSet
     * @param executableNameToExecutableMap : All the executable names for the page
     * @return
     */
    private List<Set<String>> computeOnPageLoadExecutablesSchedulingOrder(
            DirectedAcyclicGraph<String, DefaultEdge> dag,
            Set<String> onPageLoadExecutableSet,
            Map<String, Executable> executableNameToExecutableMap,
            Set<String> explicitUserSetOnLoadExecutables) {
        Map<String, Integer> pageLoadExecutableAndLevelMap = new HashMap<>();
        List<Set<String>> onPageLoadExecutables = new ArrayList<>();

        // Find all root nodes to start the BFS traversal from
        List<String> rootNodes = dag.vertexSet().stream()
                .filter(key -> dag.incomingEdgesOf(key).size() == 0)
                .collect(Collectors.toList());

        BreadthFirstIterator<String, DefaultEdge> bfsIterator = new BreadthFirstIterator<>(dag, rootNodes);

        // Implementation of offline scheduler by using level by level traversal.
        // Level i+1 executables would be dependent on Level i executables.
        // All executables in a level can run independently
        // and hence would get added to the same set.
        while (bfsIterator.hasNext()) {

            String vertex = bfsIterator.next();
            int level = bfsIterator.getDepth(vertex);
            if (onPageLoadExecutables.size() <= level) {
                onPageLoadExecutables.add(new HashSet<>());
            }

            Set<String> executablesFromBinding = executableCandidatesForPageLoadFromBinding(
                    executableNameToExecutableMap,
                    vertex,
                    pageLoadExecutableAndLevelMap,
                    onPageLoadExecutables,
                    explicitUserSetOnLoadExecutables);
            onPageLoadExecutables.get(level).addAll(executablesFromBinding);
            for (String executable : executablesFromBinding) {
                pageLoadExecutableAndLevelMap.put(executable, level);
            }
            onPageLoadExecutableSet.addAll(executablesFromBinding);
        }

        // Trim all empty sets from the list before returning.
        return onPageLoadExecutables.stream()
                .filter(setOfExecutables -> !setOfExecutables.isEmpty())
                .collect(Collectors.toList());
    }

    /**
     * This function gets a set of binding names that come from other executables. It looks for executables in the page with
     * the same names as words in the binding names set. If yes, it creates a new set of dynamicBindingNames, adds these newly
     * found executables' bindings in the set, adds the new executables and their bindings to executableNames and edges and
     * recursively calls itself with the new set of dynamicBindingNames.
     * This ensures that the DAG that we create is complete and contains all possible executables and their dependencies
     *
     * @return
     */
    private Mono<Set<ExecutableDependencyEdge>> recursivelyAddExecutablesAndTheirDependentsToGraphFromBindings(
            Set<ExecutableDependencyEdge> edges,
            Map<String, EntityDependencyNode> executablesFoundDuringWalk,
            Set<String> dynamicBindings,
            Mono<Map<String, Executable>> executableNameToExecutableMapMono,
            int evalVersion) {
        if (dynamicBindings == null || dynamicBindings.isEmpty()) {
            return Mono.just(edges);
        }

        // All executables found from possibleExecutableNames set would add their dependencies in the following set for
        // further
        // walk to find more executables recursively.
        Set<String> newBindings = ConcurrentHashMap.newKeySet();

        // First fetch all the executables in the page whose name matches the words found in all the dynamic bindings
        Mono<List<EntityDependencyNode>> findAndAddExecutablesInBindingsMono = getPossibleEntityReferences(
                        executableNameToExecutableMapMono, dynamicBindings, evalVersion)
                .flatMapMany(Flux::fromIterable)
                // Add dependencies of the executables found in the DSL in the graph.
                .flatMap(possibleEntity -> {
                    if (getExecutableTypes().contains(possibleEntity.getEntityReferenceType())) {
                        return updateExecutableSelfReferencingPaths(possibleEntity)
                                .name(UPDATE_EXECUTABLE_SELF_REFERENCING_PATHS)
                                .tap(Micrometer.observation(observationRegistry))
                                .then(extractAndSetExecutableBindingsInGraphEdges(
                                        possibleEntity,
                                        edges,
                                        newBindings,
                                        executableNameToExecutableMapMono,
                                        executablesFoundDuringWalk,
                                        null,
                                        evalVersion))
                                .name(EXTRACT_AND_SET_EXECUTABLE_BINDINGS_IN_GRAPH_EDGES)
                                .tap(Micrometer.observation(observationRegistry))
                                .thenReturn(possibleEntity);
                    } else {
                        return Mono.empty();
                    }
                })
                .collectList();

        return findAndAddExecutablesInBindingsMono.flatMap(entityDependencyNodes -> {
            // Now that the next set of bindings have been found, find recursively all executables by these names
            // and their bindings
            return recursivelyAddExecutablesAndTheirDependentsToGraphFromBindings(
                            edges,
                            executablesFoundDuringWalk,
                            newBindings,
                            executableNameToExecutableMapMono,
                            evalVersion)
                    .name(RECURSIVELY_ADD_EXECUTABLES_AND_THEIR_DEPENDENTS_TO_GRAPH_FROM_BINDINGS)
                    .tap(Micrometer.observation(observationRegistry));
        });
    }

    /**
     * This function finds all the executables which have been set to run on page load by the user and adds their
     * dependencies to the graph.
     * <p>
     * Note : If such an executable has no dependencies and no interesting entity depends on it,
     * this executable would still not get added to the output of page load scheduler. This function only ensures that the
     * dependencies of user set on page load executables are accounted for.
     * <p>
     * !!! WARNING !!! : This function updates the set `explicitUserSetOnLoadExecutables` and adds the names of all such
     * executables found in this function.
     *
     * @param creatorId
     * @param edges
     * @param explicitUserSetOnLoadExecutables
     * @param executablesFoundDuringWalkRef
     * @param bindingsFromExecutablesRef
     * @return
     */
    private Mono<Set<ExecutableDependencyEdge>> addExplicitUserSetOnLoadExecutablesToGraph(
            String creatorId,
            Set<ExecutableDependencyEdge> edges,
            Set<String> explicitUserSetOnLoadExecutables,
            Map<String, EntityDependencyNode> executablesFoundDuringWalkRef,
            Set<String> bindingsFromExecutablesRef,
            Mono<Map<String, Executable>> executableNameToExecutableMapMono,
            Set<EntityDependencyNode> executableBindingsInDsl,
            int evalVersion,
            CreatorContextType creatorType) {

        // First fetch all the executables which have been tagged as on load by the user explicitly.
        return getUnpublishedOnLoadExecutablesExplicitSetByUserInCreatorContextFlux(creatorId, creatorType)
                .name(GET_UNPUBLISHED_ON_LOAD_EXECUTABLES_EXPLICIT_SET_BY_USER_IN_CREATOR_CONTEXT)
                .tap(Micrometer.observation(observationRegistry))
                .flatMap(this::fillSelfReferencingPaths)
                // Add the vertices and edges to the graph for these executables
                .flatMap(executable -> {
                    EntityDependencyNode entityDependencyNode = new EntityDependencyNode(
                            executable.getEntityReferenceType(),
                            executable.getUserExecutableName(),
                            null,
                            null,
                            executable);
                    explicitUserSetOnLoadExecutables.add(executable.getUserExecutableName());
                    return extractAndSetExecutableBindingsInGraphEdges(
                                    entityDependencyNode,
                                    edges,
                                    bindingsFromExecutablesRef,
                                    executableNameToExecutableMapMono,
                                    executablesFoundDuringWalkRef,
                                    executableBindingsInDsl,
                                    evalVersion)
                            .name(EXTRACT_AND_SET_EXECUTABLE_BINDINGS_IN_GRAPH_EDGES)
                            .tap(Micrometer.observation(observationRegistry))
                            .thenReturn(executable);
                })
                .collectList()
                .thenReturn(edges);
    }

    protected Flux<Executable> getUnpublishedOnLoadExecutablesExplicitSetByUserInCreatorContextFlux(
            String creatorId, CreatorContextType creatorType) {
        return pageExecutableOnLoadService.getUnpublishedOnLoadExecutablesExplicitSetByUserInPageFlux(creatorId);
    }

    /**
     * Given an executable, this function adds all the dependencies the executable to the graph edges. This is achieved by first
     * walking the executable configuration and finding the paths and the mustache JS snippets found at the said path. Then
     * the relationship between the complete path and the property paths found in the mustache JS snippets are added to
     * the graph edges.
     * <p>
     * !!! WARNING !!! : This function updates the set executablesFoundDuringWalk since this function is called from all
     * places to add the executable dependencies. If the executable has already been discovered, this function exits by checking
     * in the executablesFoundDuringWalk, else, it adds it to the set.
     * This function also updates `edges` by adding all the new relationships for the said executable in the set.
     *
     * @param edges
     * @param entityDependencyNode
     * @param bindingsFromExecutables
     * @param executablesFoundDuringWalk
     */
    private Mono<Void> extractAndSetExecutableBindingsInGraphEdges(
            EntityDependencyNode entityDependencyNode,
            Set<ExecutableDependencyEdge> edges,
            Set<String> bindingsFromExecutables,
            Mono<Map<String, Executable>> executableNameToExecutableMapMono,
            Map<String, EntityDependencyNode> executablesFoundDuringWalk,
            Set<EntityDependencyNode> bindingsInDsl,
            int evalVersion) {

        Executable executable = entityDependencyNode.getExecutable();

        // Check if the executable has been deleted in unpublished state. If yes, ignore it.
        if (executable.getDeletedAt() != null) {
            return Mono.empty().then();
        }

        String name = entityDependencyNode.getValidEntityName();

        if (executablesFoundDuringWalk.containsKey(name)) {
            // This executable has already been found in our walk. Ignore this.
            return Mono.empty().then();
        }
        executablesFoundDuringWalk.put(name, entityDependencyNode);

        Map<String, Set<String>> executableBindingsMap = getExecutableBindingsMap(executable);

        Set<String> allBindings = new HashSet<>();
        executableBindingsMap.values().stream().forEach(bindings -> allBindings.addAll(bindings));

        // TODO : Throw an error on executable save when bindings from dynamic binding path list do not match the json
        //  path keys and get the client to recompute the dynamic binding path list and try again.
        if (!allBindings.containsAll(executable.getJsonPathKeys())) {
            Set<String> invalidBindings = new HashSet<>(executable.getJsonPathKeys());
            invalidBindings.removeAll(allBindings);
            log.error(
                    "Invalid dynamic binding path list for executable id {}. Not taking the following bindings in "
                            + "consideration for computing on page load executables : {}",
                    executable.getId(),
                    invalidBindings);
        }

        Set<String> bindingPaths = executableBindingsMap.keySet();

        return Flux.fromIterable(bindingPaths)
                .flatMap(bindingPath -> {
                    EntityDependencyNode executableDependencyNode = new EntityDependencyNode(
                            entityDependencyNode.getEntityReferenceType(),
                            entityDependencyNode.getValidEntityName(),
                            bindingPath,
                            null,
                            executable);
                    return getPossibleEntityReferences(
                                    executableNameToExecutableMapMono,
                                    executableBindingsMap.get(bindingPath),
                                    evalVersion,
                                    bindingsInDsl)
                            .flatMapMany(Flux::fromIterable)
                            .map(relatedDependencyNode -> {
                                bindingsFromExecutables.add(relatedDependencyNode.getReferenceString());
                                ExecutableDependencyEdge edge =
                                        new ExecutableDependencyEdge(relatedDependencyNode, executableDependencyNode);
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
    private Mono<Set<ExecutableDependencyEdge>> addWidgetRelationshipToGraph(
            Set<ExecutableDependencyEdge> edges, Map<String, Set<String>> widgetBindingMap, int evalVersion) {
        final int entityTypes = WIDGET_ENTITY_REFERENCES;
        // This part will ensure that we are discovering widget to widget relationships.
        return Flux.fromIterable(widgetBindingMap.entrySet())
                .flatMap(widgetBindingEntries -> getPossibleEntityParentsMap(
                                new ArrayList<>(widgetBindingEntries.getValue()), entityTypes, evalVersion)
                        .map(possibleParentsMap -> {
                            possibleParentsMap.entrySet().stream().forEach(entry -> {
                                if (entry.getValue() == null || entry.getValue().isEmpty()) {
                                    return;
                                }
                                String widgetPath =
                                        widgetBindingEntries.getKey().trim();
                                String[] widgetPathParts = widgetPath.split("\\.");
                                String widgetName = widgetPath;
                                if (widgetPathParts.length > 0) {
                                    widgetName = widgetPathParts[0];
                                }
                                EntityDependencyNode entityDependencyNode = new EntityDependencyNode(
                                        EntityReferenceType.WIDGET, widgetName, widgetPath, null, null);
                                entry.getValue().stream().forEach(widgetDependencyNode -> {
                                    ExecutableDependencyEdge edge =
                                            new ExecutableDependencyEdge(widgetDependencyNode, entityDependencyNode);
                                    edges.add(edge);
                                });
                            });
                            return possibleParentsMap;
                        }))
                .collectList()
                .then(Mono.just(edges));
    }

    private boolean hasUserSetExecutableToNotRunOnPageLoad(Executable executable) {
        if (TRUE.equals(executable.getUserSetOnLoad()) && !TRUE.equals(executable.getExecuteOnLoad())) {
            return true;
        }

        return false;
    }

    /**
     * This function walks the executable configuration and extracts a map of all the dynamic bindings present and the
     * executable path where they exist.
     *
     * @param executable
     * @return
     */
    private <T extends Executable> Map<String, Set<String>> getExecutableBindingsMap(T executable) {

        List<Property> dynamicBindingPathList = executable.getDynamicBindingPathList();
        Map<String, Set<String>> completePathToDynamicBindingMap = new HashMap<>();

        Map<String, Object> configurationObj = objectMapper.convertValue(
                executable.getExecutableConfiguration(), new TypeReference<HashMap<String, Object>>() {});
        Set<String> selfReferencingDataPaths = executable.getSelfReferencingDataPaths();
        if (dynamicBindingPathList != null) {
            // Each of these might have nested structures, so we iterate through them to find the leaf node for each
            for (Property x : dynamicBindingPathList) {
                final String fieldPath = String.valueOf(x.getKey());

                /**
                 * selfReferencingDataPaths is a set of paths that are expected to contain bindings that refer to the
                 * same executable object i.e. a cyclic reference. e.g. A GraphQL API response can contain pagination
                 * cursors that are required to be configured in the pagination tab of the same API. We don't want to
                 * treat these cyclic references as cyclic dependency errors.
                 */
                if (selfReferencingDataPaths.contains(fieldPath)) {
                    continue;
                }

                String[] fields = fieldPath.split("[].\\[]");
                // For nested fields, the parent dsl to search in would shift by one level every iteration
                Object parent = configurationObj;
                Iterator<String> fieldsIterator = Arrays.stream(fields)
                        .filter(fieldToken -> !fieldToken.isBlank())
                        .iterator();
                boolean isLeafNode = false;
                // This loop will end at either a leaf node, or the last identified JSON field (by throwing an
                // exception)
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
                    if (isBindingPresentInString || executable.hasExtractableBinding()) {
                        Set<String> mustacheKeysFromFields;
                        // Stricter extraction of dynamic bindings
                        if (isBindingPresentInString) {
                            mustacheKeysFromFields = MustacheHelper.extractMustacheKeysFromFields(parent).stream()
                                    .map(token -> token.getValue())
                                    .collect(Collectors.toSet());
                        } else {
                            // this must be a JS function. No need to extract mustache. The entire string is JS body
                            mustacheKeysFromFields = Set.of((String) parent);
                        }

                        String completePath = executable.getCompleteDynamicBindingPath(fieldPath);
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
    private Set<ExecutableDependencyEdge> generateParentChildRelationships(EntityDependencyNode entityDependencyNode) {
        Set<ExecutableDependencyEdge> edges = new HashSet<>();

        String parent;

        while (true) {
            try {
                Matcher matcher = parentPattern.matcher(entityDependencyNode.getReferenceString());
                matcher.find();
                parent = matcher.group(1);
                EntityDependencyNode parentDependencyNode = new EntityDependencyNode(
                        entityDependencyNode.getEntityReferenceType(),
                        entityDependencyNode.getValidEntityName(),
                        parent,
                        entityDependencyNode.getIsFunctionCall(),
                        entityDependencyNode.getExecutable());
                edges.add(new ExecutableDependencyEdge(entityDependencyNode, parentDependencyNode));
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
     * - Is it an executable name (which has been found in the page). If not, ignore.
     * - Has this executable already been found for page load? If yes, ignore.
     * - If JS, following two conditions are checked for :
     * - If sync function, ignore. This is because client would execute the same during dynamic binding eval
     * - If async function, it is a candidate only if the data for the function is referred in the dynamic binding.
     *
     * @param executableNameToExecutableMap
     * @param vertex
     * @param pageLoadExecutablesLevelMap
     * @param existingPageLoadExecutables
     * @return
     */
    private Set<String> executableCandidatesForPageLoadFromBinding(
            Map<String, Executable> executableNameToExecutableMap,
            String vertex,
            Map<String, Integer> pageLoadExecutablesLevelMap,
            List<Set<String>> existingPageLoadExecutables,
            Set<String> explicitUserSetOnLoadExecutables) {

        Set<String> onPageLoadCandidates = new HashSet<>();

        Set<String> possibleParents = getPossibleParents(vertex);

        for (String entity : possibleParents) {

            // if this generated entity name from the binding matches an executable name check for its eligibility
            if (executableNameToExecutableMap.containsKey(entity)) {

                Boolean isCandidateForPageLoad = TRUE;

                /**
                 * Add executable for page load if:
                 *  o it has been explicitly set to run on page load by the user (even if its data is not
                 *  referenced in any widget or executable)
                 *  o or, it is not a function call i.e. the data of this call is being referred to in the binding.
                 */
                String validBinding;
                if (explicitUserSetOnLoadExecutables.contains(entity)) {
                    validBinding = executableNameToExecutableMap.get(entity).getConfigurationPath();
                } else {
                    validBinding = entity + "." + "data";
                }

                if (!vertex.contains(validBinding)) {
                    isCandidateForPageLoad = FALSE;
                }

                if (isCandidateForPageLoad) {

                    // Check if this executable has already been added to page load executables.
                    if (pageLoadExecutablesLevelMap.containsKey(entity)) {
                        // Remove this executable from the existing level so that it can be added again at a deeper
                        // level.
                        Integer level = pageLoadExecutablesLevelMap.get(entity);
                        existingPageLoadExecutables.get(level).remove(entity);
                    }

                    onPageLoadCandidates.add(entity);
                }
            }
        }

        return onPageLoadCandidates;
    }
}

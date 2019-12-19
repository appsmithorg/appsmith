package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.bson.types.ObjectId;
import org.jgrapht.Graph;
import org.jgrapht.graph.DefaultDirectedGraph;
import org.jgrapht.graph.DefaultEdge;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import static com.appsmith.server.helpers.MustacheHelper.extractMustacheKeys;
import static java.util.stream.Collectors.toSet;

@Slf4j
@Service
public class LayoutServiceImpl implements LayoutService {

    private final ApplicationPageService applicationPageService;
    private final PageService pageService;
    private final ActionService actionService;

    @Autowired
    public LayoutServiceImpl(ApplicationPageService applicationPageService,
                             PageService pageService,
                             ActionService actionService) {
        this.applicationPageService = applicationPageService;
        this.pageService = pageService;
        this.actionService = actionService;
    }

    @Override
    public Mono<Layout> createLayout(String pageId, Layout layout) {
        if (pageId == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID));
        }

        Mono<Page> pageMono = pageService
                .findById(pageId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID)));

        return pageMono
                .map(page -> {
                    List<Layout> layoutList = page.getLayouts();
                    if (layoutList == null) {
                        //no layouts exist for this page
                        layoutList = new ArrayList<Layout>();
                    }
                    //Adding an Id to the layout to ensure that a layout can be referred to by its ID as well.
                    layout.setId(new ObjectId().toString());
                    layoutList.add(layout);
                    page.setLayouts(layoutList);
                    return page;
                })
                .flatMap(pageService::save)
                .then(Mono.just(layout));
    }

    @Override
    public Mono<Layout> getLayout(String pageId, String layoutId, Boolean viewMode) {
        return pageService.findByIdAndLayoutsId(pageId, layoutId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID + " or " + FieldName.LAYOUT_ID)))
                .flatMap(applicationPageService::doesPageBelongToCurrentUserOrganization)
                //The pageId given is correct and belongs to the current user's organization.
                .map(page -> {
                    List<Layout> layoutList = page.getLayouts();
                    //Because the findByIdAndLayoutsId call returned non-empty result, we are guaranteed to find the layoutId here.
                    Layout matchedLayout = layoutList.stream().filter(layout -> layout.getId().equals(layoutId)).findFirst().get();
                    matchedLayout.setViewMode(viewMode);
                    return matchedLayout;
                });
    }

    @Override
    public Mono<Layout> updateLayout(String pageId, String layoutId, Layout layout) {

        JSONObject dsl = layout.getDsl();

        Graph<String, DefaultEdge> graph = new DefaultDirectedGraph<String, DefaultEdge>(DefaultEdge.class);

        //Walk through the DSL and extract the basic relationship of widgets with actions in the DSL.
        extractWidgetRelationship(dsl, graph);

        Mono<Set<DslActionDTO>> actionsInPage =
                updatePageIdsForActionsAndReturnDslActions(graph.vertexSet(), pageId)
                .map(action -> {
                    //Update the graph here to include action-widget dependecy via dynamic bindings in the action.
                    if (action.getJsonPathKeys() != null && !action.getJsonPathKeys().isEmpty()) {
                        Set<String> jsonPathKeys = action.getJsonPathKeys();
                        for (String jsonPathKey : jsonPathKeys) {
                            String[] substrings = jsonPathKey.split(Pattern.quote("."));
                            if (!graph.vertexSet().contains(substrings[0])) {
                                graph.addVertex(substrings[0]);
                            }
                            graph.addEdge(substrings[0], action.getName());
                        }
                    }

                    //Prepare the DslActionDTO that needs to be stored in the layout and return it to be collected in to a set.
                    DslActionDTO newAction = new DslActionDTO();
                    newAction.setId(action.getId());
                    newAction.setPluginType(action.getPluginType());
                    newAction.setJsonPathKeys(action.getJsonPathKeys());
                    newAction.setName(action.getName());
                    return newAction;
                })
                .collect(toSet());

        return pageService.findByIdAndLayoutsId(pageId, layoutId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID + " or " + FieldName.LAYOUT_ID)))
                .flatMap(applicationPageService::doesPageBelongToCurrentUserOrganization)
                //The pageId given is correct and belongs to the current user's organization.
                .zipWith(actionsInPage)
                .map(tuple -> {
                    Page page = tuple.getT1();
                    Set<DslActionDTO> actions = tuple.getT2();
                    List<Layout> layoutList = page.getLayouts();
                    Set<DslActionDTO> pageLoadActions = new HashSet<>();


                    // Find the top nodes in the graph : These are the nodes which are not dependent on any other node in the graph
                    ArrayList<String> rootNodesOfGraph = getRootNodesOfGraph(graph);

                    // The vertices of the graph currently contain both the actions and the widgets to show their dependency relationship
                    // Since we are only interested in top nodes which are actions, compare with actions set and
                    // add these actions to the array list to create page load actions.
                    actions.forEach(action -> {
                        if (rootNodesOfGraph.contains(action.getName())) {
                            pageLoadActions.add(action);
                        }
                    });

                    //Because the findByIdAndLayoutsId call returned non-empty result, we are guaranteed to find the layoutId here.
                    for (Layout storedLayout : layoutList) {
                        if (storedLayout.getId().equals(layoutId)) {
                            //Copy the variables to conserve before update
                            JSONObject publishedDsl = storedLayout.getPublishedDsl();
                            Set<DslActionDTO> publishedLayoutActions = storedLayout.getPublishedLayoutActions();
                            Set<DslActionDTO> publishedLayoutOnLoadActions = storedLayout.getPublishedLayoutOnLoadActions();

                            //Update
                            layout.setLayoutActions(actions);
                            layout.setLayoutOnLoadActions(pageLoadActions);
                            BeanUtils.copyProperties(layout, storedLayout);
                            storedLayout.setId(layoutId);

                            //Copy back the conserved variables.
                            storedLayout.setPublishedDsl(publishedDsl);
                            storedLayout.setPublishedLayoutActions(publishedLayoutActions);
                            storedLayout.setPublishedLayoutOnLoadActions(publishedLayoutOnLoadActions);
                            break;
                        }
                    }
                    page.setLayouts(layoutList);
                    return page;
                })
                .flatMap(pageService::save)
                .flatMap(page -> {
                    List<Layout> layoutList = page.getLayouts();
                    for (Layout storedLayout : layoutList) {
                        if (storedLayout.getId().equals(layoutId)) {
                            return Mono.just(storedLayout);
                        }
                    }
                    return Mono.empty();
                });
    }

    void extractWidgetRelationship(net.minidev.json.JSONObject dsl, Graph graph) {
        if (dsl.get(FieldName.WIDGET_NAME) == null) {
            //This isnt a valid widget configuration. No need to traverse this.
            return;
        }
        String widgetName = dsl.getAsString(FieldName.WIDGET_NAME);

        //Since we are parsing this widget in this, add it to the graph as a vertex.
        if (!graph.vertexSet().contains(widgetName)) {
            graph.addVertex(widgetName);
        }


        Object bindings = dsl.get(FieldName.DYNAMIC_BINDINGS);

        // If dynamic bindings exist, then an edge needs to be added to the graph to represent this relationship.
        if (bindings != null) {
            JSONObject db = new JSONObject();
            Map data = (Map) bindings;
            db.putAll(data);
            // The dynamic binding currently is represented as : {"keyName" : true}
            // So we need to only get the keyName.
            List<String> dynamicBindingKeys = new ArrayList<>(db.keySet());

            dynamicBindingKeys.forEach(dynamicBindingKey -> {
                // Assumption here is that DSL creator has ensured that key with name `dynamicBindingKey` would exist in
                // widget object.
                String binding = dsl.getAsString(dynamicBindingKey);

                Set<String> extractMustacheKeys = extractMustacheKeys(binding);
                if (!extractMustacheKeys.isEmpty()) {
                    for (String mustacheKey : extractMustacheKeys) {
                        String key = mustacheKey.trim();
                        // We are only interested in the top level. e.g. if its Input1.text, we want just Input1
                        String[] subStrings = key.split(Pattern.quote("."));

                        if (!graph.vertexSet().contains(subStrings[0])) {
                            graph.addVertex(subStrings[0]);
                        }
                        //Now add the edge to represent this relationship
                        graph.addEdge(subStrings[0], widgetName);
                    }
                }
            });

        }

        ArrayList<Object> children = (ArrayList<Object>) dsl.get(FieldName.CHILDREN);
        if (children != null) {
            for (int i = 0; i < children.size(); i++) {
                Map data = (Map) children.get(i);
                JSONObject object = new JSONObject();
                object.putAll(data);
                extractWidgetRelationship(object, graph);
            }
        }
    }

    /**
     * This function returns all the nodes which are at the top of the graph.
     * These nodes are the nodes which are not dependent on any other node. Since the graph displays the dependencies of
     * different widgets and actions between each other, the root nodes of the graphs are clearly the ones which are
     * independent of others.
     *
     * @param graph
     * @return
     */
    ArrayList<String> getRootNodesOfGraph(Graph graph) {
        Set vertexSet = graph.vertexSet();
        ArrayList<String> topVertices = new ArrayList<>();
        vertexSet.forEach(vertex -> {
            int inDegree = graph.inDegreeOf(vertex);
            //If this is a root node (Also includes nodes which are not connected to anything), we are interested.
            if (inDegree == 0) {
                topVertices.add((String) vertex);
            }
        });
        return topVertices;
    }

    Flux<Action> updatePageIdsForActionsAndReturnDslActions(Set<String> nodes, String pageId) {

        return actionService
                .findDistinctActionsByNameInAndPageId(nodes, pageId);
    }

}


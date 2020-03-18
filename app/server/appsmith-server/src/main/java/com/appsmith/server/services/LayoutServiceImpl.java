package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Page;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.bson.types.ObjectId;
import org.jgrapht.Graph;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.appsmith.server.helpers.MustacheHelper.extractMustacheKeys;

@Slf4j
@Service
public class LayoutServiceImpl implements LayoutService {

    private final ApplicationPageService applicationPageService;
    private final PageService pageService;
    /*
     * This pattern finds all the String which have been extracted from the mustache dynamic bindings.
     * e.g. for the given JS function using action with name "fetchUsers"
     * {{JSON.stringify(fetchUsers)}}
     * This pattern should return ["JSON.stringify", "fetchUsers"]
     */
    private final Pattern pattern = Pattern.compile("[a-zA-Z0-9._]+");

    @Autowired
    public LayoutServiceImpl(ApplicationPageService applicationPageService,
                             PageService pageService) {
        this.applicationPageService = applicationPageService;
        this.pageService = pageService;
    }

    @Override
    public Mono<Layout> createLayout(String pageId, Layout layout) {
        if (pageId == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID));
        }

        Mono<Page> pageMono = pageService
                .findById(pageId, AclPermission.MANAGE_PAGES)
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


    /**
     * Walks the DSL and adds relationship between widgets and actions. Widgets have at this point already been added
     * to the graph by function extractAllWidgetNamesAndAddThemAsVerticesToTheGraph. Actions are recognized by comparing
     * them to a master list of action names which could be found in the DSL by the name of masterPageActions. Once
     * an action name has been found in the dynamic binding, it is then added to boundPageActions list.
     *
     * @param dsl
     * @param graph
     * @param masterPageActions
     * @param boundPageActions
     */
    @Deprecated
    private void extractRelationshipsFromDSLAndAddThemAsEdgesToTheGraph(net.minidev.json.JSONObject dsl, Graph graph, List<String> masterPageActions, List<String> boundPageActions) {
        if (dsl.get(FieldName.WIDGET_NAME) == null) {
            //This isnt a valid widget configuration. No need to traverse this.
            return;
        }

        String widgetName = dsl.getAsString(FieldName.WIDGET_NAME);

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

                        Matcher matcher = pattern.matcher(key);

                        while (matcher.find()) {
                            String word = matcher.group();

                            // We are only interested in the top level. e.g. if its Input1.text, we want just Input1
                            String[] subStrings = word.split(Pattern.quote("."));

                            // This only adds an edge if the string matches any action name or widget name
                            if (masterPageActions.contains(subStrings[0]) || graph.vertexSet().contains(subStrings[0])) {

                                //If this is an action and not a widget, add it to list of bound actions
                                if (masterPageActions.contains(subStrings[0])) {
                                    boundPageActions.add(subStrings[0]);
                                }

                                if (!graph.vertexSet().contains(subStrings[0])) {
                                    graph.addVertex(subStrings[0]);
                                }
                                //Now add the edge to represent this relationship between the widget and widget/action
                                graph.addEdge(subStrings[0], widgetName);
                            }
                        }
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
                extractRelationshipsFromDSLAndAddThemAsEdgesToTheGraph(object, graph, masterPageActions, boundPageActions);
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
    @Deprecated
    private ArrayList<String> getRootNodesOfGraph(Graph graph) {
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


}


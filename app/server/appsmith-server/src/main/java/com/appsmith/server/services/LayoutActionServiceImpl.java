package com.appsmith.server.services;

import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionDependencyEdge;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.dtos.LayoutActionUpdateDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.RefactorNameDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.solutions.PageLoadActionsUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.appsmith.external.helpers.MustacheHelper.extractWordsAndAddToSet;
import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static java.util.stream.Collectors.toSet;

@Service
@Slf4j
public class LayoutActionServiceImpl implements LayoutActionService {

    private final ObjectMapper objectMapper;
    private final AnalyticsService analyticsService;
    private final NewPageService newPageService;
    private final NewActionService newActionService;
    private final PageLoadActionsUtil pageLoadActionsUtil;
    private final SessionUserService sessionUserService;


    /*
     * To replace fetchUsers in `{{JSON.stringify(fetchUsers)}}` with getUsers, the following regex is required :
     * `\\b(fetchUsers)\\b`. To achieve this the following strings preWord and postWord are declared here to be used
     * at run time to create the regex pattern.
     */
    private final String preWord = "\\b(";
    private final String postWord = ")\\b";

    public LayoutActionServiceImpl(ObjectMapper objectMapper,
                                   AnalyticsService analyticsService,
                                   NewPageService newPageService,
                                   NewActionService newActionService,
                                   PageLoadActionsUtil pageLoadActionsUtil,
                                   SessionUserService sessionUserService) {
        this.objectMapper = objectMapper;
        this.analyticsService = analyticsService;
        this.newPageService = newPageService;
        this.newActionService = newActionService;
        this.pageLoadActionsUtil = pageLoadActionsUtil;
        this.sessionUserService = sessionUserService;
    }

    @Override
    public Mono<ActionDTO> moveAction(ActionMoveDTO actionMoveDTO) {
        ActionDTO action = actionMoveDTO.getAction();

        String oldPageId = actionMoveDTO.getAction().getPageId();

        action.setPageId(actionMoveDTO.getDestinationPageId());

        /*
         * The following steps are followed here :
         * 1. Update and save the action
         * 2. Run updateLayout on the old page
         * 3. Run updateLayout on the new page.
         * 4. Return the saved action.
         */
        return newActionService
                // 1. Update and save the action
                .updateUnpublishedAction(action.getId(), action)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, actionMoveDTO.getAction().getId())))
                .flatMap(savedAction ->
                        // fetch the unpublished source page
                        newPageService
                                .findPageById(oldPageId, MANAGE_PAGES, false)
                                .flatMap(page -> {
                                    if (page.getLayouts() == null) {
                                        return Mono.empty();
                                    }

                                    // 2. Run updateLayout on the old page
                                    return Flux.fromIterable(page.getLayouts())
                                            .flatMap(layout -> updateLayout(oldPageId, layout.getId(), layout))
                                            .collect(toSet());
                                })
                                // fetch the unpublished destination page
                                .then(newPageService.findPageById(actionMoveDTO.getDestinationPageId(), MANAGE_PAGES, false))
                                .flatMap(page -> {
                                    if (page.getLayouts() == null) {
                                        return Mono.empty();
                                    }

                                    // 3. Run updateLayout on the new page.
                                    return Flux.fromIterable(page.getLayouts())
                                            .flatMap(layout -> updateLayout(actionMoveDTO.getDestinationPageId(), layout.getId(), layout))
                                            .collect(toSet());
                                })
                                // 4. Return the saved action.
                                .thenReturn(savedAction));
    }

    @Override
    public Mono<LayoutDTO> refactorWidgetName(RefactorNameDTO refactorNameDTO) {
        String pageId = refactorNameDTO.getPageId();
        String layoutId = refactorNameDTO.getLayoutId();
        String oldName = refactorNameDTO.getOldName();
        String newName = refactorNameDTO.getNewName();
        return isNameAllowed(pageId, layoutId, newName)
                .flatMap(allowed -> {
                    if (!allowed) {
                        return Mono.error(new AppsmithException(AppsmithError.NAME_CLASH_NOT_ALLOWED_IN_REFACTOR, oldName, newName));
                    }
                    return refactorName(pageId, layoutId, oldName, newName);
                });
    }

    @Override
    public Mono<LayoutDTO> refactorActionName(RefactorNameDTO refactorNameDTO) {
        String pageId = refactorNameDTO.getPageId();
        String layoutId = refactorNameDTO.getLayoutId();
        String oldName = refactorNameDTO.getOldName();
        String newName = refactorNameDTO.getNewName();
        return isNameAllowed(pageId, layoutId, newName)
                .flatMap(allowed -> {
                    if (!allowed) {
                        return Mono.error(new AppsmithException(AppsmithError.NAME_CLASH_NOT_ALLOWED_IN_REFACTOR, oldName, newName));
                    }
                    return newActionService
                            .findByUnpublishedNameAndPageId(oldName, pageId, MANAGE_ACTIONS);
                })
                .flatMap(action -> {
                    action.setName(newName);
                    return newActionService.updateUnpublishedAction(action.getId(), action);
                })
                .then(refactorName(pageId, layoutId, oldName, newName));
    }

    /**
     * Assumption here is that the refactoring name provided is indeed unique and is fit to be replaced everywhere.
     * <p>
     * At this point, the user must have MANAGE_PAGES and MANAGE_ACTIONS permissions for page and action respectively
     *
     * @param pageId
     * @param layoutId
     * @param oldName
     * @param newName
     * @return
     */
    private Mono<LayoutDTO> refactorName(String pageId, String layoutId, String oldName, String newName) {
        String regexPattern = preWord + oldName + postWord;
        Pattern oldNamePattern = Pattern.compile(regexPattern);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        if (pageId != null) {
            params.add(FieldName.PAGE_ID, pageId);
        }

        Mono<PageDTO> updatePageMono = newPageService
                // fetch the unpublished page
                .findPageById(pageId, MANAGE_PAGES, false)
                .flatMap(page -> {
                    List<Layout> layouts = page.getLayouts();
                    for (Layout layout : layouts) {
                        if (layout.getId().equals(layoutId) && layout.getDsl() != null) {
                            String dslString = "";
                            try {
                                dslString = objectMapper.writeValueAsString(layout.getDsl());
                            } catch (JsonProcessingException e) {
                                log.debug("Exception caught during conversion of DSL Json object to String. ", e);
                            }
                            Matcher matcher = oldNamePattern.matcher(dslString);
                            String newDslString = matcher.replaceAll(newName);
                            try {
                                JSONParser parser = new JSONParser(JSONParser.MODE_PERMISSIVE);
                                JSONObject json = (JSONObject) parser.parse(newDslString);
                                layout.setDsl(json);
                            } catch (ParseException e) {
                                log.debug("Exception caught during DSL conversion from string to Json object. ", e);
                            }
                            page.setLayouts(layouts);
                            // Since the page has most probably changed, save the page and return.
                            return newPageService.saveUnpublishedPage(page);
                        }
                    }
                    // If we have reached here, the layout was not found and the page should be returned as is.
                    return Mono.just(page);
                });

        Mono<Set<String>> updateActionsMono = newActionService
                .findByPageIdAndViewMode(pageId, false, MANAGE_ACTIONS)
                /*
                 * Assuming that the datasource should not be dependent on the widget and hence not going through the same
                 * to look for replacement pattern.
                 */
                .flatMap(newAction -> {
                    ActionDTO action = newAction.getUnpublishedAction();
                    Boolean actionUpdateRequired = false;
                    ActionConfiguration actionConfiguration = action.getActionConfiguration();
                    Set<String> jsonPathKeys = action.getJsonPathKeys();

                    if (jsonPathKeys != null && !jsonPathKeys.isEmpty()) {
                        // Since json path keys actually contain the entire inline js function instead of just the widget/action
                        // name, we can not simply use the set.contains(obj) function. We need to iterate over all the keys
                        // in the set and see if the old name is a substring of the json path key.
                        for (String key : jsonPathKeys) {
                            if (key.contains(oldName)) {
                                actionUpdateRequired = true;
                            }
                        }
                    }

                    if (!actionUpdateRequired || actionConfiguration == null) {
                        return Mono.just(newAction);
                    }
                    // if actionupdateRequired is true AND actionConfiguration is not null
                    try {
                        String actionConfigurationAsString = objectMapper.writeValueAsString(actionConfiguration);
                        Matcher matcher = oldNamePattern.matcher(actionConfigurationAsString);
                        String newActionConfigurationAsString = matcher.replaceAll(newName);
                        ActionConfiguration newActionConfiguration = objectMapper.readValue(newActionConfigurationAsString, ActionConfiguration.class);
                        action.setActionConfiguration(newActionConfiguration);
                        newAction = newActionService.extractAndSetJsonPathKeys(newAction);
                        return newActionService.save(newAction);
                    } catch (JsonProcessingException e) {
                        log.debug("Exception caught during conversion between string and action configuration object ", e);
                        return Mono.just(newAction);
                    }
                })
                .map(savedAction -> savedAction.getUnpublishedAction().getName())
                .collect(toSet());

        return Mono.zip(updateActionsMono, updatePageMono)
                .flatMap(tuple -> {
                    Set<String> updatedActionNames = tuple.getT1();
                    PageDTO page = tuple.getT2();
                    log.debug("Actions updated due to refactor name in page {} are : {}", pageId, updatedActionNames);
                    List<Layout> layouts = page.getLayouts();
                    for (Layout layout : layouts) {
                        if (layout.getId().equals(layoutId)) {
                            return updateLayout(pageId, layout.getId(), layout);
                        }
                    }
                    return Mono.empty();
                });
    }

    /**
     * Walks the DSL and extracts all the widget names from it.
     * A widget is expected to have a few properties defining its own behaviour, with any mustache bindings present
     * in them aggregated in the field dynamicBindingsPathList.
     * A widget may also have other widgets as children, each of which will follow the same structure
     * Refer to FieldName.DEFAULT_PAGE_LAYOUT for a template
     *
     * @param dsl
     * @param widgetNames
     * @param dynamicBindings
     * @param pageId
     * @param layoutId
     */
    private void extractAllWidgetNamesAndDynamicBindingsFromDSL(JSONObject dsl,
                                                                Set<String> widgetNames,
                                                                Set<String> dynamicBindings,
                                                                String pageId,
                                                                String layoutId) throws AppsmithException {
        if (dsl.get(FieldName.WIDGET_NAME) == null) {
            // This isnt a valid widget configuration. No need to traverse this.
            return;
        }

        String widgetName = dsl.getAsString(FieldName.WIDGET_NAME);
        String widgetId = dsl.getAsString(FieldName.WIDGET_ID);
        String widgetType = dsl.getAsString(FieldName.WIDGET_TYPE);

        // Since we are parsing this widget in this, add it to the global set of widgets found so far in the DSL.
        widgetNames.add(widgetName);

        // Start by picking all fields where we expect to find dynamic bindings for this particular widget
        ArrayList<Object> dynamicallyBoundedPathList = (ArrayList<Object>) dsl.get(FieldName.DYNAMIC_BINDING_PATH_LIST);

        // Widgets will not have FieldName.DYNAMIC_BINDING_PATH_LIST if there are no bindings in that widget.
        // Hence we skip over the extraction of the bindings from that widget.
        if (dynamicallyBoundedPathList != null) {
            // Each of these might have nested structures, so we iterate through them to find the leaf node for each
            for (Object x : dynamicallyBoundedPathList) {
                final String fieldPath = String.valueOf(((Map) x).get(FieldName.KEY));
                String[] fields = fieldPath.split("[].\\[]");
                // For nested fields, the parent dsl to search in would shift by one level every iteration
                Object parent = dsl;
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
                                // The index being referred does not exist. Hence the path would not exist.
                                throw new AppsmithException(AppsmithError.INVALID_DYNAMIC_BINDING_REFERENCE, widgetType,
                                        widgetName, widgetId, fieldPath, pageId, layoutId, null);
                            }
                        } else {
                            throw new AppsmithException(AppsmithError.INVALID_DYNAMIC_BINDING_REFERENCE, widgetType,
                                    widgetName, widgetId, fieldPath, pageId, layoutId, null);
                        }
                    }
                    // After updating the parent, check for the types
                    if (parent == null) {
                        throw new AppsmithException(AppsmithError.INVALID_DYNAMIC_BINDING_REFERENCE, widgetType,
                                widgetName, widgetId, fieldPath, pageId, layoutId, null);
                    } else if (parent instanceof String) {
                        // If we get String value, then this is a leaf node
                        isLeafNode = true;
                    }
                }
                // Only extract mustache keys from leaf nodes
                if (isLeafNode) {
                    Set<String> mustacheKeysFromFields = MustacheHelper.extractMustacheKeysFromFields(parent);

                    // We found the path. But if the path does not have any mustache bindings, throw the error
                    if (mustacheKeysFromFields.isEmpty()) {
                        throw new AppsmithException(AppsmithError.INVALID_DYNAMIC_BINDING_REFERENCE, widgetType,
                                widgetName, widgetId, fieldPath, pageId, layoutId, parent);
                    }

                    dynamicBindings.addAll(mustacheKeysFromFields);
                }
            }
        }

        // Fetch the children of the current node in the DSL and recursively iterate over them to extract bindings
        ArrayList<Object> children = (ArrayList<Object>) dsl.get(FieldName.CHILDREN);
        if (children != null) {
            for (int i = 0; i < children.size(); i++) {
                Map data = (Map) children.get(i);
                JSONObject object = new JSONObject();
                // If the children tag exists and there are entries within it
                if (!CollectionUtils.isEmpty(data)) {
                    object.putAll(data);
                    extractAllWidgetNamesAndDynamicBindingsFromDSL(object, widgetNames, dynamicBindings, pageId, layoutId);
                }
            }
        }
    }

    /**
     * Compares the new name with the existing widget and action names for this page. If they match, then it returns
     * false to signify that refactoring can not be allowed. Else, refactoring should be allowed and hence true is
     * returned.
     *
     * @param pageId
     * @param layoutId
     * @param newName
     * @return
     */
    private Mono<Boolean> isNameAllowed(String pageId, String layoutId, String newName) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        if (pageId != null) {
            params.add(FieldName.PAGE_ID, pageId);
        }

        Mono<Set<String>> actionNamesInPageMono = newActionService
                .getUnpublishedActions(params)
                .map(action -> action.getName())
                .collect(toSet());

        /*
         * TODO : Execute this check directly on the DB server. We can query array of arrays by:
         * https://stackoverflow.com/questions/12629692/querying-an-array-of-arrays-in-mongodb
         */
        Mono<Set<String>> widgetNamesMono = newPageService
                // fetch the unpublished page
                .findPageById(pageId, MANAGE_PAGES, false)
                .flatMap(page -> {
                    List<Layout> layouts = page.getLayouts();
                    for (Layout layout : layouts) {
                        if (layout.getId().equals(layoutId)) {
                            if (layout.getWidgetNames() != null && layout.getWidgetNames().size() > 0) {
                                return Mono.just(layout.getWidgetNames());
                            }
                            // In case of no widget names (which implies that there is no DSL), return an empty set.
                            return Mono.just(new HashSet<>());
                        }
                    }
                    return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.LAYOUT_ID, layoutId));
                });

        return actionNamesInPageMono
                .map(actionNames -> {
                    if (actionNames.contains(newName)) {
                        return false;
                    }
                    return true;
                })
                .zipWith(widgetNamesMono)
                .map(tuple -> {
                    Boolean allowed = tuple.getT1();
                    if (allowed.equals(false)) {
                        return false;
                    }

                    Set<String> widgetNames = tuple.getT2();
                    if (widgetNames.contains(newName)) {
                        return false;
                    }
                    return true;
                });
    }

    /**
     * After updating the action, page layout needs to be updated to update the page load actions with the new json
     * path keys.
     * <p>
     * Calling the base function would make redundant DB calls and slow down this API unnecessarily.
     * <p>
     * At this point the user must have MANAGE_PAGE permissions because update action also leads to the page's
     * actions on load to change.
     *
     * @param id
     * @param action
     * @return
     */
    @Override
    public Mono<ActionDTO> updateAction(String id, ActionDTO action) {
        Mono<ActionDTO> updateUnpublishedAction = newActionService
                .updateUnpublishedAction(id, action)
                .cache();

        // First update the action
        return updateUnpublishedAction
                // Now update the page layout for any on load changes that may have occured.
                .flatMap(savedAction -> updatePageLayoutsGivenAction(savedAction.getPageId()))
                // Return back the updated action.
                .then(updateUnpublishedAction);

    }

    @Override
    public Mono<ActionDTO> setExecuteOnLoad(String id, Boolean isExecuteOnLoad) {
        return newActionService.findById(id, MANAGE_ACTIONS)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, id)))
                .flatMap(newAction -> {
                    ActionDTO action = newAction.getUnpublishedAction();

                    action.setUserSetOnLoad(true);
                    action.setExecuteOnLoad(isExecuteOnLoad);

                    newAction.setUnpublishedAction(action);

                    return newActionService.save(newAction)
                            .flatMap(savedAction -> updatePageLayoutsGivenAction(savedAction.getUnpublishedAction().getPageId())
                                    .then(newActionService.generateActionByViewMode(savedAction, false)));

                });
    }

    private Mono<String> updatePageLayoutsGivenAction(String pageId) {
        return Mono.justOrEmpty(pageId)
                // fetch the unpublished page
                .flatMap(id -> newPageService.findPageById(id, MANAGE_PAGES, false))
                .flatMapMany(page -> {
                    if (page.getLayouts() == null) {
                        return Mono.empty();
                    }
                    return Flux.fromIterable(page.getLayouts())
                            .flatMap(layout -> updateLayout(page.getId(), layout.getId(), layout));
                })
                .collectList()
                .then(Mono.just(pageId));
    }

    private Mono<Boolean> sendUpdateLayoutAnalyticsEvent(String pageId, String layoutId, JSONObject dsl, boolean isSuccess, Throwable error) {
        return Mono.zip(
                sessionUserService.getCurrentUser(),
                newPageService.getById(pageId)
        )
                .flatMap(tuple -> {
                    User t1 = tuple.getT1();
                    NewPage t2 = tuple.getT2();

                    final Map<String, Object> data = Map.of(
                            "username", t1.getUsername(),
                            "appId", t2.getApplicationId(),
                            "pageId", pageId,
                            "layoutId", layoutId,
                            "dsl", dsl.toJSONString(),
                            "isSuccessfulExecution", isSuccess,
                            "error", error == null ? "" : error.getMessage()
                    );

                    analyticsService.sendEvent(AnalyticsEvents.UPDATE_LAYOUT.getEventName(), t1.getUsername(), data);
                    return Mono.just(isSuccess);
                })
                .onErrorResume(e -> {
                    log.warn("Error sending action execution data point", e);
                    return Mono.just(isSuccess);
                });

    }

    @Override
    public Mono<LayoutDTO> updateLayout(String pageId, String layoutId, Layout layout) {
        final JSONObject dsl = layout.getDsl();
        if (dsl == null) {
            // There is no DSL here. No need to process anything. Return as is.
            return Mono.just(generateResponseDTO(layout));
        }

        Set<String> widgetNames = new HashSet<>();
        Set<String> jsSnippetsInDynamicBindings = new HashSet<>();
        try {
            extractAllWidgetNamesAndDynamicBindingsFromDSL(dsl, widgetNames, jsSnippetsInDynamicBindings, pageId, layoutId);
        } catch (Throwable t) {
            return sendUpdateLayoutAnalyticsEvent(pageId, layoutId, dsl, false, t)
                    .then(Mono.error(t));
        }
        layout.setWidgetNames(widgetNames);

        // dynamicBindingNames is a set of all words extracted from js snippets which could also contain the names
        // of the actions 
        Set<String> dynamicBindingNames = new HashSet<>();
        if (!CollectionUtils.isEmpty(jsSnippetsInDynamicBindings)) {
            for (String mustacheKey : jsSnippetsInDynamicBindings) {
                // Extract all the words in the dynamic bindings
                extractWordsAndAddToSet(dynamicBindingNames, mustacheKey);
            }
        }

        Set<String> actionNames = new HashSet<>();
        Set<ActionDependencyEdge> edges = new HashSet<>();
        Set<String> actionsUsedInDSL = new HashSet<>();
        List<ActionDTO> flatmapPageLoadActions = new ArrayList<>();
        List<LayoutActionUpdateDTO> actionUpdates = new ArrayList<>();
        List<String> messages = new ArrayList<>();

        Mono<List<HashSet<DslActionDTO>>> allOnLoadActionsMono = pageLoadActionsUtil
                .findAllOnLoadActions(dynamicBindingNames, actionNames, pageId, edges, actionsUsedInDSL, flatmapPageLoadActions);

        // First update the actions and set execute on load to true
        return allOnLoadActionsMono
                .flatMap(allOnLoadActions -> {
                    // Update these actions to be executed on load, unless the user has touched the executeOnLoad setting for this
                    return newActionService
                            .updateActionsExecuteOnLoad(flatmapPageLoadActions, pageId, actionUpdates, messages)
                            .thenReturn(allOnLoadActions);
                })
                .zipWith(newPageService.findByIdAndLayoutsId(pageId, layoutId, MANAGE_PAGES, false)
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND,
                                FieldName.PAGE_ID + " or " + FieldName.LAYOUT_ID, pageId + ", " + layoutId))))
                // Now update the page layout with the page load actions and the graph.
                .flatMap(tuple -> {
                    List<HashSet<DslActionDTO>> onLoadActions = tuple.getT1();
                    PageDTO page = tuple.getT2();

                    List<Layout> layoutList = page.getLayouts();
                    //Because the findByIdAndLayoutsId call returned non-empty result, we are guaranteed to find the layoutId here.
                    for (Layout storedLayout : layoutList) {
                        if (storedLayout.getId().equals(layoutId)) {
                            // Now that all the on load actions have been computed, set the vertices, edges, actions in DSL
                            // in the layout for re-use to avoid computing DAG unnecessarily.
                            layout.setLayoutOnLoadActions(onLoadActions);
                            layout.setAllOnPageLoadActionNames(actionNames);
                            layout.setAllOnPageLoadActionEdges(edges);
                            layout.setActionsUsedInDynamicBindings(actionsUsedInDSL);

                            BeanUtils.copyProperties(layout, storedLayout);
                            storedLayout.setId(layoutId);

                            break;
                        }
                    }
                    page.setLayouts(layoutList);
                    return newPageService.saveUnpublishedPage(page);
                })
                .flatMap(page -> {
                    List<Layout> layoutList = page.getLayouts();
                    for (Layout storedLayout : layoutList) {
                        if (storedLayout.getId().equals(layoutId)) {
                            return Mono.just(storedLayout);
                        }
                    }
                    return Mono.empty();
                })
                .flatMap(savedLayout -> {
                    LayoutDTO layoutDTO = generateResponseDTO(savedLayout);
                    layoutDTO.setActionUpdates(actionUpdates);
                    layoutDTO.setMessages(messages);

                    return sendUpdateLayoutAnalyticsEvent(pageId, layoutId, dsl, true, null)
                            .thenReturn(layoutDTO);
                });
    }

    private LayoutDTO generateResponseDTO(Layout layout) {

        LayoutDTO layoutDTO = new LayoutDTO();

        layoutDTO.setId(layout.getId());
        layoutDTO.setDsl(layout.getDsl());
        layoutDTO.setScreen(layout.getScreen());
        layoutDTO.setLayoutOnLoadActions(layout.getLayoutOnLoadActions());
        layoutDTO.setUserPermissions(layout.getUserPermissions());

        return layoutDTO;
    }

}

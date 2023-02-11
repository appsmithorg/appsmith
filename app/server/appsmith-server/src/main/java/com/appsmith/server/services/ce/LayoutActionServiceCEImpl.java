package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.helpers.AppsmithEventContextType;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionDependencyEdge;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.dtos.LayoutActionUpdateDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DefaultResourcesUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.helpers.WidgetSpecificUtils;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.CollectionService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.PageLoadActionsUtil;
import com.appsmith.server.solutions.PagePermission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.springframework.beans.BeanUtils;
import org.springframework.util.CollectionUtils;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
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
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.server.services.ce.ApplicationPageServiceCEImpl.EVALUATION_VERSION;
import static java.lang.Boolean.FALSE;
import static java.util.stream.Collectors.toSet;


@Slf4j
@RequiredArgsConstructor
public class LayoutActionServiceCEImpl implements LayoutActionServiceCE {

    private final ObjectMapper objectMapper;
    private final AnalyticsService analyticsService;
    private final NewPageService newPageService;
    private final NewActionService newActionService;
    private final PageLoadActionsUtil pageLoadActionsUtil;
    private final SessionUserService sessionUserService;
    private final ActionCollectionService actionCollectionService;
    private final CollectionService collectionService;
    private final ApplicationService applicationService;
    private final ResponseUtils responseUtils;
    private final DatasourceService datasourceService;
    private final PagePermission pagePermission;
    private final ActionPermission actionPermission;


    private final String layoutOnLoadActionErrorToastMessage = "A cyclic dependency error has been encountered on current page, \nqueries on page load will not run. \n Please check debugger and Appsmith documentation for more information";


    /**
     * Called by Action controller to create Action
     */
    @Override
    public Mono<ActionDTO> createAction(ActionDTO action) {
        if (action.getCollectionId() == null) {
            return this.createSingleAction(action, Boolean.FALSE);
        }

        return this.createSingleAction(action, Boolean.FALSE)
                .flatMap(savedAction -> collectionService.addSingleActionToCollection(action.getCollectionId(), savedAction));
    }

    @Override
    public Mono<ActionDTO> updateAction(String id, ActionDTO action) {

        // Since the policies are server only concept, we should first set this to null.
        action.setPolicies(null);

        //The change was not in CollectionId, just go ahead and update normally
        if (action.getCollectionId() == null) {
            return this.updateSingleAction(id, action)
                    .flatMap(updatedAction -> this.updatePageLayoutsByPageId(updatedAction.getPageId()).thenReturn(updatedAction));
        } else if (action.getCollectionId().length() == 0) {
            //The Action has been removed from existing collection.
            return newActionService
                    .getById(id)
                    .flatMap(action1 -> collectionService.removeSingleActionFromCollection(action1.getUnpublishedAction().getCollectionId(),
                            Mono.just(action1)))
                    .flatMap(action1 -> {
                        log.debug("Action {} has been removed from its collection.", action1.getId());
                        action.setCollectionId(null);
                        return this.updateSingleAction(id, action)
                                .flatMap(updatedAction -> this.updatePageLayoutsByPageId(updatedAction.getPageId()).thenReturn(updatedAction));
                    });
        } else {
            //If the code flow has reached this point, that means that the collectionId has been changed to another collection.
            //Remove the action from previous collection and add it to the new collection.
            return newActionService
                    .getById(id)
                    .flatMap(action1 -> {
                        if (action1.getUnpublishedAction().getCollectionId() != null) {
                            return collectionService.removeSingleActionFromCollection(action1.getUnpublishedAction().getCollectionId(),
                                    Mono.just(action1));
                        }
                        return Mono.just(newActionService.generateActionByViewMode(action1, false));
                    })
                    .map(obj -> (NewAction) obj)
                    .flatMap(action1 -> {
                        ActionDTO unpublishedAction = action1.getUnpublishedAction();
                        unpublishedAction.setId(action1.getId());
                        return collectionService.addSingleActionToCollection(action.getCollectionId(), unpublishedAction);
                    })
                    .flatMap(action1 -> {
                        log.debug("Action {} removed from its previous collection and added to the new collection", action1.getId());
                        return this.updateSingleAction(id, action)
                                .flatMap(updatedAction -> this.updatePageLayoutsByPageId(updatedAction.getPageId()).thenReturn(updatedAction));
                    });
        }
    }

    @Override
    public Mono<ActionDTO> moveAction(ActionMoveDTO actionMoveDTO) {
        ActionDTO action = actionMoveDTO.getAction();
        String oldPageId = actionMoveDTO.getAction().getPageId();
        final String destinationPageId = actionMoveDTO.getDestinationPageId();
        action.setPageId(destinationPageId);

        Mono<NewPage> destinationPageMono = newPageService.findById(destinationPageId, pagePermission.getActionCreatePermission())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.PAGE, destinationPageId)));

        /*
         * The following steps are followed here :
         * 1. Fetch destination page, update default page ID in actionDTO
         * 2. Update and save the action
         * 3. Run updateLayout on the old page
         * 4. Run updateLayout on the new page.
         * 5. Return the saved action.
         */
        return destinationPageMono
                .flatMap(destinationPage -> {
                    // 1. Update and save the action
                    if (action.getDefaultResources() == null) {
                        log.debug("Default resource should not be empty for move action: {}", action.getId());
                        DefaultResources defaultResources = new DefaultResources();
                        defaultResources.setPageId(destinationPage.getDefaultResources().getPageId());
                        action.setDefaultResources(defaultResources);
                    } else {
                        action.getDefaultResources().setPageId(destinationPage.getDefaultResources().getPageId());
                    }
                    return newActionService
                            .updateUnpublishedAction(action.getId(), action)
                            .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, actionMoveDTO.getAction().getId())));
                })
                .flatMap(savedAction ->
                        // fetch the unpublished source page
                        newPageService
                                .findPageById(oldPageId, pagePermission.getEditPermission(), false)
                                .flatMap(page -> {
                                    if (page.getLayouts() == null) {
                                        return Mono.empty();
                                    }

                                    // 2. Run updateLayout on the old page
                                    return Flux.fromIterable(page.getLayouts())
                                            .flatMap(layout -> {
                                                layout.setDsl(this.unescapeMongoSpecialCharacters(layout));
                                                return updateLayout(page.getId(), page.getApplicationId(), layout.getId(), layout);
                                            })
                                            .collect(toSet());
                                })
                                // fetch the unpublished destination page
                                .then(newPageService.findPageById(actionMoveDTO.getDestinationPageId(), pagePermission.getActionCreatePermission(), false))
                                .flatMap(page -> {
                                    if (page.getLayouts() == null) {
                                        return Mono.empty();
                                    }

                                    // 3. Run updateLayout on the new page.
                                    return Flux.fromIterable(page.getLayouts())
                                            .flatMap(layout -> {
                                                layout.setDsl(this.unescapeMongoSpecialCharacters(layout));
                                                return updateLayout(page.getId(), page.getApplicationId(), layout.getId(), layout);
                                            })
                                            .collect(toSet());
                                })
                                // 4. Return the saved action.
                                .thenReturn(savedAction));
    }

    @Override
    public Mono<ActionDTO> moveAction(ActionMoveDTO actionMoveDTO, String branchName) {

        // As client only have default page Id it will be sent under action and not the action.defaultResources
        Mono<String> toPageMono = newPageService
                .findByBranchNameAndDefaultPageId(branchName, actionMoveDTO.getDestinationPageId(), pagePermission.getActionCreatePermission())
                .map(NewPage::getId);

        Mono<NewAction> branchedActionMono = newActionService
                .findByBranchNameAndDefaultActionId(branchName, actionMoveDTO.getAction().getId(), actionPermission.getEditPermission());

        return Mono.zip(toPageMono, branchedActionMono)
                .flatMap(tuple -> {
                    String toPageId = tuple.getT1();
                    NewAction branchedAction = tuple.getT2();
                    ActionDTO moveAction = actionMoveDTO.getAction();
                    actionMoveDTO.setDestinationPageId(toPageId);
                    moveAction.setPageId(branchedAction.getUnpublishedAction().getPageId());
                    moveAction.setId(branchedAction.getId());
                    moveAction.setDefaultResources(branchedAction.getUnpublishedAction().getDefaultResources());
                    return moveAction(actionMoveDTO);
                })
                .map(responseUtils::updateActionDTOWithDefaultResources);
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
     * @param widgetDynamicBindingsMap
     * @param pageId
     * @param layoutId
     * @param escapedWidgetNames
     * @return
     */
    private JSONObject extractAllWidgetNamesAndDynamicBindingsFromDSL(JSONObject dsl,
                                                                      Set<String> widgetNames,
                                                                      Map<String, Set<String>> widgetDynamicBindingsMap,
                                                                      String pageId,
                                                                      String layoutId,
                                                                      Set<String> escapedWidgetNames) throws AppsmithException {
        if (dsl.get(FieldName.WIDGET_NAME) == null) {
            // This isn't a valid widget configuration. No need to traverse this.
            return dsl;
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
                Object oldParent;
                // This loop will end at either a leaf node, or the last identified JSON field (by throwing an exception)
                // Valid forms of the fieldPath for this search could be:
                // root.field.list[index].childField.anotherList.indexWithDotOperator.multidimensionalList[index1][index2]
                while (fieldsIterator.hasNext()) {
                    oldParent = parent;
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
                                        widgetName, widgetId, fieldPath, pageId, layoutId, oldParent, nextKey, "Index out of bounds for list");
                            }
                        } else {
                            throw new AppsmithException(AppsmithError.INVALID_DYNAMIC_BINDING_REFERENCE, widgetType,
                                    widgetName, widgetId, fieldPath, pageId, layoutId, oldParent, nextKey, "Child of list is not in an indexed path");
                        }
                    }
                    // After updating the parent, check for the types
                    if (parent == null) {
                        throw new AppsmithException(AppsmithError.INVALID_DYNAMIC_BINDING_REFERENCE, widgetType,
                                widgetName, widgetId, fieldPath, pageId, layoutId, oldParent, nextKey, "New element is null");
                    } else if (parent instanceof String) {
                        // If we get String value, then this is a leaf node
                        isLeafNode = true;
                    }

                    // Only extract mustache keys from leaf nodes
                    if (isLeafNode) {

                        // We found the path. But if the path does not have any mustache bindings, throw the error
                        if (!MustacheHelper.laxIsBindingPresentInString((String) parent)) {
                            try {
                                String bindingAsString = objectMapper.writeValueAsString(parent);
                                throw new AppsmithException(AppsmithError.INVALID_DYNAMIC_BINDING_REFERENCE, widgetType,
                                        widgetName, widgetId, fieldPath, pageId, layoutId, bindingAsString, nextKey, "Binding path has no mustache bindings");
                            } catch (JsonProcessingException e) {
                                throw new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR, parent);
                            }
                        }

                        // Stricter extraction of dynamic bindings
                        Set<String> mustacheKeysFromFields = MustacheHelper.extractMustacheKeysFromFields(parent).stream().map(token -> token.getValue()).collect(Collectors.toSet());

                        String completePath = widgetName + "." + fieldPath;
                        if (widgetDynamicBindingsMap.containsKey(completePath)) {
                            Set<String> mustacheKeysForWidget = widgetDynamicBindingsMap.get(completePath);
                            mustacheKeysFromFields.addAll(mustacheKeysForWidget);
                        }
                        widgetDynamicBindingsMap.put(completePath, mustacheKeysFromFields);
                    }
                }
            }
        }

        // Escape the widget keys if required and update dsl and escapedWidgetNames
        removeSpecialCharactersFromKeys(dsl, escapedWidgetNames);

        // Fetch the children of the current node in the DSL and recursively iterate over them to extract bindings
        ArrayList<Object> children = (ArrayList<Object>) dsl.get(FieldName.CHILDREN);
        ArrayList<Object> newChildren = new ArrayList<>();
        if (children != null) {
            for (int i = 0; i < children.size(); i++) {
                Map data = (Map) children.get(i);
                JSONObject object = new JSONObject();
                // If the children tag exists and there are entries within it
                if (!CollectionUtils.isEmpty(data)) {
                    object.putAll(data);
                    JSONObject child = extractAllWidgetNamesAndDynamicBindingsFromDSL(object, widgetNames, widgetDynamicBindingsMap, pageId, layoutId, escapedWidgetNames);
                    newChildren.add(child);
                }
            }
            dsl.put(FieldName.CHILDREN, newChildren);
        }

        return dsl;
    }

    private JSONObject removeSpecialCharactersFromKeys(JSONObject dsl, Set<String> escapedWidgetNames) {
        String widgetType = dsl.getAsString(FieldName.WIDGET_TYPE);

        // Only Table widget has this behaviour.
        if (widgetType != null && widgetType.equals(FieldName.TABLE_WIDGET)) {
            return WidgetSpecificUtils.escapeTableWidgetPrimaryColumns(dsl, escapedWidgetNames);
        }

        return dsl;
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
    @Override
    public Mono<Boolean> isNameAllowed(String pageId, String layoutId, String newName) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        if (pageId != null) {
            params.add(FieldName.PAGE_ID, pageId);
        }

        boolean isFQN = newName.contains(".");

        Mono<Set<String>> actionNamesInPageMono = newActionService
                .getUnpublishedActions(params)
                .flatMap(
                        actionDTO -> {
                            /*
                                This is unexpected. Every action inside a JS collection should have a collectionId.
                                But there are a few documents found for plugin type JS inside newAction collection that don't have any collectionId.
                                The reason could be due to the lack of transactional behaviour when multiple inserts/updates that take place
                                during JS action creation. A detailed RCA is documented here
                                https://www.notion.so/appsmith/RCA-JSObject-name-already-exists-Please-use-a-different-name-e09c407f0ddb4653bd3974f3703408e6
                             */
                            if (actionDTO.getPluginType().equals(PluginType.JS) && !StringUtils.hasLength(actionDTO.getCollectionId())) {
                                log.debug("JS Action with Id: {} doesn't have any collection Id under pageId: {}", actionDTO.getId(), pageId);
                                return Mono.empty();
                            } else {
                                return Mono.just(actionDTO);
                            }
                        }
                )
                .map(ActionDTO::getValidName)
                .collect(toSet());

        /*
         * TODO : Execute this check directly on the DB server. We can query array of arrays by:
         * https://stackoverflow.com/questions/12629692/querying-an-array-of-arrays-in-mongodb
         */
        Mono<Set<String>> widgetNamesMono = Mono.just(Set.of());
        Mono<Set<String>> actionCollectionNamesMono = Mono.just(Set.of());


        // Widget and collection names cannot collide with FQNs because of the dot operator
        // Hence we can avoid unnecessary DB calls
        if (!isFQN) {
            widgetNamesMono = newPageService
                    // fetch the unpublished page
                    .findPageById(pageId, pagePermission.getReadPermission(), false)
                    .flatMap(page -> {
                        List<Layout> layouts = page.getLayouts();
                        for (Layout layout : layouts) {
                            if (layoutId.equals(layout.getId())) {
                                if (layout.getWidgetNames() != null && layout.getWidgetNames().size() > 0) {
                                    return Mono.just(layout.getWidgetNames());
                                }
                                // In case of no widget names (which implies that there is no DSL), return an empty set.
                                return Mono.just(new HashSet<>());
                            }
                        }
                        return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.LAYOUT_ID, layoutId));
                    });
            actionCollectionNamesMono = actionCollectionService.getActionCollectionsByViewMode(params, false)
                    .map(ActionCollectionDTO::getName)
                    .collect(toSet())
                    .switchIfEmpty(Mono.just(Set.of()));
        }

        return Mono.zip(actionNamesInPageMono, widgetNamesMono, actionCollectionNamesMono)
                .map(tuple -> {
                    final Set<String> actionNames = tuple.getT1();
                    boolean isAllowed = true;
                    if (actionNames.contains(newName)) {
                        isAllowed = false;
                    }
                    Set<String> widgetNames = tuple.getT2();
                    if (widgetNames.contains(newName)) {
                        isAllowed = false;
                    }
                    Set<String> collectionNames = tuple.getT3();
                    if (collectionNames.contains(newName)) {
                        isAllowed = false;
                    }
                    return isAllowed;
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
    public Mono<ActionDTO> updateSingleAction(String id, ActionDTO action) {
        return newActionService
                .updateUnpublishedAction(id, action)
                .flatMap(newActionService::populateHintMessages)
                .cache();

    }

    @Override
    public Mono<ActionDTO> updateSingleActionWithBranchName(String defaultActionId, ActionDTO action, String branchName) {
        String pageId = action.getPageId();
        action.setApplicationId(null);
        action.setPageId(null);
        return newActionService.findByBranchNameAndDefaultActionId(branchName, defaultActionId, actionPermission.getEditPermission())
                .flatMap(newAction -> updateSingleAction(newAction.getId(), action))
                .flatMap(updatedAction -> this.updatePageLayoutsByPageId(pageId).thenReturn(updatedAction))
                .map(responseUtils::updateActionDTOWithDefaultResources)
                .zipWith(newPageService.findPageById(pageId, pagePermission.getEditPermission(), false), (actionDTO, pageDTO) -> {
                    // redundant check
                    if (pageDTO.getLayouts().size() > 0) {
                        actionDTO.setErrorReports(pageDTO.getLayouts().get(0).getLayoutOnLoadActionErrors());
                    }
                    return actionDTO;
                });
    }

    @Override
    public Mono<ActionDTO> setExecuteOnLoad(String id, Boolean isExecuteOnLoad) {
        return newActionService.findById(id, actionPermission.getEditPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, id)))
                .flatMap(newAction -> {
                    ActionDTO action = newAction.getUnpublishedAction();

                    action.setUserSetOnLoad(true);
                    action.setExecuteOnLoad(isExecuteOnLoad);

                    newAction.setUnpublishedAction(action);

                    return newActionService.save(newAction)
                            .flatMap(savedAction -> updatePageLayoutsByPageId(savedAction.getUnpublishedAction().getPageId())
                                    .then(newActionService.generateActionByViewMode(savedAction, false)));

                });
    }

    @Override
    public Mono<ActionDTO> setExecuteOnLoad(String defaultActionId, String branchName, Boolean isExecuteOnLoad) {
        return newActionService.findByBranchNameAndDefaultActionId(branchName, defaultActionId, actionPermission.getEditPermission())
                .flatMap(branchedAction -> setExecuteOnLoad(branchedAction.getId(), isExecuteOnLoad))
                .map(responseUtils::updateActionDTOWithDefaultResources);
    }

    /**
     * - Delete action.
     * - Update page layout since a deleted action cannot be marked as on page load.
     */
    public Mono<ActionDTO> deleteUnpublishedAction(String id) {
        return newActionService.deleteUnpublishedAction(id)
                .flatMap(actionDTO -> Mono.zip(Mono.just(actionDTO),
                        updatePageLayoutsByPageId(actionDTO.getPageId())))
                .flatMap(tuple -> {
                    ActionDTO actionDTO = tuple.getT1();
                    return Mono.just(actionDTO);
                });
    }

    public Mono<ActionDTO> deleteUnpublishedAction(String defaultActionId, String branchName) {
        return newActionService.findByBranchNameAndDefaultActionId(branchName, defaultActionId, actionPermission.getDeletePermission())
                .flatMap(branchedAction -> deleteUnpublishedAction(branchedAction.getId()))
                .map(responseUtils::updateActionDTOWithDefaultResources);
    }

    @Override
    public Mono<String> updatePageLayoutsByPageId(String pageId) {
        return Mono.justOrEmpty(pageId)
                // fetch the unpublished page
                .flatMap(id -> newPageService.findPageById(id, pagePermission.getEditPermission(), false))
                .flatMapMany(page -> {
                    if (page.getLayouts() == null) {
                        return Mono.empty();
                    }
                    return Flux.fromIterable(page.getLayouts())
                            .flatMap(layout -> {
                                layout.setDsl(this.unescapeMongoSpecialCharacters(layout));
                                return updateLayout(page.getId(), page.getApplicationId(), layout.getId(), layout);
                            });
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
                            "isSuccessfulExecution", isSuccess,
                            "error", error == null ? "" : error.getMessage()
                    );

                    return analyticsService.sendObjectEvent(AnalyticsEvents.UPDATE_LAYOUT, t2, data).thenReturn(isSuccess);
                })
                .onErrorResume(e -> {
                    log.warn("Error sending action execution data point", e);
                    return Mono.just(isSuccess);
                });

    }

    @Override
    public Mono<LayoutDTO> updateLayout(String pageId, String applicationId, String layoutId, Layout layout) {
        JSONObject dsl = layout.getDsl();
        if (dsl == null) {
            // There is no DSL here. No need to process anything. Return as is.
            return Mono.just(generateResponseDTO(layout));
        }

        Set<String> widgetNames = new HashSet<>();
        Map<String, Set<String>> widgetDynamicBindingsMap = new HashMap<>();
        Set<String> escapedWidgetNames = new HashSet<>();
        try {
            dsl = extractAllWidgetNamesAndDynamicBindingsFromDSL(dsl, widgetNames, widgetDynamicBindingsMap, pageId, layoutId, escapedWidgetNames);
        } catch (Throwable t) {
            return sendUpdateLayoutAnalyticsEvent(pageId, layoutId, dsl, false, t)
                    .then(Mono.error(t));
        }

        layout.setWidgetNames(widgetNames);

        if (!escapedWidgetNames.isEmpty()) {
            layout.setMongoEscapedWidgetNames(escapedWidgetNames);
        }

        Set<String> actionNames = new HashSet<>();
        Set<ActionDependencyEdge> edges = new HashSet<>();
        Set<String> actionsUsedInDSL = new HashSet<>();
        List<ActionDTO> flatmapPageLoadActions = new ArrayList<>();
        List<LayoutActionUpdateDTO> actionUpdates = new ArrayList<>();
        List<String> messages = new ArrayList<>();

        AtomicReference<Boolean> validOnPageLoadActions = new AtomicReference<>(Boolean.TRUE);
        Mono<Integer> evaluatedVersionMono = applicationService
                .findById(applicationId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND,
                        FieldName.APPLICATION_ID, applicationId)))
                .map(application -> {
                    Integer evaluationVersion = application.getEvaluationVersion();
                    if (evaluationVersion == null) {
                        evaluationVersion = EVALUATION_VERSION;
                    }
                    return evaluationVersion;
                });

        // setting the layoutOnLoadActionActionErrors to empty to remove the existing errors before new DAG calculation.
        layout.setLayoutOnLoadActionErrors(new ArrayList<>());

        Mono<List<Set<DslActionDTO>>> allOnLoadActionsMono = evaluatedVersionMono
                .flatMap(evaluatedVersion -> pageLoadActionsUtil
                        .findAllOnLoadActions(pageId, evaluatedVersion, widgetNames, edges, widgetDynamicBindingsMap, flatmapPageLoadActions, actionsUsedInDSL)
                        .onErrorResume(AppsmithException.class, error -> {
                            log.info(error.getMessage());
                            validOnPageLoadActions.set(FALSE);
                            layout.setLayoutOnLoadActionErrors(List.of(
                                    new ErrorDTO(error.getAppErrorCode(),
                                            layoutOnLoadActionErrorToastMessage,
                                            error.getMessage())));
                            return Mono.just(new ArrayList<>());
                        }));

        // First update the actions and set execute on load to true
        JSONObject finalDsl = dsl;
        return allOnLoadActionsMono
                .flatMap(allOnLoadActions -> {
                    // If there has been an error (e.g. cyclical dependency), then dont update any actions.
                    // This is so that unnecessary updates don't happen to actions while the page is in invalid state.
                    if (!validOnPageLoadActions.get()) {
                        return Mono.just(allOnLoadActions);
                    }
                    // Update these actions to be executed on load, unless the user has touched the executeOnLoad setting for this
                    return newActionService
                            .updateActionsExecuteOnLoad(flatmapPageLoadActions, pageId, actionUpdates, messages)
                            .thenReturn(allOnLoadActions);
                })
                .zipWith(newPageService.findByIdAndLayoutsId(pageId, layoutId, pagePermission.getEditPermission(), false)
                        .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND,
                                FieldName.PAGE_ID + " or " + FieldName.LAYOUT_ID, pageId + ", " + layoutId))))
                // Now update the page layout with the page load actions and the graph.
                .flatMap(tuple -> {
                    List<Set<DslActionDTO>> onLoadActions = tuple.getT1();
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
                            // The below field is to ensure that we record if the page load actions computation was valid
                            // when last stored in the database.
                            layout.setValidOnPageLoadActions(validOnPageLoadActions.get());

                            BeanUtils.copyProperties(layout, storedLayout);
                            storedLayout.setId(layoutId);

                            break;
                        }
                    }
                    page.setLayouts(layoutList);
                    return applicationService.saveLastEditInformation(page.getApplicationId())
                            .then(newPageService.saveUnpublishedPage(page));
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
                .map(savedLayout -> {
                    savedLayout.setDsl(this.unescapeMongoSpecialCharacters(savedLayout));
                    return savedLayout;
                })
                .flatMap(savedLayout -> {
                    LayoutDTO layoutDTO = generateResponseDTO(savedLayout);
                    layoutDTO.setActionUpdates(actionUpdates);
                    layoutDTO.setMessages(messages);

                    return sendUpdateLayoutAnalyticsEvent(pageId, layoutId, finalDsl, true, null)
                            .thenReturn(layoutDTO);
                });
    }

    @Override
    public Mono<LayoutDTO> updateLayout(String defaultPageId, String defaultApplicationId, String layoutId, Layout layout, String branchName) {
        if (StringUtils.isEmpty(branchName)) {
            return updateLayout(defaultPageId, defaultApplicationId, layoutId, layout);
        }
        return newPageService.findByBranchNameAndDefaultPageId(branchName, defaultPageId, pagePermission.getEditPermission())
                .flatMap(branchedPage -> updateLayout(branchedPage.getId(), branchedPage.getApplicationId(), layoutId, layout))
                .map(responseUtils::updateLayoutDTOWithDefaultResources);
    }

    private LayoutDTO generateResponseDTO(Layout layout) {

        LayoutDTO layoutDTO = new LayoutDTO();

        layoutDTO.setId(layout.getId());
        layoutDTO.setDsl(layout.getDsl());
        layoutDTO.setScreen(layout.getScreen());
        layoutDTO.setLayoutOnLoadActions(layout.getLayoutOnLoadActions());
        layoutDTO.setLayoutOnLoadActionErrors(layout.getLayoutOnLoadActionErrors());
        layoutDTO.setUserPermissions(layout.getUserPermissions());

        return layoutDTO;
    }

    @Override
    public JSONObject unescapeMongoSpecialCharacters(Layout layout) {
        Set<String> mongoEscapedWidgetNames = layout.getMongoEscapedWidgetNames();

        if (mongoEscapedWidgetNames == null || mongoEscapedWidgetNames.isEmpty()) {
            return layout.getDsl();
        }

        JSONObject dsl = layout.getDsl();

        // Unescape specific widgets
        dsl = unEscapeDslKeys(dsl, layout.getMongoEscapedWidgetNames());

        return dsl;
    }

    private JSONObject unEscapeDslKeys(JSONObject dsl, Set<String> escapedWidgetNames) {

        String widgetName = (String) dsl.get(FieldName.WIDGET_NAME);

        if (widgetName == null) {
            // This isnt a valid widget configuration. No need to traverse further.
            return dsl;
        }

        if (escapedWidgetNames.contains(widgetName)) {
            // We should escape the widget keys
            String widgetType = dsl.getAsString(FieldName.WIDGET_TYPE);
            if (widgetType.equals(FieldName.TABLE_WIDGET)) {
                // UnEscape Table widget keys
                // Since this is a table widget, it wouldnt have children. We can safely return from here with updated dsl
                return WidgetSpecificUtils.unEscapeTableWidgetPrimaryColumns(dsl);
            }
        }

        // Fetch the children of the current node in the DSL and recursively iterate over them to extract bindings
        ArrayList<Object> children = (ArrayList<Object>) dsl.get(FieldName.CHILDREN);
        ArrayList<Object> newChildren = new ArrayList<>();
        if (children != null) {
            for (int i = 0; i < children.size(); i++) {
                Map data = (Map) children.get(i);
                JSONObject object = new JSONObject();
                // If the children tag exists and there are entries within it
                if (!CollectionUtils.isEmpty(data)) {
                    object.putAll(data);
                    JSONObject child = unEscapeDslKeys(object, escapedWidgetNames);
                    newChildren.add(child);
                }
            }
            dsl.put(FieldName.CHILDREN, newChildren);
        }

        return dsl;
    }

    @Override
    public Mono<ActionDTO> createSingleActionWithBranch(ActionDTO action, String branchName) {

        DefaultResources defaultResources = new DefaultResources();
        defaultResources.setBranchName(branchName);

        return newPageService.findByBranchNameAndDefaultPageId(branchName, action.getPageId(), pagePermission.getActionCreatePermission())
                .flatMap(newPage -> {
                    // Update the page and application id with branched resource
                    action.setPageId(newPage.getId());
                    action.setApplicationId(newPage.getApplicationId());

                    DefaultResources pageDefaultIds = newPage.getDefaultResources();
                    defaultResources.setPageId(pageDefaultIds.getPageId());
                    defaultResources.setApplicationId(pageDefaultIds.getApplicationId());
                    if (StringUtils.isEmpty(defaultResources.getCollectionId())) {
                        defaultResources.setCollectionId(action.getCollectionId());
                    }
                    action.setDefaultResources(defaultResources);
                    return createSingleAction(action, Boolean.FALSE);
                })
                .map(responseUtils::updateActionDTOWithDefaultResources);
    }

    @Override
    public Mono<ActionDTO> createSingleAction(ActionDTO action, Boolean isJsAction) {
        AppsmithEventContext eventContext = new AppsmithEventContext(AppsmithEventContextType.DEFAULT);
        return createAction(action, eventContext, isJsAction);
    }

    @Override
    public Mono<ActionDTO> createAction(ActionDTO action, AppsmithEventContext eventContext, Boolean isJsAction) {

        if (action.getId() != null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        if (action.getName() == null || action.getName().isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME));
        }

        if (action.getPageId() == null || action.getPageId().isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGE_ID));
        }

        if (action.getDefaultResources() == null) {
            DefaultResourcesUtils.createDefaultIdsOrUpdateWithGivenResourceIds(action, null);
        }

        NewAction newAction = new NewAction();
        newAction.setPublishedAction(new ActionDTO());
        newAction.getPublishedAction().setDatasource(new Datasource());

        // If the action is a JS action, then we don't need to validate the page. Fetch the page with read.
        // Else fetch the page with create action permission to ensure that the user has the right to create an action
        AclPermission aclPermission = isJsAction ? pagePermission.getReadPermission() : pagePermission.getActionCreatePermission();

        Mono<NewPage> pageMono = newPageService
                .findById(action.getPageId(), aclPermission)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, action.getPageId())))
                .cache();

        return pageMono
                .flatMap(page -> {
                    Layout layout = page.getUnpublishedPage().getLayouts().get(0);
                    String name = action.getValidName();
                    return isNameAllowed(page.getId(), layout.getId(), name);
                })
                .flatMap(nameAllowed -> {
                    // If the name is allowed, return pageMono for further processing
                    if (Boolean.TRUE.equals(nameAllowed)) {
                        return pageMono;
                    }
                    String name = action.getValidName();
                    // Throw an error since the new action's name matches an existing action or widget name.
                    return Mono.error(new AppsmithException(AppsmithError.DUPLICATE_KEY_USER_ERROR, name, FieldName.NAME));
                })
                .flatMap(page -> {
                    // Inherit the action policies from the page.
                    newActionService.generateAndSetActionPolicies(page, newAction);

                    newActionService.setCommonFieldsFromActionDTOIntoNewAction(action, newAction);

                    // Set the application id in the main domain
                    newAction.setApplicationId(page.getApplicationId());

                    // If the datasource is embedded, check for workspaceId and set it in action
                    if (action.getDatasource() != null &&
                            action.getDatasource().getId() == null) {
                        Datasource datasource = action.getDatasource();
                        if (datasource.getWorkspaceId() == null) {
                            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.WORKSPACE_ID));
                        }
                        newAction.setWorkspaceId(datasource.getWorkspaceId());
                    }

                    // New actions will never be set to auto-magical execution, unless it is triggered via a
                    // page or application clone event.
                    if (!AppsmithEventContextType.CLONE_PAGE.equals(eventContext.getAppsmithEventContextType())) {
                        action.setExecuteOnLoad(false);
                    }

                    final DefaultResources immutableDefaultResources = action.getDefaultResources();
                    // Only store defaultPageId and defaultCollectionId for actionDTO level resource
                    DefaultResources defaultActionResource = new DefaultResources();
                    AppsmithBeanUtils.copyNestedNonNullProperties(immutableDefaultResources, defaultActionResource);

                    defaultActionResource.setApplicationId(null);
                    defaultActionResource.setActionId(null);
                    defaultActionResource.setBranchName(null);
                    if (!StringUtils.hasLength(defaultActionResource.getPageId())) {
                        defaultActionResource.setPageId(action.getPageId());
                    }
                    if (!StringUtils.hasLength(defaultActionResource.getCollectionId())) {
                        defaultActionResource.setCollectionId(action.getCollectionId());
                    }
                    action.setDefaultResources(defaultActionResource);

                    // Only store defaultApplicationId and defaultActionId for NewAction level resource
                    DefaultResources defaults = new DefaultResources();
                    AppsmithBeanUtils.copyNestedNonNullProperties(immutableDefaultResources, defaults);
                    defaults.setPageId(null);
                    defaults.setCollectionId(null);
                    if (!StringUtils.hasLength(defaults.getApplicationId())) {
                        defaults.setApplicationId(newAction.getApplicationId());
                    }
                    newAction.setDefaultResources(defaults);

                    newAction.setUnpublishedAction(action);

                    return Mono.just(newAction);
                })
                .flatMap(savedNewAction -> newActionService.validateAndSaveActionToRepository(savedNewAction).zipWith(Mono.just(savedNewAction)))
                .zipWith(Mono.defer(() -> {
                    if (action.getDatasource() != null &&
                            action.getDatasource().getId() != null) {
                        return datasourceService.findById(action.getDatasource().getId());
                    } else {
                        return Mono.justOrEmpty(action.getDatasource());
                    }
                }))
                .flatMap(zippedData -> {

                    final Tuple2<ActionDTO, NewAction> zippedActions = zippedData.getT1();
                    final Datasource datasource = zippedData.getT2();
                    final NewAction newAction1 = zippedActions.getT2();
                    final Datasource embeddedDatasource = newAction1.getUnpublishedAction().getDatasource();
                    embeddedDatasource.setIsMock(datasource.getIsMock());
                    embeddedDatasource.setIsTemplate(datasource.getIsTemplate());

                    return analyticsService
                            .sendCreateEvent(newAction1, newActionService.getAnalyticsProperties(newAction1))
                            .thenReturn(zippedActions.getT1());

                });
    }

}

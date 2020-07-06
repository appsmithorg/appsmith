package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.dtos.RefactorNameDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MustacheHelper;
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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.helpers.BeanCopyUtils.copyNewFieldValuesIntoOldObject;
import static java.util.stream.Collectors.toSet;

@Service
@Slf4j
public class LayoutActionServiceImpl implements LayoutActionService {
    private final ActionService actionService;
    private final PageService pageService;
    private final ObjectMapper objectMapper;
    private final ApplicationPageService applicationPageService;
    private final AnalyticsService analyticsService;
    /*
     * This pattern finds all the String which have been extracted from the mustache dynamic bindings.
     * e.g. for the given JS function using action with name "fetchUsers"
     * {{JSON.stringify(fetchUsers)}}
     * This pattern should return ["JSON.stringify", "fetchUsers"]
     */
    private final Pattern pattern = Pattern.compile("[a-zA-Z_][a-zA-Z0-9._]*");

    /*
     * To replace fetchUsers in `{{JSON.stringify(fetchUsers)}}` with getUsers, the following regex is required :
     * `\\b(fetchUsers)\\b`. To achieve this the following strings preWord and postWord are declared here to be used
     * at run time to create the regex pattern.
     */
    private final String preWord = "\\b(";
    private final String postWord = ")\\b";

    public LayoutActionServiceImpl(ActionService actionService,
                                   PageService pageService,
                                   ObjectMapper objectMapper,
                                   ApplicationPageService applicationPageService,
                                   AnalyticsService analyticsService) {
        this.actionService = actionService;
        this.pageService = pageService;
        this.objectMapper = objectMapper;
        this.applicationPageService = applicationPageService;
        this.analyticsService = analyticsService;
    }

    @Override
    public Mono<Layout> updateLayout(String pageId, String layoutId, Layout layout) {
        JSONObject dsl = layout.getDsl();
        if (dsl == null) {
            // There is no DSL here. No need to process anything. Return as is.
            return Mono.just(layout);
        }

        Set<String> widgetNames = new HashSet<>();
        extractAllWidgetNamesFromDSL(dsl, widgetNames);
        layout.setWidgetNames(widgetNames);

        // Extract all the mustache keys in the DSL to get the dynamic bindings used in the DSL.
        final Set<String> dynamicBindings = MustacheHelper.extractMustacheKeysFromFields(dsl);
        Set<String> dynamicBindingNames = new HashSet<>();
        if (!CollectionUtils.isEmpty(dynamicBindings)) {
            for (String mustacheKey : dynamicBindings) {
                // Extract all the words in the dynamic bindings
                extractWordsAndAddToSet(dynamicBindingNames, mustacheKey);
            }
        }

        Mono<List<HashSet<DslActionDTO>>> onLoadActionsMono = findOnLoadActionsInPage(dynamicBindingNames, pageId);

        return pageService.findByIdAndLayoutsId(pageId, layoutId, MANAGE_PAGES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.ACL_NO_RESOURCE_FOUND,
                        FieldName.PAGE_ID + " or " + FieldName.LAYOUT_ID, pageId + ", " + layoutId)))
                .zipWith(onLoadActionsMono)
                .map(tuple -> {
                    Page page = tuple.getT1();
                    List<HashSet<DslActionDTO>> onLoadActions = tuple.getT2();

                    List<Layout> layoutList = page.getLayouts();

                    //Because the findByIdAndLayoutsId call returned non-empty result, we are guaranteed to find the layoutId here.
                    for (Layout storedLayout : layoutList) {
                        if (storedLayout.getId().equals(layoutId)) {
                            //Copy the variables to conserve before update
                            JSONObject publishedDsl = storedLayout.getPublishedDsl();
                            List<HashSet<DslActionDTO>> publishedLayoutOnLoadActions = storedLayout.getPublishedLayoutOnLoadActions();

                            //Update
                            layout.setLayoutOnLoadActions(onLoadActions);
                            BeanUtils.copyProperties(layout, storedLayout);
                            storedLayout.setId(layoutId);

                            //Copy back the conserved variables.
                            storedLayout.setPublishedDsl(publishedDsl);
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

    public Mono<List<HashSet<DslActionDTO>>> findOnLoadActionsInPage(Set<String> dynamicBindingNames, String pageId) {
        return findOnLoadActionsInPage(new ArrayList<>(), dynamicBindingNames, pageId);
    }

    private Mono<List<HashSet<DslActionDTO>>> findOnLoadActionsInPage(List<HashSet<DslActionDTO>> onLoadActions, Set<String> dynamicBindingNames, String pageId) {
        if (dynamicBindingNames == null || dynamicBindingNames.isEmpty()) {
            return Mono.just(onLoadActions);
        }
        Set<String> bindingNames = new HashSet<>();
        return actionService.findOnLoadActionsInPage(dynamicBindingNames, pageId)
                .map(action -> {
                    if (!CollectionUtils.isEmpty(action.getJsonPathKeys())) {
                        for (String mustacheKey : action.getJsonPathKeys()) {
                            extractWordsAndAddToSet(bindingNames, mustacheKey);
                        }
                        bindingNames.remove(action.getName());
                    }
                    DslActionDTO newAction = new DslActionDTO();
                    newAction.setId(action.getId());
                    newAction.setPluginType(action.getPluginType());
                    newAction.setJsonPathKeys(action.getJsonPathKeys());
                    newAction.setName(action.getName());
                    if (action.getActionConfiguration() != null) {
                        newAction.setTimeoutInMillisecond(action.getActionConfiguration().getTimeoutInMillisecond());
                    }
                    return newAction;
                })
                .collect(toSet())
                .flatMap(actions -> {
                    HashSet<DslActionDTO> onLoadSet = new HashSet<>(actions);

                    // If the resultant set of actions is empty, don't add it to the array list.
                    if (!onLoadSet.isEmpty()) {
                        onLoadActions.add(0, onLoadSet);
                    }
                    return findOnLoadActionsInPage(onLoadActions, bindingNames, pageId);
                });
    }

    private void extractWordsAndAddToSet(Set<String> bindingNames, String mustacheKey) {
        String key = mustacheKey.trim();

        // Extract all the words in the dynamic bindings
        Matcher matcher = pattern.matcher(key);

        while (matcher.find()) {
            String word = matcher.group();

            String[] subStrings = word.split(Pattern.quote("."));
            if (subStrings.length > 0) {
                // We are only interested in the top level. e.g. if its Input1.text, we want just Input1
                bindingNames.add(subStrings[0]);
            }
        }
    }

    @Override
    public Mono<Action> moveAction(ActionMoveDTO actionMoveDTO) {
        Action action = actionMoveDTO.getAction();

        String oldPageId = actionMoveDTO.getAction().getPageId();

        action.setPageId(actionMoveDTO.getDestinationPageId());

        /*
         * The following steps are followed here :
         * 1. Update and save the action
         * 2. Run updateLayout on the old page
         * 3. Run updateLayout on the new page.
         * 4. Return the saved action.
         */
        return actionService
                .update(action.getId(), action)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, actionMoveDTO.getAction().getId())))
                .flatMap(savedAction -> pageService
                        .findById(oldPageId, MANAGE_PAGES)
                        .flatMap(page -> {
                            if (page.getLayouts() == null) {
                                return Mono.empty();
                            }

                            return Flux.fromIterable(page.getLayouts())
                                    .flatMap(layout -> updateLayout(oldPageId, layout.getId(), layout))
                                    .collect(toSet());
                        })
                        .then(pageService.findById(actionMoveDTO.getDestinationPageId(), MANAGE_PAGES))
                        .flatMap(page -> {
                            if (page.getLayouts() == null) {
                                return Mono.empty();
                            }

                            return Flux.fromIterable(page.getLayouts())
                                    .flatMap(layout -> updateLayout(actionMoveDTO.getDestinationPageId(), layout.getId(), layout))
                                    .collect(toSet());
                        })
                        .thenReturn(savedAction));
    }

    @Override
    public Mono<Layout> refactorWidgetName(RefactorNameDTO refactorNameDTO) {
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
    public Mono<Layout> refactorActionName(RefactorNameDTO refactorNameDTO) {
        String pageId = refactorNameDTO.getPageId();
        String layoutId = refactorNameDTO.getLayoutId();
        String oldName = refactorNameDTO.getOldName();
        String newName = refactorNameDTO.getNewName();
        return isNameAllowed(pageId, layoutId, newName)
                .flatMap(allowed -> {
                    if (!allowed) {
                        return Mono.error(new AppsmithException(AppsmithError.NAME_CLASH_NOT_ALLOWED_IN_REFACTOR, oldName, newName));
                    }
                    return actionService
                            .findByNameAndPageId(oldName, pageId);
                })
                .flatMap(action -> {
                    action.setName(newName);
                    return actionService.update(action.getId(), action);
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
    private Mono<Layout> refactorName(String pageId, String layoutId, String oldName, String newName) {
        String regexPattern = preWord + oldName + postWord;
        Pattern oldNamePattern = Pattern.compile(regexPattern);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        if (pageId != null) {
            params.add(FieldName.PAGE_ID, pageId);
        }

        Mono<Page> updatePageMono = pageService
                .findById(pageId, MANAGE_PAGES)
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
                            return pageService.save(page);
                        }
                    }
                    // If we have reached here, the layout was not found and the page should be returned as is.
                    return Mono.just(page);
                });

        Mono<Set<String>> updateActionsMono = actionService
                .findByPageId(pageId, AclPermission.MANAGE_ACTIONS)
                /*
                 * Assuming that the datasource should not be dependent on the widget and hence not going through the same
                 * to look for replacement pattern.
                 */
                .flatMap(action -> {
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
                        return Mono.just(action);
                    }
                    // if actionupdateRequired is true AND actionConfiguration is not null
                    try {
                        String actionConfigurationAsString = objectMapper.writeValueAsString(actionConfiguration);
                        Matcher matcher = oldNamePattern.matcher(actionConfigurationAsString);
                        String newActionConfigurationAsString = matcher.replaceAll(newName);
                        ActionConfiguration newActionConfiguration = objectMapper.readValue(newActionConfigurationAsString, ActionConfiguration.class);
                        action.setActionConfiguration(newActionConfiguration);
                        action = actionService.extractAndSetJsonPathKeys(action);
                        return actionService.save(action);
                    } catch (JsonProcessingException e) {
                        log.debug("Exception caught during conversion between string and action configuration object ", e);
                        return Mono.just(action);
                    }
                })
                .map(savedAction -> savedAction.getName())
                .collect(toSet());

        return Mono.zip(updateActionsMono, updatePageMono)
                .flatMap(tuple -> {
                    Set<String> updatedActionNames = tuple.getT1();
                    Page page = tuple.getT2();
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
     *
     * @param dsl
     * @param widgetNames
     */
    private void extractAllWidgetNamesFromDSL(JSONObject dsl, Set<String> widgetNames) {
        if (dsl.get(FieldName.WIDGET_NAME) == null) {
            //This isnt a valid widget configuration. No need to traverse this.
            return;
        }

        String widgetName = dsl.getAsString(FieldName.WIDGET_NAME);

        //Since we are parsing this widget in this, add it.
        widgetNames.add(widgetName);

        ArrayList<Object> children = (ArrayList<Object>) dsl.get(FieldName.CHILDREN);
        if (children != null) {
            for (int i = 0; i < children.size(); i++) {
                Map data = (Map) children.get(i);
                JSONObject object = new JSONObject();
                // If the children tag exists and there are entries within it
                if (!CollectionUtils.isEmpty(data)) {
                    object.putAll(data);
                    extractAllWidgetNamesFromDSL(object, widgetNames);
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

        Mono<Set<String>> actionNamesInPageMono = actionService
                .get(params)
                .map(action -> action.getName())
                .collect(toSet());

        /*
         * TODO : Execute this check directly on the DB server. We can query array of arrays by:
         * https://stackoverflow.com/questions/12629692/querying-an-array-of-arrays-in-mongodb
         */
        Mono<Set<String>> widgetNamesMono = pageService
                .findById(pageId, MANAGE_PAGES)
                .flatMap(page -> {
                    List<Layout> layouts = page.getLayouts();
                    for (Layout layout : layouts) {
                        if (layout.getId().equals(layoutId)) {
                            if (layout.getWidgetNames() != null && layout.getWidgetNames().size() > 0) {
                                return Mono.just(layout.getWidgetNames());
                            }
                            // In case of no widget names (which implies that there is no DSL), return an error.
                            return Mono.error(new AppsmithException(AppsmithError.NO_DSL_FOUND_IN_PAGE, pageId));
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
     * This function updates an existing action in the DB. We are completely overriding the base update function to
     * ensure that we can populate the JsonPathKeys field in the ActionConfiguration based on any changes that may
     * have happened in the action object.
     * <p>
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
    public Mono<Action> updateAction(String id, Action action) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }

        Mono<Action> dbActionMono = actionService.findById(id)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, "action", id)));

        return dbActionMono
                .map(dbAction -> {
                    copyNewFieldValuesIntoOldObject(action, dbAction);
                    return dbAction;
                })
                .flatMap(actionService::validateAndSaveActionToRepository)
                .flatMap(savedAction -> {
                    // Now that the action has been saved, update the page layout as well
                    String pageId = savedAction.getPageId();
                    Mono<Object> updateLayoutsMono = null;
                    if (pageId != null) {
                        updateLayoutsMono = pageService.findById(pageId, MANAGE_PAGES)
                                .map(page -> {
                                    if (page.getLayouts() == null) {
                                        return Mono.empty();
                                    }

                                    return Mono.just(page.getLayouts())
                                            .flatMapMany(Flux::fromIterable)
                                            .map(layout -> this.updateLayout(page.getId(), layout.getId(), layout))
                                            .collect(toSet())
                                            .then(Mono.just(savedAction));
                                });
                    }
                    if (updateLayoutsMono != null) {
                        return updateLayoutsMono
                                .then(Mono.just(savedAction));
                    }
                    return Mono.just(savedAction);
                })
                .map(savedAction -> {
                            Action act = (Action) savedAction;
                            analyticsService
                                    .sendEvent(AnalyticsEvents.UPDATE + "_" + act.getClass().getSimpleName().toUpperCase(),
                                            act);
                            return act;
                        }
                );
    }
}

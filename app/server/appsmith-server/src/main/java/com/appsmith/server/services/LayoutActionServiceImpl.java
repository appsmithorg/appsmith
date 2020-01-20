package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.dtos.RefactorNameDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
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

import static com.appsmith.server.helpers.MustacheHelper.extractMustacheKeys;
import static java.util.stream.Collectors.toSet;

@Service
@Slf4j
public class LayoutActionServiceImpl implements LayoutActionService {
    private final ActionService actionService;
    private final PageService pageService;
    private final ObjectMapper objectMapper;
    private final ApplicationPageService applicationPageService;
    /*
     * This pattern finds all the String which have been extracted from the mustache dynamic bindings.
     * e.g. for the given JS function using action with name "fetchUsers"
     * {{JSON.stringify(fetchUsers)}}
     * This pattern should return ["JSON.stringify", "fetchUsers"]
     */
    private final Pattern pattern = Pattern.compile("[a-zA-Z0-9._]+");

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
                                   ApplicationPageService applicationPageService) {
        this.actionService = actionService;
        this.pageService = pageService;
        this.objectMapper = objectMapper;
        this.applicationPageService = applicationPageService;
    }

    @Override
    public Mono<Layout> updateLayout(String pageId, String layoutId, Layout layout) {
        String dslString = "";

        // Convert the DSL into a String
        JSONObject dsl = layout.getDsl();
        try {
            dslString = objectMapper.writeValueAsString(dsl);
        } catch (JsonProcessingException e) {
            log.debug("Exception caught during conversion of DSL Json object to String. ", e);
        }

        Set<String> widgetNames = new HashSet<>();
        extractAllWidgetNamesFromDSL(dsl, widgetNames);
        layout.setWidgetNames(widgetNames);

        Mono<Set<String>> dynamicBindingNamesMono = Mono.just(dslString)
                // Extract all the mustache keys in the DSL to get the dynamic bindings used in the DSL.
                .map(dslString1 -> extractMustacheKeys(dslString1))
                .map(dynamicBindings -> {
                    Set<String> dynamicBindingNames = new HashSet<>();
                    if (!dynamicBindings.isEmpty()) {
                        for (String mustacheKey : dynamicBindings) {
                            String key = mustacheKey.trim();

                            // Extract all the words in the dynamic bindings
                            Matcher matcher = pattern.matcher(key);

                            while (matcher.find()) {
                                String word = matcher.group();

                                String[] subStrings = word.split(Pattern.quote("."));
                                if (subStrings.length > 0) {
                                    // We are only interested in the top level. e.g. if its Input1.text, we want just Input1
                                    dynamicBindingNames.add(subStrings[0]);
                                }
                            }
                        }
                    }
                    return dynamicBindingNames;
                });


        Mono<Set<DslActionDTO>> onLoadActionsMono = dynamicBindingNamesMono
                .flatMapMany(dynamicBindingNames -> findRestApiActionsByPageIdAndHTTPMethodGET(dynamicBindingNames, pageId))
                .map(action -> {
                    // Since we are only interested in few fields, prepare the DslActionDTO that needs to be stored in
                    // the layout and return it to be collected in to a set.
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
                .zipWith(onLoadActionsMono)
                .map(tuple -> {
                    Page page = tuple.getT1();
                    Set<DslActionDTO> onLoadActions = tuple.getT2();

                    List<Layout> layoutList = page.getLayouts();

                    //Because the findByIdAndLayoutsId call returned non-empty result, we are guaranteed to find the layoutId here.
                    for (Layout storedLayout : layoutList) {
                        if (storedLayout.getId().equals(layoutId)) {
                            //Copy the variables to conserve before update
                            JSONObject publishedDsl = storedLayout.getPublishedDsl();
                            Set<DslActionDTO> publishedLayoutOnLoadActions = storedLayout.getPublishedLayoutOnLoadActions();

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

    /**
     * Given a list of names of actions (nodes) and pageId, it hits the database and returns all the actions matching
     * this criteria of name and pageId with http method 'GET'
     *
     * @param nodes
     * @param pageId
     * @return
     */
    Flux<Action> findRestApiActionsByPageIdAndHTTPMethodGET(Set<String> nodes, String pageId) {

        return actionService
                .findDistinctRestApiActionsByNameInAndPageIdAndHttpMethod(nodes, pageId, "GET");
    }

    @Override
    public Mono<Action> moveAction(ActionMoveDTO actionMoveDTO) {
        Action action = actionMoveDTO.getAction();

        String oldPageId = action.getPageId();

        action.setPageId(actionMoveDTO.getDestinationPageId());

        /*
         * The following steps are followed here :
         * 1. Update and save the action
         * 2. Run updateLayout on the old page
         * 3. Run updateLayout on the new page.
         * 4. Return the saved action.
         */
        return actionService
                .save(action)
                .flatMap(savedAction -> pageService
                        .findById(oldPageId)
                        .map(page -> page.getLayouts()
                                .stream()
                                /*
                                 * subscribe() is being used here because within a stream, the master subscriber provided
                                 * by spring framework does not get attached here leading to the updateLayout mono not
                                 * emitting. The same is true for the updateLayout call for the new page.
                                 */
                                .map(layout -> updateLayout(oldPageId, layout.getId(), layout).subscribe())
                                .collect(toSet()))
                        .then(pageService.findById(actionMoveDTO.getDestinationPageId()))
                        .map(page -> page.getLayouts()
                                .stream()
                                .map(layout -> updateLayout(actionMoveDTO.getDestinationPageId(), layout.getId(), layout).subscribe())
                                .collect(toSet()))
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
        Flux<Action> actionsInPageFlux = actionService.get(params);

        Mono<Page> updatePageMono = pageService
                .findById(pageId)
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

        Mono<Set<Object>> updateActionsMono = actionsInPageFlux
                /*
                 * Assuming that the datasource should not be dependent on the widget and hence not going through the same
                 * to look for replacement pattern.
                 */
                .flatMap(action -> {
                    Boolean actionUpdateRequired = false;
                    ActionConfiguration actionConfiguration = action.getActionConfiguration();
                    Set<String> jsonPathKeys = action.getJsonPathKeys();
                    // Since json path keys actually contain the entire inline js function instead of just the widget/action
                    // name, we can not simply use the set.contains(obj) function. We need to iterate over all the keys
                    // in the set and see if the old name is a substring of the json path key.
                    for (String key : jsonPathKeys) {
                        if (key.contains(oldName)) {
                            actionUpdateRequired = true;
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
                .collect(toSet());

        return updateActionsMono
                .then(updatePageMono)
                .flatMap(page -> {
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
                object.putAll(data);
                extractAllWidgetNamesFromDSL(object, widgetNames);
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
                .findById(pageId)
                .flatMap(page -> {
                    List<Layout> layouts = page.getLayouts();
                    for (Layout layout : layouts) {
                        if (layout.getId().equals(layoutId)) {
                            return Mono.just(layout.getWidgetNames());
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
}

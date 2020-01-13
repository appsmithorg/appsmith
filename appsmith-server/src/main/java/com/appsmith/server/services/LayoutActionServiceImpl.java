package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.dtos.DslActionDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
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
}

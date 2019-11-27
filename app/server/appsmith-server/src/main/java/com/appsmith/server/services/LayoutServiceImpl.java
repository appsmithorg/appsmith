package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Page;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.bson.types.ObjectId;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

import static com.appsmith.server.helpers.MustacheHelper.extractMustacheKeys;
import static java.util.stream.Collectors.toSet;

@Slf4j
@Service
public class LayoutServiceImpl implements LayoutService {

    private final ApplicationPageService applicationPageService;
    private final PageService pageService;
    private final ObjectMapper objectMapper;
    private final ActionService actionService;

    @Autowired
    public LayoutServiceImpl(ApplicationPageService applicationPageService,
                             PageService pageService,
                             ObjectMapper objectMapper,
                             ActionService actionService) {
        this.applicationPageService = applicationPageService;
        this.pageService = pageService;
        this.objectMapper = objectMapper;
        this.actionService = actionService;
    }

    @Override
    public Mono<Layout> createLayout(String pageId, Layout layout) {
        if (pageId == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGEID));
        }

        Mono<Page> pageMono = pageService
                .findById(pageId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGEID)));

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
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGEID + " or " + FieldName.LAYOUTID)))
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
        List<String> mustacheKeys = new ArrayList<>();;
        //Extract the mustache keys and find all keys which match actions
        JSONObject dsl = layout.getDsl();
        try {
            String dslAsString = objectMapper.writeValueAsString(dsl);
            Set<String> extractMustacheKeys = extractMustacheKeys(dslAsString);
            mustacheKeys.addAll(extractMustacheKeys);
        } catch (JsonProcessingException e) {
            log.error("Exception caught during mustache extraction from the dsl in Layout. ", e);
        }

        Mono<Set<String>> actionsInPage = Flux.fromIterable(mustacheKeys)
                .map(mustacheKey -> {
                    String subStrings[] = mustacheKey.split(Pattern.quote("."));
                    // Assumption here is that the action name would always be the first substring here.
                    // If we start referring to actions from another page via <PageName>.<ActionName> format, this
                    // would break.
                    return subStrings[0];
                })
                /**
                 * TODO : Instead of finding each action by name, bulk search for actions by Name should be done.
                 */
                .flatMap(mustacheKey -> actionService.findByName(mustacheKey))
                .map(action -> {
                    action.setPageId(pageId);
                    return action;
                })
                .flatMap(actionService::save)
                .map(action -> action.getId())
                .collect(toSet());

        return pageService.findByIdAndLayoutsId(pageId, layoutId)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.PAGEID + " or " + FieldName.LAYOUTID)))
                .flatMap(applicationPageService::doesPageBelongToCurrentUserOrganization)
                //The pageId given is correct and belongs to the current user's organization.
                .zipWith(actionsInPage)
                .map(tuple -> {
                    Page page = tuple.getT1();
                    Set<String> actions = tuple.getT2();
                    List<Layout> layoutList = page.getLayouts();
                    //Because the findByIdAndLayoutsId call returned non-empty result, we are guaranteed to find the layoutId here.
                    for (Layout storedLayout : layoutList) {
                        if (storedLayout.getId().equals(layoutId)) {
                            //Copy the variables to conserve before update
                            JSONObject publishedDsl = storedLayout.getPublishedDsl();
                            Set<String> publishedDslActionIds = storedLayout.getPublishedDslActionIds();

                            //Update
                            layout.setDslActionIds(actions);
                            BeanUtils.copyProperties(layout, storedLayout);
                            storedLayout.setId(layoutId);

                            //Copy back the conserved variables.
                            storedLayout.setPublishedDsl(publishedDsl);
                            storedLayout.setPublishedDslActionIds(publishedDslActionIds);
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
}


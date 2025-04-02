package com.appsmith.server.layouts;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.dtos.LayoutExecutableUpdateDTO;
import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Executable;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ExecutableDependencyEdge;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.UpdateMultiplePageLayoutDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ObservationHelperImpl;
import com.appsmith.server.helpers.WidgetSpecificUtils;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.onload.internal.OnLoadExecutablesUtil;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.PagePermission;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.observation.ObservationRegistry;
import io.micrometer.tracing.Span;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.observability.micrometer.Micrometer;
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
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.spans.LayoutSpan.EXTRACT_ALL_WIDGET_NAMES_AND_DYNAMIC_BINDINGS_FROM_DSL;
import static com.appsmith.external.constants.spans.LayoutSpan.FIND_ALL_ON_LOAD_EXECUTABLES;
import static com.appsmith.external.constants.spans.LayoutSpan.FIND_AND_UPDATE_LAYOUT;
import static com.appsmith.external.constants.spans.LayoutSpan.UPDATE_EXECUTABLES_EXECUTE_ONLOAD;
import static com.appsmith.external.constants.spans.LayoutSpan.UPDATE_LAYOUT_DSL_METHOD;
import static com.appsmith.external.constants.spans.LayoutSpan.UPDATE_LAYOUT_METHOD;
import static com.appsmith.external.constants.spans.PageSpan.GET_PAGE_BY_ID;
import static com.appsmith.external.constants.spans.ce.LayoutSpanCE.UPDATE_LAYOUT_BASED_ON_CONTEXT;
import static com.appsmith.server.constants.CommonConstants.EVALUATION_VERSION;
import static java.lang.Boolean.FALSE;

@Slf4j
@RequiredArgsConstructor
@Service
public class UpdateLayoutServiceCEImpl implements UpdateLayoutServiceCE {

    private final OnLoadExecutablesUtil onLoadExecutablesUtil;
    private final SessionUserService sessionUserService;
    private final NewPageService newPageService;
    private final AnalyticsService analyticsService;
    private final PagePermission pagePermission;
    private final ApplicationService applicationService;
    private final ObjectMapper objectMapper;
    private final ObservationRegistry observationRegistry;
    private final ObservationHelperImpl observationHelper;

    private final String layoutOnLoadActionErrorToastMessage =
            "A cyclic dependency error has been encountered on current page, \nqueries on page load will not run. \n Please check debugger and Appsmith documentation for more information";

    private Mono<Boolean> sendUpdateLayoutAnalyticsEvent(
            String creatorId,
            String layoutId,
            JSONObject dsl,
            boolean isSuccess,
            Throwable error,
            CreatorContextType creatorType) {
        return Mono.zip(sessionUserService.getCurrentUser(), newPageService.getByIdWithoutPermissionCheck(creatorId))
                .flatMap(tuple -> {
                    User t1 = tuple.getT1();
                    NewPage t2 = tuple.getT2();

                    final Map<String, Object> data = Map.of(
                            "username",
                            t1.getUsername(),
                            "appId",
                            t2.getApplicationId(),
                            "creatorId",
                            creatorId,
                            "creatorType",
                            creatorType,
                            "layoutId",
                            layoutId,
                            "isSuccessfulExecution",
                            isSuccess,
                            "error",
                            error == null ? "" : error.getMessage());

                    return analyticsService
                            .sendObjectEvent(AnalyticsEvents.UPDATE_LAYOUT, t2, data)
                            .thenReturn(isSuccess);
                })
                .onErrorResume(e -> {
                    log.warn("Error sending action execution data point", e);
                    return Mono.just(isSuccess);
                });
    }

    private Mono<LayoutDTO> updateLayoutDsl(
            String creatorId,
            String layoutId,
            Layout layout,
            Integer evaluatedVersion,
            CreatorContextType creatorType) {
        JSONObject dsl = layout.getDsl();
        if (dsl == null) {
            // There is no DSL here. No need to process anything. Return as is.
            return Mono.just(generateResponseDTO(layout));
        }

        Set<String> widgetNames = new HashSet<>();
        Map<String, Set<String>> widgetDynamicBindingsMap = new HashMap<>();
        Set<String> escapedWidgetNames = new HashSet<>();

        Span extractAllWidgetNamesAndDynamicBindingsFromDSLSpan =
                observationHelper.createSpan(EXTRACT_ALL_WIDGET_NAMES_AND_DYNAMIC_BINDINGS_FROM_DSL);

        observationHelper.startSpan(extractAllWidgetNamesAndDynamicBindingsFromDSLSpan);

        try {
            dsl = extractAllWidgetNamesAndDynamicBindingsFromDSL(
                    dsl, widgetNames, widgetDynamicBindingsMap, creatorId, layoutId, escapedWidgetNames, creatorType);

        } catch (Throwable t) {
            return sendUpdateLayoutAnalyticsEvent(creatorId, layoutId, dsl, false, t, creatorType)
                    .then(Mono.error(t));
        }

        observationHelper.endSpan(extractAllWidgetNamesAndDynamicBindingsFromDSLSpan);

        layout.setWidgetNames(widgetNames);

        if (!escapedWidgetNames.isEmpty()) {
            layout.setMongoEscapedWidgetNames(escapedWidgetNames);
        }

        Set<String> executableNames = new HashSet<>();
        Set<ExecutableDependencyEdge> edges = new HashSet<>();
        Set<String> executablesUsedInDSL = new HashSet<>();
        List<Executable> flatmapOnLoadExecutables = new ArrayList<>();
        List<LayoutExecutableUpdateDTO> executableUpdatesRef = new ArrayList<>();
        List<String> messagesRef = new ArrayList<>();

        AtomicReference<Boolean> validOnLoadExecutables = new AtomicReference<>(Boolean.TRUE);

        // setting the layoutOnLoadActionActionErrors to empty to remove the existing
        // errors before new DAG calculation.
        layout.setLayoutOnLoadActionErrors(new ArrayList<>());

        Mono<List<Set<DslExecutableDTO>>> allOnLoadExecutablesMono = onLoadExecutablesUtil
                .findAllOnLoadExecutables(
                        creatorId,
                        evaluatedVersion,
                        widgetNames,
                        edges,
                        widgetDynamicBindingsMap,
                        flatmapOnLoadExecutables,
                        executablesUsedInDSL,
                        creatorType)
                .name(FIND_ALL_ON_LOAD_EXECUTABLES)
                .tap(Micrometer.observation(observationRegistry))
                .onErrorResume(AppsmithException.class, error -> {
                    log.info(error.getMessage());
                    validOnLoadExecutables.set(FALSE);
                    layout.setLayoutOnLoadActionErrors(List.of(new ErrorDTO(
                            error.getAppErrorCode(),
                            error.getErrorType(),
                            layoutOnLoadActionErrorToastMessage,
                            error.getMessage(),
                            error.getTitle())));
                    return Mono.just(new ArrayList<>());
                });

        // First update the actions and set execute on load to true
        JSONObject finalDsl = dsl;

        Mono<LayoutDTO> layoutDTOMono = allOnLoadExecutablesMono
                .flatMap(allOnLoadExecutables -> {
                    // If there has been an error (e.g. cyclical dependency), then don't update any
                    // actions.
                    // This is so that unnecessary updates don't happen to actions while the page is
                    // in invalid state.
                    if (!validOnLoadExecutables.get()) {
                        return Mono.just(allOnLoadExecutables);
                    }
                    // Update these executables to be executed on load, unless the user has touched
                    // the executeOnLoad
                    // setting for this
                    return onLoadExecutablesUtil
                            .updateExecutablesExecuteOnLoad(
                                    flatmapOnLoadExecutables, creatorId, executableUpdatesRef, messagesRef, creatorType)
                            .name(UPDATE_EXECUTABLES_EXECUTE_ONLOAD)
                            .tap(Micrometer.observation(observationRegistry))
                            .thenReturn(allOnLoadExecutables);
                })
                // Now update the page layout with the page load executables and the graph.
                .flatMap(onLoadExecutables -> {
                    layout.setLayoutOnLoadActions(onLoadExecutables);
                    layout.setAllOnPageLoadActionNames(executableNames);
                    layout.setActionsUsedInDynamicBindings(executablesUsedInDSL);
                    // The below field is to ensure that we record if the page load actions
                    // computation was
                    // valid when last stored in the database.
                    layout.setValidOnPageLoadActions(validOnLoadExecutables.get());

                    return onLoadExecutablesUtil
                            .findAndUpdateLayout(creatorId, creatorType, layoutId, layout)
                            .tag("no_of_widgets", String.valueOf(widgetNames.size()))
                            .tag("no_of_executables", String.valueOf(executableNames.size()))
                            .name(FIND_AND_UPDATE_LAYOUT)
                            .tap(Micrometer.observation(observationRegistry));
                })
                .map(savedLayout -> {
                    savedLayout.setDsl(this.unescapeMongoSpecialCharacters(savedLayout));
                    return savedLayout;
                })
                .flatMap(savedLayout -> {
                    LayoutDTO layoutDTO = generateResponseDTO(savedLayout);
                    layoutDTO.setActionUpdates(executableUpdatesRef);
                    layoutDTO.setMessages(messagesRef);

                    return sendUpdateLayoutAnalyticsEvent(creatorId, layoutId, finalDsl, true, null, creatorType)
                            .thenReturn(layoutDTO);
                });

        return layoutDTOMono;
    }

    @Override
    public Mono<LayoutDTO> updateLayout(String pageId, String applicationId, String layoutId, Layout layout) {
        return applicationService
                .findById(applicationId)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION_ID, applicationId)))
                .flatMap(application -> {
                    Integer evaluationVersion = application.getEvaluationVersion();
                    if (evaluationVersion == null) {
                        evaluationVersion = EVALUATION_VERSION;
                    }
                    return updateLayoutDsl(pageId, layoutId, layout, evaluationVersion, CreatorContextType.PAGE)
                            .name(UPDATE_LAYOUT_DSL_METHOD);
                });
    }

    @Override
    public Mono<Integer> updateMultipleLayouts(
            String baseApplicationId, UpdateMultiplePageLayoutDTO updateMultiplePageLayoutDTO) {
        List<Mono<LayoutDTO>> monoList = new ArrayList<>();
        for (UpdateMultiplePageLayoutDTO.UpdatePageLayoutDTO pageLayout :
                updateMultiplePageLayoutDTO.getPageLayouts()) {
            final Layout layout = new Layout();
            layout.setDsl(pageLayout.getLayout().dsl());
            Mono<LayoutDTO> updatedLayoutMono =
                    this.updateLayout(pageLayout.getPageId(), baseApplicationId, pageLayout.getLayoutId(), layout);
            monoList.add(updatedLayoutMono);
        }
        return Flux.merge(monoList).then(Mono.just(monoList.size()));
    }

    private LayoutDTO generateResponseDTO(Layout layout) {

        LayoutDTO layoutDTO = new LayoutDTO();

        layoutDTO.setId(layout.getId());
        layoutDTO.setDsl(layout.getDsl());
        layoutDTO.setScreen(layout.getScreen());
        layoutDTO.setLayoutOnLoadActions(layout.getLayoutOnLoadActions());
        layoutDTO.setLayoutOnLoadActionErrors(layout.getLayoutOnLoadActionErrors());

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

    @Override
    public Mono<String> updatePageLayoutsByPageId(String pageId) {
        // Mono.just(null) will throw an NPE, if pageId is null.
        if (!StringUtils.hasLength(pageId)) {
            return Mono.just("");
        }
        return Mono.justOrEmpty(pageId)
                // fetch the unpublished page
                .flatMap(id -> newPageService.findPageById(id, pagePermission.getEditPermission(), false))
                .name(GET_PAGE_BY_ID)
                .tap(Micrometer.observation(observationRegistry))
                .flatMapMany(page -> {
                    if (page.getLayouts() == null) {
                        return Mono.empty();
                    }
                    return Flux.fromIterable(page.getLayouts()).flatMap(layout -> {
                        layout.setDsl(this.unescapeMongoSpecialCharacters(layout));
                        return this.updateLayout(page.getId(), page.getApplicationId(), layout.getId(), layout)
                                .name(UPDATE_LAYOUT_METHOD)
                                .tap(Micrometer.observation(observationRegistry));
                    });
                })
                .collectList()
                .then(Mono.just(pageId));
    }

    @Override
    public Mono<List<Set<DslExecutableDTO>>> getOnPageLoadActions(
            String creatorId,
            String layoutId,
            Layout layout,
            Integer evaluatedVersion,
            CreatorContextType creatorType) {
        JSONObject dsl = layout.getDsl();
        if (dsl == null) {
            // There is no DSL here. No need to process anything. Return as is.
            return Mono.just(new ArrayList<>());
        }

        Set<String> widgetNames = new HashSet<>();
        Map<String, Set<String>> widgetDynamicBindingsMap = new HashMap<>();
        Set<String> escapedWidgetNames = new HashSet<>();
        // observationHelper.createSpan()
        try {
            dsl = extractAllWidgetNamesAndDynamicBindingsFromDSL(
                    dsl, widgetNames, widgetDynamicBindingsMap, creatorId, layoutId, escapedWidgetNames, creatorType);
        } catch (Throwable t) {
            return sendUpdateLayoutAnalyticsEvent(creatorId, layoutId, dsl, false, t, creatorType)
                    .then(Mono.error(t));
        }

        layout.setWidgetNames(widgetNames);

        if (!escapedWidgetNames.isEmpty()) {
            layout.setMongoEscapedWidgetNames(escapedWidgetNames);
        }
        Set<ExecutableDependencyEdge> edges = new HashSet<>();
        Set<String> executablesUsedInDSL = new HashSet<>();
        List<Executable> flatmapOnLoadExecutables = new ArrayList<>();

        AtomicReference<Boolean> validOnLoadExecutables = new AtomicReference<>(Boolean.TRUE);

        // setting the layoutOnLoadActionActionErrors to empty to remove the existing
        // errors before new DAG calculation.
        layout.setLayoutOnLoadActionErrors(new ArrayList<>());

        return onLoadExecutablesUtil
                .findAllOnLoadExecutables(
                        creatorId,
                        evaluatedVersion,
                        widgetNames,
                        edges,
                        widgetDynamicBindingsMap,
                        flatmapOnLoadExecutables,
                        executablesUsedInDSL,
                        creatorType)
                .onErrorResume(AppsmithException.class, error -> {
                    log.info(error.getMessage());
                    validOnLoadExecutables.set(FALSE);
                    layout.setLayoutOnLoadActionErrors(List.of(new ErrorDTO(
                            error.getAppErrorCode(),
                            error.getErrorType(),
                            layoutOnLoadActionErrorToastMessage,
                            error.getMessage(),
                            error.getTitle())));
                    return Mono.just(new ArrayList<>());
                });
    }

    @Override
    public Mono<String> updateLayoutByContextTypeAndContextId(CreatorContextType contextType, String contextId) {
        if (contextType == null || CreatorContextType.PAGE.equals(contextType)) {
            return this.updatePageLayoutsByPageId(contextId)
                    .name(UPDATE_LAYOUT_BASED_ON_CONTEXT)
                    .tap(Micrometer.observation(observationRegistry));
        } else {
            return Mono.just("");
        }
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
                // Since this is a table widget, it wouldnt have children. We can safely return
                // from here with updated
                // dsl
                return WidgetSpecificUtils.unEscapeTableWidgetPrimaryColumns(dsl);
            }
        }

        // Fetch the children of the current node in the DSL and recursively iterate
        // over them to extract bindings
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

    /**
     * Walks the DSL and extracts all the widget names from it.
     * A widget is expected to have a few properties defining its own behaviour,
     * with any mustache bindings present
     * in them aggregated in the field dynamicBindingsPathList.
     * A widget may also have other widgets as children, each of which will follow
     * the same structure
     * Refer to FieldName.DEFAULT_PAGE_LAYOUT for a template
     *
     * @param dsl
     * @param widgetNames
     * @param widgetDynamicBindingsMap
     * @param creatorId
     * @param layoutId
     * @param escapedWidgetNames
     * @return
     */
    private JSONObject extractAllWidgetNamesAndDynamicBindingsFromDSL(
            JSONObject dsl,
            Set<String> widgetNames,
            Map<String, Set<String>> widgetDynamicBindingsMap,
            String creatorId,
            String layoutId,
            Set<String> escapedWidgetNames,
            CreatorContextType creatorType)
            throws AppsmithException {
        if (dsl.get(FieldName.WIDGET_NAME) == null) {
            // This isn't a valid widget configuration. No need to traverse this.
            return dsl;
        }

        String widgetName = dsl.getAsString(FieldName.WIDGET_NAME);
        String widgetId = dsl.getAsString(FieldName.WIDGET_ID);
        String widgetType = dsl.getAsString(FieldName.WIDGET_TYPE);

        // Since we are parsing this widget in this, add it to the global set of widgets
        // found so far in the DSL.
        widgetNames.add(widgetName);

        // Start by picking all fields where we expect to find dynamic bindings for this
        // particular widget
        ArrayList<Object> dynamicallyBoundedPathList = (ArrayList<Object>) dsl.get(FieldName.DYNAMIC_BINDING_PATH_LIST);

        // Widgets will not have FieldName.DYNAMIC_BINDING_PATH_LIST if there are no
        // bindings in that widget.
        // Hence we skip over the extraction of the bindings from that widget.
        if (dynamicallyBoundedPathList != null) {
            // Each of these might have nested structures, so we iterate through them to
            // find the leaf node for each
            for (Object x : dynamicallyBoundedPathList) {
                final String fieldPath = String.valueOf(((Map) x).get(FieldName.KEY));
                String[] fields = fieldPath.split("[].\\[]");
                // For nested fields, the parent dsl to search in would shift by one level every
                // iteration
                Object parent = dsl;
                Iterator<String> fieldsIterator = Arrays.stream(fields)
                        .filter(fieldToken -> !fieldToken.isBlank())
                        .iterator();
                boolean isLeafNode = false;
                Object oldParent;
                // This loop will end at either a leaf node, or the last identified JSON field
                // (by throwing an
                // exception)
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
                                throw new AppsmithException(
                                        AppsmithError.INVALID_DYNAMIC_BINDING_REFERENCE,
                                        widgetType,
                                        widgetName,
                                        widgetId,
                                        fieldPath,
                                        creatorId,
                                        layoutId,
                                        oldParent,
                                        nextKey,
                                        "Index out of bounds for list",
                                        creatorType);
                            }
                        } else {
                            throw new AppsmithException(
                                    AppsmithError.INVALID_DYNAMIC_BINDING_REFERENCE,
                                    widgetType,
                                    widgetName,
                                    widgetId,
                                    fieldPath,
                                    creatorId,
                                    layoutId,
                                    oldParent,
                                    nextKey,
                                    "Child of list is not in an indexed path",
                                    creatorType);
                        }
                    }
                    // After updating the parent, check for the types
                    if (parent == null) {
                        throw new AppsmithException(
                                AppsmithError.INVALID_DYNAMIC_BINDING_REFERENCE,
                                widgetType,
                                widgetName,
                                widgetId,
                                fieldPath,
                                creatorId,
                                layoutId,
                                oldParent,
                                nextKey,
                                "New element is null",
                                creatorType);
                    } else if (parent instanceof String) {
                        // If we get String value, then this is a leaf node
                        isLeafNode = true;
                    }

                    // Only extract mustache keys from leaf nodes
                    if (isLeafNode) {

                        // We found the path. But if the path does not have any mustache bindings, throw
                        // the error
                        if (!MustacheHelper.laxIsBindingPresentInString((String) parent)) {
                            try {
                                String bindingAsString = objectMapper.writeValueAsString(parent);
                                throw new AppsmithException(
                                        AppsmithError.INVALID_DYNAMIC_BINDING_REFERENCE,
                                        widgetType,
                                        widgetName,
                                        widgetId,
                                        fieldPath,
                                        creatorId,
                                        layoutId,
                                        bindingAsString,
                                        nextKey,
                                        "Binding path has no mustache bindings",
                                        creatorType);
                            } catch (JsonProcessingException e) {
                                throw new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR, parent);
                            }
                        }

                        // Stricter extraction of dynamic bindings
                        Set<String> mustacheKeysFromFields =
                                MustacheHelper.extractMustacheKeysFromFields(parent).stream()
                                        .map(token -> token.getValue())
                                        .collect(Collectors.toSet());

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

        // Fetch the children of the current node in the DSL and recursively iterate
        // over them to extract bindings
        ArrayList<Object> children = (ArrayList<Object>) dsl.get(FieldName.CHILDREN);
        ArrayList<Object> newChildren = new ArrayList<>();
        if (children != null) {
            for (int i = 0; i < children.size(); i++) {
                Map data = (Map) children.get(i);
                JSONObject object = new JSONObject();
                // If the children tag exists and there are entries within it
                if (!CollectionUtils.isEmpty(data)) {
                    object.putAll(data);
                    JSONObject child = extractAllWidgetNamesAndDynamicBindingsFromDSL(
                            object,
                            widgetNames,
                            widgetDynamicBindingsMap,
                            creatorId,
                            layoutId,
                            escapedWidgetNames,
                            creatorType);
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
}

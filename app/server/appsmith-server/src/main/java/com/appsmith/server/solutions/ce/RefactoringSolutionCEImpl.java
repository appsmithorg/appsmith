package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.configurations.InstanceConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.RefactorActionNameDTO;
import com.appsmith.server.dtos.RefactorNameDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DslUtils;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.AstService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.jetbrains.annotations.NotNull;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static com.appsmith.server.acl.AclPermission.MANAGE_ACTIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_PAGES;
import static com.appsmith.server.services.ce.ApplicationPageServiceCEImpl.EVALUATION_VERSION;
import static java.util.stream.Collectors.toSet;

@Slf4j
public class RefactoringSolutionCEImpl implements RefactoringSolutionCE {
    private final ObjectMapper objectMapper;
    private final NewPageService newPageService;
    private final NewActionService newActionService;
    private final ActionCollectionService actionCollectionService;
    private final ResponseUtils responseUtils;
    private final LayoutActionService layoutActionService;
    private final ApplicationService applicationService;
    private final AstService astService;
    private final InstanceConfig instanceConfig;
    private final Boolean isRtsAccessible;

    private static final Pattern actionCollectionBodyPattern = Pattern.compile("export default(.*)", Pattern.DOTALL);
    private static final String EXPORT_DEFAULT_STRING = "export default";

    /*
     * To replace fetchUsers in `{{JSON.stringify(fetchUsers)}}` with getUsers, the following regex is required :
     * `\\b(fetchUsers)\\b`. To achieve this the following strings preWord and postWord are declared here to be used
     * at run time to create the regex pattern.
     */
    private static final String preWord = "\\b(";
    private static final String postWord = ")\\b";

    public RefactoringSolutionCEImpl(ObjectMapper objectMapper,
                                     NewPageService newPageService,
                                     NewActionService newActionService,
                                     ActionCollectionService actionCollectionService,
                                     ResponseUtils responseUtils,
                                     LayoutActionService layoutActionService,
                                     ApplicationService applicationService,
                                     AstService astService,
                                     InstanceConfig instanceConfig) {
        this.objectMapper = objectMapper;
        this.newPageService = newPageService;
        this.newActionService = newActionService;
        this.actionCollectionService = actionCollectionService;
        this.responseUtils = responseUtils;
        this.layoutActionService = layoutActionService;
        this.applicationService = applicationService;
        this.astService = astService;
        this.instanceConfig = instanceConfig;

        // TODO Remove this variable and access the field directly when RTS API is ready
        this.isRtsAccessible = false;

    }

    @Override
    public Mono<LayoutDTO> refactorWidgetName(RefactorNameDTO refactorNameDTO) {
        String pageId = refactorNameDTO.getPageId();
        String layoutId = refactorNameDTO.getLayoutId();
        String oldName = refactorNameDTO.getOldName();
        String newName = refactorNameDTO.getNewName();
        return layoutActionService.isNameAllowed(pageId, layoutId, newName)
                .flatMap(allowed -> {
                    if (!allowed) {
                        return Mono.error(new AppsmithException(AppsmithError.NAME_CLASH_NOT_ALLOWED_IN_REFACTOR, oldName, newName));
                    }
                    return this.refactorName(pageId, layoutId, oldName, newName);
                });
    }

    @Override
    public Mono<LayoutDTO> refactorWidgetName(RefactorNameDTO refactorNameDTO, String branchName) {
        if (!StringUtils.hasLength(branchName)) {
            return refactorWidgetName(refactorNameDTO);
        }

        return newPageService.findByBranchNameAndDefaultPageId(branchName, refactorNameDTO.getPageId(), MANAGE_PAGES)
                .flatMap(branchedPage -> {
                    refactorNameDTO.setPageId(branchedPage.getId());
                    return refactorWidgetName(refactorNameDTO);
                })
                .map(responseUtils::updateLayoutDTOWithDefaultResources);
    }

    @Override
    public Mono<LayoutDTO> refactorActionName(RefactorActionNameDTO refactorActionNameDTO) {
        String pageId = refactorActionNameDTO.getPageId();
        String layoutId = refactorActionNameDTO.getLayoutId();
        String oldName = refactorActionNameDTO.getOldName();
        final String oldFullyQualifiedName = StringUtils.hasLength(refactorActionNameDTO.getCollectionName()) ?
                refactorActionNameDTO.getCollectionName() + "." + oldName :
                oldName;
        String newName = refactorActionNameDTO.getNewName();
        final String newFullyQualifiedName = StringUtils.hasLength(refactorActionNameDTO.getCollectionName()) ?
                refactorActionNameDTO.getCollectionName() + "." + newName :
                newName;
        String actionId = refactorActionNameDTO.getActionId();
        return Mono.just(newActionService.validateActionName(newName))
                .flatMap(isValidName -> {
                    if (!isValidName) {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_ACTION_NAME));
                    }
                    return layoutActionService.isNameAllowed(pageId, layoutId, newFullyQualifiedName);
                })
                .flatMap(allowed -> {
                    if (!allowed) {
                        return Mono.error(new AppsmithException(AppsmithError.NAME_CLASH_NOT_ALLOWED_IN_REFACTOR, oldName, newName));
                    }
                    return newActionService
                            .findActionDTObyIdAndViewMode(actionId, false, MANAGE_ACTIONS);
                })
                .flatMap(action -> {
                    action.setName(newName);
                    if (StringUtils.hasLength(refactorActionNameDTO.getCollectionName())) {
                        action.setFullyQualifiedName(newFullyQualifiedName);
                    }
                    return newActionService.updateUnpublishedAction(actionId, action);
                })
                .then(this.refactorName(pageId, layoutId, oldFullyQualifiedName, newFullyQualifiedName));
    }

    @Override
    public Mono<LayoutDTO> refactorActionName(RefactorActionNameDTO refactorActionNameDTO, String branchName) {

        String defaultActionId = refactorActionNameDTO.getActionId();
        return newActionService.findByBranchNameAndDefaultActionId(branchName, defaultActionId, MANAGE_ACTIONS)
                .flatMap(branchedAction -> {
                    refactorActionNameDTO.setActionId(branchedAction.getId());
                    refactorActionNameDTO.setPageId(branchedAction.getUnpublishedAction().getPageId());
                    return refactorActionName(refactorActionNameDTO);
                })
                .map(responseUtils::updateLayoutDTOWithDefaultResources);
    }

    /**
     * Assumption here is that the refactoring name provided is indeed unique and is fit to be replaced everywhere.
     * <p>
     * At this point, the user must have MANAGE_PAGES and MANAGE_ACTIONS permissions for page and action respectively
     *
     * @param pageId   : The page that this entity belongs to
     * @param layoutId : The layout to parse through for replacement
     * @param oldName  : The original name to look for
     * @param newName  : The new name to refactor all references to
     * @return : The DSL after refactor updates
     */
    @Override
    public Mono<LayoutDTO> refactorName(String pageId, String layoutId, String oldName, String newName) {
        String regexPattern = preWord + oldName + postWord;
        Pattern oldNamePattern = Pattern.compile(regexPattern);

        Mono<PageDTO> pageMono = newPageService
                // fetch the unpublished page
                .findPageById(pageId, MANAGE_PAGES, false)
                .cache();

        Mono<Integer> evalVersionMono = pageMono
                .flatMap(page -> {
                    return applicationService.findById(page.getApplicationId())
                            .map(application -> {
                                Integer evaluationVersion = application.getEvaluationVersion();
                                if (evaluationVersion == null) {
                                    evaluationVersion = EVALUATION_VERSION;
                                }
                                return evaluationVersion;
                            });
                })
                .cache();

        Mono<PageDTO> updatePageMono = Mono.zip(pageMono, evalVersionMono)
                .flatMap(tuple -> {
                    PageDTO page = tuple.getT1();
                    int evalVersion = tuple.getT2();

                    List<Layout> layouts = page.getLayouts();
                    for (Layout layout : layouts) {
                        if (layoutId.equals(layout.getId()) && layout.getDsl() != null) {
                            // DSL has removed all the old names and replaced it with new name. If the change of name
                            // was one of the mongoEscaped widgets, then update the names in the set as well
                            Set<String> mongoEscapedWidgetNames = layout.getMongoEscapedWidgetNames();
                            if (mongoEscapedWidgetNames != null && mongoEscapedWidgetNames.contains(oldName)) {
                                mongoEscapedWidgetNames.remove(oldName);
                                mongoEscapedWidgetNames.add(newName);
                            }

                            final JsonNode dslNode = objectMapper.convertValue(layout.getDsl(), JsonNode.class);
                            Mono<PageDTO> refactorNameInDslMono = this.refactorNameInDsl(dslNode, oldName, newName, evalVersion, oldNamePattern)
                                    .then(Mono.fromCallable(() -> {
                                        layout.setDsl(objectMapper.convertValue(dslNode, JSONObject.class));
                                        page.setLayouts(layouts);
                                        return page;
                                    }));

                            // Since the page has most probably changed, save the page and return.
                            return refactorNameInDslMono
                                    .flatMap(newPageService::saveUnpublishedPage);
                        }
                    }
                    // If we have reached here, the layout was not found and the page should be returned as is.
                    return Mono.just(page);
                });

        Set<String> updatableCollectionIds = new HashSet<>();

        Mono<Set<String>> updateActionsMono = newActionService
                .findByPageIdAndViewMode(pageId, false, MANAGE_ACTIONS)
                .flatMap(newAction -> Mono.just(newAction).zipWith(evalVersionMono))
                /*
                 * Assuming that the datasource should not be dependent on the widget and hence not going through the same
                 * to look for replacement pattern.
                 */
                .flatMap(tuple -> {
                    final NewAction newAction = tuple.getT1();
                    final Integer evalVersion = tuple.getT2();
                    // We need actionDTO to be populated with pluginType from NewAction
                    // so that we can check for the JS path
                    Mono<ActionDTO> actionMono = newActionService.generateActionByViewMode(newAction, false);
                    return actionMono.flatMap(action -> {
                        if (action.getActionConfiguration() == null) {
                            return Mono.just(newAction);
                        }
                        // If this is a JS function rename, add this collection for rename
                        // because the action configuration won't tell us this
                        if (StringUtils.hasLength(action.getCollectionId()) && newName.equals(action.getValidName())) {
                            updatableCollectionIds.add(action.getCollectionId());
                        }
                        newAction.setUnpublishedAction(action);
                        return this.refactorNameInAction(action, oldName, newName, evalVersion, oldNamePattern)
                                .flatMap(updates -> {
                                    if (updates.isEmpty()) {
                                        return Mono.just(newAction);
                                    }
                                    if (StringUtils.hasLength(action.getCollectionId())) {
                                        updatableCollectionIds.add(action.getCollectionId());
                                    }
                                    newActionService.extractAndSetJsonPathKeys(newAction);
                                    return newActionService.save(newAction);
                                });
                    });

                })
                .map(savedAction -> savedAction.getUnpublishedAction().getName())
                .collect(toSet())
                .zipWith(evalVersionMono)
                .flatMap(tuple -> {
                    Set<String> updatedActions = tuple.getT1();
                    Integer evalVersion = tuple.getT2();
                    // If these actions belonged to collections, update the collection body
                    return Flux.fromIterable(updatableCollectionIds)
                            .flatMap(collectionId -> actionCollectionService.findById(collectionId, MANAGE_ACTIONS))
                            .flatMap(actionCollection -> {
                                final ActionCollectionDTO unpublishedCollection = actionCollection.getUnpublishedCollection();

                                Matcher matcher = actionCollectionBodyPattern.matcher(unpublishedCollection.getBody());
                                if (matcher.find()) {
                                    String parsableBody = matcher.group(1);
                                    return this.replaceValueInMustacheKeys(
                                                    new HashSet<>(Collections.singletonList(parsableBody)),
                                                    oldName,
                                                    newName,
                                                    evalVersion,
                                                    oldNamePattern)
                                            .flatMap(replacedMap -> {
                                                Optional<String> replacedValue = replacedMap.values().stream().findFirst();
                                                // This value should always be there
                                                if (replacedValue.isPresent()) {
                                                    final String replacedBody = EXPORT_DEFAULT_STRING + replacedValue.get();
                                                    unpublishedCollection.setBody(replacedBody);
                                                    return actionCollectionService.save(actionCollection);
                                                }
                                                return Mono.just(actionCollection);
                                            });
                                } else {
                                    // TODO make this error more informative, users should never edit JS objects to this state
                                    return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                                }
                            })
                            .collectList()
                            .thenReturn(updatedActions);
                });

        return Mono.zip(updateActionsMono, updatePageMono)
                .flatMap(tuple -> {
                    Set<String> updatedActionNames = tuple.getT1();
                    PageDTO page = tuple.getT2();
                    log.debug("Actions updated due to refactor name in page {} are : {}", pageId, updatedActionNames);
                    List<Layout> layouts = page.getLayouts();
                    for (Layout layout : layouts) {
                        if (layoutId.equals(layout.getId())) {
                            layout.setDsl(layoutActionService.unescapeMongoSpecialCharacters(layout));
                            return layoutActionService.updateLayout(page.getId(), page.getApplicationId(), layout.getId(), layout);
                        }
                    }
                    return Mono.empty();
                });
    }

    Mono<Set<String>> refactorNameInDsl(JsonNode dsl, String oldName, String newName, int evalVersion, Pattern oldNamePattern) {

        Mono<Set<String>> refactorNameInWidgetMono = Mono.just(new HashSet<>());
        Mono<Set<String>> recursiveRefactorNameInDslMono = Mono.just(new HashSet<>());

        // if current object is widget,
        if (dsl.has(FieldName.WIDGET_ID)) {
            // enter parse widget method
            refactorNameInWidgetMono = refactorNameInWidget(dsl, oldName, newName, evalVersion, oldNamePattern);
        }
        // if current object has children,
        if (dsl.has("children")) {
            ArrayNode dslChildren = (ArrayNode) dsl.get("children");
            // recurse over each child
            recursiveRefactorNameInDslMono = Flux.fromStream(StreamSupport.stream(dslChildren.spliterator(), true))
                    .flatMap(child -> refactorNameInDsl(child, oldName, newName, evalVersion, oldNamePattern))
                    .reduce(new HashSet<>(), (x, y) -> {
                        // for each child, aggregate the refactored paths
                        y.addAll(x);
                        return y;
                    });
        }

        return refactorNameInWidgetMono
                .zipWith(recursiveRefactorNameInDslMono)
                .map(tuple -> {
                    tuple.getT1().addAll(tuple.getT2());
                    return tuple.getT1();
                });
    }

    Mono<Set<String>> refactorNameInWidget(JsonNode widgetDsl, String oldName, String newName, int evalVersion, Pattern oldNamePattern) {
        boolean isRefactoredWidget = false;
        boolean isRefactoredTemplate = false;
        String widgetName = "";
        // If the name of this widget matches the old name, replace the name
        if (widgetDsl.has(FieldName.WIDGET_NAME)) {
            widgetName = widgetDsl.get(FieldName.WIDGET_NAME).asText();
            if (oldName.equals(widgetName)) {
                ((ObjectNode) widgetDsl).set(FieldName.WIDGET_NAME, new TextNode(newName));
                // We mark this widget name as being a path that was refactored using this boolean value
                isRefactoredWidget = true;
            }
        }

        // This is special handling for the list widget that has been added to allow refactoring of
        // just the default widgets inside the list. This is required because for the list, the widget names
        // exist as keys at the location List1.template(.Text1) [Ref #9281]
        // Ideally, we should avoid any non-structural elements as keys. This will be improved in list widget v2
        if (widgetDsl.has(FieldName.WIDGET_TYPE) && FieldName.LIST_WIDGET.equals(widgetDsl.get(FieldName.WIDGET_TYPE).asText())) {
            final JsonNode template = widgetDsl.get(FieldName.LIST_WIDGET_TEMPLATE);
            JsonNode newJsonNode = null;
            String fieldName = null;
            final Iterator<String> templateIterator = template.fieldNames();
            while (templateIterator.hasNext()) {
                fieldName = templateIterator.next();

                if (oldName.equals(fieldName)) {
                    newJsonNode = template.get(fieldName);
                    break;
                }
            }
            if (newJsonNode != null) {
                // If we are here, it means that the widget being refactored was from a list widget template
                // Go ahead and refactor this template as well
                ((ObjectNode) newJsonNode).set(FieldName.WIDGET_NAME, new TextNode(newName));
                // If such a pattern is found, remove that element and attach it back with the new name
                ((ObjectNode) template).remove(fieldName);
                ((ObjectNode) template).set(newName, newJsonNode);
                // We mark this template path as being a path that was refactored using this boolean value
                isRefactoredTemplate = true;
            }
        }

        Mono<Set<String>> refactorDynamicBindingsMono = Mono.just(new HashSet<>());
        Mono<Set<String>> refactorTriggerBindingsMono = Mono.just(new HashSet<>());

        // If there are dynamic bindings in this action configuration, inspect them
        if (widgetDsl.has(FieldName.DYNAMIC_BINDING_PATH_LIST) && !widgetDsl.get(FieldName.DYNAMIC_BINDING_PATH_LIST).isEmpty()) {
            ArrayNode dslDynamicBindingPathList = (ArrayNode) widgetDsl.get(FieldName.DYNAMIC_BINDING_PATH_LIST);
            // recurse over each child
            refactorDynamicBindingsMono = refactorBindingsUsingBindingPaths(
                    widgetDsl,
                    oldName,
                    newName,
                    evalVersion,
                    oldNamePattern,
                    dslDynamicBindingPathList,
                    widgetName);
        }

        // If there are dynamic triggers in this action configuration, inspect them
        if (widgetDsl.has(FieldName.DYNAMIC_TRIGGER_PATH_LIST) && !widgetDsl.get(FieldName.DYNAMIC_TRIGGER_PATH_LIST).isEmpty()) {
            ArrayNode dslDynamicTriggerPathList = (ArrayNode) widgetDsl.get(FieldName.DYNAMIC_TRIGGER_PATH_LIST);
            // recurse over each child
            refactorTriggerBindingsMono = refactorBindingsUsingBindingPaths(
                    widgetDsl,
                    oldName,
                    newName,
                    evalVersion,
                    oldNamePattern,
                    dslDynamicTriggerPathList,
                    widgetName);
        }

        final String finalWidgetNamePath = widgetName + ".widgetName";
        final boolean finalIsRefactoredWidget = isRefactoredWidget;
        final boolean finalIsRefactoredTemplate = isRefactoredTemplate;
        final String finalWidgetTemplatePath = widgetName + ".template";
        return refactorDynamicBindingsMono.zipWith(refactorTriggerBindingsMono)
                .map(tuple -> {
                    tuple.getT1().addAll(tuple.getT2());
                    return tuple.getT1();
                })
                .map(refactoredBindings -> {
                    if (Boolean.TRUE.equals(finalIsRefactoredWidget)) {
                        refactoredBindings.add(finalWidgetNamePath);
                    }
                    if (Boolean.TRUE.equals(finalIsRefactoredTemplate)) {
                        refactoredBindings.add(finalWidgetTemplatePath);
                    }
                    return refactoredBindings;
                });
    }

    @NotNull
    private Mono<Set<String>> refactorBindingsUsingBindingPaths(JsonNode widgetDsl, String oldName, String newName, int evalVersion, Pattern oldNamePattern, ArrayNode bindingPathList, String widgetName) {
        Mono<Set<String>> refactorBindingsMono;
        refactorBindingsMono = Flux.fromStream(StreamSupport.stream(bindingPathList.spliterator(), true))
                .flatMap(bindingPath -> {
                    String key = bindingPath.get(FieldName.KEY).asText();
                    // This is inside a list widget, and the path starts with template.<oldName>,
                    // We need to update the binding path list entry itself as well
                    if (widgetDsl.has(FieldName.WIDGET_TYPE) &&
                            FieldName.LIST_WIDGET.equals(widgetDsl.get(FieldName.WIDGET_TYPE).asText()) &&
                            key.startsWith("template." + oldName)) {
                        key = key.replace(oldName, newName);
                        ((ObjectNode) bindingPath).set(FieldName.KEY, new TextNode(key));
                    }
                    // Find values inside mustache bindings in this path
                    Set<String> mustacheValues = DslUtils.getMustacheValueSetFromSpecificDynamicBindingPath(widgetDsl, key);
                    final String finalKey = key;
                    // Perform refactor for each mustache value
                    return this.replaceValueInMustacheKeys(mustacheValues, oldName, newName, evalVersion, oldNamePattern)
                            .flatMap(replacementMap -> {
                                if (replacementMap.isEmpty()) {
                                    // If the map is empty, it means that this path did not have anything that had to be refactored
                                    return Mono.empty();
                                }
                                // Replace the binding path value with the new mustache values
                                DslUtils.replaceValuesInSpecificDynamicBindingPath(widgetDsl, finalKey, replacementMap);
                                // Mark this path as refactored
                                String entityPath = StringUtils.hasLength(widgetName) ? widgetName + "." : "";
                                return Mono.just(entityPath + finalKey);
                            });
                })
                .collect(Collectors.toSet());
        return refactorBindingsMono;
    }

    Mono<Set<String>> refactorNameInAction(ActionDTO actionDTO, String oldName, String newName,
                                           int evalVersion, Pattern oldNamePattern) {
        // If we're going the fallback route (without AST), we can first filter actions to be refactored
        // By performing a check on whether json path keys had a reference
        // This is not needed in the AST way since it would be costlier to make double the number of API calls
        if (Boolean.FALSE.equals(this.isRtsAccessible)) {
            Set<String> jsonPathKeys = actionDTO.getJsonPathKeys();

            boolean isReferenceFound = false;
            if (jsonPathKeys != null && !jsonPathKeys.isEmpty()) {
                // Since json path keys actually contain the entire inline js function instead of just the widget/action
                // name, we can not simply use the set.contains(obj) function. We need to iterate over all the keys
                // in the set and see if the old name is a substring of the json path key.
                for (String key : jsonPathKeys) {
                    if (oldNamePattern.matcher(key).find()) {
                        isReferenceFound = true;
                        break;
                    }
                }
            }
            // If no reference was found, return with an empty set
            if (Boolean.FALSE.equals(isReferenceFound)) {
                return Mono.just(new HashSet<>());
            }
        }

        ActionConfiguration actionConfiguration = actionDTO.getActionConfiguration();
        final JsonNode actionConfigurationNode = objectMapper.convertValue(actionConfiguration, JsonNode.class);

        Mono<Set<String>> refactorDynamicBindingsMono = Mono.just(new HashSet<>());

        // If there are dynamic bindings in this action configuration, inspect them
        if (actionDTO.getDynamicBindingPathList() != null && !actionDTO.getDynamicBindingPathList().isEmpty()) {
            // recurse over each child
            refactorDynamicBindingsMono = Flux.fromIterable(actionDTO.getDynamicBindingPathList())
                    .flatMap(dynamicBindingPath -> {
                        String key = dynamicBindingPath.getKey();
                        Set<String> mustacheValues = new HashSet<>();
                        if (PluginType.JS.equals(actionDTO.getPluginType()) && "body".equals(key)) {
                            mustacheValues.add(actionConfiguration.getBody());

                        } else {
                            mustacheValues = DslUtils.getMustacheValueSetFromSpecificDynamicBindingPath(actionConfigurationNode, key);
                        }
                        return this.replaceValueInMustacheKeys(mustacheValues, oldName, newName, evalVersion, oldNamePattern)
                                .flatMap(replacementMap -> {
                                    if (replacementMap.isEmpty()) {
                                        return Mono.empty();
                                    }
                                    DslUtils.replaceValuesInSpecificDynamicBindingPath(actionConfigurationNode, key, replacementMap);
                                    String entityPath = StringUtils.hasLength(actionDTO.getValidName()) ? actionDTO.getValidName() + "." : "";
                                    return Mono.just(entityPath + key);
                                });
                    })
                    .collect(Collectors.toSet())
                    .map(entityPaths -> {
                        actionDTO.setActionConfiguration(objectMapper.convertValue(actionConfigurationNode, ActionConfiguration.class));
                        return entityPaths;
                    });
        }

        return refactorDynamicBindingsMono;
    }

    Mono<Map<String, String>> replaceValueInMustacheKeys(Set<String> mustacheKeySet, String oldName, String
            newName, int evalVersion, Pattern oldNamePattern) {
        if (Boolean.TRUE.equals(this.isRtsAccessible)) {
            return astService.refactorNameInDynamicBindings(mustacheKeySet, oldName, newName, evalVersion);
        }
        return this.replaceValueInMustacheKeys(mustacheKeySet, oldNamePattern, newName);
    }

    Mono<Map<String, String>> replaceValueInMustacheKeys(Set<String> mustacheKeySet, Pattern
            oldNamePattern, String newName) {
        return Flux.fromIterable(mustacheKeySet)
                .flatMap(mustacheKey -> {
                    Matcher matcher = oldNamePattern.matcher(mustacheKey);
                    if (matcher.find()) {
                        return Mono.zip(Mono.just(mustacheKey), Mono.just(matcher.replaceAll(newName)));
                    }
                    return Mono.empty();
                })
                .collectMap(Tuple2::getT1, Tuple2::getT2);
    }
}

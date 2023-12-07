package com.appsmith.server.widgets.refactors;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.RefactoringMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DslUtils;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.refactors.entities.EntityRefactoringServiceCE;
import com.appsmith.server.services.AstService;
import com.appsmith.server.solutions.PagePermission;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import org.jetbrains.annotations.NotNull;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static com.appsmith.external.constants.AnalyticsEvents.REFACTOR_WIDGET;

@Slf4j
@RequiredArgsConstructor
public class WidgetRefactoringServiceCEImpl implements EntityRefactoringServiceCE<Layout> {

    private final NewPageService newPageService;
    private final AstService astService;
    private final ObjectMapper objectMapper;
    private final PagePermission pagePermission;

    @Override
    public AnalyticsEvents getRefactorAnalyticsEvent(EntityType entityType) {
        return REFACTOR_WIDGET;
    }

    @Override
    public Mono<Void> refactorReferencesInExistingEntities(
            RefactorEntityNameDTO refactorEntityNameDTO, RefactoringMetaDTO refactoringMetaDTO) {
        Mono<PageDTO> pageMono = refactoringMetaDTO.getPageDTOMono();
        Mono<Integer> evalVersionMono = refactoringMetaDTO.getEvalVersionMono();
        Set<String> updatedBindingPaths = refactoringMetaDTO.getUpdatedBindingPaths();
        Pattern oldNamePattern = refactoringMetaDTO.getOldNamePattern();

        String layoutId = refactorEntityNameDTO.getLayoutId();
        String oldName = refactorEntityNameDTO.getOldFullyQualifiedName();
        String newName = refactorEntityNameDTO.getNewFullyQualifiedName();

        Mono<PageDTO> pageDTOMono = Mono.zip(pageMono, evalVersionMono).flatMap(tuple -> {
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
                    Mono<PageDTO> refactorNameInDslMono = this.refactorNameInDsl(
                                    dslNode, oldName, newName, evalVersion, oldNamePattern)
                            .flatMap(dslBindingPaths -> {
                                updatedBindingPaths.addAll(dslBindingPaths);
                                layout.setDsl(objectMapper.convertValue(dslNode, JSONObject.class));
                                page.setLayouts(layouts);
                                refactoringMetaDTO.setUpdatedPage(page);
                                return Mono.just(page);
                            });

                    // Since the page has most probably changed, save the page and return.
                    return refactorNameInDslMono.flatMap(newPageService::saveUnpublishedPage);
                }
            }
            // If we have reached here, the layout was not found and the page should be returned as is.
            return Mono.just(page);
        });

        return pageDTOMono.then();
    }

    @Override
    public Mono<Void> updateRefactoredEntity(RefactorEntityNameDTO refactorEntityNameDTO, String branchName) {
        // Do nothing, DSL refactor will take care of this
        return Mono.empty().then();
    }

    @Override
    public Flux<String> getExistingEntityNames(String contextId, CreatorContextType contextType, String layoutId) {
        return newPageService
                // fetch the unpublished page
                .findPageById(contextId, pagePermission.getReadPermission(), false)
                .flatMapMany(page -> {
                    List<Layout> layouts = page.getLayouts();
                    for (Layout layout : layouts) {
                        if (layoutId.equals(layout.getId())) {
                            if (layout.getWidgetNames() != null
                                    && layout.getWidgetNames().size() > 0) {
                                return Flux.fromIterable(layout.getWidgetNames());
                            }
                            // In case of no widget names (which implies that there is no DSL), return an empty set.
                            return Flux.empty();
                        }
                    }
                    return Flux.error(
                            new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.LAYOUT_ID, layoutId));
                });
    }

    public Mono<Set<String>> refactorNameInDsl(
            JsonNode dsl, String oldName, String newName, int evalVersion, Pattern oldNamePattern) {

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

        return refactorNameInWidgetMono.zipWith(recursiveRefactorNameInDslMono).map(tuple -> {
            tuple.getT1().addAll(tuple.getT2());
            return tuple.getT1();
        });
    }

    Mono<Set<String>> refactorNameInWidget(
            JsonNode widgetDsl, String oldName, String newName, int evalVersion, Pattern oldNamePattern) {
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
        if (widgetDsl.has(FieldName.WIDGET_TYPE)
                && FieldName.LIST_WIDGET.equals(
                        widgetDsl.get(FieldName.WIDGET_TYPE).asText())) {
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
        if (widgetDsl.has(FieldName.DYNAMIC_BINDING_PATH_LIST)
                && !widgetDsl.get(FieldName.DYNAMIC_BINDING_PATH_LIST).isEmpty()) {
            ArrayNode dslDynamicBindingPathList = (ArrayNode) widgetDsl.get(FieldName.DYNAMIC_BINDING_PATH_LIST);
            // recurse over each child
            refactorDynamicBindingsMono = refactorBindingsUsingBindingPaths(
                    widgetDsl, oldName, newName, evalVersion, oldNamePattern, dslDynamicBindingPathList, widgetName);
        }

        // If there are dynamic triggers in this action configuration, inspect them
        if (widgetDsl.has(FieldName.DYNAMIC_TRIGGER_PATH_LIST)
                && !widgetDsl.get(FieldName.DYNAMIC_TRIGGER_PATH_LIST).isEmpty()) {
            ArrayNode dslDynamicTriggerPathList = (ArrayNode) widgetDsl.get(FieldName.DYNAMIC_TRIGGER_PATH_LIST);
            // recurse over each child
            refactorTriggerBindingsMono = refactorBindingsUsingBindingPaths(
                    widgetDsl, oldName, newName, evalVersion, oldNamePattern, dslDynamicTriggerPathList, widgetName);
        }

        final String finalWidgetNamePath = widgetName + ".widgetName";
        final boolean finalIsRefactoredWidget = isRefactoredWidget;
        final boolean finalIsRefactoredTemplate = isRefactoredTemplate;
        final String finalWidgetTemplatePath = widgetName + ".template";
        return refactorDynamicBindingsMono
                .zipWith(refactorTriggerBindingsMono)
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

    @NotNull private Mono<Set<String>> refactorBindingsUsingBindingPaths(
            JsonNode widgetDsl,
            String oldName,
            String newName,
            int evalVersion,
            Pattern oldNamePattern,
            ArrayNode bindingPathList,
            String widgetName) {
        Mono<Set<String>> refactorBindingsMono;
        refactorBindingsMono = Flux.fromStream(StreamSupport.stream(bindingPathList.spliterator(), true))
                .flatMap(bindingPath -> {
                    String key = bindingPath.get(FieldName.KEY).asText();
                    // This is inside a list widget, and the path starts with template.<oldName>.,
                    // We need to update the binding path list entry itself as well
                    if (widgetDsl.has(FieldName.WIDGET_TYPE)
                            && FieldName.LIST_WIDGET.equals(
                                    widgetDsl.get(FieldName.WIDGET_TYPE).asText())
                            && key.startsWith("template." + oldName + ".")) {
                        key = key.replace(oldName, newName);
                        ((ObjectNode) bindingPath).set(FieldName.KEY, new TextNode(key));
                    }
                    // Find values inside mustache bindings in this path
                    Set<MustacheBindingToken> mustacheValues =
                            DslUtils.getMustacheValueSetFromSpecificDynamicBindingPath(widgetDsl, key);
                    final String finalKey = key;
                    // Perform refactor for each mustache value
                    return astService
                            .replaceValueInMustacheKeys(mustacheValues, oldName, newName, evalVersion, oldNamePattern)
                            .flatMap(replacementMap -> {
                                if (replacementMap.isEmpty()) {
                                    // If the map is empty, it means that this path did not have anything that had to be
                                    // refactored
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
}

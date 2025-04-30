package com.appsmith.server.widgets.refactors;

import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.DslUtils;
import com.appsmith.server.services.AstService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Slf4j
@Component
@RequiredArgsConstructor
public class WidgetRefactorUtil {

    private final AstService astService;
    private final ObjectMapper objectMapper;

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

    public JsonNode convertDslStringToJsonNode(JSONObject dsl) {
        return objectMapper.convertValue(dsl, JsonNode.class);
    }

    public JSONObject convertDslStringToJSONObject(String dsl) {
        JSONParser jsonParser = new JSONParser();
        try {
            return (JSONObject) jsonParser.parse(dsl);
        } catch (ParseException exception) {
            log.error("Error parsing the page dsl for page: {}", exception.getMessage());
            throw new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR);
        }
    }

    public Set<String> extractWidgetNamesFromDsl(JsonNode dsl) {
        Set<String> widgetNames = new HashSet<>();
        extractWidgetNamesRecursive(dsl, widgetNames);
        return widgetNames;
    }

    private void extractWidgetNamesRecursive(JsonNode dsl, Set<String> widgetNames) {
        if (dsl == null) {
            return;
        }

        if (dsl.has(FieldName.WIDGET_NAME)) {
            widgetNames.add(dsl.get(FieldName.WIDGET_NAME).asText());
        }

        if (dsl.has("children")) {
            dsl.get("children").forEach(child -> extractWidgetNamesRecursive(child, widgetNames));
        }
    }
}

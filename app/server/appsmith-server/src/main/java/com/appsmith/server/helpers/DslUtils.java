package com.appsmith.server.helpers;

import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.server.constants.FieldName;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONObject;
import net.minidev.json.JSONValue;
import org.apache.commons.lang3.RandomStringUtils;

import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Slf4j
public class DslUtils {

    // The client-side widget id generator (see app/client/src/utils/generators.tsx) uses nanoid
    // with this alphabet and length. Matching the format here keeps cloned widget ids
    // indistinguishable from widgets created by the client.
    private static final char[] WIDGET_ID_ALPHABET = "1234567890abcdefghijklmnopqrstuvwxyz".toCharArray();
    private static final int WIDGET_ID_LENGTH = 10;

    // The root MainContainer widget has a fixed, well-known id of "0" on every page. It is
    // intentionally shared across pages (child widgets reference it via parentId = "0"), so we
    // leave it untouched when regenerating ids.
    private static final String MAIN_CONTAINER_WIDGET_ID = "0";

    /**
     * Generates a new widget id in the same format the client uses (10 char lowercase alphanumeric),
     * backed by a cryptographically strong random source.
     */
    public static String generateWidgetId() {
        return RandomStringUtils.secure().next(WIDGET_ID_LENGTH, WIDGET_ID_ALPHABET);
    }

    /**
     * Walks the given layout DSL tree and returns a deep copy with every widget id replaced by a
     * freshly generated one. Every string occurrence of an old id (e.g. parentId, widget-specific
     * id references) is rewritten to the new id, preserving the internal relationships of the DSL.
     * The root MainContainer id ("0") is preserved so that children continue to reference their
     * canvas correctly.
     *
     * <p>The input DSL is not mutated; a new tree is returned. If the DSL is null or empty, the
     * input is returned as-is.
     */
    public static JSONObject regenerateWidgetIds(JSONObject sourceDsl) {
        if (sourceDsl == null || sourceDsl.isEmpty()) {
            return sourceDsl;
        }

        JSONObject dsl = deepCopy(sourceDsl);
        Map<String, String> oldToNewWidgetIdMap = new HashMap<>();
        collectWidgetIds(dsl, oldToNewWidgetIdMap);

        if (oldToNewWidgetIdMap.isEmpty()) {
            return dsl;
        }

        rewriteWidgetIdReferences(dsl, oldToNewWidgetIdMap);
        return dsl;
    }

    private static void collectWidgetIds(JSONObject widget, Map<String, String> oldToNewWidgetIdMap) {
        Object widgetIdValue = widget.get(FieldName.WIDGET_ID);
        if (widgetIdValue instanceof String widgetId
                && !widgetId.isEmpty()
                && !MAIN_CONTAINER_WIDGET_ID.equals(widgetId)
                && !oldToNewWidgetIdMap.containsKey(widgetId)) {
            oldToNewWidgetIdMap.put(widgetId, generateWidgetId());
        }

        Object children = widget.get(FieldName.CHILDREN);
        if (children instanceof List<?> childrenList) {
            for (Object child : childrenList) {
                if (child instanceof JSONObject childObject) {
                    collectWidgetIds(childObject, oldToNewWidgetIdMap);
                }
            }
        }
    }

    @SuppressWarnings("unchecked")
    private static void rewriteWidgetIdReferences(Object node, Map<String, String> oldToNewWidgetIdMap) {
        if (node instanceof Map<?, ?> mapNode) {
            Map<String, Object> typedMap = (Map<String, Object>) mapNode;
            for (Map.Entry<String, Object> entry : typedMap.entrySet()) {
                Object value = entry.getValue();
                if (value instanceof String stringValue) {
                    String replacement = oldToNewWidgetIdMap.get(stringValue);
                    if (replacement != null) {
                        entry.setValue(replacement);
                    }
                } else {
                    rewriteWidgetIdReferences(value, oldToNewWidgetIdMap);
                }
            }
        } else if (node instanceof List<?> listNode) {
            List<Object> typedList = (List<Object>) listNode;
            for (int i = 0; i < typedList.size(); i++) {
                Object element = typedList.get(i);
                if (element instanceof String stringValue) {
                    String replacement = oldToNewWidgetIdMap.get(stringValue);
                    if (replacement != null) {
                        typedList.set(i, replacement);
                    }
                } else {
                    rewriteWidgetIdReferences(element, oldToNewWidgetIdMap);
                }
            }
        }
    }

    private static JSONObject deepCopy(JSONObject source) {
        Object parsed = JSONValue.parse(source.toJSONString());
        if (parsed instanceof JSONObject copied) {
            return copied;
        }
        // Should never happen for a well-formed DSL, but fall back to the source rather than crash.
        log.warn("Failed to deep copy DSL, parsed type was {}", parsed == null ? "null" : parsed.getClass());
        return source;
    }

    public static Set<MustacheBindingToken> getMustacheValueSetFromSpecificDynamicBindingPath(
            JsonNode dsl, String fieldPath) {

        DslNodeWalkResponse dslWalkResponse = getDslWalkResponse(dsl, fieldPath);

        // Only extract mustache keys from leaf nodes
        if (dslWalkResponse != null && dslWalkResponse.isLeafNode) {

            // We found the path. But if the path does not have any mustache bindings, return with empty set
            if (!MustacheHelper.laxIsBindingPresentInString(((TextNode) dslWalkResponse.currentNode).asText())) {
                return new HashSet<>();
            }

            // Stricter extraction of dynamic bindings
            Set<MustacheBindingToken> mustacheKeysFromFields =
                    MustacheHelper.extractMustacheKeysFromFields(((TextNode) dslWalkResponse.currentNode).asText());
            return mustacheKeysFromFields;
        }

        // This was not a text node, we do not know how to handle this
        return new HashSet<>();
    }

    public static JsonNode replaceValuesInSpecificDynamicBindingPath(
            JsonNode dsl, String fieldPath, Map<MustacheBindingToken, String> replacementMap) {
        DslNodeWalkResponse dslWalkResponse = getDslWalkResponse(dsl, fieldPath);

        if (dslWalkResponse != null && dslWalkResponse.isLeafNode) {
            final StringBuilder oldValue = new StringBuilder(((TextNode) dslWalkResponse.currentNode).asText());

            final List<MustacheBindingToken> tokens = replacementMap.keySet().stream()
                    .sorted((token1, token2) -> token2.getStartIndex() - token1.getStartIndex())
                    .toList();

            for (MustacheBindingToken mustacheBindingToken : tokens) {
                String tokenValue = mustacheBindingToken.getValue();
                int endIndex = mustacheBindingToken.getStartIndex() + tokenValue.length();
                if (oldValue.length() >= endIndex
                        && oldValue.subSequence(mustacheBindingToken.getStartIndex(), endIndex)
                                .equals(tokenValue)) {
                    oldValue.replace(
                            mustacheBindingToken.getStartIndex(), endIndex, replacementMap.get(mustacheBindingToken));
                }
            }

            ((ObjectNode) dslWalkResponse.parentNode)
                    .set(dslWalkResponse.currentKey, new TextNode(oldValue.toString()));
        }
        return dsl;
    }

    private static DslNodeWalkResponse getDslWalkResponse(JsonNode dsl, String fieldPath) {
        if (dsl == null) {
            return null;
        }
        String[] fields = fieldPath.split("[].\\[]");
        // For nested fields, the parent dsl to search in would shift by one level every iteration
        Object currentNode = dsl;
        Object parent = null;
        Iterator<String> fieldsIterator = Arrays.stream(fields)
                .filter(fieldToken -> !fieldToken.isBlank())
                .iterator();
        boolean isLeafNode = false;
        String nextKey = null;
        // This loop will end at either a leaf node, or the last identified JSON field (by throwing an exception)
        // Valid forms of the fieldPath for this search could be:
        // root.field.list[index].childField.anotherList.indexWithDotOperator.multidimensionalList[index1][index2]
        while (fieldsIterator.hasNext()) {
            nextKey = fieldsIterator.next();
            parent = currentNode;
            if (currentNode instanceof ArrayNode) {
                if (Pattern.matches(Pattern.compile("[0-9]+").toString(), nextKey)) {
                    try {
                        currentNode = ((ArrayNode) currentNode).get(Integer.parseInt(nextKey));
                    } catch (IndexOutOfBoundsException e) {
                        // The index being referred does not exist, hence the path would not exist.
                        return null;
                    }
                } else {
                    // This is an array but the fieldPath does not have an index to refer to
                    return null;
                }
            } else {
                currentNode = ((JsonNode) currentNode).get(nextKey);
            }
            // After updating the currentNode, check for the types
            if (currentNode == null) {
                return null;
            } else if (currentNode instanceof TextNode) {
                // If we get String value, then this is a leaf node
                isLeafNode = true;
                break;
            }
        }

        return new DslNodeWalkResponse(currentNode, parent, nextKey, isLeafNode);
    }

    @AllArgsConstructor
    private static class DslNodeWalkResponse {
        Object currentNode;
        Object parentNode;
        String currentKey;
        Boolean isLeafNode;
    }
}

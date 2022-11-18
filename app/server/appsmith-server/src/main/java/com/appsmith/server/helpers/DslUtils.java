package com.appsmith.server.helpers;

import com.appsmith.external.helpers.MustacheHelper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import lombok.AllArgsConstructor;
import org.apache.commons.lang3.StringUtils;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

public class DslUtils {

    public static Set<String> getMustacheValueSetFromSpecificDynamicBindingPath(JsonNode dsl, String fieldPath) {

        DslNodeWalkResponse dslWalkResponse = getDslWalkResponse(dsl, fieldPath);


        // Only extract mustache keys from leaf nodes
        if (dslWalkResponse != null && dslWalkResponse.isLeafNode) {

            // We found the path. But if the path does not have any mustache bindings, return with empty set
            if (!MustacheHelper.laxIsBindingPresentInString(((TextNode) dslWalkResponse.currentNode).asText())) {
                return new HashSet<>();
            }

            // Stricter extraction of dynamic bindings
            Set<String> mustacheKeysFromFields = MustacheHelper.extractMustacheKeysFromFields(((TextNode) dslWalkResponse.currentNode).asText());
            return mustacheKeysFromFields;
        }

        // This was not a text node, we do not know how to handle this
        return new HashSet<>();
    }

    public static JsonNode replaceValuesInSpecificDynamicBindingPath(JsonNode dsl, String fieldPath, Map<String, String> replacementMap) {
        DslNodeWalkResponse dslWalkResponse = getDslWalkResponse(dsl, fieldPath);

        if (dslWalkResponse != null && dslWalkResponse.isLeafNode) {
            final String oldValue = ((TextNode) dslWalkResponse.currentNode).asText();

            final String newValue = StringUtils.replaceEach(
                    oldValue,
                    replacementMap.keySet().toArray(new String[0]),
                    replacementMap.values().toArray(new String[0]));

            ((ObjectNode) dslWalkResponse.parentNode).set(dslWalkResponse.currentKey, new TextNode(newValue));
        }
        return dsl;
    }

    private static DslNodeWalkResponse getDslWalkResponse(JsonNode dsl, String fieldPath) {
        String[] fields = fieldPath.split("[].\\[]");
        // For nested fields, the parent dsl to search in would shift by one level every iteration
        Object currentNode = dsl;
        Object parent = null;
        Iterator<String> fieldsIterator = Arrays.stream(fields).filter(fieldToken -> !fieldToken.isBlank()).iterator();
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

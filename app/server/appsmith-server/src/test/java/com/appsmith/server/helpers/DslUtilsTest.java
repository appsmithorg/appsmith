package com.appsmith.server.helpers;

import com.appsmith.external.models.MustacheBindingToken;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

class DslUtilsTest {

    @Test
    void getMustacheValueSetFromSpecificDynamicBindingPath_withNullOrEmptyDsl_returnsEmptySet() {
        Set<MustacheBindingToken> tokensInNullDsl =
                DslUtils.getMustacheValueSetFromSpecificDynamicBindingPath(null, "irrelevantPath");
        Set<MustacheBindingToken> tokensInEmptyDsl =
                DslUtils.getMustacheValueSetFromSpecificDynamicBindingPath(new TextNode(""), "irrelevantPath");

        Assertions.assertThat(tokensInNullDsl).isEmpty();
        Assertions.assertThat(tokensInEmptyDsl).isEmpty();
    }

    @Test
    void getMustacheValueSetFromSpecificDynamicBindingPath_withComplicatedPathAndMultipleBindings_parsesDslCorrectly()
            throws JsonProcessingException {
        String fieldPath = "root.field.list[0].childField.anotherList.0.multidimensionalList[0][0]";
        String jsonString = "{ " + "\"root\": { "
                + "  \"field\": { "
                + "    \"list\": [ "
                + "        { "
                + "          \"childField\": { "
                + "            \"anotherList\": [ "
                + "              { "
                + "                \"multidimensionalList\" : [ "
                + "                  [\"{{ retrievedBinding1.text }} {{ retrievedBinding2.text }}\"]"
                + "                ] "
                + "              } "
                + "            ] "
                + "          } "
                + "        } "
                + "      ] "
                + "    } "
                + "  } "
                + "}";

        ObjectMapper mapper = new ObjectMapper();
        JsonNode dsl = mapper.readTree(jsonString);

        Set<MustacheBindingToken> tokens = DslUtils.getMustacheValueSetFromSpecificDynamicBindingPath(dsl, fieldPath);

        Assertions.assertThat(tokens)
                .containsExactlyInAnyOrder(
                        new MustacheBindingToken(" retrievedBinding1.text ", 2, false),
                        new MustacheBindingToken(" retrievedBinding2.text ", 31, false));
    }

    @Test
    void replaceValuesInSpecificDynamicBindingPath_whenFieldPathNotFound() {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode dsl = mapper.createObjectNode();
        dsl.put("fieldKey", "fieldValue");
        JsonNode replacedDsl =
                DslUtils.replaceValuesInSpecificDynamicBindingPath(dsl, "nonExistentPath", new HashMap<>());
        Assertions.assertThat(replacedDsl).isEqualTo(dsl);
    }

    @Test
    void replaceValuesInSpecificDynamicBindingPath_whenReplacementKeyNotFound() {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode dsl = mapper.createObjectNode();
        dsl.put("existingPath", "fieldValue");
        HashMap<MustacheBindingToken, String> replacementMap = new HashMap<>();
        replacementMap.put(new MustacheBindingToken("nonExistentBinding", 0, false), "newNonExistentBinding");
        JsonNode replacedDsl = DslUtils.replaceValuesInSpecificDynamicBindingPath(dsl, "existingPath", replacementMap);
        ObjectNode newDsl = mapper.createObjectNode();
        newDsl.put("existingPath", "fieldValue");
        Assertions.assertThat(replacedDsl).isEqualTo(newDsl);
    }

    @Test
    void replaceValuesInSpecificDynamicBindingPath_withSuccessfulMultipleReplacements() {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode dsl = mapper.createObjectNode();
        dsl.put("existingPath", "oldFieldValue1 oldFieldValue2 oldFieldValue1 oldFieldValue2");
        HashMap<MustacheBindingToken, String> replacementMap = new HashMap<>();
        replacementMap.put(new MustacheBindingToken("oldFieldValue1", 0, false), "newishFieldValue1");
        replacementMap.put(new MustacheBindingToken("oldFieldValue2", 15, false), "newerFieldValue2");
        replacementMap.put(new MustacheBindingToken("oldFieldValue1", 30, false), "newishFieldValue1");
        replacementMap.put(new MustacheBindingToken("oldFieldValue2", 45, false), "newerFieldValue2");
        JsonNode replacedDsl = DslUtils.replaceValuesInSpecificDynamicBindingPath(dsl, "existingPath", replacementMap);
        Assertions.assertThat(replacedDsl.get("existingPath").asText())
                .isEqualTo("newishFieldValue1 newerFieldValue2 newishFieldValue1 newerFieldValue2");
    }

    @Test
    void generateWidgetId_producesTenCharLowercaseAlphanumericIds() {
        String widgetId = DslUtils.generateWidgetId();
        Assertions.assertThat(widgetId).hasSize(10).matches("[0-9a-z]{10}");
    }

    @Test
    void generateWidgetId_producesDistinctIdsAcrossCalls() {
        Set<String> generatedIds = new HashSet<>();
        for (int i = 0; i < 1000; i++) {
            generatedIds.add(DslUtils.generateWidgetId());
        }
        // With a 36^10 space, 1000 calls should never collide in practice.
        Assertions.assertThat(generatedIds).hasSize(1000);
    }

    @Test
    void regenerateWidgetIds_withNullOrEmptyDsl_returnsInputAsIs() {
        Assertions.assertThat(DslUtils.regenerateWidgetIds(null)).isNull();
        JSONObject empty = new JSONObject();
        Assertions.assertThat(DslUtils.regenerateWidgetIds(empty)).isSameAs(empty);
    }

    @Test
    void regenerateWidgetIds_preservesMainContainerIdAndRegeneratesChildIds() {
        JSONObject child = new JSONObject();
        child.put("widgetId", "childWidgetId1");
        child.put("widgetName", "Button1");
        child.put("parentId", "0");

        JSONArray children = new JSONArray();
        children.add(child);

        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "0");
        dsl.put("widgetName", "MainContainer");
        dsl.put("children", children);

        JSONObject regenerated = DslUtils.regenerateWidgetIds(dsl);

        // MainContainer id is preserved
        Assertions.assertThat(regenerated.get("widgetId")).isEqualTo("0");
        Assertions.assertThat(regenerated.get("widgetName")).isEqualTo("MainContainer");

        // Child widget id is regenerated, but the parentId reference to MainContainer is preserved
        List<?> regeneratedChildren = (List<?>) regenerated.get("children");
        Assertions.assertThat(regeneratedChildren).hasSize(1);
        JSONObject regeneratedChild = (JSONObject) regeneratedChildren.get(0);
        Assertions.assertThat(regeneratedChild.get("widgetId"))
                .isNotEqualTo("childWidgetId1")
                .asString()
                .matches("[0-9a-z]{10}");
        Assertions.assertThat(regeneratedChild.get("widgetName")).isEqualTo("Button1");
        Assertions.assertThat(regeneratedChild.get("parentId")).isEqualTo("0");
    }

    @Test
    void regenerateWidgetIds_rewritesAllInternalReferencesConsistently() {
        // Build: MainContainer -> Container (parent) -> Button (child of Container).
        JSONObject button = new JSONObject();
        button.put("widgetId", "buttonOldId");
        button.put("widgetName", "Button1");
        button.put("parentId", "containerOldId");

        JSONArray containerChildren = new JSONArray();
        containerChildren.add(button);

        JSONObject container = new JSONObject();
        container.put("widgetId", "containerOldId");
        container.put("widgetName", "Container1");
        container.put("parentId", "0");
        container.put("children", containerChildren);
        // Widget-specific id reference (e.g. List widget's mainCanvasId) must also be rewritten.
        container.put("mainCanvasId", "buttonOldId");

        JSONArray rootChildren = new JSONArray();
        rootChildren.add(container);

        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "0");
        dsl.put("widgetName", "MainContainer");
        dsl.put("children", rootChildren);

        JSONObject regenerated = DslUtils.regenerateWidgetIds(dsl);

        JSONObject regeneratedContainer = (JSONObject) ((List<?>) regenerated.get("children")).get(0);
        JSONObject regeneratedButton = (JSONObject) ((List<?>) regeneratedContainer.get("children")).get(0);

        String newContainerId = (String) regeneratedContainer.get("widgetId");
        String newButtonId = (String) regeneratedButton.get("widgetId");

        Assertions.assertThat(newContainerId).isNotEqualTo("containerOldId").matches("[0-9a-z]{10}");
        Assertions.assertThat(newButtonId).isNotEqualTo("buttonOldId").matches("[0-9a-z]{10}");
        // Container keeps its parent (MainContainer) reference.
        Assertions.assertThat(regeneratedContainer.get("parentId")).isEqualTo("0");
        // Button's parent reference has been rewritten to the new container id.
        Assertions.assertThat(regeneratedButton.get("parentId")).isEqualTo(newContainerId);
        // Arbitrary widget-specific references are rewritten to the new button id.
        Assertions.assertThat(regeneratedContainer.get("mainCanvasId")).isEqualTo(newButtonId);
    }

    @Test
    void regenerateWidgetIds_doesNotMutateSourceDsl() {
        JSONObject child = new JSONObject();
        child.put("widgetId", "originalChildId");
        child.put("widgetName", "Button1");

        JSONArray children = new JSONArray();
        children.add(child);

        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "originalRootId");
        dsl.put("widgetName", "Canvas1");
        dsl.put("children", children);

        JSONObject regenerated = DslUtils.regenerateWidgetIds(dsl);

        Assertions.assertThat(regenerated).isNotSameAs(dsl);
        // Source DSL widget ids are untouched.
        Assertions.assertThat(dsl.get("widgetId")).isEqualTo("originalRootId");
        JSONObject originalChild = (JSONObject) ((List<?>) dsl.get("children")).get(0);
        Assertions.assertThat(originalChild.get("widgetId")).isEqualTo("originalChildId");
        // Regenerated DSL has different widget ids.
        Assertions.assertThat(regenerated.get("widgetId")).isNotEqualTo("originalRootId");
    }

    @Test
    void regenerateWidgetIds_producesNoDuplicateIdsAcrossTree() {
        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "0");
        dsl.put("widgetName", "MainContainer");

        JSONArray children = new JSONArray();
        for (int i = 0; i < 20; i++) {
            JSONObject child = new JSONObject();
            child.put("widgetId", "child" + i);
            child.put("widgetName", "Widget" + i);
            child.put("parentId", "0");
            children.add(child);
        }
        dsl.put("children", children);

        JSONObject regenerated = DslUtils.regenerateWidgetIds(dsl);

        Set<String> ids = new HashSet<>();
        ids.add((String) regenerated.get("widgetId"));
        for (Object child : (List<?>) regenerated.get("children")) {
            ids.add((String) ((JSONObject) child).get("widgetId"));
        }
        // 1 MainContainer + 20 distinct child ids.
        Assertions.assertThat(ids).hasSize(21);
    }

    @Test
    void regenerateWidgetIds_doesNotRewriteNonIdReferenceFieldsThatMatchAWidgetId() {
        // Guard against false-positive rewrites: if a non-id field (e.g. widgetName, user text
        // content, dynamic binding paths) happens to contain the same string as a widget id,
        // the rewriter must leave it alone.
        JSONObject child = new JSONObject();
        child.put("widgetId", "Table1");
        // widgetName deliberately shares the same value as the widgetId (as Appsmith's
        // PageServiceTest fixtures do). It must survive the regeneration unchanged.
        child.put("widgetName", "Table1");
        child.put("parentId", "0");
        // A plain text field whose content happens to equal the widget id must also survive.
        child.put("text", "Table1");
        // Dynamic binding path lists reference property names (e.g. "primaryColumns._id"),
        // never widget ids. They must survive untouched even if a path fragment matches.
        JSONArray bindingPaths = new JSONArray();
        JSONObject pathEntry = new JSONObject();
        pathEntry.put("key", "Table1");
        bindingPaths.add(pathEntry);
        child.put("dynamicBindingPathList", bindingPaths);

        JSONArray children = new JSONArray();
        children.add(child);

        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "0");
        dsl.put("widgetName", "MainContainer");
        dsl.put("children", children);

        JSONObject regenerated = DslUtils.regenerateWidgetIds(dsl);

        JSONObject regeneratedChild = (JSONObject) ((List<?>) regenerated.get("children")).get(0);
        String newWidgetId = (String) regeneratedChild.get("widgetId");

        Assertions.assertThat(newWidgetId).isNotEqualTo("Table1").matches("[0-9a-z]{10}");
        Assertions.assertThat(regeneratedChild.get("widgetName")).isEqualTo("Table1");
        Assertions.assertThat(regeneratedChild.get("text")).isEqualTo("Table1");
        Assertions.assertThat(regeneratedChild.get("parentId")).isEqualTo("0");
        JSONObject regeneratedPathEntry =
                (JSONObject) ((List<?>) regeneratedChild.get("dynamicBindingPathList")).get(0);
        Assertions.assertThat(regeneratedPathEntry.get("key")).isEqualTo("Table1");
    }

    @Test
    void regenerateWidgetIds_emptyChildrenArray_regeneratesRootId() {
        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "rootOldId");
        dsl.put("widgetName", "Canvas1");
        dsl.put("children", new ArrayList<>());

        JSONObject regenerated = DslUtils.regenerateWidgetIds(dsl);

        Assertions.assertThat(regenerated.get("widgetId"))
                .isNotEqualTo("rootOldId")
                .asString()
                .matches("[0-9a-z]{10}");
    }
}

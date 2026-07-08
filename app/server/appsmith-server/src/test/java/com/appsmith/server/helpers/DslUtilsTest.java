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
import java.util.Map;
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
    void regenerateWidgetIds_withNullDsl_returnsNullDslAndEmptyMapping() {
        WidgetIdRegenerationResult result = DslUtils.regenerateWidgetIds(null);
        Assertions.assertThat(result.dsl()).isNull();
        Assertions.assertThat(result.oldToNewWidgetIds()).isEmpty();
    }

    @Test
    void regenerateWidgetIds_withEmptyDsl_returnsInputDslAndEmptyMapping() {
        JSONObject empty = new JSONObject();
        WidgetIdRegenerationResult result = DslUtils.regenerateWidgetIds(empty);
        Assertions.assertThat(result.dsl()).isSameAs(empty);
        Assertions.assertThat(result.oldToNewWidgetIds()).isEmpty();
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

        JSONObject regenerated = DslUtils.regenerateWidgetIds(dsl).dsl();

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

        JSONObject regenerated = DslUtils.regenerateWidgetIds(dsl).dsl();

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

        JSONObject regenerated = DslUtils.regenerateWidgetIds(dsl).dsl();

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

        JSONObject regenerated = DslUtils.regenerateWidgetIds(dsl).dsl();

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

        JSONObject regenerated = DslUtils.regenerateWidgetIds(dsl).dsl();

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
    void regenerateWidgetIds_regeneratesIdsInsideListWidgetTemplate() {
        // List widgets keep their per-row widget definitions under "template" (a Map of widget
        // name -> widget JSONObject) rather than under "children". The regenerator must walk
        // into "template" too, otherwise the template widget ids are left untouched and would
        // collide with the originals when the page is cloned.
        JSONObject templateImage = new JSONObject();
        templateImage.put("widgetId", "templateImageOldId");
        templateImage.put("widgetName", "Image1");
        templateImage.put("type", "IMAGE_WIDGET");
        templateImage.put("parentId", "listOldId");

        JSONObject template = new JSONObject();
        template.put("Image1", templateImage);

        JSONObject listWidget = new JSONObject();
        listWidget.put("widgetId", "listOldId");
        listWidget.put("widgetName", "List1");
        listWidget.put("type", "LIST_WIDGET");
        listWidget.put("parentId", "0");
        listWidget.put("template", template);
        // List widgets also keep a "mainCanvasId" pointing at the canvas that hosts the
        // template instance. It must be rewritten consistently with the template widget id
        // (here we point it at the template widget itself for the sake of the test).
        listWidget.put("mainCanvasId", "templateImageOldId");
        listWidget.put("children", new JSONArray());

        JSONArray rootChildren = new JSONArray();
        rootChildren.add(listWidget);

        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "0");
        dsl.put("widgetName", "MainContainer");
        dsl.put("children", rootChildren);

        JSONObject regenerated = DslUtils.regenerateWidgetIds(dsl).dsl();

        JSONObject regeneratedList = (JSONObject) ((List<?>) regenerated.get("children")).get(0);
        JSONObject regeneratedTemplate = (JSONObject) regeneratedList.get("template");
        JSONObject regeneratedTemplateImage = (JSONObject) regeneratedTemplate.get("Image1");

        String newListId = (String) regeneratedList.get("widgetId");
        String newTemplateImageId = (String) regeneratedTemplateImage.get("widgetId");

        Assertions.assertThat(newListId).isNotEqualTo("listOldId").matches("[0-9a-z]{10}");
        Assertions.assertThat(newTemplateImageId)
                .isNotEqualTo("templateImageOldId")
                .matches("[0-9a-z]{10}");
        // Template widget keeps its parent (List) reference, rewritten to the new List id.
        Assertions.assertThat(regeneratedTemplateImage.get("parentId")).isEqualTo(newListId);
        // The List's mainCanvasId reference is rewritten to the new template widget id.
        Assertions.assertThat(regeneratedList.get("mainCanvasId")).isEqualTo(newTemplateImageId);
    }

    @Test
    void regenerateWidgetIds_emptyChildrenArray_regeneratesRootId() {
        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "rootOldId");
        dsl.put("widgetName", "Canvas1");
        dsl.put("children", new ArrayList<>());

        JSONObject regenerated = DslUtils.regenerateWidgetIds(dsl).dsl();

        Assertions.assertThat(regenerated.get("widgetId"))
                .isNotEqualTo("rootOldId")
                .asString()
                .matches("[0-9a-z]{10}");
    }

    // ---------------------------------------------------------------------
    // Tests covering the oldId -> newId mapping that the regenerator returns.
    // These exist because the mapping is the contract the regenerator now
    // advertises to callers (e.g. sibling cloners that hold widget id
    // references outside the DSL like ModuleInstance.widgetId), so it
    // deserves its own test coverage independent of the DSL rewrite.
    // ---------------------------------------------------------------------

    @Test
    void regenerateWidgetIds_returnsMappingFromEveryRegeneratedSourceIdToItsNewId() {
        // Build: MainContainer -> Container -> Button.
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

        JSONArray rootChildren = new JSONArray();
        rootChildren.add(container);

        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "0");
        dsl.put("widgetName", "MainContainer");
        dsl.put("children", rootChildren);

        WidgetIdRegenerationResult result = DslUtils.regenerateWidgetIds(dsl);

        JSONObject regeneratedContainer = (JSONObject) ((List<?>) result.dsl().get("children")).get(0);
        JSONObject regeneratedButton = (JSONObject) ((List<?>) regeneratedContainer.get("children")).get(0);

        String newContainerId = (String) regeneratedContainer.get("widgetId");
        String newButtonId = (String) regeneratedButton.get("widgetId");

        // Every regenerated source widget id appears in the mapping, pointing at the new
        // id the rewriter actually used inside the DSL. The MainContainer id ("0") is
        // intentionally never remapped, so it must not appear in the mapping.
        Assertions.assertThat(result.oldToNewWidgetIds())
                .hasSize(2)
                .containsEntry("containerOldId", newContainerId)
                .containsEntry("buttonOldId", newButtonId)
                .doesNotContainKey("0");
    }

    @Test
    void regenerateWidgetIds_returnsEmptyMappingForDslWithOnlyMainContainer() {
        // MainContainer is the only widget that is never remapped, so a DSL that contains
        // nothing else should yield an empty mapping while still returning a regenerated
        // (deep-copied) DSL.
        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "0");
        dsl.put("widgetName", "MainContainer");
        dsl.put("children", new JSONArray());

        WidgetIdRegenerationResult result = DslUtils.regenerateWidgetIds(dsl);

        Assertions.assertThat(result.oldToNewWidgetIds()).isEmpty();
        Assertions.assertThat(result.dsl().get("widgetId")).isEqualTo("0");
    }

    @Test
    void regenerateWidgetIds_resultMappingIsImmutable() {
        // The mapping is shared between the regenerator and any downstream cloner that
        // reads it; preventing accidental mutation rules out a class of bugs where one
        // consumer silently changes what another consumer sees.
        JSONObject child = new JSONObject();
        child.put("widgetId", "childOldId");
        child.put("widgetName", "Button1");
        child.put("parentId", "0");

        JSONArray children = new JSONArray();
        children.add(child);

        JSONObject dsl = new JSONObject();
        dsl.put("widgetId", "0");
        dsl.put("widgetName", "MainContainer");
        dsl.put("children", children);

        WidgetIdRegenerationResult result = DslUtils.regenerateWidgetIds(dsl);

        Assertions.assertThatThrownBy(() -> result.oldToNewWidgetIds().put("intruder", "value"))
                .isInstanceOf(UnsupportedOperationException.class);
        Assertions.assertThatThrownBy(() -> result.oldToNewWidgetIds().clear())
                .isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void regenerateWidgetIds_callerCanAccumulateMappingsAcrossMultipleInvocations() {
        // This documents the call-site pattern used by ApplicationPageServiceCEImpl when a
        // page has multiple layouts: the caller maintains one mutable mapping and putAll-s
        // each invocation's result into it. The result mapping itself is immutable per the
        // previous test; the caller's accumulator is not.
        Map<String, String> accumulated = new HashMap<>();

        JSONObject layoutAChild = new JSONObject();
        layoutAChild.put("widgetId", "layoutAOldId");
        layoutAChild.put("widgetName", "Button1");
        layoutAChild.put("parentId", "0");
        JSONArray layoutAChildren = new JSONArray();
        layoutAChildren.add(layoutAChild);
        JSONObject layoutADsl = new JSONObject();
        layoutADsl.put("widgetId", "0");
        layoutADsl.put("widgetName", "MainContainer");
        layoutADsl.put("children", layoutAChildren);

        JSONObject layoutBChild = new JSONObject();
        layoutBChild.put("widgetId", "layoutBOldId");
        layoutBChild.put("widgetName", "Text1");
        layoutBChild.put("parentId", "0");
        JSONArray layoutBChildren = new JSONArray();
        layoutBChildren.add(layoutBChild);
        JSONObject layoutBDsl = new JSONObject();
        layoutBDsl.put("widgetId", "0");
        layoutBDsl.put("widgetName", "MainContainer");
        layoutBDsl.put("children", layoutBChildren);

        accumulated.putAll(DslUtils.regenerateWidgetIds(layoutADsl).oldToNewWidgetIds());
        accumulated.putAll(DslUtils.regenerateWidgetIds(layoutBDsl).oldToNewWidgetIds());

        Assertions.assertThat(accumulated).containsKeys("layoutAOldId", "layoutBOldId");
        Assertions.assertThat(accumulated.get("layoutAOldId")).matches("[0-9a-z]{10}");
        Assertions.assertThat(accumulated.get("layoutBOldId")).matches("[0-9a-z]{10}");
    }
}

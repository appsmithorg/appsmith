package com.appsmith.server.helpers;

import com.appsmith.external.models.MustacheBindingToken;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Set;

class DslUtilsTest {

    @Test
    void getMustacheValueSetFromSpecificDynamicBindingPath_withNullOrEmptyDsl_returnsEmptySet() {
        Set<MustacheBindingToken> tokensInNullDsl = DslUtils.getMustacheValueSetFromSpecificDynamicBindingPath(null, "irrelevantPath");
        Set<MustacheBindingToken> tokensInEmptyDsl = DslUtils.getMustacheValueSetFromSpecificDynamicBindingPath(new TextNode(""), "irrelevantPath");

        Assertions.assertThat(tokensInNullDsl).isEmpty();
        Assertions.assertThat(tokensInEmptyDsl).isEmpty();
    }

    @Test
    void getMustacheValueSetFromSpecificDynamicBindingPath_withComplicatedPathAndMultipleBindings_parsesDslCorrectly() throws JsonProcessingException {
        String fieldPath = "root.field.list[0].childField.anotherList.0.multidimensionalList[0][0]";
        String jsonString = "{ " +
                "\"root\": { " +
                "  \"field\": { " +
                "    \"list\": [ " +
                "        { " +
                "          \"childField\": { " +
                "            \"anotherList\": [ " +
                "              { " +
                "                \"multidimensionalList\" : [ " +
                "                  [\"{{ retrievedBinding1.text }} {{ retrievedBinding2.text }}\"]" +
                "                ] " +
                "              } " +
                "            ] " +
                "          } " +
                "        } " +
                "      ] " +
                "    } " +
                "  } " +
                "}";

        ObjectMapper mapper = new ObjectMapper();
        JsonNode dsl = mapper.readTree(jsonString);

        Set<MustacheBindingToken> tokens = DslUtils.getMustacheValueSetFromSpecificDynamicBindingPath(dsl, fieldPath);

        Assertions.assertThat(tokens).containsExactlyInAnyOrder(
                new MustacheBindingToken(" retrievedBinding1.text ", 2, false),
                new MustacheBindingToken(" retrievedBinding2.text ", 31, false));
    }

    @Test
    void replaceValuesInSpecificDynamicBindingPath_whenFieldPathNotFound() {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode dsl = mapper.createObjectNode();
        dsl.put("fieldKey", "fieldValue");
        JsonNode replacedDsl = DslUtils.replaceValuesInSpecificDynamicBindingPath(dsl, "nonExistentPath", new HashMap<>());
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
        dsl.put("existingPath", "oldFieldValue1 oldFieldValue2");
        HashMap<MustacheBindingToken, String> replacementMap = new HashMap<>();
        replacementMap.put(new MustacheBindingToken("oldFieldValue1", 0, false), "newFieldValue1");
        replacementMap.put(new MustacheBindingToken("oldFieldValue2", 15, false), "newFieldValue2");
        JsonNode replacedDsl = DslUtils.replaceValuesInSpecificDynamicBindingPath(dsl, "existingPath", replacementMap);
        ObjectNode newDsl = mapper.createObjectNode();
        newDsl.put("existingPath", "newFieldValue1 newFieldValue2");
        Assertions.assertThat(replacedDsl).isEqualTo(dsl);
    }
}
package com.appsmith.external.helpers;

import com.appsmith.external.constants.ConditionalOperator;
import com.appsmith.external.models.Condition;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Assert;
import org.junit.Test;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.OBJECT_TYPE;
import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.parseWhereClause;
import static org.assertj.core.api.Assertions.assertThat;

public class PluginUtilsTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    public void parseWhereClauseTest() {
        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [\n" +
                "      {\n" +
                "        \"key\": \"i\",\n" +
                "        \"condition\": \"GTE\",\n" +
                "        \"value\": \"u\"\n" +
                "      },\n" +
                "      {\n" +
                "        \"condition\": \"AND\",\n" +
                "        \"children\": [\n" +
                "          {\n" +
                "            \"key\": \"d\",\n" +
                "            \"condition\": \"LTE\",\n" +
                "            \"value\": \"w\"\n" +
                "          },\n" +
                "          {\n" +
                "            \"condition\": \"AND\",\n" +
                "            \"children\": [\n" +
                "              {\n" +
                "                \"key\": \"a\",\n" +
                "                \"condition\": \"LTE\",\n" +
                "                \"value\": \"s\"\n" +
                "              }\n" +
                "            ]\n" +
                "          }\n" +
                "        ]\n" +
                "      },\n" +
                "      {\n" +
                "        \"condition\": \"AND\",\n" +
                "        \"children\": [\n" +
                "          {\n" +
                "            \"key\": \"u\",\n" +
                "            \"condition\": \"LTE\",\n" +
                "            \"value\": \"me\"\n" +
                "          }\n" +
                "        ]\n" +
                "      }\n" +
                "    ],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";
        try {
            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            assertThat(condition.getOperator()).isEqualTo(ConditionalOperator.AND);
            Object conditionValue = condition.getValue();
            assertThat(conditionValue).isNotNull();
            assertThat(conditionValue).isInstanceOf(List.class);
            List<Condition> conditionList = (List<Condition>) conditionValue;
            assertThat(conditionList).hasSize(3);
            for (Condition conditionFromChildren : conditionList) {
                ConditionalOperator operator = conditionFromChildren.getOperator();
                assertThat(operator).isNotNull();

                String path = conditionFromChildren.getPath();
                Object value = conditionFromChildren.getValue();
                if (operator.equals(ConditionalOperator.AND)) {
                    assertThat(path).isNull();
                    assertThat(value).isInstanceOf(List.class);
                } else {
                    assertThat(path).isNotNull();
                    assertThat(value).isInstanceOf(String.class);
                }
            }

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Test
    public void parseWhereClauseEmptyChildrenArrayTest() {
        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";
        try {
            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            assertThat(condition.getOperator()).isEqualTo(ConditionalOperator.AND);
            Object conditionValue = condition.getValue();
            assertThat(conditionValue).isNull();

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testGetDataValueAsTypeFromFormData_withFormMode_doesNotConvertToList() {
        final Map<String, Object> dataMap = Map.of("key", Map.of("viewType", "component",
                "data", "[\"value\"]"));

        try {
            PluginUtils.getDataValueSafelyFromFormData(dataMap, "key", new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            Assert.assertTrue(e instanceof ClassCastException);
        }
    }

    @Test
    public void testGetDataValueAsTypeFromFormData_withFormMode_doesNotConvert() {
        final Map<String, Object> dataMap = Map.of("key", Map.of("viewType", "component",
                "data", "[\"value\"]"));

        final String data = PluginUtils.getDataValueSafelyFromFormData(dataMap, "key", STRING_TYPE);

        Assert.assertEquals("[\"value\"]", data);
    }

    @Test
    public void testGetDataValueAsTypeFromFormData_withJsonMode_doesConvertToList() {
        final Map<String, Object> dataMap = Map.of("key", Map.of("viewType", "json",
                "data", "[\"value\"]"));

        final List<String> data = PluginUtils.getDataValueSafelyFromFormData(dataMap, "key", new TypeReference<List<String>>() {
        });

        Assert.assertEquals(List.of("value"), data);
    }

    @Test
    public void testGetDataValueAsTypeFromFormData_withJsonMode_doesConvertToObject() {
        final Map<String, Object> dataMap = Map.of("key", Map.of("viewType", "json",
                "data", "[\"value\"]"));

        final Object data = PluginUtils.getDataValueSafelyFromFormData(dataMap, "key", OBJECT_TYPE);

        Assert.assertEquals(List.of("value"), data);
    }

    @Test
    public void testGetDataValueAsTypeFromFormData_withJsonMode_doesConvertToMap() {
        final Map<String, Object> dataMap = Map.of("key", Map.of("viewType", "json",
                "data", "{\"k\":\"value\"}"));

        final Map<String, String> data = PluginUtils.getDataValueSafelyFromFormData(dataMap, "key", new TypeReference<Map<String, String>>() {
        });

        Assert.assertEquals(Map.of("k", "value"), data);
    }

    @Test
    public void testSetDataValueSafelyInFormData_withNestedPath_createsInnermostDataKey() {
        final Map<String, Object> dataMap = new HashMap<>();

        PluginUtils.setDataValueSafelyInFormData(dataMap, "key.innerKey", "value");

        Assert.assertEquals(Map.of("key", Map.of("innerKey", Map.of("data", "value"))), dataMap);
    }
}

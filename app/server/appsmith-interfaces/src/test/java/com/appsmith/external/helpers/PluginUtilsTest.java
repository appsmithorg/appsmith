package com.appsmith.external.helpers;

import com.appsmith.external.constants.ConditionalOperator;
import com.appsmith.external.models.Condition;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

            assertThat(condition.getOperator().equals(ConditionalOperator.AND));
            Object conditionValue = condition.getValue();
            assertThat(conditionValue).isNotNull();
            assertThat(conditionValue instanceof List);
            List<Condition> conditionList = (List<Condition>) conditionValue;
            assertThat(conditionList.size()).isEqualTo(3);
            for (Condition conditionFromChildren : conditionList) {
                ConditionalOperator operator = conditionFromChildren.getOperator();
                assertThat(operator).isNotNull();

                String path = conditionFromChildren.getPath();
                Object value = conditionFromChildren.getValue();
                if (operator.equals(ConditionalOperator.AND)) {
                    assertThat(path).isNull();
                    assertThat(value instanceof List);
                } else {
                    assertThat(path).isNotNull();
                    assertThat(value instanceof String);
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

            assertThat(condition.getOperator().equals(ConditionalOperator.AND));
            Object conditionValue = condition.getValue();
            assertThat(conditionValue).isNotNull();
            assertThat(conditionValue instanceof List);
            List<Condition> conditionList = (List<Condition>) conditionValue;
            assertThat(conditionList.size()).isEqualTo(0);

        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}

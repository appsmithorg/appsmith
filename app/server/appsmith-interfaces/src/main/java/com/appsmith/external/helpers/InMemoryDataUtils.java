package com.appsmith.external.helpers;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.models.ConditionalOperator;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.helpers.DataTypeStringUtils.stringToKnownDataTypeConverter;
import static com.appsmith.external.helpers.DataUtils.compareBooleans;
import static com.appsmith.external.helpers.DataUtils.compareNumbers;
import static com.appsmith.external.helpers.DataUtils.compareStrings;
import static com.appsmith.external.helpers.InMemoryDataUtils.Condition.generateConditionList;

@Slf4j
public class InMemoryDataUtils {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static final Set NumberDataTypes = Set.of(DataType.INTEGER, DataType.FLOAT, DataType.DOUBLE, DataType.LONG, DataType.BINARY);
    private static final Set StringDataTypes = Set.of(DataType.STRING, DataType.NULL);

    public static ArrayNode filter(ArrayNode items, List<Object> conditionList) {

        if (items == null || items.size() == 0) {
            return items;
        }

        if (!validConditionList(conditionList)) {
            return items; // or throw an exception
        }

        List<Condition> conditions = generateConditionList(conditionList);

        ArrayNode postFilteredList = objectMapper.createArrayNode();

        for (JsonNode item : items) {
            Boolean passesCondition = Boolean.TRUE;
            for (Condition condition : conditions) {

                String path = condition.getPath();
                ConditionalOperator operator = condition.getOperator();
                String value = condition.getValue();
                DataType valueDataType = condition.getValueDataType();

                JsonNode itemNode = item;

                String[] fieldNames = path.split("\\.");
                for (String field : fieldNames) {
                    itemNode = itemNode.get(field);
                }

                String itemValue = itemNode.asText();

                if (NumberDataTypes.contains(valueDataType)) {
                    passesCondition = compareNumbers(itemValue, value, operator);
                } else if (StringDataTypes.contains(valueDataType)) {
                    passesCondition = compareStrings(itemValue, value, operator);
                } else if (valueDataType.equals(DataType.BOOLEAN)) {
                    passesCondition = compareBooleans(itemValue, value, operator);
                }
                // Other data types are unhandled. We would not filter on the basis of those conditions
                // Either error out here or don't do filtering
                // TODO !!

                // Since this is a simple AND, if passesCondition is false, don't check other conditions
                if (!passesCondition) {
                    break;
                }
            }
            if (passesCondition) {
                postFilteredList.add(item);
            }
        }

        return postFilteredList;

    }

    public static boolean validConditionList(List<Object> conditionList) {
        for (Object condition : conditionList) {
            String path = ((Map<String, String>) condition).get("path");
            String operatorString = ((Map<String, String>) condition).get("operator");
            String value = ((Map<String, String>) condition).get("value");

            if (StringUtils.isEmpty(path) || StringUtils.isEmpty(operatorString) || StringUtils.isEmpty(value)) {
                return false;
            }
        }

        return true;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    public static class Condition {
        String path;
        ConditionalOperator operator;
        String value;
        DataType valueDataType;

        public static List<Condition> generateConditionList(List<Object> conditionList) {

            List<Condition> conditions = new ArrayList<>();

            for (Object condition : conditionList) {
                String path = ((Map<String, String>) condition).get("path");
                ConditionalOperator operator = ConditionalOperator.valueOf(((Map<String, String>) condition).get("operator"));
                String value = ((Map<String, String>) condition).get("value");
                DataType dataType = stringToKnownDataTypeConverter(value);

                conditions.add(new Condition(path, operator, value, dataType));
            }

            return conditions;
        }
    }
}

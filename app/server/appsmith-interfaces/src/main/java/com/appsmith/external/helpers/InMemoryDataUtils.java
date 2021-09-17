package com.appsmith.external.helpers;

import com.appsmith.external.models.ConditionalOperator;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;

import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.DataTypeStringUtils.castToDataType;

@Slf4j
public class InMemoryDataUtils {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static ArrayNode filter(ArrayNode items, List<Object> conditionList) {

        if (items == null || items.size() == 0) {
            return items;
        }

        if (!validConditionList(conditionList)) {
            return items; // or throw an exception
        }

        ArrayNode postFilteredList = objectMapper.createArrayNode();

        for (JsonNode item : items) {
            Boolean passesCondition = Boolean.FALSE;
            for(Object condition : conditionList) {

                String path = (String) ((Map<String, Object>) condition).get("path");
                ConditionalOperator operatorString = (ConditionalOperator) ((Map<String, Object>) condition).get("operator");
                Object value = castToDataType((String) ((Map<String, Object>) condition).get("value"));

                JsonNode itemNode = item;

                String[] fieldNames = path.split("\\.");
                for (String field : fieldNames) {
                    itemNode = itemNode.get(field);
                }

                Object itemValue = castToDataType(itemNode.asText());

            }

        }

        return postFilteredList;

    }

    public static boolean validConditionList(List<Object> conditionList) {
        for(Object condition : conditionList) {
            String path = ((Map<String, String>) condition).get("path");
            String operatorString = ((Map<String, String>) condition).get("operator");
            String value = ((Map<String, String>) condition).get("value");

            if (StringUtils.isEmpty(path) || StringUtils.isEmpty(operatorString) || StringUtils.isEmpty(value)) {
                return false;
            }
        }

        return true;
    }

//    private static Boolean passesCondition (Object sourceValue, Object destinationValue, ConditionalOperator operator) {
//        switch (operator) {
//            case LT:
//                return sourceValue < destinationValue ? Boolean.TRUE : Boolean.FALSE;
//                break;
//            case LTE:
//                break;
//            case EQ:
//                break;
//            case NOT_EQ:
//                break;
//            case GT:
//                break;
//            case GTE:
//                break;
//            case ARRAY_CONTAINS:
//                // unsupported
//                break;
//            case IN:
//                break;
//            case ARRAY_CONTAINS_ANY:
//                // unsupported
//                break;
//            case NOT_IN:
//                break;
//
//        }
//    }
}

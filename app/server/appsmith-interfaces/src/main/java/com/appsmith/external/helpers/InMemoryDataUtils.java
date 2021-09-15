package com.appsmith.external.helpers;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.List;
import java.util.Map;

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

                String path = ((Map<String, String>) condition).get("path");
                String operatorString = ((Map<String, String>) condition).get("operator");
                String value = ((Map<String, String>) condition).get("value");

                JsonNode jsonNode = item.get(path);


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
}

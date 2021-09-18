package com.appsmith.external.helpers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.junit.Test;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
public class InMemoryDataUtilsTest{

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    public void testFilter() {
        String data = "[\n" +
                "  {\n" +
                "    \"id\": 2381224,\n" +
                "    \"email\": \"michael.lawson@reqres.in\",\n" +
                "    \"userName\": \"Michael Lawson\",\n" +
                "    \"productName\": \"Chicken Sandwich\",\n" +
                "    \"orderAmount\": 4.99,\n" +
                "    \"orderStatus\": \"READY\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": 2736212,\n" +
                "    \"email\": \"lindsay.ferguson@reqres.in\",\n" +
                "    \"userName\": \"Lindsay Ferguson\",\n" +
                "    \"productName\": \"Tuna Salad\",\n" +
                "    \"orderAmount\": 9.99,\n" +
                "    \"orderStatus\": \"READY\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": 6788734,\n" +
                "    \"email\": \"tobias.funke@reqres.in\",\n" +
                "    \"userName\": \"Tobias Funke\",\n" +
                "    \"productName\": \"Beef steak\",\n" +
                "    \"orderAmount\": 19.99,\n" +
                "    \"orderStatus\": \"READY\"\n" +
                "  }\n" +
                "]";

        try {

            JSONArray itemArray = new JSONArray(data);

            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            List<Object> conditionList = new ArrayList<>();

            Map<String, String> condition = new HashMap<>();
            condition.put("path", "orderAmount");
            condition.put("operator", "LT");
            condition.put("value", "15");
            conditionList.add(condition);

            Map<String, String> condition1 = new HashMap<>();
            condition1.put("path", "orderStatus");
            condition1.put("operator", "EQ");
            condition1.put("value", "READY");
            conditionList.add(condition1);

            ArrayNode filteredData = InMemoryDataUtils.filter(items, conditionList);
            log.debug("filtered data : {}", filteredData);



        } catch (IOException e) {
            e.printStackTrace();
        }
    }

}
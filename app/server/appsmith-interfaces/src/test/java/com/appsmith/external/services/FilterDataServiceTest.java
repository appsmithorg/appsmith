package com.appsmith.external.services;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.models.Condition;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.junit.Test;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.Assert.assertEquals;

public class FilterDataServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final FilterDataService filterDataService = FilterDataService.getInstance();

    @Test
    public void testGenerateTable() {
        Map<String, DataType> schema = Map.of(
                "id", DataType.INTEGER,
                "name", DataType.STRING,
                "status", DataType.BOOLEAN
        );

        String table = filterDataService.generateTable(schema);

        assertThat(table).isNotNull();
    }

    @Test
    public void testFilterSingleCondition() {
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
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            List<Condition> conditionList = new ArrayList<>();

            Condition condition = new Condition("orderAmount", "LT", "15");
            conditionList.add(condition);

            ArrayNode filteredData = filterDataService.filterData(items, conditionList);

            assertEquals(filteredData.size(), 2);


        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testFilterMultipleConditions() {
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
                "    \"orderStatus\": \"NOT READY\"\n" +
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
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            List<Condition> conditionList = new ArrayList<>();

            Condition condition = new Condition("orderAmount", "LT", "15");
            conditionList.add(condition);

            Condition condition1 = new Condition("orderStatus", "EQ", "READY");
            conditionList.add(condition1);

            ArrayNode filteredData = filterDataService.filterData(items, conditionList);

            assertEquals(filteredData.size(), 1);


        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testFilterInConditionForStrings() {
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
                "    \"orderStatus\": \"NOT READY\"\n" +
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
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            List<Condition> conditionList = new ArrayList<>();

            Condition condition = new Condition("orderAmount", "LT", "15");
            conditionList.add(condition);

            Condition condition1 = new Condition("orderStatus", "IN", "[\"READY\", \"NOT READY\"]");
            conditionList.add(condition1);

            ArrayNode filteredData = filterDataService.filterData(items, conditionList);

            assertEquals(filteredData.size(), 2);


        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testFilterInConditionForNumbers() {
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
                "    \"orderStatus\": \"NOT READY\"\n" +
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
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            List<Condition> conditionList = new ArrayList<>();

            Condition condition = new Condition("orderAmount", "LT", "15");
            conditionList.add(condition);

            Condition condition1 = new Condition("orderAmount", "IN", "[4.99, 19.99]");
            conditionList.add(condition1);

            ArrayNode filteredData = filterDataService.filterData(items, conditionList);

            assertEquals(filteredData.size(), 1);


        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testFilterNotInConditionForNumbers() {
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
                "    \"orderStatus\": \"NOT READY\"\n" +
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
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            List<Condition> conditionList = new ArrayList<>();

            Condition condition = new Condition("orderAmount", "LT", "15");
            conditionList.add(condition);

            Condition condition1 = new Condition("orderAmount", "NOT_IN", "[5.99, 19.00]");
            conditionList.add(condition1);

            ArrayNode filteredData = filterDataService.filterData(items, conditionList);

            assertEquals(filteredData.size(), 2);


        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testMultiWordColumnNames() {
        String data = "[\n" +
                "  {\n" +
                "    \"id\": 2381224,\n" +
                "    \"email id\": \"michael.lawson@reqres.in\",\n" +
                "    \"userName\": \"Michael Lawson\",\n" +
                "    \"productName\": \"Chicken Sandwich\",\n" +
                "    \"orderAmount\": 4.99,\n" +
                "    \"orderStatus\": \"READY\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": 2736212,\n" +
                "    \"email id\": \"lindsay.ferguson@reqres.in\",\n" +
                "    \"userName\": \"Lindsay Ferguson\",\n" +
                "    \"productName\": \"Tuna Salad\",\n" +
                "    \"orderAmount\": 9.99,\n" +
                "    \"orderStatus\": \"READY\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": 6788734,\n" +
                "    \"email id\": \"tobias.funke@reqres.in\",\n" +
                "    \"userName\": \"Tobias Funke\",\n" +
                "    \"productName\": \"Beef steak\",\n" +
                "    \"orderAmount\": 19.99,\n" +
                "    \"orderStatus\": \"READY\"\n" +
                "  }\n" +
                "]";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            List<Condition> conditionList = new ArrayList<>();

            Condition condition = new Condition("orderAmount", "LT", "15");
            conditionList.add(condition);

            ArrayNode filteredData = filterDataService.filterData(items, conditionList);

            assertEquals(filteredData.size(), 2);

            Iterator<String> fieldNamesIterator = filteredData.get(0).fieldNames();

            List<String> columnNames = Stream.generate(() -> null)
                    .takeWhile(x -> fieldNamesIterator.hasNext())
                    .map(n -> fieldNamesIterator.next())
                    .collect(Collectors.toList());

            assertThat(columnNames.containsAll(List.of("id", "email id", "userName", "productName", "orderAmount", "orderStatus")));


        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testEmptyValuesInSomeColumns() {
        String data = "[\n" +
                "  {\n" +
                "    \"id\": 2381224,\n" +
                "    \"email id\": \"michael.lawson@reqres.in\",\n" +
                "    \"userName\": \"Michael Lawson\",\n" +
                "    \"productName\": \"Chicken Sandwich\",\n" +
                "    \"orderAmount\": 4.99,\n" +
                "    \"orderStatus\": \"READY\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Lindsay Ferguson\",\n" +
                "    \"productName\": \"Tuna Salad\",\n" +
                "    \"orderAmount\": 9.99,\n" +
                "    \"orderStatus\": \"READY\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Tobias Funke\",\n" +
                "    \"productName\": \"Beef steak\",\n" +
                "    \"orderAmount\": 19.99,\n" +
                "    \"orderStatus\": \"READY\"\n" +
                "  }\n" +
                "]";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            List<Condition> conditionList = new ArrayList<>();

            Condition condition = new Condition("orderAmount", "LT", "15");
            conditionList.add(condition);

            ArrayNode filteredData = filterDataService.filterData(items, conditionList);

            assertEquals(filteredData.size(), 2);


        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}

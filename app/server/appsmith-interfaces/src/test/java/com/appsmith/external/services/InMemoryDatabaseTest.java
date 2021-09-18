package com.appsmith.external.services;

import com.appsmith.external.constants.DataType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.junit.Test;

import java.io.IOException;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.services.InMemoryDatabase.fetchAll;
import static com.appsmith.external.services.InMemoryDatabase.filterData;
import static com.appsmith.external.services.InMemoryDatabase.generateTable;
import static com.appsmith.external.services.InMemoryDatabase.insertData;
import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.Assert.assertEquals;

public class InMemoryDatabaseTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    public void testGenerateTable() throws SQLException {
        Map<String, DataType> schema = Map.of(
                "id", DataType.INTEGER,
                "name", DataType.STRING,
                "status", DataType.BOOLEAN
        );

        String table = generateTable(schema);

        assertThat(table).isNotNull();
    }

    @Test
    public void testInsertDataIntoTable() throws SQLException, IOException {

        String data = "[\n" +
                "  {\n" +
                "    \"id\": 2381224,\n" +
                "    \"userName\": \"Michael Lawson\",\n" +
                "    \"orderAmount\": 4.99\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": 2736212,\n" +
                "    \"userName\": \"Lindsay Ferguson\",\n" +
                "    \"orderAmount\": 9.99\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": 6788734,\n" +
                "    \"userName\": \"Tobias Funke\",\n" +
                "    \"orderAmount\": 19.99\n" +
                "  }\n" +
                "]";

        ArrayNode items = (ArrayNode) objectMapper.readTree(data);

        Map<String, DataType> schema = Map.of(
                "id", DataType.INTEGER,
                "userName", DataType.STRING,
                "orderAmount", DataType.FLOAT
        );

        String table = generateTable(schema);

        insertData(table, items, schema);

        fetchAll(table);

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

            List<Object> conditionList = new ArrayList<>();

            Map<String, String> condition = new HashMap<>();
            condition.put("path", "orderAmount");
            condition.put("operator", "LT");
            condition.put("value", "15");
            conditionList.add(condition);

            ArrayNode filteredData = filterData(items, conditionList);

            assertEquals(filteredData.size(), 2);


        } catch (IOException | SQLException e) {
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

            ArrayNode filteredData = filterData(items, conditionList);

            assertEquals(filteredData.size(), 1);


        } catch (IOException | SQLException e) {
            e.printStackTrace();
        }
    }
}

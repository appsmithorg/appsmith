package com.appsmith.external.services;

import com.appsmith.external.constants.ConditionalOperator;
import com.appsmith.external.constants.DataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Condition;
import com.appsmith.external.models.UQIDataFilterParams;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.junit.Assert;
import org.junit.Test;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.external.helpers.PluginUtils.parseWhereClause;
import static com.appsmith.external.services.ce.FilterDataServiceCE.PAGINATE_LIMIT_KEY;
import static com.appsmith.external.services.ce.FilterDataServiceCE.PAGINATE_OFFSET_KEY;
import static com.appsmith.external.services.ce.FilterDataServiceCE.SORT_BY_COLUMN_NAME_KEY;
import static com.appsmith.external.services.ce.FilterDataServiceCE.SORT_BY_TYPE_KEY;
import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;

public class FilterDataServiceTest {

    public static final String VALUE_DESCENDING = "Descending";

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
            Assert.fail(e.getMessage());
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
                "    \"anotherKey\": 20,\n" +
                "    \"orderStatus\": \"READY\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": 2736212,\n" +
                "    \"email\": \"lindsay.ferguson@reqres.in\",\n" +
                "    \"userName\": \"Lindsay Ferguson\",\n" +
                "    \"productName\": \"Tuna Salad\",\n" +
                "    \"orderAmount\": 9.99,\n" +
                "    \"anotherKey\": 12,\n" +
                "    \"orderStatus\": \"NOT READY\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": 6788734,\n" +
                "    \"email\": \"tobias.funke@reqres.in\",\n" +
                "    \"userName\": \"Tobias Funke\",\n" +
                "    \"productName\": \"Beef steak\",\n" +
                "    \"orderAmount\": 19.99,\n" +
                "    \"anotherKey\": 20,\n" +
                "    \"orderStatus\": \"READY\"\n" +
                "  }\n" +
                "]";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            List<Condition> conditionList = new ArrayList<>();

            Condition condition = new Condition("orderAmount", "LT", "15");
            conditionList.add(condition);

            Condition condition1 = new Condition("anotherKey", "GT", "15");
            conditionList.add(condition1);


            Condition condition2 = new Condition("orderStatus", "EQ", "READY");
            conditionList.add(condition2);

            ArrayNode filteredData = filterDataService.filterData(items, conditionList);

            assertEquals(filteredData.size(), 1);


        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
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
            Assert.fail(e.getMessage());
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
            Assert.fail(e.getMessage());
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
            Assert.fail(e.getMessage());
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
            Assert.fail(e.getMessage());
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
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testValuesOfUnsupportedDataType() {
        String data = "[\n" +
                "  {\n" +
                "    \"id\": 2381224,\n" +
                "    \"email id\": \"michael.lawson@reqres.in\",\n" +
                "    \"userName\": \"Michael Lawson\",\n" +
                "    \"productName\": \"Chicken Sandwich\",\n" +
                "    \"orderAmount\": 4.99,\n" +
                "    \"date\": \"2021-09-01\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Lindsay Ferguson\",\n" +
                "    \"productName\": \"Tuna Salad\",\n" +
                "    \"orderAmount\": 9.99,\n" +
                "    \"date\": \"2021-09-01\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Tobias Funke\",\n" +
                "    \"productName\": \"Beef steak\",\n" +
                "    \"orderAmount\": 19.99,\n" +
                "    \"date\": \"2021-09-01\"\n" +
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
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testFilterData_withTimestampClause_returnsCorrectValues() {
        String data = "[\n" +
                "  {\n" +
                "    \"id\": 2381224,\n" +
                "    \"email id\": \"michael.lawson@reqres.in\",\n" +
                "    \"userName\": \"Michael Lawson\",\n" +
                "    \"productName\": \"Chicken Sandwich\",\n" +
                "    \"orderAmount\": 4.99,\n" +
                "    \"date\": \"2021-09-01 00:01:00\",\n" +
                "    \"datetime\": \"2021-09-01T00:01:00.000Z\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Lindsay Ferguson\",\n" +
                "    \"productName\": \"Tuna Salad\",\n" +
                "    \"orderAmount\": 9.99,\n" +
                "    \"date\": \"2021-09-02 00:02:00\",\n" +
                "    \"datetime\": \"2021-09-01T00:01:00.000Z\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Tobias Funke\",\n" +
                "    \"productName\": \"Beef steak\",\n" +
                "    \"orderAmount\": 19.99,\n" +
                "    \"date\": \"2021-09-03 00:03:00\",\n" +
                "    \"datetime\": \"2021-09-01T00:01:00.000Z\"\n" +
                "  }\n" +
                "]";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            List<Condition> conditionList = new ArrayList<>();

            Condition condition = new Condition("date", "GTE", "2021-09-02 00:02:00");
            conditionList.add(condition);

            ArrayNode filteredData = filterDataService.filterData(items, conditionList);

            assertEquals(2, filteredData.size());


        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void generateLogicalOperatorTest() {

        String data = "[\n" +
                "  {\n" +
                "    \"id\": 2381224,\n" +
                "    \"email id\": \"michael.lawson@reqres.in\",\n" +
                "    \"userName\": \"Michael Lawson\",\n" +
                "    \"productName\": \"Chicken Sandwich\",\n" +
                "    \"orderAmount\": 4.99,\n" +
                "    \"date\": \"2021-09-01\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Lindsay Ferguson\",\n" +
                "    \"productName\": \"Tuna Salad\",\n" +
                "    \"orderAmount\": 9.99,\n" +
                "    \"date\": \"2021-09-01\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Tobias Funke\",\n" +
                "    \"productName\": \"Beef steak\",\n" +
                "    \"orderAmount\": 19.99,\n" +
                "    \"date\": \"2021-09-01\"\n" +
                "  }\n" +
                "]";

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

            ArrayNode items = (ArrayNode) objectMapper.readTree(data);
            Map<String, DataType> schema = filterDataService.generateSchema(items);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            ConditionalOperator operator = condition.getOperator();
            List<Condition> conditions = (List<Condition>) condition.getValue();

            String expression = filterDataService.generateLogicalExpression(conditions, new ArrayList<>(), schema, operator);
            assertThat(expression.equals("( \"i\" >= ? )  and (  ( \"d\" <= ? )  and (  ( \"a\" <= ? )  )  )  and (  ( \"u\" <= ? )  ) "));

        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testFilterSingleConditionWithWhereJson() {
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

        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [\n" +
                "      {\n" +
                "        \"key\": \"orderAmount\",\n" +
                "        \"condition\": \"LT\",\n" +
                "        \"value\": \"15\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            ArrayNode filteredData = filterDataService.filterDataNew(items, new UQIDataFilterParams(condition, null,
                    null, null));

            assertEquals(filteredData.size(), 2);

        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testFilterMultipleConditionsNew() {
        String data = "[\n" +
                "  {\n" +
                "    \"id\": 2381224,\n" +
                "    \"email\": \"michael.lawson@reqres.in\",\n" +
                "    \"userName\": \"Michael Lawson\",\n" +
                "    \"productName\": \"Chicken Sandwich\",\n" +
                "    \"orderAmount\": 4.99,\n" +
                "    \"anotherKey\": 20,\n" +
                "    \"orderStatus\": \"READY\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": 2736212,\n" +
                "    \"email\": \"lindsay.ferguson@reqres.in\",\n" +
                "    \"userName\": \"Lindsay Ferguson\",\n" +
                "    \"productName\": \"Tuna Salad\",\n" +
                "    \"orderAmount\": 9.99,\n" +
                "    \"anotherKey\": 12,\n" +
                "    \"orderStatus\": \"NOT READY\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": 6788734,\n" +
                "    \"email\": \"tobias.funke@reqres.in\",\n" +
                "    \"userName\": \"Tobias Funke\",\n" +
                "    \"productName\": \"Beef steak\",\n" +
                "    \"orderAmount\": 19.99,\n" +
                "    \"anotherKey\": 20,\n" +
                "    \"orderStatus\": \"READY\"\n" +
                "  }\n" +
                "]";

        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [\n" +
                "      {\n" +
                "        \"key\": \"orderAmount\",\n" +
                "        \"condition\": \"LT\",\n" +
                "        \"value\": \"15\"\n" +
                "      },\n" +
                "      {\n" +
                "        \"key\": \"anotherKey\",\n" +
                "        \"condition\": \"GT\",\n" +
                "        \"value\": \"15\"\n" +
                "      },\n" +
                "      {\n" +
                "        \"key\": \"orderStatus\",\n" +
                "        \"condition\": \"EQ\",\n" +
                "        \"value\": \"READY\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            ArrayNode filteredData = filterDataService.filterDataNew(items, new UQIDataFilterParams(condition, null,
                    null, null));

            assertEquals(filteredData.size(), 1);


        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testFilterInConditionForStringsNew() {
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

        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [\n" +
                "      {\n" +
                "        \"key\": \"orderAmount\",\n" +
                "        \"condition\": \"LT\",\n" +
                "        \"value\": \"15\"\n" +
                "      },\n" +
                "      {\n" +
                "        \"key\": \"orderStatus\",\n" +
                "        \"condition\": \"IN\",\n" +
                "        \"value\": \"[\\\"READY\\\", \\\"NOT READY\\\"]\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            ArrayNode filteredData = filterDataService.filterDataNew(items, new UQIDataFilterParams(condition, null,
                    null, null));

            assertEquals(filteredData.size(), 2);


        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testFilterInConditionForNumbersNew() {
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

        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [\n" +
                "      {\n" +
                "        \"key\": \"orderAmount\",\n" +
                "        \"condition\": \"LT\",\n" +
                "        \"value\": \"15\"\n" +
                "      },\n" +
                "      {\n" +
                "        \"key\": \"orderAmount\",\n" +
                "        \"condition\": \"IN\",\n" +
                "        \"value\": \"[4.99, 19.99]\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            ArrayNode filteredData = filterDataService.filterDataNew(items, new UQIDataFilterParams(condition, null,
                    null, null));

            assertEquals(filteredData.size(), 1);

        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testFilterNotInConditionForNumbersNew() {
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

        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [\n" +
                "      {\n" +
                "        \"key\": \"orderAmount\",\n" +
                "        \"condition\": \"LT\",\n" +
                "        \"value\": \"15\"\n" +
                "      },\n" +
                "      {\n" +
                "        \"key\": \"orderAmount\",\n" +
                "        \"condition\": \"NOT_IN\",\n" +
                "        \"value\": \"[5.99, 19.00]\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            ArrayNode filteredData = filterDataService.filterDataNew(items, new UQIDataFilterParams(condition, null,
                    null, null));

            assertEquals(filteredData.size(), 2);


        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testMultiWordColumnNamesNew() {
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

        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [\n" +
                "      {\n" +
                "        \"key\": \"orderAmount\",\n" +
                "        \"condition\": \"LT\",\n" +
                "        \"value\": \"15\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            ArrayNode filteredData = filterDataService.filterDataNew(items, new UQIDataFilterParams(condition, null,
                    null, null));

            assertEquals(filteredData.size(), 2);

            Iterator<String> fieldNamesIterator = filteredData.get(0).fieldNames();

            List<String> columnNames = Stream.generate(() -> null)
                    .takeWhile(x -> fieldNamesIterator.hasNext())
                    .map(n -> fieldNamesIterator.next())
                    .collect(Collectors.toList());

            assertThat(columnNames.containsAll(List.of("id", "email id", "userName", "productName", "orderAmount", "orderStatus")));


        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testEmptyValuesInSomeColumnsNew() {
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

        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [\n" +
                "      {\n" +
                "        \"key\": \"orderAmount\",\n" +
                "        \"condition\": \"LT\",\n" +
                "        \"value\": \"15\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            ArrayNode filteredData = filterDataService.filterDataNew(items, new UQIDataFilterParams(condition, null,
                    null, null));

            assertEquals(filteredData.size(), 2);


        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testValuesOfUnsupportedDataTypeNew() {
        String data = "[\n" +
                "  {\n" +
                "    \"id\": 2381224,\n" +
                "    \"email id\": \"michael.lawson@reqres.in\",\n" +
                "    \"userName\": \"Michael Lawson\",\n" +
                "    \"productName\": \"Chicken Sandwich\",\n" +
                "    \"orderAmount\": 4.99,\n" +
                "    \"date\": \"2021-09-01\",\n" +
                "    \"datetime\": \"2021-09-01T00:01:00.000Z\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Lindsay Ferguson\",\n" +
                "    \"productName\": \"Tuna Salad\",\n" +
                "    \"orderAmount\": 9.99,\n" +
                "    \"date\": \"2021-09-01\",\n" +
                "    \"datetime\": \"2021-09-01T00:01:00.000Z\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Tobias Funke\",\n" +
                "    \"productName\": \"Beef steak\",\n" +
                "    \"orderAmount\": 19.99,\n" +
                "    \"date\": \"2021-09-01\",\n" +
                "    \"datetime\": \"2021-09-01T00:01:00.000Z\"\n" +
                "  }\n" +
                "]";

        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [\n" +
                "      {\n" +
                "        \"key\": \"orderAmount\",\n" +
                "        \"condition\": \"LT\",\n" +
                "        \"value\": \"15\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            ArrayNode filteredData = filterDataService.filterDataNew(items, new UQIDataFilterParams(condition, null,
                    null, null));

            assertEquals(filteredData.size(), 2);


        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testConditionTypeMismatch() {
        String data = "[\n" +
                "  {\n" +
                "    \"id\": 2381224,\n" +
                "    \"email id\": \"michael.lawson@reqres.in\",\n" +
                "    \"userName\": \"Michael Lawson\",\n" +
                "    \"productName\": \"Chicken Sandwich\",\n" +
                "    \"orderAmount\": 4.99,\n" +
                "    \"date\": \"2021-09-01\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Lindsay Ferguson\",\n" +
                "    \"productName\": \"Tuna Salad\",\n" +
                "    \"orderAmount\": 9.99,\n" +
                "    \"date\": \"2021-09-01\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Tobias Funke\",\n" +
                "    \"productName\": \"Beef steak\",\n" +
                "    \"orderAmount\": 19.99,\n" +
                "    \"date\": \"2021-09-01\"\n" +
                "  }\n" +
                "]";

        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [\n" +
                "      {\n" +
                "        \"key\": \"orderAmount\",\n" +
                "        \"condition\": \"LT\",\n" +
                "        \"value\": \"String here where number is expected\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            // Since the data type expected for orderAmount is float, but the value given is String, assert exception
            assertThrows(AppsmithPluginException.class,
                    () -> filterDataService.filterDataNew(items, new UQIDataFilterParams(condition, null, null, null)));

        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testEmptyConditions() {
        String data = "[\n" +
                "  {\n" +
                "    \"id\": 2381224,\n" +
                "    \"email id\": \"michael.lawson@reqres.in\",\n" +
                "    \"userName\": \"Michael Lawson\",\n" +
                "    \"productName\": \"Chicken Sandwich\",\n" +
                "    \"orderAmount\": 4.99,\n" +
                "    \"date\": \"2021-09-01\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Lindsay Ferguson\",\n" +
                "    \"productName\": \"Tuna Salad\",\n" +
                "    \"orderAmount\": 9.99,\n" +
                "    \"date\": \"2021-09-01\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Tobias Funke\",\n" +
                "    \"productName\": \"Beef steak\",\n" +
                "    \"orderAmount\": 19.99,\n" +
                "    \"date\": \"2021-09-01\"\n" +
                "  }\n" +
                "]";

        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            ArrayNode filteredData = filterDataService.filterDataNew(items, new UQIDataFilterParams(condition, null,
                    null, null));

            assertEquals(filteredData.size(), 3);

        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testConditionNullValueMatch() {
        String data = "[\n" +
                "  {\n" +
                "    \"id\": 2381224,\n" +
                "    \"email id\": \"michael.lawson@reqres.in\",\n" +
                "    \"userName\": \"Michael Lawson\",\n" +
                "    \"productName\": \"Chicken Sandwich\",\n" +
                "    \"orderAmount\": 4.99,\n" +
                "    \"date\": \"2021-09-01\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Lindsay Ferguson\",\n" +
                "    \"productName\": \"Tuna Salad\",\n" +
                "    \"orderAmount\": 9.99,\n" +
                "    \"date\": \"2021-09-01\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Tobias Funke\",\n" +
                "    \"productName\": \"Beef steak\",\n" +
                "    \"orderAmount\": 19.99,\n" +
                "    \"date\": \"2021-09-01\"\n" +
                "  }\n" +
                "]";

        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [\n" +
                "      {\n" +
                "        \"key\": \"orderAmount\",\n" +
                "        \"condition\": \"EQ\",\n" +
                "        \"value\": \"null\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            ArrayNode filteredData = filterDataService.filterDataNew(items, new UQIDataFilterParams(condition, null,
                    null, null));

            // Since there are no null orderAmounts, the filtered data would be empty.
            assertEquals(filteredData.size(), 0);

        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testDateCondition() {
        String data = "[\n" +
                "  {\n" +
                "    \"id\": 2381224,\n" +
                "    \"email id\": \"michael.lawson@reqres.in\",\n" +
                "    \"userName\": \"Michael Lawson\",\n" +
                "    \"productName\": \"Chicken Sandwich\",\n" +
                "    \"orderAmount\": 4.99,\n" +
                "    \"date\": \"2021-09-01\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Lindsay Ferguson\",\n" +
                "    \"productName\": \"Tuna Salad\",\n" +
                "    \"orderAmount\": 9.99,\n" +
                "    \"date\": \"2021-09-02\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Tobias Funke\",\n" +
                "    \"productName\": \"Beef steak\",\n" +
                "    \"orderAmount\": 19.99,\n" +
                "    \"date\": \"2021-09-03\"\n" +
                "  }\n" +
                "]";

        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [\n" +
                "      {\n" +
                "        \"key\": \"date\",\n" +
                "        \"condition\": \"GTE\",\n" +
                "        \"value\": \"2021-09-02\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            ArrayNode filteredData = filterDataService.filterDataNew(items, new UQIDataFilterParams(condition, null,
                    null, null));

            assertEquals(filteredData.size(), 2);

        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testFilterDataNew_withTimestampClause_returnsCorrectValues() {
        String data = "[\n" +
                "  {\n" +
                "    \"id\": 2381224,\n" +
                "    \"email id\": \"michael.lawson@reqres.in\",\n" +
                "    \"userName\": \"Michael Lawson\",\n" +
                "    \"productName\": \"Chicken Sandwich\",\n" +
                "    \"orderAmount\": 4.99,\n" +
                "    \"date\": \"2021-09-01 00:01:00\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Lindsay Ferguson\",\n" +
                "    \"productName\": \"Tuna Salad\",\n" +
                "    \"orderAmount\": 9.99,\n" +
                "    \"date\": \"2021-09-02 00:02:00\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"id\": \"\",\n" +
                "    \"email id\": \"\",\n" +
                "    \"userName\": \"Tobias Funke\",\n" +
                "    \"productName\": \"Beef steak\",\n" +
                "    \"orderAmount\": 19.99,\n" +
                "    \"date\": \"2021-09-03 00:03:00\"\n" +
                "  }\n" +
                "]";

        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [\n" +
                "      {\n" +
                "        \"key\": \"date\",\n" +
                "        \"condition\": \"GTE\",\n" +
                "        \"value\": \"2021-09-02 00:02:00\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            ArrayNode filteredData = filterDataService.filterDataNew(items,new UQIDataFilterParams(condition, null,
                    null, null));

            assertEquals(filteredData.size(), 2);

        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testProjection() {
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

        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [\n" +
                "      {\n" +
                "        \"key\": \"orderAmount\",\n" +
                "        \"condition\": \"LT\",\n" +
                "        \"value\": \"15\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            ArrayNode filteredData = filterDataService.filterDataNew(items, new UQIDataFilterParams(condition,
                    List.of("id", "email"), null, null));

            assertEquals(filteredData.size(), 2);

            List<String> expectedColumns = List.of("id", "email");
            List<String> returnedColumns = new ArrayList<>();
            filteredData.get(0).fieldNames().forEachRemaining(columnName -> returnedColumns.add(columnName));
            assertEquals(expectedColumns, returnedColumns);
        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testSortBy() {
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

        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [\n" +
                "      {\n" +
                "        \"key\": \"orderAmount\",\n" +
                "        \"condition\": \"LT\",\n" +
                "        \"value\": \"15\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            List<Map<String, String>> sortBy = new ArrayList<>();
            Map<String, String> sortCondition1 = new HashMap<>();
            sortCondition1.put(SORT_BY_COLUMN_NAME_KEY, "orderAmount");
            sortCondition1.put(SORT_BY_TYPE_KEY, VALUE_DESCENDING);
            sortBy.add(sortCondition1);
            Map<String, String> sortCondition2 = new HashMap<>();
            sortCondition2.put(SORT_BY_COLUMN_NAME_KEY, ""); // column name empty
            sortCondition2.put(SORT_BY_TYPE_KEY, VALUE_DESCENDING);
            sortBy.add(sortCondition2);

            ArrayNode filteredData = filterDataService.filterDataNew(items, new UQIDataFilterParams(condition, null,
                    sortBy, null));

            assertEquals(filteredData.size(), 2);

            List<String> expectedOrder = List.of("9.99", "4.99");
            List<String> returnedOrder = new ArrayList<>();
            returnedOrder.add(filteredData.get(0).get("orderAmount").asText());
            returnedOrder.add(filteredData.get(1).get("orderAmount").asText());
            assertEquals(expectedOrder, returnedOrder);
        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testPagination() {
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

        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [\n" +
                "      {\n" +
                "        \"key\": \"orderAmount\",\n" +
                "        \"condition\": \"LT\",\n" +
                "        \"value\": \"25\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            HashMap<String, String> paginateBy = new HashMap<>();
            paginateBy.put(PAGINATE_LIMIT_KEY, "2");
            paginateBy.put(PAGINATE_OFFSET_KEY, "1");

            ArrayNode filteredData = filterDataService.filterDataNew(items, new UQIDataFilterParams(condition, null,
                    null, paginateBy));

            assertEquals(filteredData.size(), 2);

            List<String> expectedOrderAmountValues = List.of("9.99", "19.99");
            List<String> returnedOrderAmountValues = new ArrayList<>();
            returnedOrderAmountValues.add(filteredData.get(0).get("orderAmount").asText());
            returnedOrderAmountValues.add(filteredData.get(1).get("orderAmount").asText());
            assertEquals(expectedOrderAmountValues, returnedOrderAmountValues);
        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testProjectionSortingAndPaginationTogether() {
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

        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [\n" +
                "      {\n" +
                "        \"key\": \"orderAmount\",\n" +
                "        \"condition\": \"LT\",\n" +
                "        \"value\": \"20\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            List<String> projectColumns = List.of("id", "email", "orderAmount");

            List<Map<String, String>> sortBy = new ArrayList<>();
            Map<String, String> sortCondition = new HashMap<>();
            sortCondition.put(SORT_BY_COLUMN_NAME_KEY, "orderAmount");
            sortCondition.put(SORT_BY_TYPE_KEY, VALUE_DESCENDING);
            sortBy.add(sortCondition);

            HashMap<String, String> paginateBy = new HashMap<>();
            paginateBy.put(PAGINATE_LIMIT_KEY, "1");
            paginateBy.put(PAGINATE_OFFSET_KEY, "1");

            ArrayNode filteredData = filterDataService.filterDataNew(items, new UQIDataFilterParams(condition,
                    projectColumns, sortBy,paginateBy));

            assertEquals(filteredData.size(), 1);

            String expectedOrderAmount = "9.99";
            String returnedOrderAmount = filteredData.get(0).get("orderAmount").asText();
            assertEquals(expectedOrderAmount, returnedOrderAmount);
        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }

    @Test
    public void testSortByWithEmptyColumnNameOnly() {
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

        String whereJson = "{\n" +
                "  \"where\": {\n" +
                "    \"children\": [\n" +
                "      {\n" +
                "        \"key\": \"orderAmount\",\n" +
                "        \"condition\": \"LT\",\n" +
                "        \"value\": \"15\"\n" +
                "      }\n" +
                "    ],\n" +
                "    \"condition\": \"AND\"\n" +
                "  }\n" +
                "}";

        try {
            ArrayNode items = (ArrayNode) objectMapper.readTree(data);

            Map<String, Object> whereClause = objectMapper.readValue(whereJson, HashMap.class);
            Map<String, Object> unparsedWhereClause = (Map<String, Object>) whereClause.get("where");
            Condition condition = parseWhereClause(unparsedWhereClause);

            List<Map<String, String>> sortBy = new ArrayList<>();
            Map<String, String> sortCondition1 = new HashMap<>();
            sortCondition1.put(SORT_BY_COLUMN_NAME_KEY, "");
            sortCondition1.put(SORT_BY_TYPE_KEY, VALUE_DESCENDING);
            sortBy.add(sortCondition1);

            ArrayNode filteredData = filterDataService.filterDataNew(items, new UQIDataFilterParams(condition, null,
                    sortBy, null));

            assertEquals(filteredData.size(), 2);

            List<String> expectedOrder = List.of("4.99", "9.99");
            List<String> returnedOrder = new ArrayList<>();
            returnedOrder.add(filteredData.get(0).get("orderAmount").asText());
            returnedOrder.add(filteredData.get(1).get("orderAmount").asText());
            assertEquals(expectedOrder, returnedOrder);
        } catch (IOException e) {
            e.printStackTrace();
            Assert.fail(e.getMessage());
        }
    }
}

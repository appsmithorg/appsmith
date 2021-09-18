package com.appsmith.external.services;

import com.appsmith.external.constants.ConditionalOperator;
import com.appsmith.external.constants.DataType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.DataTypeStringUtils.stringToKnownDataTypeConverter;
import static com.appsmith.external.services.InMemoryDatabase.Condition.generateConditionList;

@Component
public class InMemoryDatabase {

    private static String JDBC_DRIVER = "org.h2.Driver";
    private static String url = "jdbc:h2:mem:filterDb";
    private static ObjectMapper objectMapper = new ObjectMapper();

    private static Map<DataType, String> sqlDataTypeMap = Map.of(
            DataType.INTEGER, "INT",
            DataType.LONG, "BIGINT",
            DataType.FLOAT, "REAL",
            DataType.DOUBLE, "DOUBLE",
            DataType.BOOLEAN, "BOOLEAN",
            DataType.STRING, "VARCHAR"
    );

    private static Map<ConditionalOperator, String> sqlOperatorMapping = Map.of(
            ConditionalOperator.LT, "<",
            ConditionalOperator.LTE, "<=",
            ConditionalOperator.EQ, "=",
            ConditionalOperator.NOT_EQ, "<>",
            ConditionalOperator.GT, ">",
            ConditionalOperator.GTE, ">="
    );

    private static Connection connection;

    public InMemoryDatabase() throws SQLException {
        connection = DriverManager.getConnection(url);
    }

    public static ArrayNode filterData(ArrayNode items, List<Object> conditionList) throws SQLException {

        if (items == null || items.size() == 0) {
            return items;
        }

        if (!validConditionList(conditionList)) {
            return items; // or throw an exception
        }

        List<Condition> conditions = generateConditionList(conditionList);

        // Generate the schema of the table using the first object
        JsonNode jsonNode = items.get(0);

        Map<String, DataType> schema = generateSchema(jsonNode);

        String tableName = generateTable(schema);

        // insert the data
        insertData(tableName, items, schema);

        // Filter the data
        List<Map<String, Object>> finalResults = selectQuery(tableName, conditions);

        ArrayNode finalResultsNode = objectMapper.valueToTree(finalResults);

        return finalResultsNode;
    }

    public static List<Map<String, Object>> selectQuery(String tableName, List<Condition> conditions) {
        StringBuilder sb = new StringBuilder("SELECT * FROM " + tableName + " WHERE ");

        for (Condition condition : conditions) {
            String path = condition.getPath();
            ConditionalOperator operator = condition.getOperator();
            String value = condition.getValue();

            String sqlOp = sqlOperatorMapping.get(operator);
            if (sqlOp == null) {
                // Operator not supported. Handle the same // TODO
            }

            sb.append(path);
            sb.append(" ");
            sb.append(sqlOp);
            sb.append(" ");
            sb.append("'");
            sb.append(value);
            sb.append("' AND ");
        }

        if (!conditions.isEmpty()) {
            // Trim the last " AND " aka last 5 characters
            sb.setLength(sb.length() - 5);
        }

        sb.append(";");

        String selectQuery = sb.toString();
        System.out.println(selectQuery);

        List<Map<String, Object>> rowsList = new ArrayList<>(50);

        try {
            Statement statement = connection.createStatement();
            ResultSet resultSet = statement.executeQuery(selectQuery);

            ResultSetMetaData metaData = resultSet.getMetaData();
            int colCount = metaData.getColumnCount();

            while (resultSet.next()) {
                Map<String, Object> row = new LinkedHashMap<>(colCount);
                for (int i = 1; i <= colCount; i++) {
                    row.put(metaData.getColumnName(i), resultSet.getObject(i));
                }
                rowsList.add(row);
            }
            System.out.println(rowsList);

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return rowsList;
    }

    public static void fetchAll(String tableName) {
        String query = "SELECT * FROM " + tableName + ";";
        try {
            Statement statement = connection.createStatement();
            ResultSet resultSet = statement.executeQuery(query);

            ResultSetMetaData metaData = resultSet.getMetaData();
            int colCount = metaData.getColumnCount();
            List<Map<String, Object>> rowsList = new ArrayList<>(50);

            while (resultSet.next()) {
                Map<String, Object> row = new LinkedHashMap<>(colCount);
                for (int i = 1; i <= colCount; i++) {
                    row.put(metaData.getColumnName(i), resultSet.getObject(i));
                }
                rowsList.add(row);
            }
            System.out.println(rowsList);

        } catch (SQLException e) {
            e.printStackTrace();
        }
    }


    // INSERT INTO tableName (columnName1, columnName2) VALUES (data1, data2)
    public static void insertData(String tableName, ArrayNode items, Map<String, DataType> schema) {

        List<String> columnNames = schema.keySet().stream().collect(Collectors.toList());

        StringBuilder mainBuilder = new StringBuilder("INSERT INTO ");
        mainBuilder.append(tableName);

        StringBuilder columnNamesBuilder = new StringBuilder("(");

        for (String columnName : columnNames) {
            columnNamesBuilder.append(columnName);
            columnNamesBuilder.append(",");
        }

        // Trim the trailing comma
        int i = columnNamesBuilder.lastIndexOf(",");
        columnNamesBuilder.deleteCharAt(i);

        columnNamesBuilder.append(")");

        mainBuilder.append(columnNamesBuilder);
        mainBuilder.append(" VALUES ");

        for (JsonNode item : items) {

            StringBuilder valuesBuilder = new StringBuilder("(");

            for (String columnName : columnNames) {
                JsonNode fieldNode = item.get(columnName);
                if (fieldNode != null) {
                    valuesBuilder.append("'");
                    valuesBuilder.append(fieldNode.asText());
                    valuesBuilder.append("'");
                }
                valuesBuilder.append(",");
            }

            // All the columns have been read
            // Trim the trailing comma
            i = valuesBuilder.lastIndexOf(",");
            valuesBuilder.deleteCharAt(i);

            valuesBuilder.append("),");

            mainBuilder.append(valuesBuilder);
        }

        // Trim the trailing comma
        i = mainBuilder.lastIndexOf(",");
        mainBuilder.deleteCharAt(i);

        String insertQuery = mainBuilder.toString();
        System.out.println(insertQuery);

        try {
            connection.createStatement().execute(insertQuery);
        } catch (SQLException e) {
            e.printStackTrace();
        }

    }

    public static String generateTable(Map<String, DataType> schema) throws SQLException {

        if (connection == null || connection.isClosed() || !connection.isValid(5)) {
            connection = DriverManager.getConnection(url);
        }

        // Generate table name
        String generateUniqueId = new ObjectId().toString().toUpperCase(Locale.ROOT);
        String tableName = new StringBuilder("tbl_").append(generateUniqueId).toString();

        StringBuilder sb = new StringBuilder("CREATE TABLE ");

        sb.append(tableName);

        sb.append(" (");

        Boolean columnsAdded = false;
        for (Map.Entry<String, DataType> entry : schema.entrySet()) {
            String fieldName = entry.getKey();
            DataType dataType = entry.getValue();

            String sqlDataType = sqlDataTypeMap.get(dataType);
            if (sqlDataType == null) {
                // or throw an error for unsupported data type
                continue;
            }
            columnsAdded = true;
            sb.append(fieldName);
            sb.append(" ");
            sb.append(sqlDataType);
            sb.append(",");
        }

        // Delete trailing comma
        if (columnsAdded) {
            int i = sb.lastIndexOf(",");
            sb.deleteCharAt(i);
        }

        sb.append(");");

        String createTableQuery = sb.toString();
        System.out.println(createTableQuery);

        try {
            connection.createStatement().execute(createTableQuery);
        } catch (SQLException e) {
            e.printStackTrace();
        }

        return tableName;

    }


    private static Map<String, DataType> generateSchema(JsonNode jsonNode) {
        Map<String, DataType> schema = new HashMap<>();

        jsonNode.fieldNames().forEachRemaining(name -> {
            String value = jsonNode.get(name).asText();
            DataType dataType = stringToKnownDataTypeConverter(value);

            schema.put(name, dataType);
        });

        return schema;
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


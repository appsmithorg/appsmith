package com.appsmith.external.services;

import com.appsmith.external.constants.ConditionalOperator;
import com.appsmith.external.constants.DataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static com.appsmith.external.helpers.DataTypeStringUtils.stringToKnownDataTypeConverter;
import static com.appsmith.external.services.InMemoryDatabase.Condition.generateConditionList;

@Component
public class InMemoryDatabase {

    private static String JDBC_DRIVER = "org.h2.Driver";
    private static String url = "jdbc:h2:mem:filterDb";

    private static Map<DataType, String> sqlDataTypeMap = Map.of(
            DataType.INTEGER, "INT",
            DataType.LONG, "BIGINT",
            DataType.FLOAT, "REAL",
            DataType.DOUBLE, "DOUBLE",
            DataType.BOOLEAN, "BOOLEAN",
            DataType.STRING, "VARCHAR"
    );
    private static Connection connection;

    public InMemoryDatabase() throws SQLException {
        connection = DriverManager.getConnection(url);
    }

    public ArrayNode filterData(ArrayNode items, List<Object> conditionList) {

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


        return null;
    }

    public static String generateTable(Map<String, DataType> schema) throws SQLException {


        try {
            Class.forName(JDBC_DRIVER);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Error loading H2 JDBC Driver class."
            );
        }


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


    private Map<String, DataType> generateSchema(JsonNode jsonNode) {
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


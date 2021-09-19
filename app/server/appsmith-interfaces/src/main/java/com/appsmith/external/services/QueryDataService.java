package com.appsmith.external.services;

import com.appsmith.external.constants.ConditionalOperator;
import com.appsmith.external.constants.DataType;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Condition;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.external.helpers.DataTypeStringUtils.stringToKnownDataTypeConverter;
import static com.appsmith.external.models.Condition.addValueDataType;

@Component
@Slf4j
public class QueryDataService {

    private static String JDBC_DRIVER = "org.h2.Driver";
    private static String url = "jdbc:h2:mem:filterDb";
    private static ObjectMapper objectMapper = new ObjectMapper();

    private static final Map<DataType, String> SQL_DATATYPE_MAP = Map.of(
            DataType.INTEGER, "INT",
            DataType.LONG, "BIGINT",
            DataType.FLOAT, "REAL",
            DataType.DOUBLE, "DOUBLE",
            DataType.BOOLEAN, "BOOLEAN",
            DataType.STRING, "VARCHAR"
    );

    private static final Map<ConditionalOperator, String> SQL_OPERATOR_MAP = Map.of(
            ConditionalOperator.LT, "<",
            ConditionalOperator.LTE, "<=",
            ConditionalOperator.EQ, "=",
            ConditionalOperator.NOT_EQ, "<>",
            ConditionalOperator.GT, ">",
            ConditionalOperator.GTE, ">=",
            ConditionalOperator.IN, "IN",
            ConditionalOperator.NOT_IN, "NOT IN"
    );

    private static Connection connection;

    public QueryDataService() {
        try {
            connection = DriverManager.getConnection(url);
        } catch (SQLException e) {
            e.printStackTrace();
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Failed to connect to the in memory database. Unable to perform filtering");
        }
    }

    public static ArrayNode filterData(ArrayNode items, List<Condition> conditionList) {

        if (items == null || items.size() == 0) {
            return items;
        }

        if (!validConditionList(conditionList)) {
            return items; // or throw an exception
        }

        List<Condition> conditions = addValueDataType(conditionList);

        // Generate the schema of the table using the first object
        JsonNode jsonNode = items.get(0);

        Map<String, DataType> schema = generateSchema(jsonNode);

        String tableName = generateTable(schema);

        // insert the data
        insertData(tableName, items, schema);

        // Filter the data
        List<Map<String, Object>> finalResults = executeFilterQuery(tableName, conditions);

        // Now that the data has been filtered. Clean Up. Drop the table
        dropTable(tableName);

        ArrayNode finalResultsNode = objectMapper.valueToTree(finalResults);

        return finalResultsNode;
    }

    public static List<Map<String, Object>> executeFilterQuery(String tableName, List<Condition> conditions) {
        StringBuilder sb = new StringBuilder("SELECT * FROM " + tableName);

        String whereClause = generateWhereClause(conditions);
        sb.append(whereClause);

        sb.append(";");

        String selectQuery = sb.toString();
        log.debug("{} : Executing Query on H2 : {}", Thread.currentThread().getName(), selectQuery);

        List<Map<String, Object>> rowsList = new ArrayList<>(50);

        checkAndSetConnection();

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
            // Getting a SQL Exception here means that our generated query is incorrect. Raise an alarm!
            e.printStackTrace();
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Filtering failure seen : " + e.getMessage());
        }

        return rowsList;
    }

    private static String generateWhereClause(List<Condition> conditions) {

        StringBuilder sb = new StringBuilder();

        Boolean firstCondition = true;
        for (Condition condition : conditions) {

            if (firstCondition) {
                // Append the WHERE keyword before adding the conditions
                sb.append(" WHERE ");
                firstCondition = false;
            } else {
                // This is not the first condition. Append an `AND` before adding the next condition
                sb.append(" AND ");
            }

            String path = condition.getPath();
            ConditionalOperator operator = condition.getOperator();
            String value = condition.getValue();

            String sqlOp = SQL_OPERATOR_MAP.get(operator);
            if (sqlOp == null) {
                // Operator not supported. Handle the same // TODO
            }

            sb.append(path);
            sb.append(" ");
            sb.append(sqlOp);
            sb.append(" ");

            // These are array operations. Convert value into appropriate format and then append
            if (operator == ConditionalOperator.IN || operator == ConditionalOperator.NOT_IN) {

                StringBuilder valueBuilder = new StringBuilder("(");

                // The array could be an array of Strings
                if (value.contains("\"")) {
                    try {
                        List<String> stringValues = objectMapper.readValue(value, List.class);
                        List<String> updatedStringValues = stringValues.stream().map(stringValue -> "\'" + stringValue + "\'").collect(Collectors.toList());
                        String finalValues = String.join(",", updatedStringValues);
                        valueBuilder.append(finalValues);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                } else {
                    String trimmedValue = value.replaceAll("^\\[|]$", "");
                    valueBuilder.append(trimmedValue);
                }

                valueBuilder.append(")");
                value = valueBuilder.toString();
                sb.append(value);

            } else {
                // Since the value is not an array, surround the same with single quotes and append
                sb.append("'");
                sb.append(value);
                sb.append("'");
            }
        }

        return sb.toString();
    }

    // INSERT INTO tableName (columnName1, columnName2) VALUES (data1, data2)
    public static void insertData(String tableName, ArrayNode items, Map<String, DataType> schema) {

        List<String> columnNames = schema.keySet().stream().collect(Collectors.toList());

        StringBuilder insertQueryBuilder = new StringBuilder("INSERT INTO ");
        insertQueryBuilder.append(tableName);

        StringBuilder columnNamesBuilder = new StringBuilder("(");
        columnNamesBuilder.append(String.join(", ", columnNames));
        columnNamesBuilder.append(")");

        insertQueryBuilder.append(columnNamesBuilder);
        insertQueryBuilder.append(" VALUES ");

        StringBuilder valuesMasterBuilder = new StringBuilder();

        int iterator = 0;
        for (JsonNode item : items) {

            // In the number of values inserted is greater than 1000, the insert would fail. Once we have reached 1000
            // rows, execute the insert for rows so far and start afresh.
            if (iterator == 1000) {
                String insertQueryString = finalInsertQueryString(insertQueryBuilder.toString(), valuesMasterBuilder);
                executeDbQuery(insertQueryString);

                // Reset the values builder and iterator for new insert queries.
                valuesMasterBuilder = new StringBuilder();
                iterator = 0;
            }

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
            int i = valuesBuilder.lastIndexOf(",");
            valuesBuilder.deleteCharAt(i);

            valuesBuilder.append("),");

            valuesMasterBuilder.append(valuesBuilder);
            iterator++;
        }

        if (valuesMasterBuilder.length() > 0) {
            String insertQueryString = finalInsertQueryString(insertQueryBuilder.toString(), valuesMasterBuilder);
            executeDbQuery(insertQueryString);
        }
    }

    private static void executeDbQuery(String query) {
        checkAndSetConnection();
        try {
            connection.createStatement().execute(query);
        } catch (SQLException e) {
            // Getting a SQL Exception here means that our generated query is incorrect. Raise an alarm!
            e.printStackTrace();
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Filtering failure seen during insertion of data : " + e.getMessage());
        }
    }

    private static String finalInsertQueryString(String partialInsertQuery, StringBuilder valuesBuilder) {

        StringBuilder insertQueryBuilder = new StringBuilder(partialInsertQuery);

        if (valuesBuilder.lastIndexOf(",") == valuesBuilder.length() - 1) {
            valuesBuilder.deleteCharAt(valuesBuilder.length() - 1);
        }

        insertQueryBuilder.append(valuesBuilder);
        insertQueryBuilder.append(";");

        String finalInsertQuery = insertQueryBuilder.toString();
        System.out.println(finalInsertQuery);

        return finalInsertQuery;
    }

    private static void checkAndSetConnection() {
        try {
            if (connection == null || connection.isClosed() || !connection.isValid(5)) {
                connection = DriverManager.getConnection(url);
            }
        } catch (SQLException e) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Failed to connect to the in memory database. Unable to perform filtering");
        }
    }

    public static String generateTable(Map<String, DataType> schema) {

        checkAndSetConnection();

        // Generate table name
        String generateUniqueId = new ObjectId().toString().toUpperCase();

        // Appending tbl_ before the generated unique id since using the string directly was throwing a SQL error
        // which I couldnt solve. Just appending a string to it though works perfectly.
        String tableName = new StringBuilder("tbl_").append(generateUniqueId).toString();

        StringBuilder sb = new StringBuilder("CREATE TABLE ");

        sb.append(tableName);

        sb.append(" (");

        Boolean columnsAdded = false;
        for (Map.Entry<String, DataType> entry : schema.entrySet()) {
            String fieldName = entry.getKey();
            DataType dataType = entry.getValue();

            String sqlDataType = SQL_DATATYPE_MAP.get(dataType);
            if (sqlDataType == null) {
                // the data type recognized does not have a native support in appsmith right now
                // default to String
                sqlDataType = SQL_DATATYPE_MAP.get(DataType.STRING);
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

        executeDbQuery(createTableQuery);

        return tableName;

    }

    public static void dropTable(String tableName) {

        checkAndSetConnection();

        String dropTableQuery = "DROP TABLE " + tableName + ";";

        executeDbQuery(dropTableQuery);
    }


    private static Map<String, DataType> generateSchema(JsonNode jsonNode) {

        Iterator<String> fieldNamesIterator = jsonNode.fieldNames();
        /**
         * For an object of the following type :
         * {
         *      "field1" : "stringValue",
         *      "field2" : "true",
         *      "field3" : "12"
         * }
         *
         * The schema generated would be a Map as follows :
         * {
         *      field1 : DataType.STRING
         *      field2 : DataType.BOOLEAN
         *      field3 : DataType.INTEGER
         * }
         */
        Map<String, DataType> schema = Stream.generate(() -> null)
                .takeWhile(x -> fieldNamesIterator.hasNext())
                .map(n -> fieldNamesIterator.next())
                .collect(Collectors.toMap(
                        Function.identity(),
                        name -> {
                            String value = jsonNode.get(name).asText();
                            DataType dataType = stringToKnownDataTypeConverter(value);
                            return dataType;
                        }));

        return schema;
    }


    public static boolean validConditionList(List<Condition> conditionList) {

        return conditionList
                .stream()
                .allMatch(condition -> Condition.isValid(condition));
    }

}


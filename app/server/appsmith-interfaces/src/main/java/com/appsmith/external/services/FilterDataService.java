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
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
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
public class FilterDataService {

    private static FilterDataService instance = null;
    private ObjectMapper objectMapper;
    private Connection connection;

    private static final String URL = "jdbc:h2:mem:filterDb";

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

    private FilterDataService() {

        objectMapper = new ObjectMapper();

        try {
            connection = DriverManager.getConnection(URL);
        } catch (SQLException e) {
            log.error(e.getMessage());
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Failed to connect to the in memory database. Unable to perform filtering");
        }
    }

    public static FilterDataService getInstance() {

        if (instance == null) {
            instance = new FilterDataService();
        }

        return instance;
    }

    public ArrayNode filterData(ArrayNode items, List<Condition> conditionList) {

        if (items == null || items.size() == 0) {
            return items;
        }
        // Generate the schema of the table using the first object
        JsonNode jsonNode = items.get(0);

        Map<String, DataType> schema = generateSchema(jsonNode);

        if (!validConditionList(conditionList, schema)) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Conditions for filtering were incomplete or incorrect.");
        }

        List<Condition> conditions = addValueDataType(conditionList);


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

    public List<Map<String, Object>> executeFilterQuery(String tableName, List<Condition> conditions) {
        StringBuilder sb = new StringBuilder("SELECT * FROM " + tableName);

        String whereClause = generateWhereClause(conditions);
        sb.append(whereClause);

        sb.append(";");

        String selectQuery = sb.toString();
        log.debug("{} : Executing Query on H2 : {}", Thread.currentThread().getName(), selectQuery);

        List<Map<String, Object>> rowsList = new ArrayList<>(50);

        Connection conn = checkAndGetConnection();

        try {
            Statement statement = conn.createStatement();
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

        } catch (SQLException e) {
            // Getting a SQL Exception here means that our generated query is incorrect. Raise an alarm!
            log.error(e.getMessage());
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Filtering failure seen : " + e.getMessage());
        }

        return rowsList;
    }

    private String generateWhereClause(List<Condition> conditions) {

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
                throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        operator.toString() + " is not supported currently for filtering.");
            }

            sb.append("\"" + path + "\"");
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
                        log.error(e.getMessage());
                    }
                } else {
                    // Removes the outer square brackets from the string to leave behind just the values separated by comma
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
    public void insertData(String tableName, ArrayNode items, Map<String, DataType> schema) {

        List<String> columnNames = schema.keySet().stream().collect(Collectors.toList());

        List<String> quotedColumnNames = columnNames.stream().map(name -> "\"" + name + "\"").collect(Collectors.toList());

        StringBuilder insertQueryBuilder = new StringBuilder("INSERT INTO ");
        insertQueryBuilder.append(tableName);

        StringBuilder columnNamesBuilder = new StringBuilder("(");
        columnNamesBuilder.append(String.join(", ", quotedColumnNames));
        columnNamesBuilder.append(")");

        insertQueryBuilder.append(columnNamesBuilder);
        insertQueryBuilder.append(" VALUES ");

        StringBuilder valuesMasterBuilder = new StringBuilder();

        int counter = 0;
        for (JsonNode item : items) {

            // If the number of values inserted is greater than 1000, the insert would fail. Once we have reached 1000
            // rows, execute the insert for rows so far and start afresh for the rest of the rows
            if (counter == 1000) {
                String insertQueryString = finalInsertQueryString(insertQueryBuilder.toString(), valuesMasterBuilder);
                executeDbQuery(insertQueryString);

                // Reset the values builder and counter for new insert queries.
                valuesMasterBuilder = new StringBuilder();
                counter = 0;
            }

            StringBuilder valuesBuilder = new StringBuilder();

            if (counter != 0) {
                // If not the first row, add a separator between rows
                valuesBuilder.append(",");
            }

            // Start the row
            valuesBuilder.append("(");

            Boolean firstEntry = true;
            for (String columnName : columnNames) {

                if (!firstEntry) {
                    // Add a separator before adding a new entry
                    valuesBuilder.append(",");
                } else {
                    // For future iterations, set flag to false
                    firstEntry = false;
                }

                JsonNode fieldNode = item.get(columnName);
                if (fieldNode != null) {
                    valuesBuilder.append("'");
                    valuesBuilder.append(fieldNode.asText());
                    valuesBuilder.append("'");
                }
            }

            // End the row
            valuesBuilder.append(")");

            valuesMasterBuilder.append(valuesBuilder);
            counter++;
        }

        if (valuesMasterBuilder.length() > 0) {
            String insertQueryString = finalInsertQueryString(insertQueryBuilder.toString(), valuesMasterBuilder);
            executeDbQuery(insertQueryString);
        }
    }

    private void executeDbQuery(String query) {

        Connection conn = checkAndGetConnection();

        try {
            conn.createStatement().execute(query);
        } catch (SQLException e) {
            log.error(e.getMessage());
            // Getting a SQL Exception here means that our generated query is incorrect. Raise an alarm!
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Filtering failure seen during insertion of data : " + e.getMessage());
        }
    }

    private String finalInsertQueryString(String partialInsertQuery, StringBuilder valuesBuilder) {

        StringBuilder insertQueryBuilder = new StringBuilder(partialInsertQuery);

        insertQueryBuilder.append(valuesBuilder);
        insertQueryBuilder.append(";");

        String finalInsertQuery = insertQueryBuilder.toString();

        return finalInsertQuery;
    }

    private Connection checkAndGetConnection() {
        try {
            if (connection == null || connection.isClosed() || !connection.isValid(5)) {
                connection = DriverManager.getConnection(URL);
            }
        } catch (SQLException e) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Failed to connect to the in memory database. Unable to perform filtering");
        }

        return connection;
    }

    public String generateTable(Map<String, DataType> schema) {

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

            if (columnsAdded) {
                // If columns have been added before, add a separator
                sb.append(",");
            }

            String fieldName = entry.getKey();
            DataType dataType = entry.getValue();

            String sqlDataType = SQL_DATATYPE_MAP.get(dataType);
            if (sqlDataType == null) {
                // the data type recognized does not have a native support in appsmith right now
                // default to String
                sqlDataType = SQL_DATATYPE_MAP.get(DataType.STRING);
            }
            columnsAdded = true;
            sb.append("\"" + fieldName + "\"");
            sb.append(" ");
            sb.append(sqlDataType);

        }

        sb.append(");");

        String createTableQuery = sb.toString();

        executeDbQuery(createTableQuery);

        return tableName;

    }

    public void dropTable(String tableName) {

        String dropTableQuery = "DROP TABLE " + tableName + ";";

        executeDbQuery(dropTableQuery);
    }


    private Map<String, DataType> generateSchema(JsonNode jsonNode) {

        Iterator<String> fieldNamesIterator = jsonNode.fieldNames();
        /*
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
                .map(name -> {
                    if (name.contains("\"") || name.contains("\'")) {
                        throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                "\' or \" are unsupported symbols in column names for filtering. Caused by column name : " + name);
                    }
                    return name;
                })
                .collect(Collectors.toMap(
                                Function.identity(),
                                name -> {
                                    String value = jsonNode.get(name).asText();
                                    DataType dataType = stringToKnownDataTypeConverter(value);
                                    return dataType;
                                },
                                (u, v) -> {
                                    // This is not possible.
                                    throw new IllegalStateException(String.format("Duplicate key %s", u));
                                },
                                LinkedHashMap::new
                        )
                );

        return schema;
    }

    private PreparedStatement setValueInStatement(PreparedStatement preparedStatement, int index, String value, DataType dataType) {

        try {
            switch (dataType) {

                case INTEGER: {
                    preparedStatement.setInt(index, Integer.parseInt(value));
                    break;
                }
                case LONG: {
                    preparedStatement.setLong(index, Long.parseLong(value));
                    break;
                }
                case FLOAT:
                case DOUBLE: {
                    preparedStatement.setBigDecimal(index, new BigDecimal(String.valueOf(value)));
                    break;
                }
                case BOOLEAN: {
                    preparedStatement.setBoolean(index, Boolean.parseBoolean(value));
                    break;
                }
                case STRING: {
                    preparedStatement.setString(index, value);
                    break;
                }
                default:
                    break;
            }

        } catch (SQLException | IllegalArgumentException e) {
            // Alarm! This should never fail since appsmith is the creator of the query and supporter of it. Raise
            // an alarm and fix quickly!
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e);
        }

        return preparedStatement;
    }


    public boolean validConditionList(List<Condition> conditionList, Map<String, DataType> schema) {

        conditionList
                .stream()
                .map(condition -> {
                    if (!Condition.isValid(condition)) {
                        throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                "Condition for filtering were incomplete or incorrect. : " + condition);
                    }

                    String path = condition.getPath();

                    if (!schema.containsKey(path)) {
                        throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                path + " not found in the known column names :" + schema.keySet());
                    }

                    return condition;
                })
                .collect(Collectors.toList());

        // All the conditions were iterated over and checked. In case an error was found, an exception has already been
        // thrown. If reached here, everything is hunky-dory.
        return true;
    }

}


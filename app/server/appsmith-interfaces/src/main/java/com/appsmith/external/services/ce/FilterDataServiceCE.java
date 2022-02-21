package com.appsmith.external.services.ce;

import com.appsmith.external.constants.ConditionalOperator;
import com.appsmith.external.constants.DataType;
import com.appsmith.external.constants.SortType;
import com.appsmith.external.dtos.PreparedStatementValueDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.Condition;
import com.appsmith.external.models.UQIDataFilterParams;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.springframework.util.CollectionUtils;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.external.helpers.DataTypeStringUtils.stringToKnownDataTypeConverter;
import static com.appsmith.external.models.Condition.addValueDataType;
import static org.apache.commons.lang3.StringUtils.isBlank;


@Slf4j
public class FilterDataServiceCE implements IFilterDataServiceCE {

    public static final String SORT_BY_COLUMN_NAME_KEY = "column";
    public static final String SORT_BY_TYPE_KEY = "order";
    public static final String DATA_INFO_VALUE_KEY = "value";
    public static final String DATA_INFO_TYPE_KEY = "type";
    public static final String PAGINATE_LIMIT_KEY = "limit";
    public static final String PAGINATE_OFFSET_KEY = "offset";

    private ObjectMapper objectMapper;
    private Connection connection;

    private static final String URL = "jdbc:h2:mem:filterDb;DATABASE_TO_UPPER=FALSE";

    private static final Map<DataType, String> SQL_DATATYPE_MAP = Map.of(
            DataType.INTEGER, "INT",
            DataType.LONG, "BIGINT",
            DataType.FLOAT, "REAL",
            DataType.DOUBLE, "DOUBLE",
            DataType.BOOLEAN, "BOOLEAN",
            DataType.STRING, "VARCHAR",
            DataType.DATE, "DATE",
            DataType.TIMESTAMP, "TIMESTAMP"
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

    public FilterDataServiceCE() {

        objectMapper = new ObjectMapper();

        try {
            connection = DriverManager.getConnection(URL);
        } catch (SQLException e) {
            log.error(e.getMessage());
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_IN_MEMORY_FILTERING_ERROR, "Failed to connect to the in memory database. Unable to perform filtering : " + e.getMessage());
        }
    }

    public ArrayNode filterData(ArrayNode items, List<Condition> conditionList) {
        return filterData(items, conditionList, null);
    }

    /**
     * Overloaded Method to handle plugin-based DataType conversion.
     * Plugins implementing this passes parameter 'dataTypeConversionMap' to instruct how their DataTypes to be processed.
     * Example: GoogleSheet plugin handled it in a way that Integer, Long and Float DataTypes to be treated as Double.
     * @param items
     * @param conditionList
     * @param dataTypeConversionMap - A Map to provide custom Datatype(value) against the actual Datatype(key) found.
     * @return
     */
    public ArrayNode filterData(ArrayNode items, List<Condition> conditionList, Map<DataType, DataType> dataTypeConversionMap) {

        if (items == null || items.size() == 0) {
            return items;
        }

        Map<String, DataType> schema = generateSchema(items, dataTypeConversionMap);

        if (!validConditionList(conditionList, schema)) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, "Conditions for filtering were incomplete or incorrect.");
        }

        List<Condition> conditions = addValueDataType(conditionList);


        String tableName = generateTable(schema);

        // insert the data
        insertAllData(tableName, items, schema, dataTypeConversionMap);

        // Filter the data
        List<Map<String, Object>> finalResults = executeFilterQueryOldFormat(tableName, conditions, schema, dataTypeConversionMap);

        // Now that the data has been filtered. Clean Up. Drop the table
        dropTable(tableName);

        ArrayNode finalResultsNode = objectMapper.valueToTree(finalResults);

        return finalResultsNode;
    }

    /**
     * This filter method is using the new UQI format.
     * @param items - data
     * @param uqiDataFilterParams - filter conditions to apply on data
     * @return filtered data
     */
    public ArrayNode filterDataNew(ArrayNode items, UQIDataFilterParams uqiDataFilterParams) {
        if (items == null || items.size() == 0) {
            return items;
        }

        Condition condition = uqiDataFilterParams.getCondition();
        if (condition != null) {
            Condition updatedCondition = addValueDataType(condition);
            uqiDataFilterParams.setCondition(updatedCondition);
        }

        Map<String, DataType> schema = generateSchema(items);
        String tableName = generateTable(schema);

        // insert the data
        insertAllData(tableName, items, schema);

        // Filter the data
        List<Map<String, Object>> finalResults = executeFilterQueryNew(tableName, schema, uqiDataFilterParams);

        // Now that the data has been filtered. Clean Up. Drop the table
        dropTable(tableName);

        ArrayNode finalResultsNode = objectMapper.valueToTree(finalResults);

        return finalResultsNode;
    }

    private List<Map<String, Object>> executeFilterQueryNew(String tableName, Map<String, DataType> schema,
                                                            UQIDataFilterParams uqiDataFilterParams) {

        Condition condition = uqiDataFilterParams.getCondition();
        List<String> projectionColumns = uqiDataFilterParams.getProjectionColumns();
        List<Map<String, String>> sortBy = uqiDataFilterParams.getSortBy();
        Map<String, String> paginateBy = uqiDataFilterParams.getPaginateBy();

        Connection conn = checkAndGetConnection();

        StringBuilder sb = new StringBuilder();

        // Add projection columns condition otherwise use `select *`
        addProjectionCondition(sb, projectionColumns, tableName);

        /**
         * Moving this from a LinkedHashMap to an ArrayList of objects because with LinkedHashMap we were using
         * the data value as key. Hence, if two identical data values existed then they would overwrite each other. E.g.
         * if there was where clause like `Name == John` Or `Name != John, (which is a perfectly valid query) then
         * the prepared statement substitution would fail because instead of two values to substitute it would only
         * fine one i.e. {"John" -> DataType.String} is the only entry it would find whereas two entries are
         * actually required {"John" -> DataType.String, "John" -> DataType.String} - one for each condition in the
         * where clause. JUnit TC `testProjectionSortingAndPaginationTogether` takes care of this case as well.
         */
        List<PreparedStatementValueDTO> values = new ArrayList<>();

        if (condition != null) {
            ConditionalOperator operator = condition.getOperator();
            List<Condition> conditions = (List<Condition>) condition.getValue();

            String whereClause = generateLogicalExpression(conditions, values, schema, operator);

            if (StringUtils.isNotEmpty(whereClause)) {
                sb.append(" WHERE ");
                sb.append(whereClause);
            }
        }

        // Add `order by` condition
        addSortCondition(sb, sortBy);

        // Add `limit <num> offset <num>` condition
        addPaginationCondition(sb, paginateBy, values);

        sb.append(";");

        List<Map<String, Object>> rowsList = new ArrayList<>(50);

        String selectQuery = sb.toString();
        log.debug("{} : Executing Query on H2 : {}", Thread.currentThread().getName(), selectQuery);

        try {
            PreparedStatement preparedStatement = conn.prepareStatement(selectQuery);
            Iterator<PreparedStatementValueDTO> iterator = values.iterator();
            for (int i = 0; iterator.hasNext(); i++) {
                PreparedStatementValueDTO dataInfo = iterator.next();
                String value = dataInfo.getValue();
                DataType dataType = dataInfo.getDataType();
                setValueInStatement(preparedStatement, i + 1, value, dataType);
            }

            ResultSet resultSet = preparedStatement.executeQuery();
            ResultSetMetaData metaData = resultSet.getMetaData();
            int colCount = metaData.getColumnCount();

            while (resultSet.next()) {
                Map<String, Object> row = new LinkedHashMap<>(colCount);
                for (int i = 1; i <= colCount; i++) {
                    Object resultValue = resultSet.getObject(i);

                    // Set null values to empty strings
                    if (null == resultValue) {
                        resultValue = "";
                    }

                    row.put(metaData.getColumnName(i), resultValue);
                }
                rowsList.add(row);
            }
        } catch (SQLException e) {
            // Getting a SQL Exception here means that our generated query is incorrect. Raise an alarm!
            log.error(e.getMessage());
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_IN_MEMORY_FILTERING_ERROR, "Filtering failure seen : " + e.getMessage());
        }

        return rowsList;
    }

    /**
     * This method adds the following clause to the SQL query: `LIMIT <num> OFFSET <num>`
     *
     * @param sb         - SQL query builder
     * @param paginateBy - values for limit and offset
     * @param values     - list to hold values to be substituted in prepared statement
     */
    private void addPaginationCondition(StringBuilder sb, Map<String, String> paginateBy,
                                        List<PreparedStatementValueDTO> values) {
        if (CollectionUtils.isEmpty(paginateBy)) {
            return;
        }

        sb.append(" LIMIT ? OFFSET ?");

        // Set limit value and data type for prepared statement substitution
        String limit = paginateBy.get(PAGINATE_LIMIT_KEY);
        if (isBlank(limit)) {
            limit = "20";
        }
        values.add(new PreparedStatementValueDTO(limit, DataType.INTEGER));

        // Set offset value and data type for prepared statement substitution
        String offset = paginateBy.get(PAGINATE_OFFSET_KEY);
        if (isBlank(offset)) {
            offset = "0";
        }
        values.add(new PreparedStatementValueDTO(offset, DataType.INTEGER));
    }

    /**
     * Display only those columns that the user has chosen to display.
     * E.g. if the projectionColumns is a list that contains ["ID, Name"], then this method will add the following
     * SQL line: `SELECT ID, Name from tableName`, otherwise it will add: `SELECT * FROM tableName`
     *
     * @param sb - SQL query builder
     * @param projectionColumns - list of columns that need to be displayed
     * @param tableName - table name in database
     */
    private void addProjectionCondition(StringBuilder sb, List<String> projectionColumns, String tableName) {
        if (!CollectionUtils.isEmpty(projectionColumns)) {
            sb.append("SELECT");
            projectionColumns.stream()
                    .forEach(columnName -> sb.append(" " + columnName + ","));

            sb.setLength(sb.length() - 1);
            sb.append(" FROM " + tableName);
        }
        else {
            sb.append("SELECT * FROM " + tableName);
        }
    }

    /**
     * This method adds `ORDER BY` clause to the SQL query. E.g. if the sortBy list is
     * [
     *   {"columnName": "ID", "type": "ASCENDING"},
     *   {"columnName": "Name", "type": "DESCENDING"}
     * ]
     * then this method will add the following line to the SQL query: `ORDER BY ID ASC, Name DESC`
     *
     * @param sb - SQL query builder
     * @param sortBy - list of columns to sort by and sort type (ascending / descending)
     * @throws AppsmithPluginException
     */
    private void addSortCondition(StringBuilder sb, List<Map<String, String>> sortBy) throws AppsmithPluginException {

        /**
         * Checks if:
         *  o `sortBy` condition list is null or empty
         *  o all column names in the sortBy list are empty
         */
        if (isSortConditionEmpty(sortBy)) {
            return;
        }

        sb.append(" ORDER BY");
        sortBy.stream()
                .filter(sortCondition -> !isBlank(sortCondition.get(SORT_BY_COLUMN_NAME_KEY)))
                .forEachOrdered(sortCondition -> {
                    String columnName = sortCondition.get(SORT_BY_COLUMN_NAME_KEY);
                    SortType sortType;
                    try {
                        sortType = SortType.valueOf(sortCondition.get(SORT_BY_TYPE_KEY).toUpperCase());
                    } catch (IllegalArgumentException e) {
                        throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Appsmith server failed " +
                                "to parse the type of sort condition. Please reach out to Appsmith customer support " +
                                "to resolve this.");
                    }
                    sb.append(" " + columnName + " " + sortType + ",");
                });

        sb.setLength(sb.length() - 1);
    }

    /**
     * Checks if:
     *  o `sortBy` condition list is null or empty
     *  o all column names in the sortBy list are empty
     */
    private boolean isSortConditionEmpty(List<Map<String, String>> sortBy) {
        if (CollectionUtils.isEmpty(sortBy)) {
            return true;
        }

        return sortBy.stream()
                .allMatch(sortCondition -> isBlank(sortCondition.get(SORT_BY_COLUMN_NAME_KEY)));
    }

    /**
     * Filter Query before UQI implementation
     * @param tableName - table name in database
     * @param conditions - Where Conditions
     * @param schema    - The Schema
     * @param dataTypeConversionMap - A Map to provide custom Datatype against the actual Datatype found.
     * @return
     */
    public List<Map<String, Object>> executeFilterQueryOldFormat(String tableName, List<Condition> conditions, Map<String, DataType> schema, Map<DataType, DataType> dataTypeConversionMap) {
        Connection conn = checkAndGetConnection();

        StringBuilder sb = new StringBuilder("SELECT * FROM " + tableName);

        LinkedList<PreparedStatementValueDTO> values = new LinkedList<>();

        String whereClause = generateWhereClauseOldFormat(conditions, values, schema);

        sb.append(whereClause);

        sb.append(";");

        List<Map<String, Object>> rowsList = new ArrayList<>(50);

        String selectQuery = sb.toString();
        log.debug("{} : Executing Query on H2 : {}", Thread.currentThread().getName(), selectQuery);

        try {
            PreparedStatement preparedStatement = conn.prepareStatement(selectQuery);
            Iterator<PreparedStatementValueDTO> iterator = values.iterator();
            for (int i = 0; iterator.hasNext(); i++) {
                PreparedStatementValueDTO valueEntry = iterator.next();
                String value = valueEntry.getValue();
                DataType dataType = valueEntry.getDataType();
                setValueInStatement(preparedStatement, i + 1, value, dataType, dataTypeConversionMap);
            }

            ResultSet resultSet = preparedStatement.executeQuery();
            ResultSetMetaData metaData = resultSet.getMetaData();
            int colCount = metaData.getColumnCount();

            while (resultSet.next()) {
                Map<String, Object> row = new LinkedHashMap<>(colCount);
                for (int i = 1; i <= colCount; i++) {
                    Object resultValue = resultSet.getObject(i);

                    // Set null values to empty strings
                    if (null == resultValue) {
                        resultValue = "";
                    }

                    row.put(metaData.getColumnName(i), resultValue);
                }
                rowsList.add(row);
            }
        } catch (SQLException e) {
            // Getting a SQL Exception here means that our generated query is incorrect. Raise an alarm!
            log.error(e.getMessage());
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_IN_MEMORY_FILTERING_ERROR, "Filtering failure seen : " + e.getMessage());
        }

        return rowsList;
    }

    private String generateWhereClauseOldFormat(List<Condition> conditions, LinkedList<PreparedStatementValueDTO> values, Map<String, DataType> schema) {

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
            String value = (String) condition.getValue();

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

                try {
                    List<Object> arrayValues = objectMapper.readValue(value, List.class);
                    List<String> updatedStringValues = arrayValues
                            .stream()
                            .map(fieldValue -> {
                                values.add(new PreparedStatementValueDTO(String.valueOf(fieldValue), schema.get(path)));
                                return "?";
                            })
                            .collect(Collectors.toList());
                    String finalValues = String.join(",", updatedStringValues);
                    valueBuilder.append(finalValues);
                } catch (IOException e) {
                    throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            value + " could not be parsed into an array");
                }

                valueBuilder.append(")");
                value = valueBuilder.toString();
                sb.append(value);

            } else {
                // Not an array. Simply add a placeholder
                sb.append("?");
                values.add(new PreparedStatementValueDTO(value, schema.get(path)));
            }
        }
        return sb.toString();
    }

    public void insertAllData(String tableName, ArrayNode items, Map<String, DataType> schema) {
        insertAllData( tableName, items, schema, null);
    }

    /**
     * Overloaded Method to handle plugin-based DataType conversion.
     * @param tableName - table name in database
     * @param items     - Data
     * @param schema    - The Schema
     * @param dataTypeConversionMap - A Map to provide custom Datatype against the actual Datatype found.
     */
    public void insertAllData(String tableName, ArrayNode items, Map<String, DataType> schema, Map<DataType, DataType> dataTypeConversionMap) {

        List<String> columnNames = schema.keySet().stream().collect(Collectors.toList());

        List<String> quotedColumnNames = columnNames.stream().map(name -> "\"" + name + "\"").collect(Collectors.toList());

        StringBuilder insertQueryBuilder = new StringBuilder("INSERT INTO ");
        insertQueryBuilder.append(tableName);

        StringBuilder columnNamesBuilder = new StringBuilder("(");
        columnNamesBuilder.append(String.join(", ", quotedColumnNames));
        columnNamesBuilder.append(")");

        // In order data types of all the columns
        List<DataType> columnTypes = new ArrayList<>();
        for (String columnName : columnNames) {
            columnTypes.add(schema.get(columnName));
        }

        insertQueryBuilder.append(columnNamesBuilder);
        insertQueryBuilder.append(" VALUES ");

        StringBuilder valuesMasterBuilder = new StringBuilder();

        int counter = 0;
        List<String> inOrderValues = new ArrayList<>();

        for (JsonNode item : items) {

            // If the number of values inserted is greater than 1000, the insert would fail. Once we have reached 1000
            // rows, execute the insert for rows so far and start afresh for the rest of the rows
            if (counter == 1000) {

                insertReadyData(insertQueryBuilder.toString(), valuesMasterBuilder, inOrderValues, columnTypes, dataTypeConversionMap);
                // Reset the values builder and counter for new insert queries.
                valuesMasterBuilder = new StringBuilder();
                counter = 0;
                inOrderValues = new ArrayList<>();
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
                    valuesBuilder.append("?");
                    inOrderValues.add(fieldNode.asText());
                }
            }

            // End the row
            valuesBuilder.append(")");

            valuesMasterBuilder.append(valuesBuilder);
            counter++;
        }

        if (valuesMasterBuilder.length() > 0) {
            insertReadyData(insertQueryBuilder.toString(), valuesMasterBuilder, inOrderValues, columnTypes, dataTypeConversionMap);
        }
    }

    private void executeDbQuery(String query) {

        Connection conn = checkAndGetConnection();
        log.debug("{} : Executing Query on H2 : {}", Thread.currentThread().getName(), query);

        try {
            conn.createStatement().execute(query);
        } catch (SQLException e) {
            log.error(e.getMessage());
            // Getting a SQL Exception here means that our generated query is incorrect. Raise an alarm!
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_IN_MEMORY_FILTERING_ERROR, e.getMessage());
        }
    }

    private void insertReadyData(String partialInsertQuery, StringBuilder valuesBuilder, List<String> inOrderValues, List<DataType> columnTypes, Map<DataType, DataType> dataTypeConversionMap) {

        Connection conn = checkAndGetConnection();

        StringBuilder insertQueryBuilder = new StringBuilder(partialInsertQuery);
        insertQueryBuilder.append(valuesBuilder);
        insertQueryBuilder.append(";");

        String finalInsertQuery = insertQueryBuilder.toString();

        try {
            PreparedStatement preparedStatement = conn.prepareStatement(finalInsertQuery);

            int valueCounter = 0;
            while (valueCounter < inOrderValues.size()) {

                for (int columnTypeCounter = 0; columnTypeCounter < columnTypes.size(); columnTypeCounter++, valueCounter++) {
                    setValueInStatement(preparedStatement, valueCounter + 1, inOrderValues.get(valueCounter), columnTypes.get(columnTypeCounter), dataTypeConversionMap);
                }
            }

            preparedStatement.executeUpdate();

        } catch (SQLException e) {
            e.printStackTrace();
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_IN_MEMORY_FILTERING_ERROR, "Error in ingesting the data : " + e.getMessage());
        }
    }

    private Connection checkAndGetConnection() {
        try {
            if (connection == null || connection.isClosed() || !connection.isValid(5)) {
                connection = DriverManager.getConnection(URL);
            }
        } catch (SQLException e) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_IN_MEMORY_FILTERING_ERROR, "Failed to connect to the filtering database");
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


    public Map<String, DataType> generateSchema(ArrayNode items) {
        return generateSchema(items, null);
    }

    /**
     * Overloaded Method to handle plugin-based DataType conversion.
     * @param items
     * @param dataTypeConversionMap - A Map to provide custom Datatype against the actual Datatype found.
     * @return
     */
    public Map<String, DataType> generateSchema(ArrayNode items, Map<DataType, DataType> dataTypeConversionMap) {

        JsonNode item = items.get(0);

        Iterator<String> fieldNamesIterator = item.fieldNames();

        Set<String> missingColumnDataTypes = new HashSet<>();
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
                                    String value = item.get(name).asText();
                                    if (StringUtils.isEmpty(value)) {
                                        missingColumnDataTypes.add(name);
                                        // Default to string
                                        return DataType.STRING;
                                    } else {
                                        DataType foundDataType = stringToKnownDataTypeConverter(value);
                                        DataType convertedDataType = foundDataType;
                                        if(name != "rowIndex" && dataTypeConversionMap != null) {
                                            convertedDataType = dataTypeConversionMap.getOrDefault(foundDataType, foundDataType);
                                        }
                                        return convertedDataType;
                                    }
                                },
                                (u, v) -> {
                                    // This is not possible.
                                    throw new IllegalStateException(String.format("Duplicate key %s", u));
                                },
                                LinkedHashMap::new
                        )
                );


        // Try to find the missing data type which has been initialized to String
        Set<String> columns = new HashSet();
        columns.addAll(missingColumnDataTypes);

        for (String columnName : columns) {
            for (JsonNode entry : items) {
                String value = entry.get(columnName).asText();
                if (!StringUtils.isEmpty(value)) {
                    DataType foundDataType = stringToKnownDataTypeConverter(value);
                    DataType dataType = foundDataType;
                    if(dataTypeConversionMap != null) {
                        dataType = dataTypeConversionMap.getOrDefault(foundDataType, foundDataType);
                    }
                    schema.put(columnName, dataType);
                    missingColumnDataTypes.remove(columnName);
                }
            }
        }

        // We could not assert a data type for a column because no data exists in any of the rows
        if (!missingColumnDataTypes.isEmpty()) {
            // TODO : Decide on the interaction expected here. Currently we are defaulting to String and hence no
            // error would be shown to the user and filtering on other columns should continue as is.
        }

        return schema;
    }

    private PreparedStatement setValueInStatement(PreparedStatement preparedStatement, int index, String value, DataType dataType) {
        return setValueInStatement(preparedStatement, index, value, dataType, null);
    }

    /**
     * Overloaded Method to handle plugin-based DataType conversion.
     * @param preparedStatement
     * @param index
     * @param value
     * @param topRowDataType
     * @param dataTypeConversionMap - A Map to provide custom Datatype against the actual Datatype found.
     * @return
     */
    private PreparedStatement setValueInStatement(PreparedStatement preparedStatement, int index, String value, DataType topRowDataType, Map<DataType, DataType> dataTypeConversionMap) {

        DataType dataType = topRowDataType;
        if (dataTypeConversionMap != null) {
            //The input datatype will be converted to custom DatType as per implementing dataTypeConversionMap
            dataType = dataTypeConversionMap.getOrDefault(topRowDataType, topRowDataType);
        }

        String strNumericValue = value.trim().replaceAll(",","");

        // Override datatype to null for empty values
        if (StringUtils.isEmpty(value)) {
            dataType = DataType.NULL;
        } else {
            // value is not empty.
            DataType currentRowDataType = stringToKnownDataTypeConverter(value);
            DataType inputDataType = currentRowDataType;
            if (dataTypeConversionMap != null) {
                //Datatype of each row be processed, expected to be consistent to column datatype (first row datatype).
                inputDataType = dataTypeConversionMap.getOrDefault(currentRowDataType, currentRowDataType);
            }
            if (DataType.NULL.equals(inputDataType)) {
                dataType = DataType.NULL;
            }
            //We are setting incompatible datatypes of each row to Null, rather allowing it and exit with error.
            if (dataTypeConversionMap != null && inputDataType != dataType) {
                log.debug("DataType Error : [" + inputDataType + "] " + value + " is not of type " + dataType + " which is the datatype of the column, hence ignored in filter.");
                dataType = DataType.NULL;
            }
        }

        try {
            switch (dataType) {
                case NULL: {
                    preparedStatement.setNull(index, Types.NULL);
                    break;
                }
                case INTEGER: {
                    preparedStatement.setInt(index, Integer.parseInt(strNumericValue));
                    break;
                }
                case LONG: {
                    preparedStatement.setLong(index, Long.parseLong(strNumericValue));
                    break;
                }
                case FLOAT:
                case DOUBLE: {
                    preparedStatement.setBigDecimal(index, new BigDecimal(String.valueOf(strNumericValue)));
                    break;
                }
                case BOOLEAN: {
                    preparedStatement.setBoolean(index, Boolean.parseBoolean(value));
                    break;
                }
                case STRING:
                default:
                    preparedStatement.setString(index, value);
                    break;
            }

        } catch (SQLException e) {
            // Alarm! This should never fail since appsmith is the creator of the query and supporter of it. Raise
            // an alarm and fix quickly!
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_IN_MEMORY_FILTERING_ERROR,
                    "Error while interacting with value " + value + " : " + e.getMessage());
        } catch (IllegalArgumentException e) {
            // The data type recognized does not match the data type of the value being set via Prepared Statement
            // Add proper handling here.
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_IN_MEMORY_FILTERING_ERROR,
                    "Error while interacting with value " + value + " : " + e.getMessage() +
                            ". The data type value was being parsed to was : " + dataType);
        }

        return preparedStatement;
    }


    public boolean validConditionList(List<Condition> conditionList, Map<String, DataType> schema) {

        conditionList
                .stream()
                .map(condition -> {
                    if (!Condition.isValid(condition)) {
                        throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                "Condition \" " + condition.getPath() + " " + condition.getOperator().toString() + " "
                                        + condition.getValue() + " \" is incorrect and could not be parsed.");
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

    public String generateLogicalExpression(List<Condition> conditions, List<PreparedStatementValueDTO> values,
                                            Map<String, DataType> schema, ConditionalOperator logicOp) {

        StringBuilder sb = new StringBuilder();

        Boolean firstCondition = true;
        for (Condition condition : conditions) {
            String path = condition.getPath();
            ConditionalOperator operator = condition.getOperator();
            Object objValue = condition.getValue();
            if (operator.equals(ConditionalOperator.AND) || operator.equals(ConditionalOperator.OR)) {
                List<Condition> subConditions = (List<Condition>) objValue;
                String logicalExpression = generateLogicalExpression(subConditions, values, schema, operator);
                if (StringUtils.isNotEmpty(logicalExpression)) {
                    sb.append(" " + logicOp + " ( ");
                    sb.append(logicalExpression);
                    sb.append(" ) ");
                }
            } else {
                String value = (String) objValue;

                if (StringUtils.isNotEmpty(path) && StringUtils.isNotEmpty(value)) {
                    if (firstCondition) {
                        firstCondition = false;
                    } else {
                        // This is not the first valid condition. Append the operator before adding the next condition
                        sb.append(" " + logicOp);
                    }
                    String sqlOp = SQL_OPERATOR_MAP.get(operator);
                    if (sqlOp == null) {
                        throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                operator + " is not supported currently for filtering.");
                    }
                    sb.append(" ( ");
                    sb.append("\"" + path + "\"");
                    sb.append(" ");
                    sb.append(sqlOp);
                    sb.append(" ");

                    // These are array operations. Convert value into appropriate format and then append
                    if (operator == ConditionalOperator.IN || operator == ConditionalOperator.NOT_IN) {

                        StringBuilder valueBuilder = new StringBuilder("(");

                        try {
                            List<Object> arrayValues = objectMapper.readValue(value, List.class);
                            List<String> updatedStringValues = arrayValues
                                    .stream()
                                    .map(fieldValue -> {
                                        values.add(new PreparedStatementValueDTO(String.valueOf(fieldValue), schema.get(path)));
                                        return "?";
                                    })
                                    .collect(Collectors.toList());
                            String finalValues = String.join(",", updatedStringValues);
                            valueBuilder.append(finalValues);
                        } catch (IOException e) {
                            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                    value + " could not be parsed into an array");
                        }

                        valueBuilder.append(")");
                        value = valueBuilder.toString();
                        sb.append(value);

                    } else {
                        // Not an array. Simply add a placeholder
                        sb.append("?");
                        values.add(new PreparedStatementValueDTO(value, schema.get(path)));
                    }

                    sb.append(" ) ");
                }
            }

        }
        return sb.toString();
    }

}


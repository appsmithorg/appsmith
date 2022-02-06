package com.external.plugins;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.PsParameterDTO;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.external.utils.QueryUtils;
import io.r2dbc.spi.ColumnMetadata;
import io.r2dbc.spi.Connection;
import io.r2dbc.spi.ConnectionFactories;
import io.r2dbc.spi.ConnectionFactoryOptions;
import io.r2dbc.spi.Option;
import io.r2dbc.spi.Result;
import io.r2dbc.spi.Row;
import io.r2dbc.spi.RowMetadata;
import io.r2dbc.spi.Statement;
import io.r2dbc.spi.ValidationDepth;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ObjectUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.AbstractMap.SimpleEntry;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.helpers.PluginUtils.MATCH_QUOTED_WORDS_REGEX;
import static com.appsmith.external.helpers.PluginUtils.getIdenticalColumns;
import static com.appsmith.external.helpers.PluginUtils.getPSParamLabel;
import static com.appsmith.external.helpers.SmartSubstitutionHelper.replaceQuestionMarkWithDollarIndex;
import static io.r2dbc.spi.ConnectionFactoryOptions.SSL;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

public class MySqlPlugin extends BasePlugin {

    private static final String DATE_COLUMN_TYPE_NAME = "date";
    private static final String DATETIME_COLUMN_TYPE_NAME = "datetime";
    private static final String TIMESTAMP_COLUMN_TYPE_NAME = "timestamp";
    private static final int VALIDATION_CHECK_TIMEOUT = 4; // seconds
    private static final String IS_KEY = "is";

    /**
     * Example output for COLUMNS_QUERY:
     * +------------+-----------+-------------+-------------+-------------+------------+----------------+
     * | table_name | column_id | column_name | column_type | is_nullable | COLUMN_KEY | EXTRA          |
     * +------------+-----------+-------------+-------------+-------------+------------+----------------+
     * | test       |         1 | id          | int         |           0 | PRI        | auto_increment |
     * | test       |         2 | firstname   | varchar     |           1 |            |                |
     * | test       |         3 | middlename  | varchar     |           1 |            |                |
     * | test       |         4 | lastname    | varchar     |           1 |            |                |
     * +------------+-----------+-------------+-------------+-------------+------------+----------------+
     */
    private static final String COLUMNS_QUERY = "select tab.table_name as table_name,\n" +
            "       col.ordinal_position as column_id,\n" +
            "       col.column_name as column_name,\n" +
            "       col.data_type as column_type,\n" +
            "       col.is_nullable = 'YES' as is_nullable,\n" +
            "       col.column_key,\n" +
            "       col.extra\n" +
            "from information_schema.tables as tab\n" +
            "         inner join information_schema.columns as col\n" +
            "                    on col.table_schema = tab.table_schema\n" +
            "                        and col.table_name = tab.table_name\n" +
            "where tab.table_type = 'BASE TABLE'\n" +
            "  and tab.table_schema = database()\n" +
            "order by tab.table_name,\n" +
            "         col.ordinal_position;";

    /**
     * Example output for KEYS_QUERY:
     * +-----------------+-------------+------------+-----------------+-------------+----------------+---------------+----------------+
     * | CONSTRAINT_NAME | self_schema | self_table | constraint_type | self_column | foreign_schema | foreign_table | foreign_column |
     * +-----------------+-------------+------------+-----------------+-------------+----------------+---------------+----------------+
     * | PRIMARY         | mytestdb    | test       | p               | id          | NULL           | NULL          | NULL           |
     * +-----------------+-------------+------------+-----------------+-------------+----------------+---------------+----------------+
     */
    private static final String KEYS_QUERY = "select i.constraint_name,\n" +
            "       i.TABLE_SCHEMA as self_schema,\n" +
            "       i.table_name as self_table,\n" +
            "       if(i.constraint_type = 'FOREIGN KEY', 'f', 'p') as constraint_type,\n" +
            "       k.column_name as self_column, -- k.ordinal_position, k.position_in_unique_constraint,\n" +
            "       k.referenced_table_schema as foreign_schema,\n" +
            "       k.referenced_table_name as foreign_table,\n" +
            "       k.referenced_column_name as foreign_column\n" +
            "from information_schema.table_constraints i\n" +
            "         left join information_schema.key_column_usage k\n" +
            "             on i.constraint_name = k.constraint_name and i.table_name = k.table_name\n" +
            "where i.table_schema = database()\n" +
            "  and k.constraint_schema = database()\n" +
            // "  and i.enforced = 'YES'\n" +  // Looks like this is not available on all versions of MySQL.
            "  and i.constraint_type in ('FOREIGN KEY', 'PRIMARY KEY')\n" +
            "order by i.table_name, i.constraint_name, k.position_in_unique_constraint;";

    public MySqlPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Slf4j
    @Extension
    public static class MySqlPluginExecutor implements PluginExecutor<Connection>, SmartSubstitutionInterface {

        private static final int PREPARED_STATEMENT_INDEX = 0;
        private final Scheduler scheduler = Schedulers.elastic();

        /**
         * Instead of using the default executeParametrized provided by pluginExecutor, this implementation affords an opportunity
         * to use PreparedStatement (if configured) which requires the variable substitution, etc. to happen in a particular format
         * supported by PreparedStatement. In case of PreparedStatement turned off, the action and datasource configurations are
         * prepared (binding replacement) using PluginExecutor.variableSubstitution
         *
         * @param connection              : This is the connection that is established to the data source. This connection is according
         *                                to the parameters in Datasource Configuration
         * @param executeActionDTO        : This is the data structure sent by the client during execute. This contains the params
         *                                which would be used for substitution
         * @param datasourceConfiguration : These are the configurations which have been used to create a Datasource from a Plugin
         * @param actionConfiguration     : These are the configurations which have been used to create an Action from a Datasource.
         * @return
         */
        @Override
        public Mono<ActionExecutionResult> executeParameterized(Connection connection,
                                                                ExecuteActionDTO executeActionDTO,
                                                                DatasourceConfiguration datasourceConfiguration,
                                                                ActionConfiguration actionConfiguration) {

            final Map<String, Object> requestData = new HashMap<>();

            Boolean isPreparedStatement;

            final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
            if (properties == null || properties.get(PREPARED_STATEMENT_INDEX) == null) {
                // In case the prepared statement configuration is missing, default to true
                isPreparedStatement = true;
            } else if (properties.get(PREPARED_STATEMENT_INDEX) != null) {
                Object psValue = properties.get(PREPARED_STATEMENT_INDEX).getValue();
                if (psValue instanceof Boolean) {
                    isPreparedStatement = (Boolean) psValue;
                } else if (psValue instanceof String) {
                    isPreparedStatement = Boolean.parseBoolean((String) psValue);
                } else {
                    isPreparedStatement = true;
                }
            } else {
                isPreparedStatement = true;
            }

            requestData.put("preparedStatement", TRUE.equals(isPreparedStatement));

            String query = actionConfiguration.getBody();
            // Check for query parameter before performing the probably expensive fetch connection from the pool op.
            if (query == null) {
                ActionExecutionResult errorResult = new ActionExecutionResult();
                errorResult.setStatusCode(AppsmithPluginError.PLUGIN_ERROR.getAppErrorCode().toString());
                errorResult.setIsExecutionSuccess(false);
                errorResult.setBody(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getMessage("Missing required " +
                        "parameter: Query."));
                errorResult.setTitle(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getTitle());
                ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();
                actionExecutionRequest.setProperties(requestData);
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult);
            }

            actionConfiguration.setBody(query.trim());

            // In case of non prepared statement, simply do binding replacement and execute
            if (FALSE.equals(isPreparedStatement)) {
                prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);
                return executeCommon(connection, actionConfiguration, FALSE, null, null, requestData);
            }

            //This has to be executed as Prepared Statement
            // First extract all the bindings in order
            List<String> mustacheKeysInOrder = MustacheHelper.extractMustacheKeysInOrder(query);
            // Replace all the bindings with a ? as expected in a prepared statement.
            String updatedQuery = MustacheHelper.replaceMustacheWithQuestionMark(query, mustacheKeysInOrder);
            // Set the query with bindings extracted and replaced with '?' back in config
            actionConfiguration.setBody(updatedQuery);
            return executeCommon(connection, actionConfiguration, TRUE, mustacheKeysInOrder, executeActionDTO, requestData);
        }

        public Mono<ActionExecutionResult> executeCommon(Connection connection,
                                                         ActionConfiguration actionConfiguration,
                                                         Boolean preparedStatement,
                                                         List<String> mustacheValuesInOrder,
                                                         ExecuteActionDTO executeActionDTO,
                                                         Map<String, Object> requestData) {

            String query = actionConfiguration.getBody();

            /**
             * - MySQL r2dbc driver is not able to substitute the `True/False` value properly after the IS keyword.
             * Converting `True/False` to integer 1 or 0 also does not work in this case as MySQL syntax does not support
             * integers with IS keyword.
             * - I have raised an issue with r2dbc to track it: https://github.com/mirromutth/r2dbc-mysql/issues/200
             */
            if (preparedStatement && isIsOperatorUsed(query)) {
                return Mono.error(
                        new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                "Appsmith currently does not support the IS keyword with the prepared statement " +
                                        "setting turned ON. Please re-write your SQL query without the IS keyword or " +
                                        "turn OFF (unsafe) the 'Use prepared statement' knob from the settings tab."
                        )
                );
            }

            String finalQuery = QueryUtils.removeQueryComments(query);

            boolean isSelectOrShowQuery = getIsSelectOrShowQuery(finalQuery);

            final List<Map<String, Object>> rowsList = new ArrayList<>(50);
            final List<String> columnsList = new ArrayList<>();
            Map<String, Object> psParams = preparedStatement ? new LinkedHashMap<>() : null;
            String transformedQuery = preparedStatement ? replaceQuestionMarkWithDollarIndex(finalQuery) : finalQuery;
            List<RequestParamDTO> requestParams = List.of(new RequestParamDTO(ACTION_CONFIGURATION_BODY,
                    transformedQuery, null, null, psParams));

            // TODO: need to write a JUnit TC for VALIDATION_CHECK_TIMEOUT
            Flux<Result> resultFlux = Mono.from(connection.validate(ValidationDepth.REMOTE))
                    .timeout(Duration.ofSeconds(VALIDATION_CHECK_TIMEOUT))
                    .onErrorMap(TimeoutException.class, error -> new StaleConnectionException())
                    .flatMapMany(isValid -> {
                        if (isValid) {
                            return createAndExecuteQueryFromConnection(finalQuery,
                                    connection,
                                    preparedStatement,
                                    mustacheValuesInOrder,
                                    executeActionDTO,
                                    requestData,
                                    psParams);
                        }
                        return Flux.error(new StaleConnectionException());
                    });

            Mono<List<Map<String, Object>>> resultMono;

            if (isSelectOrShowQuery) {
                resultMono = resultFlux
                        .flatMap(result ->
                                result.map((row, meta) -> {
                                            rowsList.add(getRow(row, meta));

                                            if (columnsList.isEmpty()) {
                                                columnsList.addAll(meta.getColumnNames());
                                            }

                                            return result;
                                        }
                                )
                        )
                        .collectList()
                        .thenReturn(rowsList);
            } else {
                resultMono = resultFlux
                        .flatMap(Result::getRowsUpdated)
                        .collectList()
                        .flatMap(list -> Mono.just(list.get(list.size() - 1)))
                        .map(rowsUpdated -> {
                            rowsList.add(
                                    Map.of(
                                            "affectedRows",
                                            ObjectUtils.defaultIfNull(rowsUpdated, 0)
                                    )
                            );
                            return rowsList;
                        });
            }

            return resultMono
                    .map(res -> {
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setBody(objectMapper.valueToTree(rowsList));
                        result.setMessages(populateHintMessages(columnsList));
                        result.setIsExecutionSuccess(true);
                        System.out.println(Thread.currentThread().getName() + " In the MySqlPlugin, got action " +
                                "execution result");
                        return result;
                    })
                    .onErrorResume(error -> {
                        if (error instanceof StaleConnectionException) {
                            return Mono.error(error);
                        }
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setIsExecutionSuccess(false);
                        result.setErrorInfo(error);
                        return Mono.just(result);
                    })
                    // Now set the request in the result to be returned back to the server
                    .map(actionExecutionResult -> {
                        ActionExecutionRequest request = new ActionExecutionRequest();
                        request.setQuery(finalQuery);
                        request.setProperties(requestData);
                        request.setRequestParams(requestParams);
                        ActionExecutionResult result = actionExecutionResult;
                        result.setRequest(request);
                        return result;
                    })
                    .subscribeOn(scheduler);

        }

        private boolean isIsOperatorUsed(String query) {
            String queryKeyWordsOnly = query.replaceAll(MATCH_QUOTED_WORDS_REGEX, "");
            return Arrays.stream(queryKeyWordsOnly.split("\\s"))
                    .anyMatch(word -> IS_KEY.equalsIgnoreCase(word.trim()));
        }

        private Flux<Result> createAndExecuteQueryFromConnection(String query,
                                                                 Connection connection,
                                                                 Boolean preparedStatement,
                                                                 List<String> mustacheValuesInOrder,
                                                                 ExecuteActionDTO executeActionDTO,
                                                                 Map<String, Object> requestData,
                                                                 Map psParams) {

            Statement connectionStatement = connection.createStatement(query);
            if (FALSE.equals(preparedStatement) || mustacheValuesInOrder == null || mustacheValuesInOrder.isEmpty()) {
                return Flux.from(connectionStatement.execute());
            }

            System.out.println("Query : " + query);

            List<Map.Entry<String, String>> parameters = new ArrayList<>();
            try {
                connectionStatement = (Statement) this.smartSubstitutionOfBindings(connectionStatement,
                        mustacheValuesInOrder,
                        executeActionDTO.getParams(),
                        parameters);

                requestData.put("ps-parameters", parameters);

                IntStream.range(0, parameters.size())
                        .forEachOrdered(i ->
                                psParams.put(
                                        getPSParamLabel(i + 1),
                                        new PsParameterDTO(parameters.get(i).getKey(), parameters.get(i).getValue())));

            } catch (AppsmithPluginException e) {
                return Flux.error(e);
            }


            return Flux.from(connectionStatement.execute());

        }

        @Override
        public Object substituteValueInInput(int index,
                                             String binding,
                                             String value,
                                             Object input,
                                             List<Map.Entry<String, String>> insertedParams,
                                             Object... args) {

            Statement connectionStatement = (Statement) input;
            DataType valueType = DataTypeStringUtils.stringToKnownDataTypeConverter(value);

            Map.Entry<String, String> parameter = new SimpleEntry<>(value, valueType.toString());
            insertedParams.add(parameter);

            if (DataType.NULL.equals(valueType)) {
                try {
                    connectionStatement.bindNull((index - 1), Object.class);
                } catch (UnsupportedOperationException e) {
                    // Do nothing. Move on
                }
            } else if (DataType.INTEGER.equals(valueType)) {
                /**
                 * - NumberFormatException is NOT expected here since stringToKnownDataTypeConverter uses parseInt
                 * method to detect INTEGER type.
                 */
                connectionStatement.bind((index - 1), Integer.parseInt(value));
            } else if (DataType.BOOLEAN.equals(valueType)) {
                connectionStatement.bind((index - 1), Boolean.parseBoolean(value) == TRUE ? 1 : 0);
            } else {
                connectionStatement.bind((index - 1), value);
            }

            return connectionStatement;
        }

        private Set<String> populateHintMessages(List<String> columnNames) {

            Set<String> messages = new HashSet<>();

            List<String> identicalColumns = getIdenticalColumns(columnNames);
            if (!CollectionUtils.isEmpty(identicalColumns)) {
                messages.add("Your MySQL query result may not have all the columns because duplicate column names " +
                        "were found for the column(s): " + String.join(", ", identicalColumns) + ". You may use the " +
                        "SQL keyword 'as' to rename the duplicate column name(s) and resolve this issue.");
            }

            return messages;
        }

        /**
         * 1. Parse the actual row objects returned by r2dbc driver for mysql statements.
         * 2. Return the row as a map {column_name -> column_value}.
         */
        private Map<String, Object> getRow(Row row, RowMetadata meta) {
            Iterator<ColumnMetadata> iterator = (Iterator<ColumnMetadata>) meta.getColumnMetadatas().iterator();
            Map<String, Object> processedRow = new LinkedHashMap<>();

            while (iterator.hasNext()) {
                ColumnMetadata metaData = iterator.next();
                String columnName = metaData.getName();
                String typeName = metaData.getJavaType().toString();
                Object columnValue = row.get(columnName);

                if (java.time.LocalDate.class.toString().equalsIgnoreCase(typeName) && columnValue != null) {
                    columnValue = DateTimeFormatter.ISO_DATE.format(row.get(columnName, LocalDate.class));
                } else if ((java.time.LocalDateTime.class.toString().equalsIgnoreCase(typeName)) && columnValue != null) {
                    columnValue = DateTimeFormatter.ISO_DATE_TIME.format(
                            LocalDateTime.of(
                                    row.get(columnName, LocalDateTime.class).toLocalDate(),
                                    row.get(columnName, LocalDateTime.class).toLocalTime()
                            )
                    ) + "Z";
                } else if (java.time.LocalTime.class.toString().equalsIgnoreCase(typeName) && columnValue != null) {
                    columnValue = DateTimeFormatter.ISO_TIME.format(row.get(columnName,
                            LocalTime.class));
                } else if (java.time.Year.class.toString().equalsIgnoreCase(typeName) && columnValue != null) {
                    columnValue = row.get(columnName, LocalDate.class).getYear();
                } else {
                    columnValue = row.get(columnName);
                }

                processedRow.put(columnName, columnValue);
            }

            return processedRow;
        }

        /**
         * 1. Check the type of sql query - i.e Select ... or Insert/Update/Drop
         * 2. In case sql queries are chained together, then decide the type based on the last query. i.e In case of
         * query "select * from test; updated test ..." the type of query will be based on the update statement.
         * 3. This is used because the output returned to client is based on the type of the query. In case of a
         * select query rows are returned, whereas, in case of any other query the number of updated rows is
         * returned.
         */
        private boolean getIsSelectOrShowQuery(String query) {
            String[] queries = query.split(";");

            String lastQuery = queries[queries.length - 1].trim();

            return (lastQuery.trim().split("\\s+")[0].equalsIgnoreCase("select")
                    || lastQuery.trim().split("\\s+")[0].equalsIgnoreCase("show"));
        }

        @Override
        public Mono<ActionExecutionResult> execute(Connection connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            // Unused function
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unsupported Operation"));
        }

        @Override
        public Mono<Connection> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();

            StringBuilder urlBuilder = new StringBuilder();
            if (CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                urlBuilder.append(datasourceConfiguration.getUrl());
            } else {
                urlBuilder.append("r2dbc:mysql://");
                final List<String> hosts = new ArrayList<>();

                for (Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                    hosts.add(endpoint.getHost() + ":" + ObjectUtils.defaultIfNull(endpoint.getPort(), 3306L));
                }

                urlBuilder.append(String.join(",", hosts)).append("/");

                if (!StringUtils.isEmpty(authentication.getDatabaseName())) {
                    urlBuilder.append(authentication.getDatabaseName());
                }

            }

            urlBuilder.append("?zeroDateTimeBehavior=convertToNull");
            final List<Property> dsProperties = datasourceConfiguration.getProperties();

            if (dsProperties != null) {
                for (Property property : dsProperties) {
                    if ("serverTimezone".equals(property.getKey()) && !StringUtils.isEmpty(property.getValue())) {
                        urlBuilder.append("&serverTimezone=").append(property.getValue());
                        break;
                    }
                }
            }


            ConnectionFactoryOptions baseOptions = ConnectionFactoryOptions.parse(urlBuilder.toString());
            ConnectionFactoryOptions.Builder ob = ConnectionFactoryOptions.builder().from(baseOptions)
                    .option(ConnectionFactoryOptions.USER, authentication.getUsername())
                    .option(ConnectionFactoryOptions.PASSWORD, authentication.getPassword());

            /*
             * - Ideally, it is never expected to be null because the SSL dropdown is set to a initial value.
             */
            if (datasourceConfiguration.getConnection() == null
                    || datasourceConfiguration.getConnection().getSsl() == null
                    || datasourceConfiguration.getConnection().getSsl().getAuthType() == null) {
                return Mono.error(
                        new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_ERROR,
                                "Appsmith server has failed to fetch SSL configuration from datasource configuration form. " +
                                        "Please reach out to Appsmith customer support to resolve this."
                        )
                );
            }

            /*
             * - By default, the driver configures SSL in the preferred mode.
             */
            SSLDetails.AuthType sslAuthType = datasourceConfiguration.getConnection().getSsl().getAuthType();
            switch (sslAuthType) {
                case PREFERRED:
                case REQUIRED:
                    ob = ob
                            .option(SSL, true)
                            .option(Option.valueOf("sslMode"), sslAuthType.toString().toLowerCase());

                    break;
                case DISABLED:
                    ob = ob.option(SSL, false);

                    break;
                case DEFAULT:
                    /* do nothing - accept default driver setting*/

                    break;
                default:
                    return Mono.error(
                            new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR,
                                    "Appsmith server has found an unexpected SSL option: " + sslAuthType + ". Please reach out to" +
                                            " Appsmith customer support to resolve this."
                            )
                    );
            }

            return (Mono<Connection>) Mono.from(ConnectionFactories.get(ob.build()).create())
                    .onErrorResume(exception -> Mono.error(new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                            exception
                    )))
                    .subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(Connection connection) {

            if (connection != null) {
                Mono.from(connection.close())
                        .onErrorResume(exception -> {
                            log.debug("In datasourceDestroy function error mode.", exception);
                            return Mono.empty();
                        })
                        .subscribeOn(scheduler)
                        .subscribe();
            }
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {

            Set<String> invalids = new HashSet<>();

            if (datasourceConfiguration.getConnection() != null
                    && datasourceConfiguration.getConnection().getMode() == null) {
                invalids.add("Missing Connection Mode.");
            }

            if (StringUtils.isEmpty(datasourceConfiguration.getUrl()) &&
                    CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                invalids.add("Missing endpoint and url");
            } else if (!CollectionUtils.isEmpty(datasourceConfiguration.getEndpoints())) {
                for (final Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                    if (endpoint.getHost() == null || endpoint.getHost().isBlank()) {
                        invalids.add("Host value cannot be empty");
                    } else if (endpoint.getHost().contains("/") || endpoint.getHost().contains(":")) {
                        invalids.add("Host value cannot contain `/` or `:` characters. Found `" + endpoint.getHost() + "`.");
                    }
                }
            }

            if (datasourceConfiguration.getAuthentication() == null) {
                invalids.add("Missing authentication details.");
            } else {
                DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
                if (StringUtils.isEmpty(authentication.getUsername())) {
                    invalids.add("Missing username for authentication.");
                }

                if (StringUtils.isEmpty(authentication.getPassword()) && StringUtils.isEmpty(authentication.getUsername())) {
                    invalids.add("Missing password for authentication.");
                } else if (StringUtils.isEmpty(authentication.getPassword())) {
                    // it is valid if it has the username but not the password
                    authentication.setPassword("");
                }

                if (StringUtils.isEmpty(authentication.getDatabaseName())) {
                    invalids.add("Missing database name.");
                }
            }

            /*
             * - Ideally, it is never expected to be null because the SSL dropdown is set to a initial value.
             */
            if (datasourceConfiguration.getConnection() == null
                    || datasourceConfiguration.getConnection().getSsl() == null
                    || datasourceConfiguration.getConnection().getSsl().getAuthType() == null) {
                invalids.add("Appsmith server has failed to fetch SSL configuration from datasource configuration form. " +
                        "Please reach out to Appsmith customer support to resolve this.");
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
            return datasourceCreate(datasourceConfiguration)
                    .flatMap(connection -> Mono.from(connection.close()))
                    .then(Mono.just(new DatasourceTestResult()))
                    .onErrorResume(error -> {
                        // We always expect to have an error object, but the error object may not be well formed
                        final String errorMessage = error.getMessage() == null
                                ? AppsmithPluginError.PLUGIN_DATASOURCE_TEST_GENERIC_ERROR.getMessage()
                                : error.getMessage();
                        System.out.println("Error when testing MySQL datasource. " + errorMessage);
                        return Mono.just(new DatasourceTestResult(errorMessage));
                    })
                    .subscribeOn(scheduler);

        }

        /**
         * 1. Parse results obtained by running COLUMNS_QUERY defined on top of the page.
         * 2. A sample mysql output for the query is also given near COLUMNS_QUERY definition on top of the page.
         */
        private void getTableInfo(Row row, RowMetadata meta, Map<String, DatasourceStructure.Table> tablesByName) {
            final String tableName = row.get("table_name", String.class);

            if (!tablesByName.containsKey(tableName)) {
                tablesByName.put(tableName, new DatasourceStructure.Table(
                        DatasourceStructure.TableType.TABLE,
                        null,
                        tableName,
                        new ArrayList<>(),
                        new ArrayList<>(),
                        new ArrayList<>()
                ));
            }

            final DatasourceStructure.Table table = tablesByName.get(tableName);
            table.getColumns().add(new DatasourceStructure.Column(
                    row.get("column_name", String.class),
                    row.get("column_type", String.class),
                    null,
                    row.get("extra", String.class).contains("auto_increment")
            ));

            return;
        }

        /**
         * 1. Parse results obtained by running KEYS_QUERY defined on top of the page.
         * 2. A sample mysql output for the query is also given near KEYS_QUERY definition on top of the page.
         */
        private void getKeyInfo(Row row, RowMetadata meta, Map<String, DatasourceStructure.Table> tablesByName,
                                Map<String, DatasourceStructure.Key> keyRegistry) {
            final String constraintName = row.get("constraint_name", String.class);
            final char constraintType = row.get("constraint_type", String.class).charAt(0);
            final String selfSchema = row.get("self_schema", String.class);
            final String tableName = row.get("self_table", String.class);


            if (!tablesByName.containsKey(tableName)) {
                /* do nothing */
                return;
            }

            final DatasourceStructure.Table table = tablesByName.get(tableName);
            final String keyFullName = tableName + "." + row.get("constraint_name", String.class);

            if (constraintType == 'p') {
                if (!keyRegistry.containsKey(keyFullName)) {
                    final DatasourceStructure.PrimaryKey key = new DatasourceStructure.PrimaryKey(
                            constraintName,
                            new ArrayList<>()
                    );
                    keyRegistry.put(keyFullName, key);
                    table.getKeys().add(key);
                }
                ((DatasourceStructure.PrimaryKey) keyRegistry.get(keyFullName)).getColumnNames()
                        .add(row.get("self_column", String.class));
            } else if (constraintType == 'f') {
                final String foreignSchema = row.get("foreign_schema", String.class);
                final String prefix = (foreignSchema.equalsIgnoreCase(selfSchema) ? "" : foreignSchema + ".")
                        + row.get("foreign_table", String.class) + ".";

                if (!keyRegistry.containsKey(keyFullName)) {
                    final DatasourceStructure.ForeignKey key = new DatasourceStructure.ForeignKey(
                            constraintName,
                            new ArrayList<>(),
                            new ArrayList<>()
                    );
                    keyRegistry.put(keyFullName, key);
                    table.getKeys().add(key);
                }

                ((DatasourceStructure.ForeignKey) keyRegistry.get(keyFullName)).getFromColumns()
                        .add(row.get("self_column", String.class));
                ((DatasourceStructure.ForeignKey) keyRegistry.get(keyFullName)).getToColumns()
                        .add(prefix + row.get("foreign_column", String.class));
            }

            return;
        }

        /**
         * 1. Generate template for all tables in the database.
         */
        private void getTemplates(Map<String, DatasourceStructure.Table> tablesByName) {
            for (DatasourceStructure.Table table : tablesByName.values()) {
                final List<DatasourceStructure.Column> columnsWithoutDefault = table.getColumns()
                        .stream()
                        .filter(column -> column.getDefaultValue() == null)
                        .collect(Collectors.toList());

                final List<String> columnNames = new ArrayList<>();
                final List<String> columnValues = new ArrayList<>();
                final StringBuilder setFragments = new StringBuilder();

                for (DatasourceStructure.Column column : columnsWithoutDefault) {
                    final String name = column.getName();
                    final String type = column.getType();
                    String value;

                    if (type == null) {
                        value = "null";
                    } else if ("text".equals(type) || "varchar".equals(type)) {
                        value = "''";
                    } else if (type.startsWith("int")) {
                        value = "1";
                    } else if (type.startsWith("double")) {
                        value = "1.0";
                    } else if (DATE_COLUMN_TYPE_NAME.equals(type)) {
                        value = "'2019-07-01'";
                    } else if (DATETIME_COLUMN_TYPE_NAME.equals(type)
                            || TIMESTAMP_COLUMN_TYPE_NAME.equals(type)) {
                        value = "'2019-07-01 10:00:00'";
                    } else {
                        value = "''";
                    }

                    columnNames.add(name);
                    columnValues.add(value);
                    setFragments.append("\n    ").append(name).append(" = ").append(value).append(",");
                }

                // Delete the last comma
                if (setFragments.length() > 0) {
                    setFragments.deleteCharAt(setFragments.length() - 1);
                }

                final String tableName = table.getName();
                table.getTemplates().addAll(List.of(
                        new DatasourceStructure.Template("SELECT", "SELECT * FROM " + tableName + " LIMIT 10;"),
                        new DatasourceStructure.Template("INSERT", "INSERT INTO " + tableName
                                + " (" + String.join(", ", columnNames) + ")\n"
                                + "  VALUES (" + String.join(", ", columnValues) + ");"),
                        new DatasourceStructure.Template("UPDATE", "UPDATE " + tableName + " SET"
                                + setFragments + "\n"
                                + "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!"),
                        new DatasourceStructure.Template("DELETE", "DELETE FROM " + tableName
                                + "\n  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!")
                ));
            }
        }

        @Override
        public Mono<DatasourceStructure> getStructure(Connection connection, DatasourceConfiguration datasourceConfiguration) {
            final DatasourceStructure structure = new DatasourceStructure();
            final Map<String, DatasourceStructure.Table> tablesByName = new LinkedHashMap<>();
            final Map<String, DatasourceStructure.Key> keyRegistry = new HashMap<>();

            return Mono.from(connection.validate(ValidationDepth.REMOTE))
                    .timeout(Duration.ofSeconds(VALIDATION_CHECK_TIMEOUT))
                    .onErrorMap(TimeoutException.class, error -> new StaleConnectionException())
                    .flatMapMany(isValid -> {
                        if (isValid) {
                            return connection.createStatement(COLUMNS_QUERY).execute();
                        } else {
                            return Flux.error(new StaleConnectionException());
                        }
                    })
                    .flatMap(result -> {
                        return result.map((row, meta) -> {
                            getTableInfo(row, meta, tablesByName);

                            return result;
                        });
                    })
                    .collectList()
                    .thenMany(Flux.from(connection.createStatement(KEYS_QUERY).execute()))
                    .flatMap(result -> {
                        return result.map((row, meta) -> {
                            getKeyInfo(row, meta, tablesByName, keyRegistry);

                            return result;
                        });
                    })
                    .collectList()
                    .map(list -> {
                        /* Get templates for each table and put those in. */
                        getTemplates(tablesByName);
                        structure.setTables(new ArrayList<>(tablesByName.values()));
                        for (DatasourceStructure.Table table : structure.getTables()) {
                            table.getKeys().sort(Comparator.naturalOrder());
                        }

                        return structure;
                    })
                    .onErrorMap(e -> {
                        if (!(e instanceof AppsmithPluginException) && !(e instanceof StaleConnectionException)) {
                            return new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_ERROR,
                                    e.getMessage()
                            );
                        }

                        return e;
                    })
                    .subscribeOn(scheduler);
        }
    }
}

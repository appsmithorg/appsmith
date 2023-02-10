package com.external.plugins;

import com.appsmith.external.datatypes.AppsmithType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.helpers.DataTypeServiceUtils;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.PsParameterDTO;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.external.plugins.datatypes.MySQLSpecificDataTypes;
import com.external.utils.MySqlDatasourceUtils;
import com.external.utils.QueryUtils;
import io.r2dbc.pool.ConnectionPool;
import io.r2dbc.spi.Connection;
import io.r2dbc.spi.R2dbcNonTransientResourceException;
import io.r2dbc.spi.Result;
import io.r2dbc.spi.Row;
import io.r2dbc.spi.RowMetadata;
import io.r2dbc.spi.Statement;
import io.r2dbc.spi.ValidationDepth;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ObjectUtils;
import org.mariadb.r2dbc.message.server.ColumnDefinitionPacket;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.pool.PoolShutdownException;

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
import java.util.stream.IntStream;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.helpers.PluginUtils.MATCH_QUOTED_WORDS_REGEX;
import static com.appsmith.external.helpers.PluginUtils.getIdenticalColumns;
import static com.appsmith.external.helpers.PluginUtils.getPSParamLabel;
import static com.appsmith.external.helpers.SmartSubstitutionHelper.replaceQuestionMarkWithDollarIndex;
import static com.external.utils.MySqlDatasourceUtils.getNewConnectionPool;
import static com.external.utils.MySqlGetStructureUtils.getKeyInfo;
import static com.external.utils.MySqlGetStructureUtils.getTableInfo;
import static com.external.utils.MySqlGetStructureUtils.getTemplates;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static java.nio.charset.StandardCharsets.UTF_8;

@Slf4j
public class MySqlPlugin extends BasePlugin {

    private static final int VALIDATION_CHECK_TIMEOUT = 4; // seconds
    private static final String IS_KEY = "is";
    public static final String JSON_DB_TYPE = "JSON";

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

    @Extension
    public static class MySqlPluginExecutor implements PluginExecutor<ConnectionPool>, SmartSubstitutionInterface {

        private static final int PREPARED_STATEMENT_INDEX = 0;
        private final Scheduler scheduler = Schedulers.boundedElastic();

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
        public Mono<ActionExecutionResult> executeParameterized(ConnectionPool connection,
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
            List<MustacheBindingToken> mustacheKeysInOrder = MustacheHelper.extractMustacheKeysInOrder(query);
            // Replace all the bindings with a ? as expected in a prepared statement.
            String updatedQuery = MustacheHelper.replaceMustacheWithQuestionMark(query, mustacheKeysInOrder);
            // Set the query with bindings extracted and replaced with '?' back in config
            actionConfiguration.setBody(updatedQuery);
            return executeCommon(connection, actionConfiguration, TRUE, mustacheKeysInOrder, executeActionDTO, requestData);
        }

        public Mono<ActionExecutionResult> executeCommon(ConnectionPool connectionPool,
                                                         ActionConfiguration actionConfiguration,
                                                         Boolean preparedStatement,
                                                         List<MustacheBindingToken> mustacheValuesInOrder,
                                                         ExecuteActionDTO executeActionDTO,
                                                         Map<String, Object> requestData) {

            String query = actionConfiguration.getBody();

            /**
             * TBD: check if this comment is resolved with the new MariaDB driver.
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

            boolean isSelectOrShowOrDescQuery = getIsSelectOrShowOrDescQuery(finalQuery);

            final List<Map<String, Object>> rowsList = new ArrayList<>(50);
            final List<String> columnsList = new ArrayList<>();
            Map<String, Object> psParams = preparedStatement ? new LinkedHashMap<>() : null;
            String transformedQuery = preparedStatement ? replaceQuestionMarkWithDollarIndex(finalQuery) : finalQuery;
            List<RequestParamDTO> requestParams = List.of(new RequestParamDTO(ACTION_CONFIGURATION_BODY,
                    transformedQuery, null, null, psParams));

            return Mono.usingWhen(
                    connectionPool.create(),
                    connection -> {
                        // TODO: add JUnit TC for the `connection.validate` check. Not sure how to do it at the moment.
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
                        if (isSelectOrShowOrDescQuery) {
                            resultMono = resultFlux
                                    .flatMap(result ->
                                            result.map((row, meta) -> {
                                                        rowsList.add(getRow(row, meta));

                                                        if (columnsList.isEmpty()) {
                                                            meta.getColumnMetadatas().stream().forEach(columnMetadata -> columnsList.add(columnMetadata.getName()));
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
                                    .map(list -> list.get(list.size() - 1))
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
                                    log.debug("In the MySqlPlugin, got action execution result");
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
                                });
                    },
                    Connection::close
            )
            .timeout(Duration.ofSeconds(VALIDATION_CHECK_TIMEOUT))
            .onErrorMap(TimeoutException.class, error -> new StaleConnectionException())
            .onErrorMap(PoolShutdownException.class, error -> new StaleConnectionException())
            .onErrorMap(R2dbcNonTransientResourceException.class, error -> new StaleConnectionException())
            .subscribeOn(scheduler);
        }

        boolean isIsOperatorUsed(String query) {
            String queryKeyWordsOnly = query.replaceAll(MATCH_QUOTED_WORDS_REGEX, "");
            return Arrays.stream(queryKeyWordsOnly.split("\\s"))
                    .anyMatch(word -> IS_KEY.equalsIgnoreCase(word.trim()));
        }

        private Flux<Result> createAndExecuteQueryFromConnection(String query,
                                                                 Connection connection,
                                                                 Boolean preparedStatement,
                                                                 List<MustacheBindingToken> mustacheValuesInOrder,
                                                                 ExecuteActionDTO executeActionDTO,
                                                                 Map<String, Object> requestData,
                                                                 Map psParams) {

            Statement connectionStatement = connection.createStatement(query);
            if (FALSE.equals(preparedStatement) || mustacheValuesInOrder == null || mustacheValuesInOrder.isEmpty()) {
                return Flux.from(connectionStatement.execute());
            }

            log.debug("Query : {}", query);

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
        public Mono<DatasourceTestResult> testDatasource(ConnectionPool pool) {
            return Mono.just(pool)
                    .flatMap(p -> p.create())
                    .flatMap(conn -> Mono.from(conn.close()))
                    .then(Mono.just(new DatasourceTestResult()));
        }

        @Override
        public Object substituteValueInInput(int index,
                                             String binding,
                                             String value,
                                             Object input,
                                             List<Map.Entry<String, String>> insertedParams,
                                             Object... args) {

            Statement connectionStatement = (Statement) input;
            Param param = (Param) args[0];
            AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(param.getClientDataType(), value, MySQLSpecificDataTypes.pluginSpecificTypes);
            Map.Entry<String, String> parameter = new SimpleEntry<>(value, appsmithType.type().toString());
            insertedParams.add(parameter);

            switch (appsmithType.type()) {
                case NULL:
                    try {
                        connectionStatement.bindNull((index - 1), String.class);
                    } catch (UnsupportedOperationException e) {
                        // Do nothing. Move on
                    }
                    break;
                case BOOLEAN:
                    connectionStatement.bind((index - 1), appsmithType.performSmartSubstitution(value));
                    break;
                case INTEGER:
                    connectionStatement.bind((index - 1), Integer.parseInt(value));
                    break;
                case LONG:
                    connectionStatement.bind((index - 1), Long.parseLong(value));
                    break;
                case DOUBLE:
                    connectionStatement.bind((index - 1), Double.parseDouble(value));
                    break;
                default:
                    connectionStatement.bind((index - 1), value);
                    break;
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
            Iterator<ColumnDefinitionPacket> iterator = (Iterator<ColumnDefinitionPacket>) meta.getColumnMetadatas().iterator();
            Map<String, Object> processedRow = new LinkedHashMap<>();

            while (iterator.hasNext()) {
                ColumnDefinitionPacket metaData = iterator.next();
                String columnName = metaData.getName();
                String javaTypeName = metaData.getJavaType().toString();
                String sqlColumnType = metaData.getDataType().name();
                Object columnValue = row.get(columnName);

                if (java.time.LocalDate.class.toString().equalsIgnoreCase(javaTypeName) && columnValue != null) {
                    columnValue = DateTimeFormatter.ISO_DATE.format(row.get(columnName, LocalDate.class));
                } else if ((java.time.LocalDateTime.class.toString().equalsIgnoreCase(javaTypeName)) && columnValue != null) {
                    columnValue = DateTimeFormatter.ISO_DATE_TIME.format(
                            LocalDateTime.of(
                                    row.get(columnName, LocalDateTime.class).toLocalDate(),
                                    row.get(columnName, LocalDateTime.class).toLocalTime()
                            )
                    ) + "Z";
                } else if (java.time.LocalTime.class.toString().equalsIgnoreCase(javaTypeName) && columnValue != null) {
                    columnValue = DateTimeFormatter.ISO_TIME.format(row.get(columnName,
                            LocalTime.class));
                } else if (java.time.Year.class.toString().equalsIgnoreCase(javaTypeName) && columnValue != null) {
                    columnValue = row.get(columnName, LocalDate.class).getYear();
                } else if (JSON_DB_TYPE.equals(sqlColumnType)) {
                    /**
                     * In case of MySQL the JSON DB type is stored as a binary object in the DB. This is different from
                     * MariaDB where it is stored as a text.Since we currently use MariaDB driver for MySQL plugin as
                     * well the driver reads the JSON DB type data as byte array which we are converting to a string
                     * here.
                     *
                     * Please note that this if check would not apply to MariaDB plugin since MariaDB stores JSON as
                     * text.
                     * Ref: https://mariadb.com/kb/en/json-data-type/
                     **/
                    if (columnValue.getClass().isArray()) {
                        columnValue = new String((byte[]) columnValue, UTF_8);
                    }
                } else {
                    columnValue = row.get(columnName);
                }

                processedRow.put(columnName, columnValue);
            }

            return processedRow;
        }

        /**
         * 1. Check the type of sql query - i.e Select ... or Insert/Update/Drop
         * 2. In case sql queries are chained together, then decide the type based on the last query. i.e. In case of
         * query "select * from test; update test ..." the type of query will be based on the update statement.
         * 3. This is used because the output returned to client is based on the type of the query. In case of a
         * select query rows are returned, whereas, in case of any other query the number of updated rows is
         * returned.
         */
        private boolean getIsSelectOrShowOrDescQuery(String query) {
            String[] queries = query.split(";");

            String lastQuery = queries[queries.length - 1].trim();

            return
                    Arrays.asList("select", "show", "describe", "desc")
                            .contains(lastQuery.trim().split("\\s+")[0].toLowerCase());
        }

        @Override
        public Mono<ActionExecutionResult> execute(ConnectionPool connection,
                                                   DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
            // Unused function
            return Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, "Unsupported Operation"));
        }

        @Override
        public Mono<ConnectionPool> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            ConnectionPool pool = null;
            try {
                pool = getNewConnectionPool(datasourceConfiguration);
            } catch (AppsmithPluginException e) {
                return Mono.error(e);
            }
            return Mono.just(pool);
        }
        @Override
        public void datasourceDestroy(ConnectionPool connectionPool) {
            if (connectionPool != null) {
                Mono.just(connectionPool.disposeLater())
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
            return MySqlDatasourceUtils.validateDatasource(datasourceConfiguration);
        }

        @Override
        public Mono<DatasourceStructure> getStructure(ConnectionPool connectionPool,
                                                      DatasourceConfiguration datasourceConfiguration) {
            final DatasourceStructure structure = new DatasourceStructure();
            final Map<String, DatasourceStructure.Table> tablesByName = new LinkedHashMap<>();
            final Map<String, DatasourceStructure.Key> keyRegistry = new HashMap<>();

            return Mono.usingWhen(
                    connectionPool.create(),
                    connection -> {
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
                                });
                    },
                    Connection::close
                    )
                    .timeout(Duration.ofSeconds(VALIDATION_CHECK_TIMEOUT))
                    .onErrorMap(TimeoutException.class, error -> new StaleConnectionException())
                    .onErrorMap(PoolShutdownException.class, error -> new StaleConnectionException())
                    .subscribeOn(scheduler);
        }
    }
}

package com.external.plugins;

import com.appsmith.external.datatypes.AppsmithType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.helpers.DataTypeServiceUtils;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.helpers.SSHTunnelContext;
import com.appsmith.external.helpers.SSHUtils;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.ConnectionContext;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceStructure.Template;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.PsParameterDTO;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.SSHConnection;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.external.plugins.datatypes.MySQLSpecificDataTypes;
import com.external.plugins.exceptions.MySQLErrorMessages;
import com.external.plugins.exceptions.MySQLPluginError;
import com.external.utils.MySqlDatasourceUtils;
import com.external.utils.MySqlErrorUtils;
import com.external.utils.QueryUtils;
import io.r2dbc.pool.ConnectionPool;
import io.r2dbc.pool.PoolMetrics;
import io.r2dbc.spi.Connection;
import io.r2dbc.spi.R2dbcBadGrammarException;
import io.r2dbc.spi.R2dbcException;
import io.r2dbc.spi.R2dbcNonTransientResourceException;
import io.r2dbc.spi.R2dbcPermissionDeniedException;
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
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.pool.PoolShutdownException;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.AbstractMap.SimpleEntry;
import java.util.concurrent.TimeoutException;
import java.util.stream.IntStream;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.helpers.PluginUtils.MATCH_QUOTED_WORDS_REGEX;
import static com.appsmith.external.helpers.PluginUtils.getIdenticalColumns;
import static com.appsmith.external.helpers.PluginUtils.getPSParamLabel;
import static com.appsmith.external.helpers.SSHUtils.getConnectionContext;
import static com.appsmith.external.helpers.SSHUtils.isSSHTunnelConnected;
import static com.appsmith.external.helpers.SmartSubstitutionHelper.replaceQuestionMarkWithDollarIndex;
import static com.external.plugins.exceptions.MySQLErrorMessages.CONNECTION_VALIDITY_CHECK_FAILED_ERROR_MSG;
import static com.external.utils.MySqlDatasourceUtils.getNewConnectionPool;
import static com.external.utils.MySqlGetStructureUtils.getKeyInfo;
import static com.external.utils.MySqlGetStructureUtils.getTableInfo;
import static com.external.utils.MySqlGetStructureUtils.getTemplates;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static java.nio.charset.StandardCharsets.UTF_8;
import static org.apache.commons.lang3.StringUtils.isBlank;
import static org.springframework.util.CollectionUtils.isEmpty;

@Slf4j
public class MySqlPlugin extends BasePlugin {

    private static final int VALIDATION_CHECK_TIMEOUT = 4; // seconds
    private static final String IS_KEY = "is";
    public static final String JSON_DB_TYPE = "JSON";
    public static final int CONNECTION_METHOD_INDEX = 1;
    public static final MySqlErrorUtils mySqlErrorUtils = MySqlErrorUtils.getInstance();

    public static final Long MYSQL_DEFAULT_PORT = 3306L;

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
    private static final String COLUMNS_QUERY =
            "select tab.table_name as table_name,\n" + "       col.ordinal_position as column_id,\n"
                    + "       col.column_name as column_name,\n"
                    + "       col.data_type as column_type,\n"
                    + "       col.is_nullable = 'YES' as is_nullable,\n"
                    + "       col.column_key,\n"
                    + "       col.extra\n"
                    + "from information_schema.tables as tab\n"
                    + "         inner join information_schema.columns as col\n"
                    + "                    on col.table_schema = tab.table_schema\n"
                    + "                        and col.table_name = tab.table_name\n"
                    + "where tab.table_type = 'BASE TABLE'\n"
                    + "  and tab.table_schema = database()\n"
                    + "order by tab.table_name,\n"
                    + "         col.ordinal_position;";

    /**
     * Example output for KEYS_QUERY:
     * +-----------------+-------------+------------+-----------------+-------------+----------------+---------------+----------------+
     * | CONSTRAINT_NAME | self_schema | self_table | constraint_type | self_column | foreign_schema | foreign_table | foreign_column |
     * +-----------------+-------------+------------+-----------------+-------------+----------------+---------------+----------------+
     * | PRIMARY         | mytestdb    | test       | p               | id          | NULL           | NULL          | NULL           |
     * +-----------------+-------------+------------+-----------------+-------------+----------------+---------------+----------------+
     */
    private static final String KEYS_QUERY = "select i.constraint_name,\n" + "       i.TABLE_SCHEMA as self_schema,\n"
            + "       i.table_name as self_table,\n"
            + "       if(i.constraint_type = 'FOREIGN KEY', 'f', 'p') as constraint_type,\n"
            + "       k.column_name as self_column, -- k.ordinal_position, k.position_in_unique_constraint,\n"
            + "       k.referenced_table_schema as foreign_schema,\n"
            + "       k.referenced_table_name as foreign_table,\n"
            + "       k.referenced_column_name as foreign_column\n"
            + "from information_schema.table_constraints i\n"
            + "         left join information_schema.key_column_usage k\n"
            + "             on i.constraint_name = k.constraint_name and i.table_name = k.table_name\n"
            + "where i.table_schema = database()\n"
            + "  and k.constraint_schema = database()\n"
            +
            // "  and i.enforced = 'YES'\n" +  // Looks like this is not available on all versions of MySQL.
            "  and i.constraint_type in ('FOREIGN KEY', 'PRIMARY KEY')\n"
            + "order by i.table_name, i.constraint_name, k.position_in_unique_constraint;";

    public MySqlPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Extension
    public static class MySqlPluginExecutor
            implements PluginExecutor<ConnectionContext<ConnectionPool>>, SmartSubstitutionInterface {

        private static final int PREPARED_STATEMENT_INDEX = 0;
        private final Scheduler scheduler = Schedulers.boundedElastic();

        /**
         * Instead of using the default executeParametrized provided by pluginExecutor, this implementation affords an opportunity
         * to use PreparedStatement (if configured) which requires the variable substitution, etc. to happen in a particular format
         * supported by PreparedStatement. In case of PreparedStatement turned off, the action and datasource configurations are
         * prepared (binding replacement) using PluginExecutor.variableSubstitution
         *
         * @param connectionContext              : This is the connection that is established to the data source. This connection is according
         *                                to the parameters in Datasource Configuration
         * @param executeActionDTO        : This is the data structure sent by the client during execute. This contains the params
         *                                which would be used for substitution
         * @param datasourceConfiguration : These are the configurations which have been used to create a Datasource from a Plugin
         * @param actionConfiguration     : These are the configurations which have been used to create an Action from a Datasource.
         * @return
         */
        @Override
        public Mono<ActionExecutionResult> executeParameterized(
                ConnectionContext<ConnectionPool> connectionContext,
                ExecuteActionDTO executeActionDTO,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            String printMessage =
                    Thread.currentThread().getName() + ": executeParameterized() called for MySQL plugin.";
            log.debug(printMessage);
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
            if (!StringUtils.hasLength(query)) {
                ActionExecutionResult errorResult = new ActionExecutionResult();
                errorResult.setIsExecutionSuccess(false);
                errorResult.setErrorInfo(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        MySQLErrorMessages.MISSING_PARAMETER_QUERY_ERROR_MSG));
                ActionExecutionRequest actionExecutionRequest = new ActionExecutionRequest();
                actionExecutionRequest.setProperties(requestData);
                errorResult.setRequest(actionExecutionRequest);
                return Mono.just(errorResult);
            }

            actionConfiguration.setBody(query.trim());

            // In case of non prepared statement, simply do binding replacement and execute
            if (FALSE.equals(isPreparedStatement)) {
                prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);
                return executeCommon(connectionContext, actionConfiguration, FALSE, null, null, requestData);
            }

            // This has to be executed as Prepared Statement
            // First extract all the bindings in order
            List<MustacheBindingToken> mustacheKeysInOrder = MustacheHelper.extractMustacheKeysInOrder(query);
            // Replace all the bindings with a ? as expected in a prepared statement.
            String updatedQuery = MustacheHelper.replaceMustacheWithQuestionMark(query, mustacheKeysInOrder);
            // Set the query with bindings extracted and replaced with '?' back in config
            actionConfiguration.setBody(updatedQuery);
            return executeCommon(
                    connectionContext, actionConfiguration, TRUE, mustacheKeysInOrder, executeActionDTO, requestData);
        }

        @Override
        public ActionConfiguration getSchemaPreviewActionConfig(Template queryTemplate, Boolean isMock) {
            String printMessage =
                    Thread.currentThread().getName() + ": getSchemaPreviewActionConfig() called for MySQL plugin.";
            log.debug(printMessage);
            ActionConfiguration actionConfig = new ActionConfiguration();
            // Sets query body
            actionConfig.setBody(queryTemplate.getBody());

            // Sets prepared statement to false
            Property preparedStatement = new Property();
            preparedStatement.setValue(false);
            List<Property> pluginSpecifiedTemplates = new ArrayList<Property>();
            pluginSpecifiedTemplates.add(preparedStatement);
            actionConfig.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);
            return actionConfig;
        }

        @Override
        public Mono<String> getEndpointIdentifierForRateLimit(DatasourceConfiguration datasourceConfiguration) {
            String printMessage =
                    Thread.currentThread().getName() + ": getEndpointIdentifierForRateLimit() called for MySQL plugin.";
            log.debug(printMessage);
            List<Endpoint> endpoints = datasourceConfiguration.getEndpoints();
            SSHConnection sshProxy = datasourceConfiguration.getSshProxy();
            String identifier = "";
            // When hostname and port both are available, both will be used as identifier
            // When port is not present, default port along with hostname will be used
            // This ensures rate limiting will only be applied if hostname is present
            if (endpoints.size() > 0) {
                String hostName = endpoints.get(0).getHost();
                if (!isBlank(hostName)) {
                    identifier = hostName + "_"
                            + SSHUtils.getDBPortFromConfigOrDefault(datasourceConfiguration, MYSQL_DEFAULT_PORT);
                }
            }

            if (SSHUtils.isSSHEnabled(datasourceConfiguration, CONNECTION_METHOD_INDEX)
                    && sshProxy != null
                    && !isBlank(sshProxy.getHost())) {
                identifier += "_" + sshProxy.getHost() + "_"
                        + SSHUtils.getSSHPortFromConfigOrDefault(datasourceConfiguration);
            }
            return Mono.just(identifier);
        }

        public Mono<ActionExecutionResult> executeCommon(
                ConnectionContext<ConnectionPool> connectionContext,
                ActionConfiguration actionConfiguration,
                Boolean preparedStatement,
                List<MustacheBindingToken> mustacheValuesInOrder,
                ExecuteActionDTO executeActionDTO,
                Map<String, Object> requestData) {
            String printMessage = Thread.currentThread().getName() + ": executeCommon() called for MySQL plugin.";
            log.debug(printMessage);
            ConnectionPool connectionPool = connectionContext.getConnection();
            SSHTunnelContext sshTunnelContext = connectionContext.getSshTunnelContext();
            String query = actionConfiguration.getBody();

            /**
             * TBD: check if this comment is resolved with the new MariaDB driver.
             * - MySQL r2dbc driver is not able to substitute the `True/False` value properly after the IS keyword.
             * Converting `True/False` to integer 1 or 0 also does not work in this case as MySQL syntax does not support
             * integers with IS keyword.
             * - I have raised an issue with r2dbc to track it: https://github.com/mirromutth/r2dbc-mysql/issues/200
             */
            String finalQuery = QueryUtils.removeQueryComments(query);

            if (preparedStatement && isIsOperatorUsed(finalQuery)) {
                return Mono.error(new AppsmithPluginException(
                        MySQLPluginError.IS_KEYWORD_NOT_ALLOWED_IN_PREPARED_STATEMENT,
                        MySQLErrorMessages.IS_KEYWORD_NOT_SUPPORTED_IN_PS_ERROR_MSG));
            }

            boolean isSelectOrShowOrDescQuery = getIsSelectOrShowOrDescQuery(finalQuery);

            final List<Map<String, Object>> rowsList = new ArrayList<>(50);
            final List<String> columnsList = new ArrayList<>();
            Map<String, Object> psParams = preparedStatement ? new LinkedHashMap<>() : null;
            String transformedQuery = preparedStatement ? replaceQuestionMarkWithDollarIndex(finalQuery) : finalQuery;
            List<RequestParamDTO> requestParams =
                    List.of(new RequestParamDTO(ACTION_CONFIGURATION_BODY, transformedQuery, null, null, psParams));
            Instant requestedAt = Instant.now();

            return Mono.usingWhen(
                            connectionPool.create(),
                            connection -> {
                                // TODO: add JUnit TC for the `connection.validate` check. Not sure how to do it at the
                                // moment.
                                Flux<Result> resultFlux = Mono.from(connection.validate(ValidationDepth.LOCAL))
                                        .timeout(Duration.ofSeconds(VALIDATION_CHECK_TIMEOUT))
                                        .onErrorMap(
                                                TimeoutException.class,
                                                error -> new StaleConnectionException(error.getMessage()))
                                        .map(isConnectionValid ->
                                                isConnectionValid && isSSHTunnelConnected(sshTunnelContext))
                                        .flatMapMany(isValid -> {
                                            if (isValid) {
                                                return createAndExecuteQueryFromConnection(
                                                        finalQuery,
                                                        connection,
                                                        preparedStatement,
                                                        mustacheValuesInOrder,
                                                        executeActionDTO,
                                                        requestData,
                                                        psParams);
                                            }
                                            return Flux.error(new StaleConnectionException(
                                                    CONNECTION_VALIDITY_CHECK_FAILED_ERROR_MSG));
                                        });

                                Mono<List<Map<String, Object>>> resultMono;
                                if (isSelectOrShowOrDescQuery) {
                                    resultMono = resultFlux
                                            .flatMap(result -> result.map((row, meta) -> {
                                                rowsList.add(getRow(row, meta));

                                                if (columnsList.isEmpty()) {
                                                    meta.getColumnMetadatas().stream()
                                                            .forEach(columnMetadata ->
                                                                    columnsList.add(columnMetadata.getName()));
                                                }

                                                return result;
                                            }))
                                            .collectList()
                                            .thenReturn(rowsList);
                                } else {
                                    resultMono = resultFlux
                                            .flatMap(Result::getRowsUpdated)
                                            .collectList()
                                            .map(list -> list.get(list.size() - 1))
                                            .map(rowsUpdated -> {
                                                rowsList.add(Map.of(
                                                        "affectedRows", ObjectUtils.defaultIfNull(rowsUpdated, 0)));
                                                return rowsList;
                                            });
                                }

                                // Adding connection pool logs in order to debug memroy leak issue
                                // Refer: https://github.com/appsmithorg/appsmith/issues/34028
                                Optional<PoolMetrics> poolMetricsOptional = connectionPool.getMetrics();
                                if (poolMetricsOptional.isPresent()) {
                                    PoolMetrics poolMetrics = poolMetricsOptional.get();
                                    log.debug("Execute query: connection Pool Metrics: Acquired: "
                                            + poolMetrics.acquiredSize() + ", Pending: "
                                            + poolMetrics.pendingAcquireSize() + ", Allocated: "
                                            + poolMetrics.allocatedSize() + ", idle: " + poolMetrics.idleSize()
                                            + ", Max allocations: " + poolMetrics.getMaxAllocatedSize()
                                            + ", Max pending acquire: " + poolMetrics.getMaxPendingAcquireSize());
                                }

                                return resultMono
                                        .map(res -> {
                                            ActionExecutionResult result = new ActionExecutionResult();
                                            log.debug(
                                                    Thread.currentThread().getName()
                                                            + ": objectMapper.valueToTree from MySQL plugin.");
                                            Stopwatch processStopwatch =
                                                    new Stopwatch("MySQL Plugin objectMapper valueToTree");
                                            result.setBody(objectMapper.valueToTree(rowsList));
                                            processStopwatch.stopAndLogTimeInMillisWithSysOut();
                                            result.setMessages(populateHintMessages(columnsList));
                                            result.setIsExecutionSuccess(true);
                                            log.debug("In the MySqlPlugin, got action execution result");
                                            return result;
                                        })
                                        .onErrorResume(error -> {
                                            if (error instanceof StaleConnectionException) {
                                                return Mono.error(error);
                                            } else if (error instanceof R2dbcBadGrammarException) {
                                                R2dbcBadGrammarException r2dbcBadGrammarException =
                                                        ((R2dbcBadGrammarException) error);
                                                error = new AppsmithPluginException(
                                                        MySQLPluginError.INVALID_QUERY_SYNTAX,
                                                        r2dbcBadGrammarException.getMessage(),
                                                        "SQLSTATE: " + r2dbcBadGrammarException.getSqlState());
                                            } else if (error instanceof R2dbcPermissionDeniedException) {
                                                R2dbcPermissionDeniedException r2dbcPermissionDeniedException =
                                                        (R2dbcPermissionDeniedException) error;
                                                error = new AppsmithPluginException(
                                                        MySQLPluginError.MISSING_REQUIRED_PERMISSION,
                                                        r2dbcPermissionDeniedException.getMessage(),
                                                        "SQLSTATE: " + r2dbcPermissionDeniedException.getSqlState());
                                            } else if (error instanceof R2dbcException) {
                                                R2dbcException r2dbcException = (R2dbcException) error;
                                                error = new AppsmithPluginException(
                                                        MySQLPluginError.QUERY_EXECUTION_FAILED,
                                                        MySQLErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG,
                                                        r2dbcException.getMessage(),
                                                        "SQLSTATE: " + r2dbcException.getSqlState());
                                            } else if (!(error instanceof AppsmithPluginException)) {
                                                error = new AppsmithPluginException(
                                                        MySQLPluginError.QUERY_EXECUTION_FAILED,
                                                        MySQLErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG,
                                                        error);
                                            }
                                            ActionExecutionResult result = new ActionExecutionResult();
                                            result.setIsExecutionSuccess(false);
                                            result.setErrorInfo(error);
                                            return Mono.just(result);
                                        })
                                        // Now set the request in the result to be returned to the server
                                        .map(actionExecutionResult -> {
                                            log.debug(
                                                    Thread.currentThread().getName()
                                                            + ": setting the request in actionExecutionResult from MySQL plugin.");
                                            ActionExecutionRequest request = new ActionExecutionRequest();
                                            request.setQuery(finalQuery);
                                            request.setProperties(requestData);
                                            request.setRequestParams(requestParams);
                                            if (request.getRequestedAt() == null) {
                                                request.setRequestedAt(requestedAt);
                                            }
                                            ActionExecutionResult result = actionExecutionResult;
                                            result.setRequest(request);

                                            return result;
                                        });
                            },
                            Connection::close)
                    .onErrorMap(TimeoutException.class, error -> new StaleConnectionException(error.getMessage()))
                    .onErrorMap(PoolShutdownException.class, error -> new StaleConnectionException(error.getMessage()))
                    .onErrorMap(
                            R2dbcNonTransientResourceException.class,
                            error -> new StaleConnectionException(error.getMessage()))
                    .onErrorMap(IllegalStateException.class, error -> new StaleConnectionException(error.getMessage()))
                    .subscribeOn(scheduler);
        }

        boolean isIsOperatorUsed(String query) {
            String queryKeyWordsOnly = query.replaceAll(MATCH_QUOTED_WORDS_REGEX, "");
            return Arrays.stream(queryKeyWordsOnly.split("\\s")).anyMatch(word -> IS_KEY.equalsIgnoreCase(word.trim()));
        }

        private Flux<Result> createAndExecuteQueryFromConnection(
                String query,
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

            log.debug("Query : " + query);

            List<Map.Entry<String, String>> parameters = new ArrayList<>();
            try {
                connectionStatement = (Statement) this.smartSubstitutionOfBindings(
                        connectionStatement, mustacheValuesInOrder, executeActionDTO.getParams(), parameters);

                requestData.put("ps-parameters", parameters);

                IntStream.range(0, parameters.size())
                        .forEachOrdered(i -> psParams.put(
                                getPSParamLabel(i + 1),
                                new PsParameterDTO(
                                        parameters.get(i).getKey(),
                                        parameters.get(i).getValue())));

            } catch (AppsmithPluginException e) {
                return Flux.error(e);
            }

            return Flux.from(connectionStatement.execute());
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(ConnectionContext<ConnectionPool> connectionContext) {
            String printMessage = Thread.currentThread().getName() + ": testDatasource() called for MySQL plugin.";
            log.debug(printMessage);
            ConnectionPool pool = connectionContext.getConnection();
            return Mono.just(pool)
                    .flatMap(p -> p.create())
                    .flatMap(conn -> Mono.from(conn.close()))
                    .then(Mono.just(new DatasourceTestResult()))
                    .onErrorResume(
                            error -> Mono.just(new DatasourceTestResult(mySqlErrorUtils.getReadableError(error))));
        }

        @Override
        public Object substituteValueInInput(
                int index,
                String binding,
                String value,
                Object input,
                List<Map.Entry<String, String>> insertedParams,
                Object... args) {

            Statement connectionStatement = (Statement) input;
            Param param = (Param) args[0];
            AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(
                    param.getClientDataType(), value, MySQLSpecificDataTypes.pluginSpecificTypes);
            Map.Entry<String, String> parameter =
                    new SimpleEntry<>(value, appsmithType.type().toString());
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
            if (!isEmpty(identicalColumns)) {
                messages.add("Your MySQL query result may not have all the columns because duplicate column names "
                        + "were found for the column(s): "
                        + String.join(", ", identicalColumns) + ". You may use the "
                        + "SQL keyword 'as' to rename the duplicate column name(s) and resolve this issue.");
            }

            return messages;
        }

        /**
         * 1. Parse the actual row objects returned by r2dbc driver for mysql statements.
         * 2. Return the row as a map {column_name -> column_value}.
         */
        private Map<String, Object> getRow(Row row, RowMetadata meta) {
            Iterator<ColumnDefinitionPacket> iterator =
                    (Iterator<ColumnDefinitionPacket>) meta.getColumnMetadatas().iterator();
            Map<String, Object> processedRow = new LinkedHashMap<>();

            while (iterator.hasNext()) {
                ColumnDefinitionPacket metaData = iterator.next();
                String columnName = metaData.getName();
                String javaTypeName = metaData.getJavaType().toString();
                String sqlColumnType = metaData.getDataType().name();
                Object columnValue = row.get(columnName);

                if (java.time.LocalDate.class.toString().equalsIgnoreCase(javaTypeName) && columnValue != null) {
                    columnValue = DateTimeFormatter.ISO_DATE.format(row.get(columnName, LocalDate.class));
                } else if ((java.time.LocalDateTime.class.toString().equalsIgnoreCase(javaTypeName))
                        && columnValue != null) {
                    columnValue = DateTimeFormatter.ISO_DATE_TIME.format(LocalDateTime.of(
                                    row.get(columnName, LocalDateTime.class).toLocalDate(),
                                    row.get(columnName, LocalDateTime.class).toLocalTime()))
                            + "Z";
                } else if (java.time.LocalTime.class.toString().equalsIgnoreCase(javaTypeName) && columnValue != null) {
                    columnValue = DateTimeFormatter.ISO_TIME.format(row.get(columnName, LocalTime.class));
                } else if (java.time.Year.class.toString().equalsIgnoreCase(javaTypeName) && columnValue != null) {
                    columnValue = row.get(columnName, LocalDate.class).getYear();
                } else if (columnValue != null && JSON_DB_TYPE.equals(sqlColumnType)) {
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
        boolean getIsSelectOrShowOrDescQuery(String query) {
            String[] queries = query.split(";");

            String lastQuery = queries[queries.length - 1].trim();

            return Arrays.asList("select", "show", "describe", "desc")
                    .contains(lastQuery.trim().split("\\s+")[0].toLowerCase());
        }

        @Override
        public Mono<ActionExecutionResult> execute(
                ConnectionContext connectionContext,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {
            // Unused function
            return Mono.error(new AppsmithPluginException(
                    MySQLPluginError.QUERY_EXECUTION_FAILED,
                    MySQLErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG,
                    "Unsupported Operation"));
        }

        @Override
        public Mono<ConnectionContext<ConnectionPool>> datasourceCreate(
                DatasourceConfiguration datasourceConfiguration) {
            String printMessage = Thread.currentThread().getName() + ": datasourceCreate() called for MySQL plugin.";
            log.debug(printMessage);
            return Mono.just(datasourceConfiguration).flatMap(ignore -> {
                ConnectionContext<ConnectionPool> connectionContext;
                try {
                    connectionContext = getConnectionContext(
                            datasourceConfiguration, CONNECTION_METHOD_INDEX, MYSQL_DEFAULT_PORT, ConnectionPool.class);
                    ConnectionPool pool = getNewConnectionPool(datasourceConfiguration, connectionContext);
                    connectionContext.setConnection(pool);
                    return Mono.just(connectionContext);
                } catch (AppsmithPluginException e) {
                    return Mono.error(e);
                }
            });
        }

        @Override
        public void datasourceDestroy(ConnectionContext<ConnectionPool> connectionContext) {
            String printMessage = Thread.currentThread().getName() + ": datasourceDestroy() called for MySQL plugin.";
            log.debug(printMessage);
            Mono.just(connectionContext)
                    .flatMap(ignore -> {
                        SSHTunnelContext sshTunnelContext = connectionContext.getSshTunnelContext();
                        if (sshTunnelContext != null) {
                            try {
                                /**
                                 * IMO, order of these operations is important here (not sure), this particular order
                                 * seems safe. e.g. if the thread is stopped first then there may be some issues with
                                 * closing the server socket or disconnecting client.
                                 */
                                sshTunnelContext.getServerSocket().close();
                                sshTunnelContext.getSshClient().disconnect();
                                sshTunnelContext.getThread().stop();
                            } catch (IOException e) {
                                log.debug("Failed to destroy SSH tunnel context: " + e.getMessage());
                            }
                        }

                        return Mono.empty();
                    })
                    .subscribeOn(scheduler)
                    .subscribe();

            /**
             * This database connection destroy can be scheduled independently of the previous SSH tunnel destroy
             * because they are not related to each other. They operate as independent units.
             */
            ConnectionPool connectionPool = connectionContext.getConnection();
            if (connectionPool != null) {
                connectionPool
                        .disposeLater()
                        .onErrorResume(exception -> {
                            log.debug("Could not destroy MySQL connection pool");
                            exception.printStackTrace();
                            return Mono.empty();
                        })
                        .subscribeOn(scheduler)
                        .subscribe();
            }
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            String printMessage = Thread.currentThread().getName() + ": validateDatasource() called for MySQL plugin.";
            log.debug(printMessage);
            return MySqlDatasourceUtils.validateDatasource(datasourceConfiguration);
        }

        @Override
        public Mono<DatasourceStructure> getStructure(
                ConnectionContext<ConnectionPool> connectionContext, DatasourceConfiguration datasourceConfiguration) {
            String printMessage = Thread.currentThread().getName() + ": getStructure() called for MySQL plugin.";
            log.debug(printMessage);
            final DatasourceStructure structure = new DatasourceStructure();
            final Map<String, DatasourceStructure.Table> tablesByName = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
            final Map<String, DatasourceStructure.Key> keyRegistry = new HashMap<>();

            ConnectionPool connectionPool = connectionContext.getConnection();
            SSHTunnelContext sshTunnelContext = connectionContext.getSshTunnelContext();
            return Mono.usingWhen(
                            connectionPool.create(),
                            connection -> Mono.from(connection.validate(ValidationDepth.LOCAL))
                                    .timeout(Duration.ofSeconds(VALIDATION_CHECK_TIMEOUT))
                                    .onErrorMap(
                                            TimeoutException.class,
                                            error -> new StaleConnectionException(error.getMessage()))
                                    .map(isConnectionValid ->
                                            isConnectionValid && isSSHTunnelConnected(sshTunnelContext))
                                    .flatMapMany(isValid -> {
                                        // Adding connection pool logs in order to debug memroy leak issue
                                        // Refer: https://github.com/appsmithorg/appsmith/issues/34028
                                        Optional<PoolMetrics> poolMetricsOptional = connectionPool.getMetrics();
                                        if (poolMetricsOptional.isPresent()) {
                                            PoolMetrics poolMetrics = poolMetricsOptional.get();
                                            log.debug("Get structure: connection Pool Metrics: Acquired: "
                                                    + poolMetrics.acquiredSize() + ", Pending: "
                                                    + poolMetrics.pendingAcquireSize() + ", Allocated: "
                                                    + poolMetrics.allocatedSize() + ", idle: " + poolMetrics.idleSize()
                                                    + ", Max allocations: " + poolMetrics.getMaxAllocatedSize()
                                                    + ", Max pending acquire: "
                                                    + poolMetrics.getMaxPendingAcquireSize());
                                        }
                                        if (isValid) {
                                            return connection
                                                    .createStatement(COLUMNS_QUERY)
                                                    .execute();
                                        } else {
                                            return Flux.error(new StaleConnectionException(
                                                    CONNECTION_VALIDITY_CHECK_FAILED_ERROR_MSG));
                                        }
                                    })
                                    .flatMap(result -> {
                                        return result.map((row, meta) -> {
                                            getTableInfo(row, meta, tablesByName);

                                            return result;
                                        });
                                    })
                                    .collectList()
                                    .thenMany(Flux.from(connection
                                            .createStatement(KEYS_QUERY)
                                            .execute()))
                                    .flatMap(result -> {
                                        return result.map((row, meta) -> {
                                            getKeyInfo(row, meta, tablesByName, keyRegistry);

                                            return result;
                                        });
                                    })
                                    .collectList()
                                    .map(list -> {
                                        log.debug(
                                                Thread.currentThread().getName() + ": getTemplates from MySQL plugin.");
                                        /* Get templates for each table and put those in. */
                                        getTemplates(tablesByName);
                                        structure.setTables(new ArrayList<>(tablesByName.values()));
                                        for (DatasourceStructure.Table table : structure.getTables()) {
                                            table.getKeys().sort(Comparator.naturalOrder());
                                        }

                                        return structure;
                                    })
                                    .onErrorMap(e -> {
                                        if (!(e instanceof AppsmithPluginException)
                                                && !(e instanceof StaleConnectionException)) {
                                            return new AppsmithPluginException(
                                                    AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR,
                                                    MySQLErrorMessages.GET_STRUCTURE_ERROR_MSG,
                                                    e.getMessage());
                                        }

                                        return e;
                                    }),
                            Connection::close)
                    .onErrorMap(TimeoutException.class, error -> new StaleConnectionException(error.getMessage()))
                    .onErrorMap(PoolShutdownException.class, error -> new StaleConnectionException(error.getMessage()))
                    .subscribeOn(scheduler);
        }
    }
}

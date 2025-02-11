package com.external.plugins;

import com.appsmith.external.configurations.connectionpool.ConnectionPoolConfig;
import com.appsmith.external.constants.DataType;
import com.appsmith.external.datatypes.AppsmithType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.helpers.DataTypeServiceUtils;
import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.helpers.Stopwatch;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.PsParameterDTO;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.external.plugins.exceptions.MssqlErrorMessages;
import com.external.plugins.exceptions.MssqlPluginError;
import com.external.plugins.utils.MssqlDatasourceUtils;
import com.external.plugins.utils.MssqlExecuteUtils;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.pool.HikariPool;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.ObjectUtils;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Time;
import java.sql.Timestamp;
import java.sql.Types;
import java.text.MessageFormat;
import java.time.Duration;
import java.util.AbstractMap.SimpleEntry;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.IntStream;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.constants.PluginConstants.PluginName.MSSQL_PLUGIN_NAME;
import static com.appsmith.external.helpers.PluginUtils.getIdenticalColumns;
import static com.appsmith.external.helpers.PluginUtils.getPSParamLabel;
import static com.appsmith.external.helpers.SmartSubstitutionHelper.replaceQuestionMarkWithDollarIndex;
import static com.external.plugins.constants.MssqlPluginConstants.GENERATE_CRUD_PAGE_SELECT_QUERY;
import static com.external.plugins.exceptions.MssqlErrorMessages.CONNECTION_CLOSED_ERROR_MSG;
import static com.external.plugins.exceptions.MssqlErrorMessages.CONNECTION_INVALID_ERROR_MSG;
import static com.external.plugins.exceptions.MssqlErrorMessages.CONNECTION_NULL_ERROR_MSG;
import static com.external.plugins.utils.MssqlDatasourceUtils.logHikariCPStatus;
import static com.external.plugins.utils.MssqlExecuteUtils.closeConnectionPostExecution;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.apache.commons.lang3.StringUtils.isBlank;
import static org.springframework.util.CollectionUtils.isEmpty;

@Slf4j
public class MssqlPlugin extends BasePlugin {

    private static final String JDBC_DRIVER = "com.microsoft.sqlserver.jdbc.SQLServerDriver";

    private static final int VALIDITY_CHECK_TIMEOUT = 5;

    private static final int MINIMUM_POOL_SIZE = 5;

    private static final int MAXIMUM_POOL_SIZE = 10;

    private static final long LEAK_DETECTION_TIME_MS = 60 * 1000;

    private static final long MS_SQL_DEFAULT_PORT = 1433L;

    public static final MssqlDatasourceUtils mssqlDatasourceUtils = new MssqlDatasourceUtils();

    public MssqlPlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    /**
     * MsSQL plugin receives the query as json of the following format :
     */
    @Extension
    public static class MssqlPluginExecutor implements PluginExecutor<HikariDataSource>, SmartSubstitutionInterface {

        public static final Scheduler scheduler = Schedulers.boundedElastic();

        private static final int PREPARED_STATEMENT_INDEX = 0;

        private final ConnectionPoolConfig connectionPoolConfig;

        public MssqlPluginExecutor(ConnectionPoolConfig connectionPoolConfig) {
            this.connectionPoolConfig = connectionPoolConfig;
        }

        /**
         * Instead of using the default executeParametrized provided by pluginExecutor, this implementation affords an opportunity
         * to use PreparedStatement (if configured) which requires the variable substitution, etc. to happen in a particular format
         * supported by PreparedStatement. In case of PreparedStatement turned off, the action and datasource configurations are
         * prepared (binding replacement) using PluginExecutor.variableSubstitution
         *
         * @param hikariDSConnection      : This is the connection that is established to the data source. This connection is according
         *                                to the parameters in Datasource Configuration
         * @param executeActionDTO        : This is the data structure sent by the client during execute. This contains the params
         *                                which would be used for substitution
         * @param datasourceConfiguration : These are the configurations which have been used to create a Datasource from a Plugin
         * @param actionConfiguration     : These are the configurations which have been used to create an Action from a Datasource.
         * @return
         */
        @Override
        public Mono<ActionExecutionResult> executeParameterized(
                HikariDataSource hikariDSConnection,
                ExecuteActionDTO executeActionDTO,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            log.debug(Thread.currentThread().getName() + ": executeParameterized() called for MSSQL plugin.");
            String query = actionConfiguration.getBody();
            // Check for query parameter before performing the probably expensive fetch connection from the pool op.
            if (!StringUtils.hasLength(query)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR, MssqlErrorMessages.MISSING_QUERY_ERROR_MSG));
            }

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

            // In case of non-prepared statement, simply do bind replacement and execute
            if (FALSE.equals(isPreparedStatement)) {
                prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);
                return executeCommon(hikariDSConnection, actionConfiguration, FALSE, null, null);
            }

            // Prepared statement
            // First extract all the bindings in order
            List<MustacheBindingToken> mustacheKeysInOrder = MustacheHelper.extractMustacheKeysInOrder(query);
            // Replace all the bindings with a `?` as expected in a prepared statement.
            String updatedQuery = MustacheHelper.replaceMustacheWithQuestionMark(query, mustacheKeysInOrder);
            actionConfiguration.setBody(updatedQuery);
            return executeCommon(hikariDSConnection, actionConfiguration, TRUE, mustacheKeysInOrder, executeActionDTO);
        }

        public Mono<ActionExecutionResult> executeCommon(
                HikariDataSource hikariDSConnection,
                ActionConfiguration actionConfiguration,
                Boolean preparedStatement,
                List<MustacheBindingToken> mustacheValuesInOrder,
                ExecuteActionDTO executeActionDTO) {

            log.debug(Thread.currentThread().getName() + ": executeCommon() called for MSSQL plugin.");
            final Map<String, Object> requestData = new HashMap<>();
            requestData.put("preparedStatement", TRUE.equals(preparedStatement) ? true : false);

            String query = actionConfiguration.getBody();
            Map<String, Object> psParams = preparedStatement ? new LinkedHashMap<>() : null;
            String transformedQuery = preparedStatement ? replaceQuestionMarkWithDollarIndex(query) : query;
            List<RequestParamDTO> requestParams =
                    List.of(new RequestParamDTO(ACTION_CONFIGURATION_BODY, transformedQuery, null, null, psParams));

            return Mono.fromCallable(() -> {
                        log.debug(Thread.currentThread().getName() + ": within mono callable from MSSQL plugin.");
                        boolean isResultSet;
                        Connection sqlConnectionFromPool;
                        Statement statement = null;
                        PreparedStatement preparedQuery = null;
                        ResultSet resultSet = null;
                        List<Map<String, Object>> rowsList = new ArrayList<>(50);
                        final List<String> columnsList = new ArrayList<>();

                        try {
                            sqlConnectionFromPool = mssqlDatasourceUtils.getConnectionFromHikariConnectionPool(
                                    hikariDSConnection, MSSQL_PLUGIN_NAME);
                        } catch (SQLException | StaleConnectionException e) {
                            // The function can throw either StaleConnectionException or SQLException. The underlying
                            // hikari
                            // library throws SQLException in case the pool is closed or there is an issue initializing
                            // the connection pool which can also be translated in our world to StaleConnectionException
                            // and should then trigger the destruction and recreation of the pool.
                            return Mono.error(
                                    e instanceof StaleConnectionException
                                            ? e
                                            : new StaleConnectionException(e.getMessage()));
                        }

                        try {
                            if (sqlConnectionFromPool == null
                                    || sqlConnectionFromPool.isClosed()
                                    || !sqlConnectionFromPool.isValid(VALIDITY_CHECK_TIMEOUT)) {
                                log.debug("Encountered stale connection in MsSQL plugin. Reporting back.");

                                if (sqlConnectionFromPool == null) {
                                    return Mono.error(new StaleConnectionException(CONNECTION_NULL_ERROR_MSG));
                                } else if (sqlConnectionFromPool.isClosed()) {
                                    return Mono.error(new StaleConnectionException(CONNECTION_CLOSED_ERROR_MSG));
                                } else {
                                    /**
                                     * Not adding explicit `!sqlConnectionFromPool.isValid(VALIDITY_CHECK_TIMEOUT)`
                                     * check here because this check may take few seconds to complete hence adding
                                     * extra time delay.
                                     */
                                    return Mono.error(new StaleConnectionException(CONNECTION_INVALID_ERROR_MSG));
                                }
                            }
                        } catch (SQLException error) {
                            // This exception is thrown only when the timeout to `isValid` is negative. Since, that's
                            // not the case,
                            // here, this should never happen.
                            log.error("Error checking validity of MsSQL connection.");
                            error.printStackTrace();
                        }

                        // Log HikariCP status
                        logHikariCPStatus(
                                MessageFormat.format("Before executing Mssql query [{0}]", query), hikariDSConnection);
                        ;

                        try {
                            if (FALSE.equals(preparedStatement)) {
                                statement = sqlConnectionFromPool.createStatement();
                                isResultSet = statement.execute(query);
                                resultSet = statement.getResultSet();
                            } else {
                                preparedQuery = sqlConnectionFromPool.prepareStatement(query);

                                List<Map.Entry<String, String>> parameters = new ArrayList<>();
                                preparedQuery = (PreparedStatement) smartSubstitutionOfBindings(
                                        preparedQuery, mustacheValuesInOrder, executeActionDTO.getParams(), parameters);

                                requestData.put("ps-parameters", parameters);

                                IntStream.range(0, parameters.size())
                                        .forEachOrdered(i -> psParams.put(
                                                getPSParamLabel(i + 1),
                                                new PsParameterDTO(
                                                        parameters.get(i).getKey(),
                                                        parameters.get(i).getValue())));

                                isResultSet = preparedQuery.execute();
                                resultSet = preparedQuery.getResultSet();
                            }

                            MssqlExecuteUtils.populateRowsAndColumns(
                                    rowsList,
                                    columnsList,
                                    resultSet,
                                    isResultSet,
                                    preparedStatement,
                                    statement,
                                    preparedQuery);

                        } catch (SQLException e) {
                            return Mono.error(new AppsmithPluginException(
                                    MssqlPluginError.QUERY_EXECUTION_FAILED,
                                    MssqlErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG,
                                    e.getMessage(),
                                    "SQLSTATE: " + e.getSQLState()));

                        } finally {
                            // Log HikariCP status
                            logHikariCPStatus(
                                    MessageFormat.format("After executing Mssql query [{0}]", query),
                                    hikariDSConnection);

                            closeConnectionPostExecution(resultSet, statement, preparedQuery, sqlConnectionFromPool);
                        }

                        ActionExecutionResult result = new ActionExecutionResult();
                        log.debug(Thread.currentThread().getName()
                                + ": objectMapper.valueToTree invoked from MSSQL plugin.");
                        Stopwatch processStopwatch = new Stopwatch("MSSQL Plugin objectMapper valueToTree");
                        result.setBody(objectMapper.valueToTree(rowsList));
                        processStopwatch.stopAndLogTimeInMillis();
                        result.setMessages(populateHintMessages(columnsList));
                        result.setIsExecutionSuccess(true);
                        return Mono.just(result);
                    })
                    .flatMap(obj -> obj)
                    .map(obj -> (ActionExecutionResult) obj)
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
                        log.debug(Thread.currentThread().getName()
                                + ": setting request in the actionExecutionResult from MSSQL plugin.");
                        ActionExecutionRequest request = new ActionExecutionRequest();
                        request.setQuery(query);
                        request.setProperties(requestData);
                        request.setRequestParams(requestParams);
                        ActionExecutionResult result = actionExecutionResult;
                        result.setRequest(request);
                        return result;
                    })
                    .timeout(Duration.ofMillis(actionConfiguration.getTimeoutInMillisecond()))
                    .subscribeOn(scheduler);
        }

        private Set<String> populateHintMessages(List<String> columnNames) {

            Set<String> messages = new HashSet<>();

            List<String> identicalColumns = getIdenticalColumns(columnNames);
            if (!isEmpty(identicalColumns)) {
                messages.add("Your MsSQL query result may not have all the columns because duplicate column names "
                        + "were found for the column(s): "
                        + String.join(", ", identicalColumns) + ". You may use the "
                        + "SQL keyword 'as' to rename the duplicate column name(s) and resolve this issue.");
            }

            return messages;
        }

        @Override
        public Mono<HikariDataSource> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            log.debug(Thread.currentThread().getName() + ": datasourceCreate() called for MSSQL plugin.");
            return Mono.defer(() -> connectionPoolConfig
                            .getMaxConnectionPoolSize()
                            .flatMap(maxPoolSize -> {
                                return Mono.fromCallable(() -> {
                                            log.debug(
                                                    Thread.currentThread().getName() + ": Connecting to SQL Server db");
                                            return createConnectionPool(datasourceConfiguration, maxPoolSize);
                                        })
                                        .subscribeOn(scheduler);
                            }))
                    .subscribeOn(scheduler);
        }

        @Override
        public void datasourceDestroy(HikariDataSource connection) {
            if (connection != null) {
                connection.close();
            }
        }

        @Override
        public Set<String> validateDatasource(@NonNull DatasourceConfiguration datasourceConfiguration) {
            log.debug(Thread.currentThread().getName() + ": validateDatasource() called for MSSQL plugin.");
            Set<String> invalids = new HashSet<>();

            if (isEmpty(datasourceConfiguration.getEndpoints())) {
                invalids.add(MssqlErrorMessages.DS_MISSING_ENDPOINT_ERROR_MSG);
            }

            if (datasourceConfiguration.getConnection() != null
                    && datasourceConfiguration.getConnection().getMode() == null) {
                invalids.add(MssqlErrorMessages.DS_MISSING_CONNECTION_MODE_ERROR_MSG);
            }

            DBAuth auth = (DBAuth) datasourceConfiguration.getAuthentication();
            if (auth == null) {
                invalids.add(MssqlErrorMessages.DS_MISSING_AUTHENTICATION_DETAILS_ERROR_MSG);

            } else {
                if (StringUtils.isEmpty(auth.getUsername())) {
                    invalids.add(MssqlErrorMessages.DS_MISSING_USERNAME_ERROR_MSG);
                }

                if (StringUtils.isEmpty(auth.getPassword())) {
                    invalids.add(MssqlErrorMessages.DS_MISSING_PASSWORD_ERROR_MSG);
                }
            }

            return invalids;
        }

        @Override
        public Mono<ActionExecutionResult> execute(
                HikariDataSource connection,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {
            // Unused function
            return Mono.error(new AppsmithPluginException(
                    MssqlPluginError.QUERY_EXECUTION_FAILED,
                    MssqlErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG,
                    "Unsupported Operation"));
        }

        @Override
        public Mono<DatasourceStructure> getStructure(
                HikariDataSource connection, DatasourceConfiguration datasourceConfiguration) {
            log.debug(Thread.currentThread().getName() + ": getStructure() called for MSSQL plugin.");
            return MssqlDatasourceUtils.getStructure(connection, datasourceConfiguration);
        }

        @Override
        public Object substituteValueInInput(
                int index,
                String binding,
                String value,
                Object input,
                List<Map.Entry<String, String>> insertedParams,
                Object... args)
                throws AppsmithPluginException {

            PreparedStatement preparedStatement = (PreparedStatement) input;
            Param param = (Param) args[0];
            AppsmithType appsmithType = DataTypeServiceUtils.getAppsmithType(param.getClientDataType(), value);
            DataType valueType = appsmithType.type();

            Map.Entry<String, String> parameter = new SimpleEntry<>(value, valueType.toString());
            insertedParams.add(parameter);

            try {
                switch (valueType) {
                    case NULL: {
                        preparedStatement.setNull(index, Types.NULL);
                        break;
                    }
                    case BINARY: {
                        preparedStatement.setBinaryStream(index, IOUtils.toInputStream(value));
                        break;
                    }
                    case BYTES: {
                        preparedStatement.setBytes(index, value.getBytes("UTF-8"));
                        break;
                    }
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
                    case DATE: {
                        preparedStatement.setDate(index, Date.valueOf(value));
                        break;
                    }
                    case TIME: {
                        preparedStatement.setTime(index, Time.valueOf(value));
                        break;
                    }
                    case TIMESTAMP: {
                        preparedStatement.setTimestamp(index, Timestamp.valueOf(value));
                        break;
                    }
                    case ARRAY: {
                        throw new IllegalArgumentException("Array datatype is not supported in MS SQL");
                    }
                    case STRING: {
                        preparedStatement.setString(index, value);
                        break;
                    }
                    default:
                        break;
                }

            } catch (SQLException | IllegalArgumentException | IOException e) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        String.format(MssqlErrorMessages.QUERY_PREPARATION_FAILED_ERROR_MSG, binding),
                        e.getMessage());
            }

            return preparedStatement;
        }

        /**
         * MsSQL plugin makes use of a common template that is available for SQL query which is also used for other SQL
         * type plugins e.g. Postgres to create select, insert, update, delete, find queries for the CRUD page. In
         * case of MsSQL the  template select query needs to be replaced because its syntax does not match with MsSQL
         * syntax. Hence, this method updates the template select query with the correct syntax select query for MsSQL.
         */
        @Override
        public Mono<Void> sanitizeGenerateCRUDPageTemplateInfo(
                List<ActionConfiguration> actionConfigurationList, Object... args) {
            if (isEmpty(actionConfigurationList)) {
                return Mono.empty();
            }

            /* Find the actionConfiguration containing select query */
            Optional<ActionConfiguration> selectQueryConfigOptional = actionConfigurationList.stream()
                    .filter(actionConfiguration -> actionConfiguration.getBody().contains("SELECT"))
                    .findFirst();

            if (selectQueryConfigOptional.isPresent()) {
                ActionConfiguration selectQueryActionConfiguration = selectQueryConfigOptional.get();
                selectQueryActionConfiguration.setBody(GENERATE_CRUD_PAGE_SELECT_QUERY);
            }

            return Mono.empty();
        }

        @Override
        public Mono<String> getEndpointIdentifierForRateLimit(DatasourceConfiguration datasourceConfiguration) {
            List<Endpoint> endpoints = datasourceConfiguration.getEndpoints();
            String identifier = "";
            // When hostname and port both are available, both will be used as identifier
            // When port is not present, default port along with hostname will be used
            // This ensures rate limiting will only be applied if hostname is present
            if (endpoints.size() > 0) {
                String hostName = endpoints.get(0).getHost();
                Long port = endpoints.get(0).getPort();
                if (!isBlank(hostName)) {
                    identifier = hostName + "_" + ObjectUtils.defaultIfNull(port, MS_SQL_DEFAULT_PORT);
                }
            }
            return Mono.just(identifier);
        }
    }

    public static long getPort(Endpoint endpoint) {

        if (endpoint.getPort() == null) {
            return MS_SQL_DEFAULT_PORT;
        }

        return endpoint.getPort();
    }

    /**
     * This function is blocking in nature which connects to the database and creates a connection pool
     *
     * @param datasourceConfiguration
     * @return connection pool
     */
    private static HikariDataSource createConnectionPool(
            DatasourceConfiguration datasourceConfiguration, Integer maxPoolSize) throws AppsmithPluginException {

        DBAuth authentication = null;
        StringBuilder urlBuilder = null;
        HikariConfig hikariConfig = null;
        HikariDataSource hikariDatasource = null;

        hikariConfig = new HikariConfig();
        hikariConfig.setDriverClassName(JDBC_DRIVER);
        hikariConfig.setMinimumIdle(MINIMUM_POOL_SIZE);

        // Use maxPoolSize from config if available, otherwise use default
        int maximumPoolSize = maxPoolSize != null ? maxPoolSize : MAXIMUM_POOL_SIZE;
        hikariConfig.setMaximumPoolSize(maximumPoolSize);

        // Configuring leak detection threshold for 60 seconds. Any connection which hasn't been released in 60 seconds
        // should get tracked (may be falsely for long running queries) as leaked connection
        hikariConfig.setLeakDetectionThreshold(LEAK_DETECTION_TIME_MS);

        authentication = (DBAuth) datasourceConfiguration.getAuthentication();
        if (authentication.getUsername() != null) {
            hikariConfig.setUsername(authentication.getUsername());
        }
        if (authentication.getPassword() != null) {
            hikariConfig.setPassword(authentication.getPassword());
        }

        urlBuilder = new StringBuilder("jdbc:sqlserver://");
        for (Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
            urlBuilder
                    .append(endpoint.getHost())
                    .append(":")
                    .append(getPort(endpoint))
                    .append(";");
        }

        if (StringUtils.hasLength(authentication.getDatabaseName())) {
            urlBuilder
                    .append("database=")
                    .append(authentication.getDatabaseName())
                    .append(";");
        }

        addSslOptionsToUrlBuilder(datasourceConfiguration, urlBuilder);

        hikariConfig.setJdbcUrl(urlBuilder.toString());

        try {
            hikariDatasource = new HikariDataSource(hikariConfig);
        } catch (HikariPool.PoolInitializationException e) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    MssqlErrorMessages.CONNECTION_POOL_CREATION_FAILED_ERROR_MSG,
                    e.getMessage());
        }

        return hikariDatasource;
    }

    private static void addSslOptionsToUrlBuilder(
            DatasourceConfiguration datasourceConfiguration, StringBuilder urlBuilder) throws AppsmithPluginException {
        /*
         * - Ideally, it is never expected to be null because the SSL dropdown is set to a initial value.
         */
        if (datasourceConfiguration.getConnection() == null
                || datasourceConfiguration.getConnection().getSsl() == null
                || datasourceConfiguration.getConnection().getSsl().getAuthType() == null) {
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_ERROR,
                    "Appsmith server has failed to fetch SSL configuration from datasource configuration form. "
                            + "Please reach out to Appsmith customer support to resolve this.");
        }

        /*
         * - By default, the driver configures SSL in the no verify mode.
         */
        SSLDetails.AuthType sslAuthType =
                datasourceConfiguration.getConnection().getSsl().getAuthType();
        switch (sslAuthType) {
            case DISABLE:
                urlBuilder.append("encrypt=false;");

                break;
            case NO_VERIFY:
                urlBuilder.append("encrypt=true;");
                urlBuilder.append("trustServerCertificate=true;");

                break;
            default:
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_ERROR,
                        "Appsmith server has found an unexpected SSL option: " + sslAuthType + ". Please reach out to"
                                + " Appsmith customer support to resolve this.");
        }
    }
}

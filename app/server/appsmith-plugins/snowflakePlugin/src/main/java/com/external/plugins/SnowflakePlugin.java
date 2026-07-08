package com.external.plugins;

import com.appsmith.external.constants.DataType;
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
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.KeyPairAuth;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.PsParameterDTO;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.external.plugins.SmartSubstitutionInterface;
import com.external.plugins.exceptions.SnowflakeErrorMessages;
import com.external.utils.SnowflakeKeyUtils;
import com.external.utils.SqlUtils;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import com.zaxxer.hikari.pool.HikariPool;
import lombok.extern.slf4j.Slf4j;
import net.snowflake.client.jdbc.SnowflakeBasicDataSource;
import org.apache.commons.io.IOUtils;
import org.bouncycastle.pkcs.PKCSException;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.math.BigDecimal;
import java.security.PrivateKey;
import java.sql.*;
import java.util.*;
import java.util.AbstractMap.SimpleEntry;
import java.util.stream.IntStream;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static com.appsmith.external.constants.Authentication.DB_AUTH;
import static com.appsmith.external.constants.Authentication.SNOWFLAKE_KEY_PAIR_AUTH;
import static com.appsmith.external.constants.PluginConstants.PluginName.SNOWFLAKE_PLUGIN_NAME;
import static com.appsmith.external.helpers.PluginUtils.getPSParamLabel;
import static com.appsmith.external.helpers.SmartSubstitutionHelper.replaceQuestionMarkWithDollarIndex;
import static com.external.utils.ExecutionUtils.getRowsFromPreparedStatement;
import static com.external.utils.ExecutionUtils.getRowsFromQueryResult;
import static com.external.utils.SnowflakeDatasourceUtils.getConnectionFromHikariConnectionPool;
import static com.external.utils.ValidationUtils.validateWarehouseDatabaseSchema;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

@Slf4j
public class SnowflakePlugin extends BasePlugin {

    static final String JDBC_DRIVER = "net.snowflake.client.jdbc.SnowflakeDriver";

    private static final int MINIMUM_POOL_SIZE = 1;

    private static final int MAXIMUM_POOL_SIZE = 5;
    private static final int CONNECTION_TIMEOUT_MILLISECONDS = 25000;

    private static final String SNOWFLAKE_DB_LOGIN_TIMEOUT_PROPERTY_KEY = "loginTimeout";

    private static final int SNOWFLAKE_DB_LOGIN_TIMEOUT_VALUE_SEC = 15;

    public SnowflakePlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Extension
    public static class SnowflakePluginExecutor
            implements PluginExecutor<HikariDataSource>, SmartSubstitutionInterface {

        private final Scheduler scheduler = Schedulers.boundedElastic();

        // Index of the "Use prepared statements" toggle within actionConfiguration.pluginSpecifiedTemplates.
        private static final int PREPARED_STATEMENT_INDEX = 0;

        /**
         * Overriding the default executeParameterized so that dynamic bindings ({{...}}) can be bound as
         * PreparedStatement parameters instead of being substituted into the SQL text. When the user disables
         * prepared statements (to bind identifiers/fragments that a PreparedStatement cannot parameterize), we
         * fall back to the default mustache substitution path, matching the Postgres/MySQL/MSSQL plugins.
         */
        @Override
        public Mono<ActionExecutionResult> executeParameterized(
                HikariDataSource connection,
                ExecuteActionDTO executeActionDTO,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            log.debug(Thread.currentThread().getName() + ": executeParameterized() called for Snowflake plugin.");
            String query = actionConfiguration.getBody();

            if (!StringUtils.hasLength(query)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        SnowflakeErrorMessages.MISSING_QUERY_ERROR_MSG));
            }

            Boolean isPreparedStatement;
            final List<Property> properties = actionConfiguration.getPluginSpecifiedTemplates();
            if (properties == null
                    || properties.size() <= PREPARED_STATEMENT_INDEX
                    || properties.get(PREPARED_STATEMENT_INDEX) == null) {
                // In case the prepared statement configuration is missing, default to true (safe by default).
                isPreparedStatement = true;
            } else {
                Object psValue = properties.get(PREPARED_STATEMENT_INDEX).getValue();
                if (psValue instanceof Boolean) {
                    isPreparedStatement = (Boolean) psValue;
                } else if (psValue instanceof String) {
                    // Only an explicit "false" disables prepared statements; any other value keeps it enabled.
                    isPreparedStatement = !"false".equalsIgnoreCase(((String) psValue).trim());
                } else {
                    isPreparedStatement = true;
                }
            }

            // In case of non-prepared statement, simply do bind replacement and execute the raw statement.
            if (FALSE.equals(isPreparedStatement)) {
                prepareConfigurationsForExecution(executeActionDTO, actionConfiguration, datasourceConfiguration);
                return executeCommon(connection, actionConfiguration, FALSE, null, null);
            }

            // Prepared statement: replace every binding with a `?` and bind the values on the PreparedStatement.
            List<MustacheBindingToken> mustacheKeysInOrder = MustacheHelper.extractMustacheKeysInOrder(query);
            String updatedQuery = MustacheHelper.replaceMustacheWithQuestionMark(query, mustacheKeysInOrder);
            actionConfiguration.setBody(updatedQuery);
            return executeCommon(connection, actionConfiguration, TRUE, mustacheKeysInOrder, executeActionDTO);
        }

        @Override
        public Mono<ActionExecutionResult> execute(
                HikariDataSource connection,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {
            // Raw (non-parameterized) execution path. Reached only when prepared statements are disabled, after
            // the framework has already performed mustache substitution on the action configuration.
            return executeCommon(connection, actionConfiguration, FALSE, null, null);
        }

        private Mono<ActionExecutionResult> executeCommon(
                HikariDataSource connection,
                ActionConfiguration actionConfiguration,
                Boolean preparedStatement,
                List<MustacheBindingToken> mustacheValuesInOrder,
                ExecuteActionDTO executeActionDTO) {

            log.debug(Thread.currentThread().getName() + ": executeCommon() called for Snowflake plugin.");
            String query = actionConfiguration.getBody();

            if (!StringUtils.hasLength(query)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        SnowflakeErrorMessages.MISSING_QUERY_ERROR_MSG));
            }

            final Map<String, Object> requestData = new HashMap<>();
            requestData.put("preparedStatement", TRUE.equals(preparedStatement));
            Map<String, Object> psParams = TRUE.equals(preparedStatement) ? new LinkedHashMap<>() : null;
            String transformedQuery =
                    TRUE.equals(preparedStatement) ? replaceQuestionMarkWithDollarIndex(query) : query;
            List<RequestParamDTO> requestParams =
                    List.of(new RequestParamDTO(ACTION_CONFIGURATION_BODY, transformedQuery, null, null, psParams));

            return Mono.fromCallable(() -> {
                        log.debug(Thread.currentThread().getName() + ": Execute Snowflake Query");
                        Connection connectionFromPool;

                        try {
                            /**
                             * The getConnectionFromHikariConnectionPool method used here is the duplicate of
                             * method defined in PluginUtils.java and not the same one. Please check the comment on
                             * the method definition to understand more.
                             */
                            connectionFromPool =
                                    getConnectionFromHikariConnectionPool(connection, SNOWFLAKE_PLUGIN_NAME);
                        } catch (SQLException | StaleConnectionException e) {
                            if (e instanceof StaleConnectionException) {
                                throw e;
                            } else {
                                throw new StaleConnectionException(e.getMessage());
                            }
                        }

                        HikariPoolMXBean poolProxy = connection.getHikariPoolMXBean();

                        int idleConnections = poolProxy.getIdleConnections();
                        int activeConnections = poolProxy.getActiveConnections();
                        int totalConnections = poolProxy.getTotalConnections();
                        int threadsAwaitingConnection = poolProxy.getThreadsAwaitingConnection();
                        log.debug(String.format(
                                "Before executing snowflake query [%s] Hikari Pool stats: active - %d, idle - %d, awaiting - %d, total - %d",
                                query,
                                activeConnections,
                                idleConnections,
                                threadsAwaitingConnection,
                                totalConnections));

                        // Declared outside the try so the prepared statement is always closed in the finally,
                        // even if binding a parameter throws before execution.
                        PreparedStatement preparedQuery = null;
                        try {
                            // Connection staleness is checked as part of these method calls.
                            if (FALSE.equals(preparedStatement)) {
                                return getRowsFromQueryResult(connectionFromPool, query);
                            }

                            preparedQuery = connectionFromPool.prepareStatement(query);
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

                            return getRowsFromPreparedStatement(connectionFromPool, preparedQuery);
                        } catch (AppsmithPluginException | StaleConnectionException e) {
                            throw e;
                        } finally {

                            if (preparedQuery != null) {
                                try {
                                    preparedQuery.close();
                                } catch (SQLException e) {
                                    log.error("Execute Error closing Snowflake prepared statement", e);
                                }
                            }

                            idleConnections = poolProxy.getIdleConnections();
                            activeConnections = poolProxy.getActiveConnections();
                            totalConnections = poolProxy.getTotalConnections();
                            threadsAwaitingConnection = poolProxy.getThreadsAwaitingConnection();
                            log.debug(String.format(
                                    "After executing snowflake query, Hikari Pool stats active - %d, idle - %d, awaiting - %d, total - %d",
                                    activeConnections, idleConnections, threadsAwaitingConnection, totalConnections));

                            if (connectionFromPool != null) {
                                try {
                                    // Return the connection back to the pool
                                    connectionFromPool.close();
                                } catch (SQLException e) {
                                    log.error("Execute Error returning Snowflake connection to pool");
                                    e.printStackTrace();
                                }
                            }
                        }
                    })
                    .map(rowsList -> {
                        ActionExecutionResult result = new ActionExecutionResult();
                        result.setBody(objectMapper.valueToTree(rowsList));
                        result.setIsExecutionSuccess(true);
                        ActionExecutionRequest request = new ActionExecutionRequest();
                        request.setQuery(query);
                        request.setProperties(requestData);
                        request.setRequestParams(requestParams);
                        result.setRequest(request);
                        return result;
                    })
                    .subscribeOn(scheduler);
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
                        // Fully qualified because this file wildcard-imports both java.sql.* and java.util.*.
                        preparedStatement.setDate(index, java.sql.Date.valueOf(value));
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
                    case STRING:
                    case JSON_OBJECT: {
                        preparedStatement.setString(index, value);
                        break;
                    }
                    case ARRAY:
                    case NULL_ARRAY:
                        // Array-typed values cannot be bound as a scalar JDBC parameter. Fail fast with a clear
                        // message rather than leaving the placeholder unbound and hitting a confusing driver error.
                        throw new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                                String.format(SnowflakeErrorMessages.ARRAY_PARAMETER_NOT_SUPPORTED_ERROR_MSG, binding));
                    default:
                        // An unrecognized data type would otherwise leave the placeholder unbound while it is
                        // still tracked as an inserted parameter, surfacing as a confusing driver error later.
                        log.warn(
                                "Unrecognized data type {} for binding {}; skipping parameter binding",
                                valueType,
                                binding);
                        break;
                }
            } catch (SQLException | IllegalArgumentException | java.io.IOException e) {
                if ((e instanceof SQLException)
                        && e.getMessage() != null
                        && e.getMessage().contains("The column index is out of range:")) {
                    // The parameter is likely being set inside a commented-out part of the query. Ignore it.
                } else {
                    throw new AppsmithPluginException(
                            AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                            String.format(SnowflakeErrorMessages.QUERY_PREPARATION_FAILED_ERROR_MSG, value, binding),
                            e.getMessage());
                }
            }

            return preparedStatement;
        }

        @Override
        public Mono<HikariDataSource> createConnectionClient(
                DatasourceConfiguration datasourceConfiguration, Properties properties) {
            log.debug(Thread.currentThread().getName() + ": createConnectionClient() called for Snowflake plugin.");
            return getHikariConfig(datasourceConfiguration, properties)
                    .flatMap(config -> Mono.fromCallable(() -> {
                                log.debug(Thread.currentThread().getName() + ": creating Snowflake connection client");
                                // Set up the connection URL
                                String jdbcUrl = getJDBCUrl(datasourceConfiguration);
                                config.setJdbcUrl(jdbcUrl);

                                config.setDataSourceProperties(properties);

                                // Now create the connection pool from the configuration
                                HikariDataSource datasource = null;
                                try {
                                    datasource = new HikariDataSource(config);
                                } catch (HikariPool.PoolInitializationException e) {
                                    throw new AppsmithPluginException(
                                            AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, e.getMessage());
                                }

                                return datasource;
                            })
                            .subscribeOn(scheduler))
                    .onErrorMap(
                            AppsmithPluginException.class,
                            error -> new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, error.getMessage()));
        }

        @Override
        public Properties addPluginSpecificProperties(
                DatasourceConfiguration datasourceConfiguration, Properties properties) {
            properties.setProperty("driver_name", JDBC_DRIVER);
            properties.setProperty("minimumIdle", String.valueOf(MINIMUM_POOL_SIZE));
            properties.setProperty("maximunPoolSize", String.valueOf(MAXIMUM_POOL_SIZE));
            properties.setProperty(
                    SNOWFLAKE_DB_LOGIN_TIMEOUT_PROPERTY_KEY, String.valueOf(SNOWFLAKE_DB_LOGIN_TIMEOUT_VALUE_SEC));
            properties.setProperty("connectionTimeoutMillis", String.valueOf(CONNECTION_TIMEOUT_MILLISECONDS));
            return properties;
        }

        @Override
        public Properties addAuthParamsToConnectionConfig(
                DatasourceConfiguration datasourceConfiguration, Properties properties) {
            log.debug(Thread.currentThread().getName()
                    + ": addAuthParamsToConnectionConfig() called for Snowflake plugin.");
            // Only for username password auth, we need to set these properties, for others
            // like key-pair auth, authentication specific properties need to be set on config itself
            AuthenticationDTO authentication = datasourceConfiguration.getAuthentication();
            String authenticationType = getAuthenticationType(authentication);
            if (DB_AUTH.equals(authenticationType)) {
                DBAuth dbAuth = (DBAuth) authentication;
                properties.setProperty("user", dbAuth.getUsername());
                properties.setProperty("password", dbAuth.getPassword());
            }
            properties.setProperty(
                    "warehouse",
                    String.valueOf(
                            datasourceConfiguration.getProperties().get(0).getValue()));
            properties.setProperty(
                    "db",
                    String.valueOf(
                            datasourceConfiguration.getProperties().get(1).getValue()));
            properties.setProperty(
                    "schema",
                    String.valueOf(
                            datasourceConfiguration.getProperties().get(2).getValue()));
            properties.setProperty(
                    "role",
                    String.valueOf(
                            datasourceConfiguration.getProperties().get(3).getValue()));
            /* Ref: https://github.com/appsmithorg/appsmith/issues/19784 */
            properties.setProperty("jdbc_query_result_format", "json");
            return properties;
        }

        @Override
        public void datasourceDestroy(HikariDataSource connection) {
            if (connection != null) {
                connection.close();
            }
        }

        @Override
        public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
            log.debug(Thread.currentThread().getName() + ": validateDatasource() called for Snowflake plugin.");
            Set<String> invalids = new HashSet<>();

            if (StringUtils.isEmpty(datasourceConfiguration.getUrl())) {
                invalids.add(SnowflakeErrorMessages.DS_MISSING_ENDPOINT_ERROR_MSG);
            }

            if (datasourceConfiguration.getProperties() != null
                    && (datasourceConfiguration.getProperties().size() < 1
                            || datasourceConfiguration.getProperties().get(0) == null
                            || datasourceConfiguration.getProperties().get(0).getValue() == null
                            || StringUtils.isEmpty(String.valueOf(datasourceConfiguration
                                    .getProperties()
                                    .get(0)
                                    .getValue())))) {
                invalids.add(SnowflakeErrorMessages.DS_MISSING_WAREHOUSE_NAME_ERROR_MSG);
            }

            if (datasourceConfiguration.getProperties() != null
                    && (datasourceConfiguration.getProperties().size() < 2
                            || datasourceConfiguration.getProperties().get(1) == null
                            || datasourceConfiguration.getProperties().get(1).getValue() == null
                            || StringUtils.isEmpty(String.valueOf(datasourceConfiguration
                                    .getProperties()
                                    .get(1)
                                    .getValue())))) {
                invalids.add(SnowflakeErrorMessages.DS_MISSING_DATABASE_NAME_ERROR_MSG);
            }

            if (datasourceConfiguration.getProperties() != null
                    && (datasourceConfiguration.getProperties().size() < 3
                            || datasourceConfiguration.getProperties().get(2) == null
                            || datasourceConfiguration.getProperties().get(2).getValue() == null
                            || StringUtils.isEmpty(String.valueOf(datasourceConfiguration
                                    .getProperties()
                                    .get(2)
                                    .getValue())))) {
                invalids.add(SnowflakeErrorMessages.DS_MISSING_SCHEMA_NAME_ERROR_MSG);
            }

            if (datasourceConfiguration.getAuthentication() == null) {
                invalids.add(SnowflakeErrorMessages.DS_MISSING_AUTHENTICATION_DETAILS_ERROR_MSG);
            } else {
                if (SNOWFLAKE_KEY_PAIR_AUTH.equals(
                        getAuthenticationType(datasourceConfiguration.getAuthentication()))) {
                    KeyPairAuth authentication = (KeyPairAuth) datasourceConfiguration.getAuthentication();
                    if (StringUtils.isEmpty(authentication.getUsername())) {
                        invalids.add(SnowflakeErrorMessages.DS_MISSING_USERNAME_ERROR_MSG);
                    }

                    if (authentication.getPrivateKey() == null) {
                        invalids.add(SnowflakeErrorMessages.DS_MISSING_PRIVATE_KEY_ERROR_MSG);
                    }
                } else {
                    DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
                    if (StringUtils.isEmpty(authentication.getUsername())) {
                        invalids.add(SnowflakeErrorMessages.DS_MISSING_USERNAME_ERROR_MSG);
                    }

                    if (StringUtils.isEmpty(authentication.getPassword())) {
                        invalids.add(SnowflakeErrorMessages.DS_MISSING_PASSWORD_ERROR_MSG);
                    }
                }
            }
            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(HikariDataSource connection) {
            log.debug(Thread.currentThread().getName() + ": testDatasource() called for Snowflake plugin.");
            return Mono.just(connection)
                    .flatMap(connectionPool -> {
                        log.debug(Thread.currentThread().getName() + ": Testing Snowflake Datasource");
                        Connection connectionFromPool;
                        try {
                            /**
                             * The getConnectionFromHikariConnectionPool method used here is the duplicate of
                             * method defined in PluginUtils.java and not the same one. Please check the comment on
                             * the method definition to understand more.
                             */
                            connectionFromPool =
                                    getConnectionFromHikariConnectionPool(connectionPool, SNOWFLAKE_PLUGIN_NAME);
                            return Mono.just(validateWarehouseDatabaseSchema(connectionFromPool));
                        } catch (SQLException e) {
                            // The function can throw either StaleConnectionException or SQLException. The underlying
                            // hikari
                            // library throws SQLException in case the pool is closed or there is an issue initializing
                            // the connection pool which can also be translated in our world to StaleConnectionException
                            // and should then trigger the destruction and recreation of the pool.

                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                    SnowflakeErrorMessages.UNABLE_TO_CREATE_CONNECTION_ERROR_MSG));

                        } catch (StaleConnectionException e) {
                            return Mono.error(new AppsmithPluginException(
                                    AppsmithPluginError.STALE_CONNECTION_ERROR, e.getMessage()));
                        }
                    })
                    .map(errorSet -> {
                        if (!errorSet.isEmpty()) {
                            return new DatasourceTestResult(errorSet);
                        }

                        return new DatasourceTestResult();
                    })
                    .subscribeOn(scheduler);
        }

        @Override
        public Mono<DatasourceStructure> getStructure(
                HikariDataSource connection, DatasourceConfiguration datasourceConfiguration) {
            log.debug(Thread.currentThread().getName() + ": getStructure() called for Snowflake plugin.");
            final DatasourceStructure structure = new DatasourceStructure();
            final Map<String, DatasourceStructure.Table> tablesByName = new LinkedHashMap<>();
            final Map<String, DatasourceStructure.Key> keyRegistry = new HashMap<>();

            return Mono.fromSupplier(() -> {
                        Connection connectionFromPool;
                        try {
                            /**
                             * The getConnectionFromHikariConnectionPool method used here is the duplicate of
                             * method defined in PluginUtils.java and not the same one. Please check the comment on
                             * the method definition to understand more.
                             */
                            connectionFromPool =
                                    getConnectionFromHikariConnectionPool(connection, SNOWFLAKE_PLUGIN_NAME);
                        } catch (SQLException | StaleConnectionException e) {
                            // The function can throw either StaleConnectionException or SQLException. The underlying
                            // hikari
                            // library throws SQLException in case the pool is closed or there is an issue initializing
                            // the connection pool which can also be translated in our world to StaleConnectionException
                            // and should then trigger the destruction and recreation of the pool.
                            throw new StaleConnectionException(e.getMessage());
                        }

                        HikariPoolMXBean poolProxy = connection.getHikariPoolMXBean();

                        int idleConnections = poolProxy.getIdleConnections();
                        int activeConnections = poolProxy.getActiveConnections();
                        int totalConnections = poolProxy.getTotalConnections();
                        int threadsAwaitingConnection = poolProxy.getThreadsAwaitingConnection();
                        log.debug(String.format(
                                "Before getting snowflake structure Hikari Pool stats active - %d, idle - %d, awaiting - %d, total - %d",
                                activeConnections, idleConnections, threadsAwaitingConnection, totalConnections));

                        try {
                            // Connection staleness is checked as part of this method call.
                            Set<String> invalids = validateWarehouseDatabaseSchema(connectionFromPool);
                            if (!invalids.isEmpty()) {
                                throw new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, invalids.toArray()[0]);
                            }
                            Statement statement = connectionFromPool.createStatement();
                            // Schema name comes from datasource configuration (requires MANAGE_DATASOURCES). Escape
                            // single quotes so the value cannot break out of the string literal in the metadata query.
                            final String schemaValue = String.valueOf(datasourceConfiguration
                                            .getProperties()
                                            .get(2)
                                            .getValue())
                                    .replace("'", "''");
                            final String columnsQuery = SqlUtils.COLUMNS_QUERY + "'" + schemaValue + "'";
                            ResultSet resultSet = statement.executeQuery(columnsQuery);

                            while (resultSet.next()) {
                                SqlUtils.getTableInfo(resultSet, tablesByName);
                            }

                            resultSet = statement.executeQuery(SqlUtils.PRIMARY_KEYS_QUERY);
                            while (resultSet.next()) {
                                SqlUtils.getPrimaryKeyInfo(resultSet, tablesByName, keyRegistry);
                            }

                            resultSet = statement.executeQuery(SqlUtils.FOREIGN_KEYS_QUERY);
                            while (resultSet.next()) {
                                SqlUtils.getForeignKeyInfo(resultSet, tablesByName, keyRegistry);
                            }

                            /* Get templates for each table and put those in. */
                            SqlUtils.getTemplates(tablesByName);
                            structure.setTables(new ArrayList<>(tablesByName.values()));
                            for (DatasourceStructure.Table table : structure.getTables()) {
                                table.getKeys().sort(Comparator.naturalOrder());
                            }
                        } catch (SQLException throwable) {
                            log.debug("Exception caught while fetching structure of Snowflake datasource. Cause:");
                            throwable.printStackTrace();
                            throw new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR,
                                    SnowflakeErrorMessages.GET_STRUCTURE_ERROR_MSG,
                                    throwable.getMessage(),
                                    "SQLSTATE: " + throwable.getSQLState());
                        } finally {
                            log.debug(Thread.currentThread().getName() + ": Get Structure Snowflake");
                            idleConnections = poolProxy.getIdleConnections();
                            activeConnections = poolProxy.getActiveConnections();
                            totalConnections = poolProxy.getTotalConnections();
                            threadsAwaitingConnection = poolProxy.getThreadsAwaitingConnection();
                            log.debug(String.format(
                                    "After snowflake structure, Hikari Pool stats active - %d, idle - %d, awaiting - %d, total - %d",
                                    activeConnections, idleConnections, threadsAwaitingConnection, totalConnections));

                            if (connectionFromPool != null) {
                                try {
                                    // Return the connection back to the pool
                                    connectionFromPool.close();
                                } catch (SQLException e) {
                                    log.error("Error returning snowflake connection to pool during get structure");
                                    e.printStackTrace();
                                }
                            }
                        }
                        return structure;
                    })
                    .subscribeOn(scheduler);
        }

        private Mono<HikariConfig> getHikariConfig(
                DatasourceConfiguration datasourceConfiguration, Properties properties) {
            HikariConfig commonConfig = getCommonHikariConfig(properties);
            Mono<HikariConfig> configMono = Mono.empty();

            String authenticationType = getAuthenticationType(datasourceConfiguration.getAuthentication());
            if (authenticationType != null) {
                switch (authenticationType) {
                    case DB_AUTH:
                        configMono = getBasicAuthConfig(commonConfig, datasourceConfiguration);
                        break;
                    case SNOWFLAKE_KEY_PAIR_AUTH:
                        configMono = getKeyPairAuthConfig(commonConfig, datasourceConfiguration);
                        break;
                    default:
                        break;
                }
            }
            return configMono;
        }

        private Mono<HikariConfig> getKeyPairAuthConfig(
                HikariConfig config, DatasourceConfiguration datasourceConfiguration) {
            KeyPairAuth keyPairAuthConfig = (KeyPairAuth) datasourceConfiguration.getAuthentication();
            byte[] keyBytes = keyPairAuthConfig.getPrivateKey().getDecodedContent();
            String passphrase = keyPairAuthConfig.getPassphrase();
            return getPrivateKeyFromBase64(keyBytes, passphrase)
                    .flatMap(privateKey -> {
                        String jdbcUrl = getJDBCUrl(datasourceConfiguration);

                        // Prepare datasource object to be passed to hikariConfig
                        SnowflakeBasicDataSource ds = new SnowflakeBasicDataSource();
                        ds.setPrivateKey(privateKey);
                        ds.setUser(keyPairAuthConfig.getUsername());
                        ds.setUrl(jdbcUrl);
                        ds.setWarehouse(String.valueOf(
                                datasourceConfiguration.getProperties().get(0).getValue()));
                        ds.setDatabaseName(String.valueOf(
                                datasourceConfiguration.getProperties().get(1).getValue()));
                        ds.setRole(String.valueOf(
                                datasourceConfiguration.getProperties().get(3).getValue()));
                        ds.setSchema(String.valueOf(
                                datasourceConfiguration.getProperties().get(2).getValue()));
                        config.setDataSource(ds);

                        return Mono.just(config);
                    })
                    .onErrorMap(
                            AppsmithPluginException.class,
                            error -> new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, error.getMessage()));
        }

        private Mono<HikariConfig> getBasicAuthConfig(
                HikariConfig config, DatasourceConfiguration datasourceConfiguration) {
            return Mono.fromCallable(() -> {
                DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
                if (authentication.getUsername() != null) {
                    config.setUsername(authentication.getUsername());
                }
                if (authentication.getPassword() != null) {
                    config.setPassword(authentication.getPassword());
                }
                return config;
            });
        }

        private HikariConfig getCommonHikariConfig(Properties properties) {
            HikariConfig config = new HikariConfig();
            config.setDriverClassName(properties.getProperty("driver_name"));

            config.setMinimumIdle(Integer.parseInt(properties.get("minimumIdle").toString()));
            config.setMaximumPoolSize(
                    Integer.parseInt(properties.get("maximunPoolSize").toString()));
            config.setConnectionTimeout(
                    Long.parseLong(properties.get("connectionTimeoutMillis").toString()));
            return config;
        }

        private Mono<PrivateKey> getPrivateKeyFromBase64(byte[] keyBytes, String passphrase) {
            try {
                return Mono.just(SnowflakeKeyUtils.readEncryptedPrivateKey(keyBytes, passphrase));
            } catch (AppsmithPluginException e) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                        SnowflakeErrorMessages.DS_MISSING_PASSPHRASE_FOR_ENCRYPTED_PRIVATE_KEY));
            } catch (PKCSException e) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                        SnowflakeErrorMessages.DS_INCORRECT_PASSPHRASE_OR_PRIVATE_KEY));
            } catch (Exception e) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                        SnowflakeErrorMessages.UNABLE_TO_CREATE_CONNECTION_ERROR_MSG));
            }
        }

        private String getJDBCUrl(DatasourceConfiguration dsConfig) {
            StringBuilder urlBuilder =
                    new StringBuilder("jdbc:snowflake://" + dsConfig.getUrl() + ".snowflakecomputing.com?");
            return urlBuilder.toString();
        }

        private String getAuthenticationType(AuthenticationDTO authentication) {
            String authenticationType = authentication.getAuthenticationType();
            if (authenticationType == null) {
                // This is required to provide backwards compatibility for older snowflake datasources
                // Where authenticationType property is null, in that case it should default to DB_AUTH
                authentication.setAuthenticationType(DB_AUTH);
            }
            return authentication.getAuthenticationType();
        }
    }
}

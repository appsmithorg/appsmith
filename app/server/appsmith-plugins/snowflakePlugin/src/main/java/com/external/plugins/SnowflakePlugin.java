package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.plugins.BasePlugin;
import com.appsmith.external.plugins.PluginExecutor;
import com.external.plugins.exceptions.SnowflakeErrorMessages;
import com.external.utils.SqlUtils;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import com.zaxxer.hikari.pool.HikariPool;
import lombok.extern.slf4j.Slf4j;
import org.pf4j.Extension;
import org.pf4j.PluginWrapper;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import static com.appsmith.external.constants.PluginConstants.PluginName.SNOWFLAKE_PLUGIN_NAME;
import static com.external.utils.ExecutionUtils.getRowsFromQueryResult;
import static com.external.utils.SnowflakeDatasourceUtils.getConnectionFromHikariConnectionPool;
import static com.external.utils.ValidationUtils.validateWarehouseDatabaseSchema;

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
    public static class SnowflakePluginExecutor implements PluginExecutor<HikariDataSource> {

        private final Scheduler scheduler = Schedulers.boundedElastic();

        @Override
        public Mono<ActionExecutionResult> execute(
                HikariDataSource connection,
                DatasourceConfiguration datasourceConfiguration,
                ActionConfiguration actionConfiguration) {

            String query = actionConfiguration.getBody();

            if (!StringUtils.hasLength(query)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        SnowflakeErrorMessages.MISSING_QUERY_ERROR_MSG));
            }

            return Mono.fromCallable(() -> {
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
                        log.debug(
                                "Before executing snowflake query [{}] Hikari Pool stats : active - {} , idle - {} , awaiting - {} , total - {}",
                                query,
                                activeConnections,
                                idleConnections,
                                threadsAwaitingConnection,
                                totalConnections);

                        try {
                            // Connection staleness is checked as part of this method call.
                            return getRowsFromQueryResult(connectionFromPool, query);
                        } catch (AppsmithPluginException | StaleConnectionException e) {
                            throw e;
                        } finally {

                            idleConnections = poolProxy.getIdleConnections();
                            activeConnections = poolProxy.getActiveConnections();
                            totalConnections = poolProxy.getTotalConnections();
                            threadsAwaitingConnection = poolProxy.getThreadsAwaitingConnection();
                            log.debug(
                                    "After executing snowflake query, Hikari Pool stats active - {} , idle - {} , awaiting - {} , total - {} ",
                                    activeConnections,
                                    idleConnections,
                                    threadsAwaitingConnection,
                                    totalConnections);

                            if (connectionFromPool != null) {
                                try {
                                    // Return the connection back to the pool
                                    connectionFromPool.close();
                                } catch (SQLException e) {
                                    log.debug("Execute Error returning Snowflake connection to pool", e);
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
                        result.setRequest(request);
                        return result;
                    })
                    .subscribeOn(scheduler);
        }

        @Override
        public Mono<HikariDataSource> createConnectionClient(
                DatasourceConfiguration datasourceConfiguration, Properties properties) {
            return Mono.fromCallable(() -> {
                        HikariConfig config = new HikariConfig();

                        config.setDriverClassName(properties.getProperty("driver_name"));

                        config.setMinimumIdle(
                                Integer.parseInt(properties.get("minimumIdle").toString()));
                        config.setMaximumPoolSize(Integer.parseInt(
                                properties.get("maximunPoolSize").toString()));

                        config.setInitializationFailTimeout(Long.parseLong(
                                properties.get("initializationFailTimeout").toString()));
                        config.setConnectionTimeout(Long.parseLong(
                                properties.get("connectionTimeoutMillis").toString()));

                        // Set authentication properties
                        DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
                        if (authentication.getUsername() != null) {
                            config.setUsername(authentication.getUsername());
                        }
                        if (authentication.getPassword() != null) {
                            config.setPassword(authentication.getPassword());
                        }

                        // Set up the connection URL
                        StringBuilder urlBuilder = new StringBuilder(
                                "jdbc:snowflake://" + datasourceConfiguration.getUrl() + ".snowflakecomputing.com?");
                        config.setJdbcUrl(urlBuilder.toString());

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
                    .subscribeOn(scheduler);
        }

        @Override
        public Properties addPluginSpecificProperties(
                DatasourceConfiguration datasourceConfiguration, Properties properties) {
            properties.setProperty("driver_name", JDBC_DRIVER);
            properties.setProperty("minimumIdle", String.valueOf(MINIMUM_POOL_SIZE));
            properties.setProperty("maximunPoolSize", String.valueOf(MAXIMUM_POOL_SIZE));
            properties.setProperty(
                    SNOWFLAKE_DB_LOGIN_TIMEOUT_PROPERTY_KEY, String.valueOf(SNOWFLAKE_DB_LOGIN_TIMEOUT_VALUE_SEC));
            /**
             * Setting the value for setInitializationFailTimeout to -1 to
             * bypass any connection attempt and validation during startup
             * @see https://www.javadoc.io/doc/com.zaxxer/HikariCP/latest/com/zaxxer/hikari/HikariConfig.html
             */
            properties.setProperty("initializationFailTimeout", String.valueOf(-1));
            properties.setProperty("connectionTimeoutMillis", String.valueOf(CONNECTION_TIMEOUT_MILLISECONDS));
            return properties;
        }

        @Override
        public Properties addAuthParamsToConnectionConfig(
                DatasourceConfiguration datasourceConfiguration, Properties properties) {
            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            properties.setProperty("user", authentication.getUsername());
            properties.setProperty("password", authentication.getPassword());
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
                DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
                if (StringUtils.isEmpty(authentication.getUsername())) {
                    invalids.add(SnowflakeErrorMessages.DS_MISSING_USERNAME_ERROR_MSG);
                }

                if (StringUtils.isEmpty(authentication.getPassword())) {
                    invalids.add(SnowflakeErrorMessages.DS_MISSING_PASSWORD_ERROR_MSG);
                }
            }

            return invalids;
        }

        @Override
        public Mono<DatasourceTestResult> testDatasource(HikariDataSource connection) {

            return Mono.just(connection)
                    .flatMap(connectionPool -> {
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
                        log.debug(
                                "Before getting snowflake structure Hikari Pool stats active - {} , idle - {} , awaiting - {} , total - {} ",
                                activeConnections,
                                idleConnections,
                                threadsAwaitingConnection,
                                totalConnections);

                        try {
                            // Connection staleness is checked as part of this method call.
                            Set<String> invalids = validateWarehouseDatabaseSchema(connectionFromPool);
                            if (!invalids.isEmpty()) {
                                throw new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR, invalids.toArray()[0]);
                            }
                            Statement statement = connectionFromPool.createStatement();
                            final String columnsQuery = SqlUtils.COLUMNS_QUERY + "'"
                                    + datasourceConfiguration
                                            .getProperties()
                                            .get(2)
                                            .getValue() + "'";
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
                            log.error(
                                    "Exception caught while fetching structure of Snowflake datasource. Cause: ",
                                    throwable);
                            throw new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR,
                                    SnowflakeErrorMessages.GET_STRUCTURE_ERROR_MSG,
                                    throwable.getMessage(),
                                    "SQLSTATE: " + throwable.getSQLState());
                        } finally {

                            idleConnections = poolProxy.getIdleConnections();
                            activeConnections = poolProxy.getActiveConnections();
                            totalConnections = poolProxy.getTotalConnections();
                            threadsAwaitingConnection = poolProxy.getThreadsAwaitingConnection();
                            log.debug(
                                    "After snowflake structure, Hikari Pool stats active - {} , idle - {} , awaiting - {} , total - {} ",
                                    activeConnections,
                                    idleConnections,
                                    threadsAwaitingConnection,
                                    totalConnections);

                            if (connectionFromPool != null) {
                                try {
                                    // Return the connection back to the pool
                                    connectionFromPool.close();
                                } catch (SQLException e) {
                                    log.debug("Error returning snowflake connection to pool during get structure", e);
                                }
                            }
                        }
                        return structure;
                    })
                    .subscribeOn(scheduler);
        }
    }
}

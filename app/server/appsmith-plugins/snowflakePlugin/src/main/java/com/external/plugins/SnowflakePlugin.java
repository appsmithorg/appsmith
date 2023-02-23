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
import com.external.plugins.exceptions.SnowflakePluginError;
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

import static com.external.utils.ExecutionUtils.getRowsFromQueryResult;
import static com.external.utils.ValidationUtils.validateWarehouseDatabaseSchema;

@Slf4j
public class SnowflakePlugin extends BasePlugin {

    static final String JDBC_DRIVER = "net.snowflake.client.jdbc.SnowflakeDriver";

    private static final int MINIMUM_POOL_SIZE = 1;

    private static final int MAXIMUM_POOL_SIZE = 5;

    public SnowflakePlugin(PluginWrapper wrapper) {
        super(wrapper);
    }

    @Extension
    public static class SnowflakePluginExecutor implements PluginExecutor<HikariDataSource> {

        private final Scheduler scheduler = Schedulers.boundedElastic();

        @Override
        public Mono<ActionExecutionResult> execute(HikariDataSource connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {

            String query = actionConfiguration.getBody();

            if (! StringUtils.hasLength(query)) {
                return Mono.error(new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR,
                        SnowflakeErrorMessages.MISSING_QUERY_ERROR_MSG));
            }

            return Mono.fromCallable(() -> {

                        Connection connectionFromPool;

                        try {
                            connectionFromPool = getConnectionFromConnectionPool(connection);
                        } catch (SQLException | StaleConnectionException e) {
                            if (e instanceof StaleConnectionException) {
                                throw e;
                            } else {
                                throw new StaleConnectionException();
                            }
                        }

                        HikariPoolMXBean poolProxy = connection.getHikariPoolMXBean();

                        int idleConnections = poolProxy.getIdleConnections();
                        int activeConnections = poolProxy.getActiveConnections();
                        int totalConnections = poolProxy.getTotalConnections();
                        int threadsAwaitingConnection = poolProxy.getThreadsAwaitingConnection();
                        log.debug("Before executing snowflake query [{}] Hikari Pool stats : active - {} , idle - {} , awaiting - {} , total - {}",
                                query, activeConnections, idleConnections, threadsAwaitingConnection, totalConnections);

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
                            log.debug("After executing snowflake query, Hikari Pool stats active - {} , idle - {} , awaiting - {} , total - {} ",
                                    activeConnections, idleConnections, threadsAwaitingConnection, totalConnections);

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
        public Mono<HikariDataSource> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
            try {
                Class.forName(JDBC_DRIVER);
            } catch (ClassNotFoundException ex) {
                log.debug("Driver not found");
                return Mono.error(new AppsmithPluginException(SnowflakePluginError.SNOWFLAKE_PLUGIN_ERROR, SnowflakeErrorMessages.DRIVER_NOT_FOUND_ERROR_MSG, ex.getMessage()));
            }

            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            Properties properties = new Properties();
            properties.setProperty("user", authentication.getUsername());
            properties.setProperty("password", authentication.getPassword());
            properties.setProperty("warehouse", String.valueOf(datasourceConfiguration.getProperties().get(0).getValue()));
            properties.setProperty("db", String.valueOf(datasourceConfiguration.getProperties().get(1).getValue()));
            properties.setProperty("schema", String.valueOf(datasourceConfiguration.getProperties().get(2).getValue()));
            properties.setProperty("role", String.valueOf(datasourceConfiguration.getProperties().get(3).getValue()));
            /* Ref: https://github.com/appsmithorg/appsmith/issues/19784 */
            properties.setProperty("jdbc_query_result_format", "json");

            return Mono
                    .fromCallable(() -> {
                        log.debug("Connecting to Snowflake");
                        return createConnectionPool(datasourceConfiguration,properties);
                    })
                    .subscribeOn(scheduler);
        }

        /**
         * This function is blocking in nature which connects to the database and creates a connection pool
         *
         * @param datasourceConfiguration
         * @return connection pool
         */
        private static HikariDataSource createConnectionPool(DatasourceConfiguration datasourceConfiguration,Properties properties) throws AppsmithPluginException {

            HikariConfig config = new HikariConfig();

            config.setDriverClassName(JDBC_DRIVER);

            config.setMinimumIdle(MINIMUM_POOL_SIZE);
            config.setMaximumPoolSize(MAXIMUM_POOL_SIZE);

            // Set authentication properties
            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            if (authentication.getUsername() != null) {
                config.setUsername(authentication.getUsername());
            }
            if (authentication.getPassword() != null) {
                config.setPassword(authentication.getPassword());
            }

            // Set up the connection URL
            StringBuilder urlBuilder = new StringBuilder("jdbc:snowflake://" + datasourceConfiguration.getUrl() + ".snowflakecomputing.com?");
            config.setJdbcUrl(urlBuilder.toString());

            config.setDataSourceProperties(properties);

            // Now create the connection pool from the configuration
            HikariDataSource datasource = null;
            try {
                datasource = new HikariDataSource(config);
            } catch (HikariPool.PoolInitializationException e) {
                throw new AppsmithPluginException(
                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                        e.getMessage()
                );
            }

            return datasource;
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
                    || StringUtils.isEmpty(String.valueOf(datasourceConfiguration.getProperties().get(0).getValue())))) {
                invalids.add(SnowflakeErrorMessages.DS_MISSING_WAREHOUSE_NAME_ERROR_MSG);
            }

            if (datasourceConfiguration.getProperties() != null
                    && (datasourceConfiguration.getProperties().size() < 2
                    || datasourceConfiguration.getProperties().get(1) == null
                    || datasourceConfiguration.getProperties().get(1).getValue() == null
                    || StringUtils.isEmpty(String.valueOf(datasourceConfiguration.getProperties().get(1).getValue())))) {
                invalids.add(SnowflakeErrorMessages.DS_MISSING_DATABASE_NAME_ERROR_MSG);
            }

            if (datasourceConfiguration.getProperties() != null
                    && (datasourceConfiguration.getProperties().size() < 3
                    || datasourceConfiguration.getProperties().get(2) == null
                    || datasourceConfiguration.getProperties().get(2).getValue() == null
                    || StringUtils.isEmpty(String.valueOf(datasourceConfiguration.getProperties().get(2).getValue())))) {
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

            return Mono.fromCallable(() -> {

                        Connection connectionFromPool;
                        try {
                            connectionFromPool = getConnectionFromConnectionPool(connection);
                        } catch (SQLException | StaleConnectionException e) {
                            // The function can throw either StaleConnectionException or SQLException. The underlying hikari
                            // library throws SQLException in case the pool is closed or there is an issue initializing
                            // the connection pool which can also be translated in our world to StaleConnectionException
                            // and should then trigger the destruction and recreation of the pool.
                            if (e instanceof StaleConnectionException) {
                                throw e;
                            } else {
                                throw new StaleConnectionException();
                            }
                        }

                        return validateWarehouseDatabaseSchema(connectionFromPool);
                    })
                    .map(DatasourceTestResult::new);
        }

        @Override
        public Mono<DatasourceStructure> getStructure(HikariDataSource connection, DatasourceConfiguration datasourceConfiguration) {
            final DatasourceStructure structure = new DatasourceStructure();
            final Map<String, DatasourceStructure.Table> tablesByName = new LinkedHashMap<>();
            final Map<String, DatasourceStructure.Key> keyRegistry = new HashMap<>();

            return Mono
                    .fromSupplier(() -> {

                        Connection connectionFromPool;
                        try {
                            connectionFromPool = getConnectionFromConnectionPool(connection);
                        } catch (SQLException | StaleConnectionException e) {
                            // The function can throw either StaleConnectionException or SQLException. The underlying hikari
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
                        log.debug("Before getting snowflake structure Hikari Pool stats active - {} , idle - {} , awaiting - {} , total - {} ",
                                activeConnections, idleConnections, threadsAwaitingConnection, totalConnections);


                        try {
                            // Connection staleness is checked as part of this method call.
                            Set<String> invalids = validateWarehouseDatabaseSchema(connectionFromPool);
                            if (!invalids.isEmpty()) {
                                throw new AppsmithPluginException(
                                        AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                        invalids.toArray()[0]
                                );
                            }
                            Statement statement = connectionFromPool.createStatement();
                            final String columnsQuery = SqlUtils.COLUMNS_QUERY + "'"
                                    + datasourceConfiguration.getProperties().get(2).getValue() + "'";
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
                            log.error("Exception caught while fetching structure of Snowflake datasource. Cause: ", throwable);
                            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR, SnowflakeErrorMessages.GET_STRUCTURE_ERROR_MSG, throwable.getMessage(), "SQLSTATE: " + throwable.getSQLState());
                        } finally {

                            idleConnections = poolProxy.getIdleConnections();
                            activeConnections = poolProxy.getActiveConnections();
                            totalConnections = poolProxy.getTotalConnections();
                            threadsAwaitingConnection = poolProxy.getThreadsAwaitingConnection();
                            log.debug("After snowflake structure, Hikari Pool stats active - {} , idle - {} , awaiting - {} , total - {} ",
                                    activeConnections, idleConnections, threadsAwaitingConnection, totalConnections);

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

        /**
         * First checks if the connection pool is still valid. If yes, we fetch a connection from the pool and return
         * In case a connection is not available in the pool, SQL Exception is thrown
         *
         * @param connectionPool
         * @return SQL Connection
         */
        private static Connection getConnectionFromConnectionPool(HikariDataSource connectionPool) throws SQLException {

            if (connectionPool == null || connectionPool.isClosed() || !connectionPool.isRunning()) {
                log.debug("Encountered stale connection pool in Snowflake plugin. Reporting back.");
                throw new StaleConnectionException();
            }

            return connectionPool.getConnection();
        }
    }
}
package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.SSLDetails;
import com.external.plugins.exceptions.OracleErrorMessages;
import com.external.plugins.exceptions.OraclePluginError;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import com.zaxxer.hikari.pool.HikariPool;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.ObjectUtils;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.external.plugins.OraclePlugin.OraclePluginExecutor.scheduler;
import static org.apache.commons.lang3.StringUtils.isBlank;
import static org.springframework.util.CollectionUtils.isEmpty;

@Slf4j
public class OracleDatasourceUtils {
    public static final int MINIMUM_POOL_SIZE = 1;
    public static final int MAXIMUM_POOL_SIZE = 5;
    public static final long LEAK_DETECTION_TIME_MS = 60 * 1000;
    public static final String JDBC_DRIVER = "oracle.jdbc.driver.OracleDriver";
    public static final String ORACLE_URL_PREFIX = "jdbc:oracle:thin:@tcp://";
    public static final int ORACLE_URL_PREFIX_TCPS_OFFSET = 21;

    /**
     * Example output:
     * +------------+-----------+-----------------+
     * | TABLE_NAME |COLUMN_NAME| DATA_TYPE       |
     * +------------+-----------+-----------------+
     * | CLUB       | ID        | NUMBER          |
     * | STUDENTS   | NAME      | VARCHAR2        |
     * +------------+-----------+-----------------+
     */
    public static final String ORACLE_SQL_QUERY_TO_GET_ALL_TABLE_COLUMN_TYPE =
            "SELECT " +
            "table_name, column_name, data_type " +
            "FROM " +
            "user_tab_cols";

    /**
     * Example output:
     * +------------+-----------+-----------------+-----------------+-------------------+
     * | TABLE_NAME |COLUMN_NAME| CONSTRAINT_TYPE | CONSTRAINT_NAME | R_CONSTRAINT_NAME |
     * +------------+-----------+-----------------+-----------------+-------------------+
     * | CLUB       | ID        | R               | FK_STUDENTS_ID  | PK_STUDENTS_ID    |
     * | STUDENTS   | ID        | P               | SYS_C006397     | null              |
     * +------------+-----------+-----------------+-----------------+-------------------+
     */
    public static final String ORACLE_SQL_QUERY_TO_GET_ALL_TABLE_COLUMN_KEY_CONSTRAINTS =
            "SELECT " +
            "    cols.table_name, " +
            "    cols.column_name, " +
            "    cons.constraint_type, " +
            "    cons.constraint_name, " +
            "    cons.r_constraint_name " +
            "FROM " +
            "    all_cons_columns cols " +
            "    JOIN all_constraints cons " +
            "        ON cols.owner = cons.owner " +
            "        AND cols.constraint_name = cons.constraint_name " +
            "    JOIN all_tab_cols tab_cols " +
            "        ON cols.owner = tab_cols.owner " +
            "        AND cols.table_name = tab_cols.table_name " +
            "        AND cols.column_name = tab_cols.column_name " +
            "WHERE " +
            "    cons.constraint_type IN ('P', 'R') " +
            "    AND cons.owner = 'ADMIN' " +
            "ORDER BY " +
            "    cols.table_name, " +
            "    cols.position";

    public static void datasourceDestroy(HikariDataSource connection) {
        if (connection != null) {
            System.out.println(Thread.currentThread().getName() + ": Closing Oracle DB Connection Pool");
            connection.close();
        }
    }

    public static Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
        Set<String> invalids = new HashSet<>();

        if (isEmpty(datasourceConfiguration.getEndpoints())) {
            invalids.add("Missing endpoint.");
        } else {
            for (final Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                if (isBlank(endpoint.getHost())) {
                    invalids.add("Missing hostname.");
                } else if (endpoint.getHost().contains("/") || endpoint.getHost().contains(":")) {
                    invalids.add("Host value cannot contain `/` or `:` characters. Found `" + endpoint.getHost() + "`.");
                }
            }
        }

        if (datasourceConfiguration.getAuthentication() == null) {
            invalids.add("Missing authentication details.");

        } else {
            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            if (isBlank(authentication.getUsername())) {
                invalids.add("Missing username for authentication.");
            }

            if (isBlank(authentication.getDatabaseName())) {
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

    public static Mono<DatasourceStructure> getStructure(HikariDataSource connectionPool,
                                                   DatasourceConfiguration datasourceConfiguration) {
        // 1. -done- Figure out role of each query
        // 2. -wip- Run query and fetch all data
        // 3. Return schema info
        // 4. Return query templates
        // 5. Update static templates

        final DatasourceStructure structure = new DatasourceStructure();
        final Map<String, DatasourceStructure.Table> tableNameToTableMap = new LinkedHashMap<>();

        return Mono.fromSupplier(() -> {
                    Connection connectionFromPool;
                    try {
                        connectionFromPool = getConnectionFromConnectionPool(connectionPool);
                    } catch (SQLException | StaleConnectionException e) {
                        // The function can throw either StaleConnectionException or SQLException. The
                        // underlying hikari
                        // library throws SQLException in case the pool is closed or there is an issue
                        // initializing
                        // the connection pool which can also be translated in our world to
                        // StaleConnectionException
                        // and should then trigger the destruction and recreation of the pool.
                        return Mono.error(e instanceof StaleConnectionException ? e : new StaleConnectionException());
                    }

                    HikariPoolMXBean poolProxy = connectionPool.getHikariPoolMXBean();
                    int idleConnections = poolProxy.getIdleConnections();
                    int activeConnections = poolProxy.getActiveConnections();
                    int totalConnections = poolProxy.getTotalConnections();
                    int threadsAwaitingConnection = poolProxy.getThreadsAwaitingConnection();
                    log.debug("Before getting DB structure: Hikari Pool stats : active - {} , idle - {}, " +
                                    "awaiting - {} , total - {}", activeConnections, idleConnections,
                            threadsAwaitingConnection, totalConnections);

                    try (Statement statement = connectionFromPool.createStatement()) {
                        // Get table names. For each table get its column names and column types.
                        try (ResultSet columnsResultSet =
                                     statement.executeQuery(ORACLE_SQL_QUERY_TO_GET_ALL_TABLE_COLUMN_TYPE)) {
                            while (columnsResultSet.next()) {
                                final String tableName = columnsResultSet.getString("TABLE_NAME");
                                if (!tableNameToTableMap.containsKey(tableName)) {
                                    tableNameToTableMap.put(tableName, new DatasourceStructure.Table(
                                            DatasourceStructure.TableType.TABLE,
                                            null,
                                            tableName,
                                            new ArrayList<>(),
                                            new ArrayList<>(),
                                            new ArrayList<>()));
                                }
                                final DatasourceStructure.Table table = tableNameToTableMap.get(tableName);
                                table.getColumns().add(new DatasourceStructure.Column(
                                        columnsResultSet.getString("COLUMN_NAME"),
                                        columnsResultSet.getString("DATA_TYPE"),
                                        null,
                                        false));
                            }
                        }

                        Map<String, String> primaryKeyConstraintNameToTableNameMap = new HashMap<>();
                        Map<String, String> primaryKeyConstraintNameToColumnNameMap = new HashMap<>();
                        Map<String, String> foreignKeyConstraintNameToTableNameMap = new HashMap<>();
                        Map<String, String> foreignKeyConstraintNameToColumnNameMap = new HashMap<>();
                        Map<String, String> foreignKeyConstraintNameToRemoteConstraintNameMap = new HashMap<>();

                        // Get all key constraints
                        try (ResultSet columnsResultSet =
                                     statement.executeQuery(ORACLE_SQL_QUERY_TO_GET_ALL_TABLE_COLUMN_KEY_CONSTRAINTS)) {
                            while (columnsResultSet.next()) {
                                final String tableName = columnsResultSet.getString("TABLE_NAME");
                                final String columnName = columnsResultSet.getString("COLUMN_NAME");
                                final String constraintType = columnsResultSet.getString("CONSTRAINT_TYPE");
                                final String constraintName = columnsResultSet.getString("CONSTRAINT_NAME");
                                final String remoteConstraintName = columnsResultSet.getString("R_CONSTRAINT_NAME");

                                if ("P".equalsIgnoreCase(constraintType)) {
                                    primaryKeyConstraintNameToTableNameMap.put(constraintName, tableName);
                                    primaryKeyConstraintNameToColumnNameMap.put(constraintName, columnName);
                                }
                                else {
                                    foreignKeyConstraintNameToTableNameMap.put(constraintName, tableName);
                                    foreignKeyConstraintNameToColumnNameMap.put(constraintName, columnName);
                                    foreignKeyConstraintNameToRemoteConstraintNameMap.put(constraintName, remoteConstraintName);
                                }
                            }

                            primaryKeyConstraintNameToColumnNameMap.keySet().stream()
                                    .filter(constraintName -> {
                                        String tableName = primaryKeyConstraintNameToTableNameMap.get(constraintName);
                                        return tableNameToTableMap.keySet().contains(tableName);
                                    })
                                    .forEach(constraintName -> {
                                        String tableName = primaryKeyConstraintNameToTableNameMap.get(constraintName);
                                        DatasourceStructure.Table table = tableNameToTableMap.get(tableName);
                                        String columnName = primaryKeyConstraintNameToColumnNameMap.get(constraintName);
                                        table.getKeys().add(new DatasourceStructure.PrimaryKey(constraintName,
                                                List.of(columnName)));
                                    });

                            foreignKeyConstraintNameToColumnNameMap.keySet().stream()
                                    .filter(constraintName -> {
                                        String tableName = foreignKeyConstraintNameToTableNameMap.get(constraintName);
                                        return tableNameToTableMap.keySet().contains(tableName);
                                    })
                                    .forEach(constraintName -> {
                                        String tableName = foreignKeyConstraintNameToTableNameMap.get(constraintName);
                                        DatasourceStructure.Table table = tableNameToTableMap.get(tableName);
                                        String columnName = foreignKeyConstraintNameToColumnNameMap.get(constraintName);
                                        String remoteConstraintName =
                                                foreignKeyConstraintNameToRemoteConstraintNameMap.get(constraintName);
                                        String remoteColumn = primaryKeyConstraintNameToColumnNameMap.get(remoteConstraintName);
                                        table.getKeys().add(new DatasourceStructure.ForeignKey(constraintName,
                                                List.of(columnName), List.of(remoteColumn)));
                                    });
                        }
                    } catch (SQLException throwable) {
                        return Mono.error(new AppsmithPluginException( AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR,
                                OracleErrorMessages.GET_STRUCTURE_ERROR_MSG, throwable.getCause(),
                                "SQLSTATE: " + throwable.getSQLState()));
                    } finally {
                        idleConnections = poolProxy.getIdleConnections();
                        activeConnections = poolProxy.getActiveConnections();
                        totalConnections = poolProxy.getTotalConnections();
                        threadsAwaitingConnection = poolProxy.getThreadsAwaitingConnection();
                        log.debug( "After Oracle db structure, Hikari Pool stats active - {} , idle - {} , awaiting -" +
                                        " {}  , total - {} ", activeConnections, idleConnections,
                                threadsAwaitingConnection, totalConnections);

                        if (connectionFromPool != null) {
                            try {
                                // Return the connection back to the pool
                                connectionFromPool.close();
                            } catch (SQLException e) {
                                log.debug("Error returning Oracle connection to pool during get structure", e);
                            }
                        }
                    }

                    structure.setTables(new ArrayList<>(tableNameToTableMap.values()));
                    return structure;
                })
                .map(resultStructure -> (DatasourceStructure) resultStructure)
                .subscribeOn(scheduler);
    }

    public static HikariDataSource createConnectionPool(DatasourceConfiguration datasourceConfiguration) throws AppsmithPluginException {
        HikariConfig config = new HikariConfig();

        config.setDriverClassName(JDBC_DRIVER);

        config.setMinimumIdle(MINIMUM_POOL_SIZE);
        config.setMaximumPoolSize(MAXIMUM_POOL_SIZE);

        // Set authentication properties
        DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
        if (!isBlank(authentication.getUsername())) {
            config.setUsername(authentication.getUsername());
        }
        if (!isBlank(authentication.getPassword())) {
            config.setPassword(authentication.getPassword());
        }

        // Set up the connection URL
        StringBuilder urlBuilder = new StringBuilder(ORACLE_URL_PREFIX);

        List<String> hosts = datasourceConfiguration
                .getEndpoints()
                .stream()
                .map(endpoint -> endpoint.getHost() + ":" + ObjectUtils.defaultIfNull(endpoint.getPort(), 1521L))
                .collect(Collectors.toList());

        urlBuilder.append(String.join(",", hosts)).append("/");

        if (!isBlank(authentication.getDatabaseName())) {
            urlBuilder.append(authentication.getDatabaseName());
        }

        /*
         * - Ideally, it is never expected to be null because the SSL dropdown is set to a initial value.
         */
        if (datasourceConfiguration.getConnection() == null
                || datasourceConfiguration.getConnection().getSsl() == null
                || datasourceConfiguration.getConnection().getSsl().getAuthType() == null) {
            throw new AppsmithPluginException(OraclePluginError.ORACLE_PLUGIN_ERROR,
                    OracleErrorMessages.SSL_CONFIGURATION_ERROR_MSG);
        }

        SSLDetails.AuthType sslAuthType = datasourceConfiguration.getConnection().getSsl().getAuthType();
        switch (sslAuthType) {
            case DISABLE:
                /* do nothing */

                break;
            case NO_VERIFY:
                /* convert tcp to tcps in the URL */
                urlBuilder.insert(ORACLE_URL_PREFIX_TCPS_OFFSET, 's');

                break;
            default:
                throw new AppsmithPluginException(OraclePluginError.ORACLE_PLUGIN_ERROR,
                        String.format(OracleErrorMessages.INVALID_SSL_OPTION_ERROR_MSG, sslAuthType));
        }

        String url = urlBuilder.toString();
        config.setJdbcUrl(url);

        // Configuring leak detection threshold for 60 seconds. Any connection which hasn't been released in 60 seconds
        // should get tracked (may be falsely for long running queries) as leaked connection
        config.setLeakDetectionThreshold(LEAK_DETECTION_TIME_MS);

        // Now create the connection pool from the configuration
        HikariDataSource datasource = null;
        try {
            datasource = new HikariDataSource(config);
        } catch (HikariPool.PoolInitializationException e) {
            throw new AppsmithPluginException(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    OracleErrorMessages.CONNECTION_POOL_CREATION_FAILED_ERROR_MSG, e.getMessage());
        }

        return datasource;
    }

    /**
     * First checks if the connection pool is still valid. If yes, we fetch a connection from the pool and return
     * In case a connection is not available in the pool, SQL Exception is thrown
     */
    public static java.sql.Connection getConnectionFromConnectionPool(HikariDataSource connectionPool) throws SQLException {

        if (connectionPool == null || connectionPool.isClosed() || !connectionPool.isRunning()) {
            System.out.println(Thread.currentThread().getName() +
                    ": Encountered stale connection pool in Oracle plugin. Reporting back.");
            throw new StaleConnectionException();
        }

        return connectionPool.getConnection();
    }
}

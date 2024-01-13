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
import reactor.core.publisher.Mono;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.constants.PluginConstants.PluginName.ORACLE_PLUGIN_NAME;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_POOL_CLOSED_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_POOL_NOT_RUNNING_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_POOL_NULL_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.UNKNOWN_CONNECTION_ERROR_MSG;
import static com.appsmith.external.helpers.PluginUtils.safelyCloseSingleConnectionFromHikariCP;
import static com.external.plugins.OraclePlugin.OraclePluginExecutor.scheduler;
import static com.external.plugins.OraclePlugin.oracleDatasourceUtils;
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

    public static final String ORACLE_PRIMARY_KEY_INDICATOR = "P";

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
            "SELECT " + "table_name, column_name, data_type " + "FROM " + "user_tab_cols";

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
            "SELECT " + "    cols.table_name, "
                    + "    cols.column_name, "
                    + "    cons.constraint_type, "
                    + "    cons.constraint_name, "
                    + "    cons.r_constraint_name "
                    + "FROM "
                    + "    all_cons_columns cols "
                    + "    JOIN all_constraints cons "
                    + "        ON cols.owner = cons.owner "
                    + "        AND cols.constraint_name = cons.constraint_name "
                    + "    JOIN all_tab_cols tab_cols "
                    + "        ON cols.owner = tab_cols.owner "
                    + "        AND cols.table_name = tab_cols.table_name "
                    + "        AND cols.column_name = tab_cols.column_name "
                    + "WHERE "
                    + "    cons.constraint_type IN ('P', 'R') "
                    + "    AND cons.owner = 'ADMIN' "
                    + "ORDER BY "
                    + "    cols.table_name, "
                    + "    cols.position";

    public static void datasourceDestroy(HikariDataSource connectionPool) {
        if (connectionPool != null) {
            log.debug(Thread.currentThread().getName() + ": Closing Oracle DB Connection Pool");
            connectionPool.close();
        }
    }

    public static Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
        Set<String> invalids = new HashSet<>();

        if (isEmpty(datasourceConfiguration.getEndpoints())) {
            invalids.add(OracleErrorMessages.DS_MISSING_ENDPOINT_ERROR_MSG);
        } else {
            for (final Endpoint endpoint : datasourceConfiguration.getEndpoints()) {
                if (isBlank(endpoint.getHost())) {
                    invalids.add(OracleErrorMessages.DS_MISSING_HOSTNAME_ERROR_MSG);
                } else if (endpoint.getHost().contains("/")
                        || endpoint.getHost().contains(":")) {
                    invalids.add(String.format(OracleErrorMessages.DS_INVALID_HOSTNAME_ERROR_MSG, endpoint.getHost()));
                }
            }
        }

        if (datasourceConfiguration.getAuthentication() == null) {
            invalids.add(OracleErrorMessages.DS_MISSING_AUTHENTICATION_DETAILS_ERROR_MSG);

        } else {
            DBAuth authentication = (DBAuth) datasourceConfiguration.getAuthentication();
            if (isBlank(authentication.getUsername())) {
                invalids.add(OracleErrorMessages.DS_MISSING_USERNAME_ERROR_MSG);
            }

            if (isBlank(authentication.getPassword())) {
                invalids.add(OracleErrorMessages.DS_MISSING_PASSWORD_ERROR_MSG);
            }

            if (isBlank(authentication.getDatabaseName())) {
                invalids.add(OracleErrorMessages.DS_MISSING_SERVICE_NAME_ERROR_MSG);
            }
        }

        /*
         * - Ideally, it is never expected to be null because the SSL dropdown is set to a initial value.
         */
        if (datasourceConfiguration.getConnection() == null
                || datasourceConfiguration.getConnection().getSsl() == null
                || datasourceConfiguration.getConnection().getSsl().getAuthType() == null) {
            invalids.add(OracleErrorMessages.SSL_CONFIGURATION_ERROR_MSG);
        }

        return invalids;
    }

    public static Mono<DatasourceStructure> getStructure(
            HikariDataSource connectionPool, DatasourceConfiguration datasourceConfiguration) {
        final DatasourceStructure structure = new DatasourceStructure();
        final Map<String, DatasourceStructure.Table> tableNameToTableMap = new LinkedHashMap<>();

        return Mono.fromSupplier(() -> {
                    Connection connectionFromPool;
                    try {
                        connectionFromPool = oracleDatasourceUtils.getConnectionFromHikariConnectionPool(
                                connectionPool, ORACLE_PLUGIN_NAME);
                    } catch (SQLException | StaleConnectionException e) {
                        // The function can throw either StaleConnectionException or SQLException. The
                        // underlying hikari library throws SQLException in case the pool is closed or there is an issue
                        // initializing the connection pool which can also be translated in our world to
                        // StaleConnectionException and should then trigger the destruction and recreation of the pool.
                        return Mono.error(
                                e instanceof StaleConnectionException
                                        ? e
                                        : new StaleConnectionException(e.getMessage()));
                    }

                    logHikariCPStatus("Before getting Oracle DB schema", connectionPool);

                    try (Statement statement = connectionFromPool.createStatement()) {
                        // Set table names. For each table set its column names and column types.
                        setTableNamesAndColumnNamesAndColumnTypes(statement, tableNameToTableMap);

                        // Set primary key and foreign key constraints.
                        setPrimaryAndForeignKeyInfoInTables(statement, tableNameToTableMap);

                    } catch (SQLException throwable) {
                        return Mono.error(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR,
                                OracleErrorMessages.GET_STRUCTURE_ERROR_MSG,
                                throwable.getCause(),
                                "SQLSTATE: " + throwable.getSQLState()));
                    } finally {
                        logHikariCPStatus("After getting Oracle DB schema", connectionPool);
                        safelyCloseSingleConnectionFromHikariCP(
                                connectionFromPool,
                                "Error returning Oracle connection to pool " + "during get structure");
                    }

                    // Set SQL query templates
                    setSQLQueryTemplates(tableNameToTableMap);

                    structure.setTables(new ArrayList<>(tableNameToTableMap.values()));
                    return structure;
                })
                .map(resultStructure -> (DatasourceStructure) resultStructure)
                .subscribeOn(scheduler);
    }

    /**
     * Run a SQL query to fetch all user accessible tables along with their column names and if the column is a
     * primary or foreign key. Since the remote table relationship for a foreign key column is not explicitly defined
     * we create a 1:1 map here for primary_key -> table, and foreign_key -> table so that we can find both the
     * tables to which a foreign key is related to.
     * Please check the SQL query macro definition to find a sample response as comment.
     */
    private static void setPrimaryAndForeignKeyInfoInTables(
            Statement statement, Map<String, DatasourceStructure.Table> tableNameToTableMap) throws SQLException {
        Map<String, String> primaryKeyConstraintNameToTableNameMap = new HashMap<>();
        Map<String, String> primaryKeyConstraintNameToColumnNameMap = new HashMap<>();
        Map<String, String> foreignKeyConstraintNameToTableNameMap = new HashMap<>();
        Map<String, String> foreignKeyConstraintNameToColumnNameMap = new HashMap<>();
        Map<String, String> foreignKeyConstraintNameToRemoteConstraintNameMap = new HashMap<>();

        try (ResultSet columnsResultSet =
                statement.executeQuery(ORACLE_SQL_QUERY_TO_GET_ALL_TABLE_COLUMN_KEY_CONSTRAINTS)) {
            while (columnsResultSet.next()) {
                final String tableName = columnsResultSet.getString("TABLE_NAME");
                final String columnName = columnsResultSet.getString("COLUMN_NAME");
                final String constraintType = columnsResultSet.getString("CONSTRAINT_TYPE");
                final String constraintName = columnsResultSet.getString("CONSTRAINT_NAME");
                final String remoteConstraintName = columnsResultSet.getString("R_CONSTRAINT_NAME");

                if (ORACLE_PRIMARY_KEY_INDICATOR.equalsIgnoreCase(constraintType)) {
                    primaryKeyConstraintNameToTableNameMap.put(constraintName, tableName);
                    primaryKeyConstraintNameToColumnNameMap.put(constraintName, columnName);
                } else {
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
                        table.getKeys().add(new DatasourceStructure.PrimaryKey(constraintName, List.of(columnName)));
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
                        table.getKeys()
                                .add(new DatasourceStructure.ForeignKey(
                                        constraintName, List.of(columnName), List.of(remoteColumn)));
                    });
        }
    }

    /**
     * Run a SQL query to fetch all tables accessible to user along with their columns and data  type of each column.
     * Then read the response and populate Appsmith's Table object with the same.
     * Please check the SQL query macro definition to find a sample response as comment.
     */
    private static void setTableNamesAndColumnNamesAndColumnTypes(
            Statement statement, Map<String, DatasourceStructure.Table> tableNameToTableMap) throws SQLException {
        try (ResultSet columnsResultSet = statement.executeQuery(ORACLE_SQL_QUERY_TO_GET_ALL_TABLE_COLUMN_TYPE)) {
            while (columnsResultSet.next()) {
                final String tableName = columnsResultSet.getString("TABLE_NAME");
                if (!tableNameToTableMap.containsKey(tableName)) {
                    tableNameToTableMap.put(
                            tableName,
                            new DatasourceStructure.Table(
                                    DatasourceStructure.TableType.TABLE,
                                    "",
                                    tableName,
                                    new ArrayList<>(),
                                    new ArrayList<>(),
                                    new ArrayList<>()));
                }
                final DatasourceStructure.Table table = tableNameToTableMap.get(tableName);
                table.getColumns()
                        .add(new DatasourceStructure.Column(
                                columnsResultSet.getString("COLUMN_NAME"),
                                columnsResultSet.getString("DATA_TYPE"),
                                null,
                                false));
            }
        }
    }

    private static void setSQLQueryTemplates(Map<String, DatasourceStructure.Table> tableNameToTableMap) {
        tableNameToTableMap.values().stream().forEach(table -> {
            LinkedHashMap<String, String> columnNameToSampleColumnDataMap = new LinkedHashMap<>();
            table.getColumns().stream().forEach(column -> {
                columnNameToSampleColumnDataMap.put(column.getName(), getSampleColumnData(column.getType()));
            });

            String selectQueryTemplate =
                    MessageFormat.format("SELECT * FROM {0} WHERE " + "ROWNUM < 10", table.getName());
            String insertQueryTemplate = MessageFormat.format(
                    "INSERT INTO {0} ({1}) " + "VALUES ({2})",
                    table.getName(),
                    getSampleColumnNamesCSVString(columnNameToSampleColumnDataMap),
                    getSampleColumnDataCSVString(columnNameToSampleColumnDataMap));
            String updateQueryTemplate = MessageFormat.format(
                    "UPDATE {0} SET {1} WHERE " + "1=0 -- Specify a valid condition here. Removing the condition may "
                            + "update every row in the table!",
                    table.getName(), getSampleOneColumnUpdateString(columnNameToSampleColumnDataMap));
            String deleteQueryTemplate = MessageFormat.format(
                    "DELETE FROM {0} WHERE 1=0" + " -- Specify a valid condition here. Removing the condition may "
                            + "delete everything in the table!",
                    table.getName());

            table.getTemplates()
                    .add(new DatasourceStructure.Template(
                            "SELECT", null, Map.of("body", Map.of("data", selectQueryTemplate)), true));
            table.getTemplates()
                    .add(new DatasourceStructure.Template(
                            "INSERT", null, Map.of("body", Map.of("data", insertQueryTemplate)), false));
            table.getTemplates()
                    .add(new DatasourceStructure.Template(
                            "UPDATE", null, Map.of("body", Map.of("data", updateQueryTemplate)), false));
            table.getTemplates()
                    .add(new DatasourceStructure.Template(
                            "DELETE", null, Map.of("body", Map.of("data", deleteQueryTemplate)), false));
        });
    }

    private static String getSampleOneColumnUpdateString(
            LinkedHashMap<String, String> columnNameToSampleColumnDataMap) {
        return MessageFormat.format(
                "{0}={1}",
                columnNameToSampleColumnDataMap.keySet().stream().findFirst().orElse("id"),
                columnNameToSampleColumnDataMap.values().stream().findFirst().orElse("'uid'"));
    }

    private static String getSampleColumnNamesCSVString(LinkedHashMap<String, String> columnNameToSampleColumnDataMap) {
        return String.join(", ", columnNameToSampleColumnDataMap.keySet());
    }

    private static String getSampleColumnDataCSVString(LinkedHashMap<String, String> columnNameToSampleColumnDataMap) {
        return String.join(", ", columnNameToSampleColumnDataMap.values());
    }

    private static String getSampleColumnData(String type) {
        if (type == null) {
            return "NULL";
        }

        switch (type.toUpperCase()) {
            case "NUMBER":
                return "1";
            case "FLOAT": /* Fall through */
            case "DOUBLE":
                return "1.0";
            case "CHAR": /* Fall through */
            case "NCHAR": /* Fall through */
            case "VARCHAR": /* Fall through */
            case "VARCHAR2": /* Fall through */
            case "NVARCHAR": /* Fall through */
            case "NVARCHAR2":
                return "'text'";
            case "NULL": /* Fall through */
            default:
                return "NULL";
        }
    }

    public static HikariDataSource createConnectionPool(DatasourceConfiguration datasourceConfiguration)
            throws AppsmithPluginException {
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

        List<String> hosts = datasourceConfiguration.getEndpoints().stream()
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
            throw new AppsmithPluginException(
                    OraclePluginError.ORACLE_PLUGIN_ERROR, OracleErrorMessages.SSL_CONFIGURATION_ERROR_MSG);
        }

        SSLDetails.AuthType sslAuthType =
                datasourceConfiguration.getConnection().getSsl().getAuthType();
        switch (sslAuthType) {
            case DISABLE:
                /* do nothing */

                break;
            case NO_VERIFY:
                /* convert tcp to tcps in the URL */
                urlBuilder.insert(ORACLE_URL_PREFIX_TCPS_OFFSET, 's');

                break;
            default:
                throw new AppsmithPluginException(
                        OraclePluginError.ORACLE_PLUGIN_ERROR,
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
            throw new AppsmithPluginException(
                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                    OracleErrorMessages.CONNECTION_POOL_CREATION_FAILED_ERROR_MSG,
                    e.getMessage());
        }

        return datasource;
    }

    public static void logHikariCPStatus(String logPrefix, HikariDataSource connectionPool) {
        HikariPoolMXBean poolProxy = connectionPool.getHikariPoolMXBean();
        int idleConnections = poolProxy.getIdleConnections();
        int activeConnections = poolProxy.getActiveConnections();
        int totalConnections = poolProxy.getTotalConnections();
        int threadsAwaitingConnection = poolProxy.getThreadsAwaitingConnection();
        log.debug(MessageFormat.format(
                "{0}: Hikari Pool stats : active - {1} , idle - {2}, awaiting - {3} , total - {4}",
                logPrefix, activeConnections, idleConnections, threadsAwaitingConnection, totalConnections));
    }

    public void checkHikariCPConnectionPoolValidity(HikariDataSource connectionPool, String pluginName)
            throws StaleConnectionException {
        if (connectionPool == null || connectionPool.isClosed() || !connectionPool.isRunning()) {
            String printMessage = MessageFormat.format(
                    Thread.currentThread().getName()
                            + ": Encountered stale connection pool in {0} plugin. Reporting back.",
                    pluginName);
            System.out.println(printMessage);

            if (connectionPool == null) {
                throw new StaleConnectionException(CONNECTION_POOL_NULL_ERROR_MSG);
            } else if (connectionPool.isClosed()) {
                throw new StaleConnectionException(CONNECTION_POOL_CLOSED_ERROR_MSG);
            } else if (!connectionPool.isRunning()) {
                throw new StaleConnectionException(CONNECTION_POOL_NOT_RUNNING_ERROR_MSG);
            } else {
                /**
                 * Ideally, code flow is never expected to reach here. However, this section has been added to catch
                 * those cases wherein a developer updates the parent if condition but does not update the nested
                 * if else conditions.
                 */
                throw new StaleConnectionException(UNKNOWN_CONNECTION_ERROR_MSG);
            }
        }
    }

    public Connection getConnectionFromHikariConnectionPool(HikariDataSource connectionPool, String pluginName)
            throws SQLException {
        checkHikariCPConnectionPoolValidity(connectionPool, pluginName);
        return connectionPool.getConnection();
    }
}

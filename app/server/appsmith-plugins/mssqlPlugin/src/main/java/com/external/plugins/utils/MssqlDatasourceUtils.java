package com.external.plugins.utils;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.external.plugins.exceptions.MssqlErrorMessages;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.constants.PluginConstants.PluginName.MSSQL_PLUGIN_NAME;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_POOL_CLOSED_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_POOL_NOT_RUNNING_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.CONNECTION_POOL_NULL_ERROR_MSG;
import static com.appsmith.external.exceptions.pluginExceptions.BasePluginErrorMessages.UNKNOWN_CONNECTION_ERROR_MSG;
import static com.appsmith.external.helpers.PluginUtils.safelyCloseSingleConnectionFromHikariCP;
import static com.external.plugins.MssqlPlugin.MssqlPluginExecutor.scheduler;
import static com.external.plugins.MssqlPlugin.mssqlDatasourceUtils;

@Slf4j
public class MssqlDatasourceUtils {

    public static final String PRIMARY_KEY_INDICATOR = "PRIMARY KEY";

    /**
     * Example output:
     *
     * <pre>
     * +------------+-----------+---------------+-------------+
     * | TABLE_NAME | COLUMN_NAME | COLUMN_TYPE | SCHEMA_NAME |
     * +------------+-----------+---------------+-------------+
     * | CLUB       | ID        | NUMBER        | DBO         |
     * | STUDENTS   | NAME      | VARCHAR2      | DBO         |
     * +------------+-----------+--------------+--------------+
     * </pre>
     */
    private static final String QUERY_TO_GET_ALL_TABLE_COLUMN_TYPE = "SELECT \n" + "   col.name AS column_name,\n"
            + "   typ.name AS column_type,\n"
            + "   tbl.name AS table_name,\n"
            + "   sch.name AS schema_name\n"
            + "FROM sys.columns col\n"
            + "   INNER JOIN sys.tables tbl ON col.object_id = tbl.object_id\n"
            + "   INNER JOIN sys.types typ ON col.user_type_id = typ.user_type_id\n"
            + "   INNER JOIN sys.schemas sch ON tbl.schema_id = sch.schema_id\n"
            + "WHERE tbl.is_ms_shipped = 0\n"
            + "ORDER BY tbl.name, col.column_id;\n";

    /**
     * Example output:
     * <pre>
     * +------------+-----------+-----------------+-----------------+-------------+
     * | TABLE_NAME |COLUMN_NAME| CONSTRAINT_TYPE | CONSTRAINT_NAME | SCHEMA_NAME |
     * +------------+-----------+-----------------+-----------------+-------------+
     * | CLUB       | ID        | R               | FK_STUDENTS_ID  | DBO         |
     * | STUDENTS   | ID        | P               | SYS_C006397     | DBO         |
     * +------------+-----------+-----------------+-----------------+-------------+
     * </pre>
     */
    private static final String QUERY_TO_GET_ALL_TABLE_COLUMN_KEY_CONSTRAINTS = "SELECT \n" + "    cols.table_name,\n"
            + "    cols.column_name,\n"
            + "    cols.constraint_schema as schema_name,\n"
            + "    cons.constraint_type,\n"
            + "    cons.constraint_name\n"
            + "FROM \n"
            + "    INFORMATION_SCHEMA.KEY_COLUMN_USAGE cols\n"
            + "    JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS cons\n"
            + "        ON cols.CONSTRAINT_SCHEMA = cons.CONSTRAINT_SCHEMA\n"
            + "        AND cols.CONSTRAINT_NAME = cons.CONSTRAINT_NAME\n"
            + "WHERE \n"
            + "    cons.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')\n"
            + "    AND cols.CONSTRAINT_SCHEMA = 'dbo'\n"
            + "ORDER BY \n"
            + "    cols.table_name,\n"
            + "    cols.ordinal_position\n";

    public static Mono<DatasourceStructure> getStructure(
            HikariDataSource connection, DatasourceConfiguration datasourceConfiguration) {
        final DatasourceStructure structure = new DatasourceStructure();
        final Map<String, DatasourceStructure.Table> tableNameToTableMap = new LinkedHashMap<>();

        return Mono.fromSupplier(() -> {
                    Connection connectionFromPool;
                    try {
                        connectionFromPool = mssqlDatasourceUtils.getConnectionFromHikariConnectionPool(
                                connection, MSSQL_PLUGIN_NAME);
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

                    logHikariCPStatus("Before getting Mssql DB schema", connection);

                    try (Statement statement = connectionFromPool.createStatement()) {
                        // Set table names. For each table set its column names and column types.
                        setTableNamesAndColumnNamesAndColumnTypes(statement, tableNameToTableMap);

                        // Set primary key and foreign key constraints.
                        setPrimaryAndForeignKeyInfoInTables(statement, tableNameToTableMap);

                    } catch (SQLException throwable) {
                        return Mono.error(new AppsmithPluginException(
                                AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR,
                                MssqlErrorMessages.GET_STRUCTURE_ERROR_MSG,
                                throwable.getCause(),
                                "SQLSTATE: " + throwable.getSQLState()));
                    } finally {
                        logHikariCPStatus("After getting Oracle DB schema", connection);
                        safelyCloseSingleConnectionFromHikariCP(
                                connectionFromPool,
                                "Error returning Oracle connection to pool " + "during get structure");
                    }

                    // Set SQL query templates
                    setSQLQueryTemplates(tableNameToTableMap);

                    structure.setTables(new ArrayList<>(tableNameToTableMap.values()));
                    log.debug("Got the structure of postgres db");
                    return structure;
                })
                .map(resultStructure -> (DatasourceStructure) resultStructure)
                .subscribeOn(scheduler);
    }

    /**
     * First checks if the connection pool is still valid. If yes, we fetch a connection from the pool and return
     * In case a connection is not available in the pool, SQL Exception is thrown
     *
     * @param connectionPool
     * @return SQL Connection
     */
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

    /**
     * Run a SQL query to fetch all tables accessible to user along with their columns and data  type of each column.
     * Then read the response and populate Appsmith's Table object with the same.
     * Please check the SQL query macro definition to find a sample response as comment.
     */
    private static void setTableNamesAndColumnNamesAndColumnTypes(
            Statement statement, Map<String, DatasourceStructure.Table> tableNameToTableMap) throws SQLException {
        try (ResultSet columnsResultSet = statement.executeQuery(QUERY_TO_GET_ALL_TABLE_COLUMN_TYPE)) {
            while (columnsResultSet.next()) {
                final String columnName = columnsResultSet.getString("column_name");
                final String columnType = columnsResultSet.getString("column_type");
                final String tableName = columnsResultSet.getString("table_name");
                final String schemaName = columnsResultSet.getString("schema_name");
                final String fullTableName = schemaName + "." + tableName;
                if (!tableNameToTableMap.containsKey(fullTableName)) {
                    tableNameToTableMap.put(
                            fullTableName,
                            new DatasourceStructure.Table(
                                    DatasourceStructure.TableType.TABLE,
                                    schemaName,
                                    fullTableName,
                                    new ArrayList<>(),
                                    new ArrayList<>(),
                                    new ArrayList<>()));
                }

                final DatasourceStructure.Table table = tableNameToTableMap.get(fullTableName);

                table.getColumns().add(new DatasourceStructure.Column(columnName, columnType, null, false));
            }
        }
    }

    /**
     * Run a SQL query to fetch all user accessible tables along with their column names and if the column is a
     * primary or foreign key.
     * Please check the SQL query macro definition to find a sample response as comment.
     */
    private static void setPrimaryAndForeignKeyInfoInTables(
            Statement statement, Map<String, DatasourceStructure.Table> tableNameToTableMap) throws SQLException {
        Map<String, String> primaryKeyConstraintNameToTableNameMap = new HashMap<>();
        Map<String, String> primaryKeyConstraintNameToColumnNameMap = new HashMap<>();
        Map<String, String> foreignKeyConstraintNameToTableNameMap = new HashMap<>();
        Map<String, String> foreignKeyConstraintNameToColumnNameMap = new HashMap<>();
        try (ResultSet constraintsResultSet = statement.executeQuery(QUERY_TO_GET_ALL_TABLE_COLUMN_KEY_CONSTRAINTS)) {
            while (constraintsResultSet.next()) {
                final String tableName = constraintsResultSet.getString("table_name");
                final String columnName = constraintsResultSet.getString("column_name");
                final String constraintType = constraintsResultSet.getString("constraint_type");
                final String constraintName = constraintsResultSet.getString("constraint_name");
                final String schemaName = constraintsResultSet.getString("schema_name");
                final String fullTableName = schemaName + "." + tableName;

                if (PRIMARY_KEY_INDICATOR.equalsIgnoreCase(constraintType)) {
                    primaryKeyConstraintNameToTableNameMap.put(constraintName, fullTableName);
                    primaryKeyConstraintNameToColumnNameMap.put(constraintName, columnName);
                } else {
                    foreignKeyConstraintNameToTableNameMap.put(constraintName, fullTableName);
                    foreignKeyConstraintNameToColumnNameMap.put(constraintName, columnName);
                }
            }
        }

        primaryKeyConstraintNameToColumnNameMap.keySet().stream()
                .filter(constraintName -> {
                    String tableName = primaryKeyConstraintNameToTableNameMap.get(constraintName);
                    return tableNameToTableMap.containsKey(tableName);
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
                    return tableNameToTableMap.containsKey(tableName);
                })
                .forEach(constraintName -> {
                    String tableName = foreignKeyConstraintNameToTableNameMap.get(constraintName);
                    DatasourceStructure.Table table = tableNameToTableMap.get(tableName);
                    String columnName = foreignKeyConstraintNameToColumnNameMap.get(constraintName);
                    table.getKeys()
                            .add(new DatasourceStructure.ForeignKey(
                                    constraintName, List.of(columnName), new ArrayList<>()));
                });
    }

    private static void setSQLQueryTemplates(Map<String, DatasourceStructure.Table> tableNameToTableMap) {
        tableNameToTableMap.values().forEach(table -> {
            LinkedHashMap<String, String> columnNameToSampleColumnDataMap = new LinkedHashMap<>();
            table.getColumns()
                    .forEach(column -> columnNameToSampleColumnDataMap.put(
                            column.getName(), getSampleColumnData(column.getType())));

            String selectQueryTemplate = MessageFormat.format("SELECT TOP 10 * FROM {0}", table.getName());
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

            table.getTemplates().add(new DatasourceStructure.Template("SELECT", selectQueryTemplate, true));
            table.getTemplates().add(new DatasourceStructure.Template("INSERT", insertQueryTemplate, false));
            table.getTemplates().add(new DatasourceStructure.Template("UPDATE", updateQueryTemplate, false));
            table.getTemplates().add(new DatasourceStructure.Template("DELETE", deleteQueryTemplate, false));
        });
    }

    private static String getSampleColumnData(String type) {
        if (type == null) {
            return "NULL";
        }

        return switch (type.toUpperCase()) {
            case "NUMBER", "INT" -> "1";
            case "FLOAT", "DOUBLE" -> "1.0";
            case "CHAR", "NCHAR", "VARCHAR", "VARCHAR2", "NVARCHAR", "NVARCHAR2" -> "'text'";
            default -> "NULL";
        };
    }

    private static String getSampleColumnNamesCSVString(LinkedHashMap<String, String> columnNameToSampleColumnDataMap) {
        return String.join(", ", columnNameToSampleColumnDataMap.keySet());
    }

    private static String getSampleColumnDataCSVString(LinkedHashMap<String, String> columnNameToSampleColumnDataMap) {
        return String.join(", ", columnNameToSampleColumnDataMap.values());
    }

    private static String getSampleOneColumnUpdateString(
            LinkedHashMap<String, String> columnNameToSampleColumnDataMap) {
        return MessageFormat.format(
                "{0}={1}",
                columnNameToSampleColumnDataMap.keySet().stream().findFirst().orElse("id"),
                columnNameToSampleColumnDataMap.values().stream().findFirst().orElse("'uid'"));
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

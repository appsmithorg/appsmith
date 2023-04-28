package com.external.plugins;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.OracleContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.MessageFormat;

import static com.external.plugins.OracleTestDBContainerManager.getDefaultDatasourceConfig;
import static com.external.plugins.utils.OracleDatasourceUtils.getConnectionFromConnectionPool;
import static com.external.plugins.utils.OracleExecuteUtils.closeConnectionPostExecution;

@Testcontainers
public class OracleExecutionTest {
    public static final String SQL_QUERY_CREATE_TABLE_FORMAT =
            "create table {0} (\n" +
            "c_varchar2   varchar2(20),\n" +
            "c_nvarchar2 nvarchar2(20),\n" +
            "c_number number,\n" +
            "c_float float,\n" +
            "c_date date,\n" +
            "c_binary_float binary_float,\n" +
            "c_binary_double binary_double,\n" +
            "c_timestamp timestamp,\n" +
            "c_timestamp_tz timestamp with time zone,\n" +
            "c_timestamp_ltz timestamp with local time zone,\n" +
            "c_interval_year interval year to month,\n" +
            "c_interval_day interval day to second,\n" +
            "c_rowid rowid,\n" +
            "c_urowid urowid,\n" +
            "c_char char(20),\n" +
            "c_nchar nchar(20),\n" +
            "c_clob clob,\n" +
            "c_nclob nclob,\n" +
            ")\n";
    private static final String SQL_QUERY_TO_INSERT_ONE_ROW_FORMAT =
            "insert into {0} values (\n" +
            "'varchar2',\n" +
            "'nvarchar2',\n" +
            "{1},\n" +
            "11.22,\n" +
            "'03-OCT-02',\n" +
            "11.22,\n" +
            "11.22,\n" +
            "TIMESTAMP'1997-01-01 09:26:50.124',\n" +
            "TIMESTAMP'1997-01-01 09:26:56.66 +02:00',\n" +
            "TIMESTAMP'1999-04-05 8:00:00 US/Pacific',\n" +
            "INTERVAL '1' YEAR(3),\n" +
            "INTERVAL '1' HOUR,\n" +
            "'000001F8.0001.0006',\n" +
            "'000001F8.0001.0006',\n" +
            "'char',\n" +
            "'nchar',\n" +
            "'clob',\n" +
            "'nclob',\n" +
            ")";
    OraclePlugin.OraclePluginExecutor oraclePluginExecutor = new OraclePlugin.OraclePluginExecutor();

    @SuppressWarnings("rawtypes") // The type parameter for the container type is just itself and is pseudo-optional.
    @Container
    private static final OracleContainer oracleDB = OracleTestDBContainerManager.getOracleDBForTest();

    private static HikariDataSource sharedConnectionPool = null;

    @BeforeAll
    public void setup() throws SQLException {
        sharedConnectionPool = oraclePluginExecutor.datasourceCreate(getDefaultDatasourceConfig(oracleDB)).block();
        createTablesForTest();
    }

    public void createTablesForTest() throws SQLException {
        createTableWithName("testSelectWithoutPreparedStatement");
        createTableWithName("testSelectWithPreparedStatement");
        createTableWithName("testInsertWithoutPreparedStatement");
        createTableWithName("testInsertWithPreparedStatement");
        createTableWithName("testUpdateWithoutPreparedStatement");
        createTableWithName("testUpdateWithPreparedStatement");
        createTableWithName("testDeleteWithoutPreparedStatement");
        createTableWithName("testDeleteWithPreparedStatement");
    }

    private void createTableWithName(String tableName) throws SQLException {
        String sqlQueryToCreateTable = MessageFormat.format(SQL_QUERY_CREATE_TABLE_FORMAT, tableName);
        runSQLQueryOnOracleTestDB(sqlQueryToCreateTable);

        String sqlQueryToInsertRow1 = MessageFormat.format(SQL_QUERY_TO_INSERT_ONE_ROW_FORMAT, tableName, 1);
        runSQLQueryOnOracleTestDB(sqlQueryToInsertRow1);

        String sqlQueryToInsertRow2 = MessageFormat.format(SQL_QUERY_TO_INSERT_ONE_ROW_FORMAT, tableName, 2);
        runSQLQueryOnOracleTestDB(sqlQueryToInsertRow2);
    }

    private void runSQLQueryOnOracleTestDB(String sqlQuery) throws SQLException {
        Connection connectionFromPool = getConnectionFromConnectionPool(sharedConnectionPool);
        Statement statement = connectionFromPool.createStatement();
        statement.execute(sqlQuery);
        closeConnectionPostExecution(null, statement, null, connectionFromPool);
    }

    @Test
    public void testSelectQueryWithoutPreparedStatement() {
        String sqlSelectQuery = "select c_number from testSelectWithoutPreparedStatement";

    }
}

package com.external.plugins;

import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.OracleContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.SQLException;
import java.text.MessageFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.getExecuteDTOForTestWithBindingAndValueAndDataType;
import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.plugins.OracleTestDBContainerManager.getDefaultDatasourceConfig;
import static com.external.plugins.OracleTestDBContainerManager.oraclePluginExecutor;
import static com.external.plugins.OracleTestDBContainerManager.runSQLQueryOnOracleTestDB;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
public class OracleExecutionTest {
    public static final String SQL_QUERY_CREATE_TABLE_FORMAT = "create table {0} (\n" + "c_varchar2   varchar2(20),\n"
            + "c_nvarchar2 nvarchar2(20),\n"
            + "c_number number,\n"
            + "c_float float,\n"
            + "c_date date,\n"
            + "c_binary_float binary_float,\n"
            + "c_binary_double binary_double,\n"
            + "c_timestamp timestamp,\n"
            + "c_timestamp_tz timestamp with time zone,\n"
            + "c_timestamp_ltz timestamp with local time zone,\n"
            + "c_interval_year interval year to month,\n"
            + "c_interval_day interval day to second,\n"
            + "c_rowid rowid,\n"
            + "c_urowid urowid,\n"
            + "c_char char(20),\n"
            + "c_nchar nchar(20),\n"
            + "c_clob clob,\n"
            + "c_nclob nclob\n"
            + ")\n";
    private static final String SQL_QUERY_TO_INSERT_ONE_ROW_FORMAT = "insert into {0} values (\n" + "''varchar2'',\n"
            + "''nvarchar2'',\n"
            + "{1},\n"
            + "11.22,\n"
            + "''03-OCT-02'',\n"
            + "11.22,\n"
            + "11.22,\n"
            + "TIMESTAMP''1997-01-01 09:26:50.124'',\n"
            + "TIMESTAMP''1997-01-01 09:26:56.66 +02:00'',\n"
            + "TIMESTAMP''1999-04-05 8:00:00 US/Pacific'',\n"
            + "INTERVAL ''1'' YEAR(3),\n"
            + "INTERVAL ''1'' HOUR,\n"
            + "''000001F8.0001.0006'',\n"
            + "''000001F8.0001.0006'',\n"
            + "''char'',\n"
            + "''nchar'',\n"
            + "''clob'',\n"
            + "''nclob''\n"
            + ")";

    private static final String SQL_QUERY_TO_INSERT_ONE_ROW_WITH_BINDING_FORMAT =
            "insert into {0} values (\n" + "'{{'binding1'}}',\n"
                    + "'{{'binding2'}}',\n"
                    + "'{{'binding3'}}',\n"
                    + "'{{'binding4'}}',\n"
                    + "'{{'binding5'}}',\n"
                    + "'{{'binding6'}}',\n"
                    + "'{{'binding7'}}',\n"
                    + "TO_TIMESTAMP('{{'binding8'}}', ''YYYY-MM-DD HH24:MI:SS.FF''),\n"
                    + "TO_TIMESTAMP('{{'binding9'}}', ''YYYY-MM-DD HH24:MI:SS.FF''),\n"
                    + "TO_TIMESTAMP('{{'binding10'}}', ''YYYY-MM-DD HH24:MI:SS.FF''),\n"
                    + "NUMTOYMINTERVAL('{{'binding11'}}', ''YEAR''),\n"
                    + "NUMTODSINTERVAL('{{'binding12'}}', ''HOUR''),\n"
                    + "'{{'binding13'}}',\n"
                    + "'{{'binding14'}}',\n"
                    + "'{{'binding15'}}',\n"
                    + "'{{'binding16'}}',\n"
                    + "'{{'binding17'}}',\n"
                    + "'{{'binding18'}}'\n"
                    + ")";

    public static final String SELECT_TEST_WITHOUT_PREPARED_STMT_TABLE_NAME =
            "testSelectWithPreparedStatementWithoutAnyBinding";
    public static final String SELECT_TEST_WITH_PREPARED_STMT_TABLE_NAME = "testSelectWithPreparedStatementWithBinding";
    public static final String INSERT_TEST_WITHOUT_PREPARED_STMT_TABLE_NAME =
            "testInsertWithPreparedStatementWithoutAnyBinding";
    public static final String INSERT_TEST_WITH_PREPARED_STMT_TABLE_NAME = "testInsertWithPreparedStatementWithBinding";
    public static final String UPDATE_TEST_WITHOUT_PREPARED_STMT_TABLE_NAME =
            "testUpdateWithPreparedStatementWithoutAnyBinding";
    public static final String UPDATE_TEST_WITH_PREPARED_STMT_TABLE_NAME = "testUpdateWithPreparedStatementWithBinding";
    public static final String DELETE_TEST_WITHOUT_PREPARED_STMT_TABLE_NAME =
            "testDeleteWithPreparedStatementWithoutAnyBinding";
    public static final String DELETE_TEST_WITH_PREPARED_STMT_TABLE_NAME = "testDeleteWithPreparedStatementWithBinding";

    @SuppressWarnings("rawtypes") // The type parameter for the container type is just itself and is pseudo-optional.
    @Container
    private static final OracleContainer oracleDB = OracleTestDBContainerManager.getOracleDBForTest();

    private static HikariDataSource sharedConnectionPool = null;

    @BeforeAll
    public static void setup() throws SQLException {
        sharedConnectionPool = oraclePluginExecutor
                .datasourceCreate(getDefaultDatasourceConfig(oracleDB))
                .block();
        createTablesForTest();
    }

    public static void createTablesForTest() throws SQLException {
        createTableWithName(SELECT_TEST_WITHOUT_PREPARED_STMT_TABLE_NAME);
        createTableWithName(SELECT_TEST_WITH_PREPARED_STMT_TABLE_NAME);
        createTableWithName(INSERT_TEST_WITHOUT_PREPARED_STMT_TABLE_NAME);
        createTableWithName(INSERT_TEST_WITH_PREPARED_STMT_TABLE_NAME);
        createTableWithName(UPDATE_TEST_WITHOUT_PREPARED_STMT_TABLE_NAME);
        createTableWithName(UPDATE_TEST_WITH_PREPARED_STMT_TABLE_NAME);
        createTableWithName(DELETE_TEST_WITHOUT_PREPARED_STMT_TABLE_NAME);
        createTableWithName(DELETE_TEST_WITH_PREPARED_STMT_TABLE_NAME);
    }

    private static void createTableWithName(String tableName) throws SQLException {
        String sqlQueryToCreateTable = MessageFormat.format(SQL_QUERY_CREATE_TABLE_FORMAT, tableName);
        runSQLQueryOnOracleTestDB(sqlQueryToCreateTable, sharedConnectionPool);

        String sqlQueryToInsertRow1 = MessageFormat.format(SQL_QUERY_TO_INSERT_ONE_ROW_FORMAT, tableName, 1);
        runSQLQueryOnOracleTestDB(sqlQueryToInsertRow1, sharedConnectionPool);

        String sqlQueryToInsertRow2 = MessageFormat.format(SQL_QUERY_TO_INSERT_ONE_ROW_FORMAT, tableName, 2);
        runSQLQueryOnOracleTestDB(sqlQueryToInsertRow2, sharedConnectionPool);
    }

    @Test
    public void testSelectQueryWithPreparedStatementWithoutAnyBinding() {
        String sqlSelectQuery = MessageFormat.format(
                "SELECT c_number FROM {0} ORDER BY c_number", SELECT_TEST_WITHOUT_PREPARED_STMT_TABLE_NAME);
        Map formData = setDataValueSafelyInFormData(null, "body", sqlSelectQuery);
        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setFormData(formData);
        Mono<ActionExecutionResult> executionResultMono = oraclePluginExecutor.executeParameterized(
                sharedConnectionPool, new ExecuteActionDTO(), getDefaultDatasourceConfig(oracleDB), actionConfig);
        String expectedResultString = "[{\"C_NUMBER\":\"1\"},{\"C_NUMBER\":\"2\"}]";
        verifyColumnValue(executionResultMono, expectedResultString);
    }

    @Test
    public void testQueryWorksWithSemicolonInTheEnd() {
        String sqlSelectQuery = MessageFormat.format(
                "SELECT c_number FROM {0} ORDER BY c_number;", SELECT_TEST_WITHOUT_PREPARED_STMT_TABLE_NAME);
        Map formData = setDataValueSafelyInFormData(null, "body", sqlSelectQuery);
        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setFormData(formData);
        Mono<ActionExecutionResult> executionResultMono = oraclePluginExecutor.executeParameterized(
                sharedConnectionPool, new ExecuteActionDTO(), getDefaultDatasourceConfig(oracleDB), actionConfig);
        String expectedResultString = "[{\"C_NUMBER\":\"1\"},{\"C_NUMBER\":\"2\"}]";
        verifyColumnValue(executionResultMono, expectedResultString);
    }

    @Test
    public void testSelectQueryWithPreparedStatementWithBinding() {
        String sqlSelectQuery = MessageFormat.format(
                "SELECT c_number FROM {0} WHERE " + "c_varchar2='{{'binding1'}}' ORDER BY c_number DESC",
                SELECT_TEST_WITH_PREPARED_STMT_TABLE_NAME);
        Map formData = setDataValueSafelyInFormData(null, "body", sqlSelectQuery);
        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setFormData(formData);

        LinkedHashMap<String, List> bindingNameToValueAndDataTypeMap = new LinkedHashMap<>();
        bindingNameToValueAndDataTypeMap.put("binding1", List.of("varchar2", ClientDataType.STRING));
        ExecuteActionDTO executeActionDTO =
                getExecuteDTOForTestWithBindingAndValueAndDataType(bindingNameToValueAndDataTypeMap);

        Mono<ActionExecutionResult> executionResultMono = oraclePluginExecutor.executeParameterized(
                sharedConnectionPool, executeActionDTO, getDefaultDatasourceConfig(oracleDB), actionConfig);
        String expectedResultString = "[{\"C_NUMBER\":\"2\"},{\"C_NUMBER\":\"1\"}]";
        verifyColumnValue(executionResultMono, expectedResultString);
    }

    @Test
    public void testInsertQueryReturnValueWithPreparedStatementWithoutAnyBinding() {
        String sqlInsertQuery = MessageFormat.format(
                SQL_QUERY_TO_INSERT_ONE_ROW_FORMAT, INSERT_TEST_WITHOUT_PREPARED_STMT_TABLE_NAME, 3);
        Map insertQueryFormData = setDataValueSafelyInFormData(null, "body", sqlInsertQuery);
        ActionConfiguration insertQueryActionConfig = new ActionConfiguration();
        insertQueryActionConfig.setFormData(insertQueryFormData);
        Mono<ActionExecutionResult> insertQueryExecutionResultMono = oraclePluginExecutor.executeParameterized(
                sharedConnectionPool,
                new ExecuteActionDTO(),
                getDefaultDatasourceConfig(oracleDB),
                insertQueryActionConfig);
        String insertQueryExpectedResultString = "[{\"affectedRows\":1}]";
        verifyColumnValue(insertQueryExecutionResultMono, insertQueryExpectedResultString);
    }

    @Test
    public void testInsertQueryVerifyNewRowAddedWithPreparedStatementWithoutAnyBinding() {
        String sqlInsertQuery = MessageFormat.format(
                SQL_QUERY_TO_INSERT_ONE_ROW_FORMAT, INSERT_TEST_WITHOUT_PREPARED_STMT_TABLE_NAME, 4);
        Map insertQueryFormData = setDataValueSafelyInFormData(null, "body", sqlInsertQuery);
        ActionConfiguration insertQueryActionConfig = new ActionConfiguration();
        insertQueryActionConfig.setFormData(insertQueryFormData);
        oraclePluginExecutor
                .executeParameterized(
                        sharedConnectionPool,
                        new ExecuteActionDTO(),
                        getDefaultDatasourceConfig(oracleDB),
                        insertQueryActionConfig)
                .block();

        String sqlSelectQuery = MessageFormat.format(
                "SELECT * FROM {0} WHERE c_number=4", INSERT_TEST_WITHOUT_PREPARED_STMT_TABLE_NAME);
        Map selectQueryFormData = setDataValueSafelyInFormData(null, "body", sqlSelectQuery);
        ActionConfiguration selectQueryActionConfig = new ActionConfiguration();
        selectQueryActionConfig.setFormData(selectQueryFormData);
        Mono<ActionExecutionResult> selectQueryExecutionResultMono = oraclePluginExecutor.executeParameterized(
                sharedConnectionPool,
                new ExecuteActionDTO(),
                getDefaultDatasourceConfig(oracleDB),
                selectQueryActionConfig);
        String selectQueryExpectedResultString = "[" + "{"
                + "\"C_VARCHAR2\":\"varchar2\","
                + "\"C_NVARCHAR2\":\"nvarchar2\","
                + "\"C_NUMBER\":\"4\","
                + "\"C_FLOAT\":\"11.22\","
                + "\"C_DATE\":\"2002-10-03\","
                + "\"C_BINARY_FLOAT\":\"11.22\","
                + "\"C_BINARY_DOUBLE\":\"11.22\","
                + "\"C_TIMESTAMP\":\"1997-01-01T09:26:50.124Z\","
                + "\"C_TIMESTAMP_TZ\":\"1997-01-01T09:26:56.66+02:00\","
                + "\"C_TIMESTAMP_LTZ\":\"1999-04-05T15:00:00Z\","
                + "\"C_INTERVAL_YEAR\":\"1-0\","
                + "\"C_INTERVAL_DAY\":\"0 1:0:0.0\","
                + "\"C_ROWID\":\"AAAAAAAAGAAAAH4AAB\","
                + "\"C_UROWID\":\"000001F8.0001.0006\","
                + "\"C_CHAR\":\"char                \","
                + "\"C_NCHAR\":\"nchar               \","
                + "\"C_CLOB\":\"clob\","
                + "\"C_NCLOB\":\"nclob\""
                + "}"
                + "]";
        verifyColumnValue(selectQueryExecutionResultMono, selectQueryExpectedResultString);
    }

    @Test
    public void testInsertQueryReturnValueWithPreparedStatementWithBinding() {
        String sqlInsertQuery = MessageFormat.format(
                SQL_QUERY_TO_INSERT_ONE_ROW_WITH_BINDING_FORMAT, INSERT_TEST_WITH_PREPARED_STMT_TABLE_NAME);
        Map insertQueryFormData = setDataValueSafelyInFormData(null, "body", sqlInsertQuery);
        ActionConfiguration insertQueryActionConfig = new ActionConfiguration();
        insertQueryActionConfig.setFormData(insertQueryFormData);

        LinkedHashMap<String, List> bindingNameToValueAndDataTypeMap = new LinkedHashMap<>();
        bindingNameToValueAndDataTypeMap.put("binding1", List.of("varchar2", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding2", List.of("nvarchar2", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding3", List.of("3", ClientDataType.NUMBER));
        bindingNameToValueAndDataTypeMap.put("binding4", List.of("11.22", ClientDataType.NUMBER));
        bindingNameToValueAndDataTypeMap.put("binding5", List.of("03-OCT-02", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding6", List.of("11.22", ClientDataType.NUMBER));
        bindingNameToValueAndDataTypeMap.put("binding7", List.of("11.22", ClientDataType.NUMBER));
        bindingNameToValueAndDataTypeMap.put("binding8", List.of("1997-01-01 09:26:50.124", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding9", List.of("1997-01-01 09:26:50.124", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding10", List.of("1997-01-01 09:26:50.124", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding11", List.of("1", ClientDataType.NUMBER));
        bindingNameToValueAndDataTypeMap.put("binding12", List.of("1", ClientDataType.NUMBER));
        bindingNameToValueAndDataTypeMap.put("binding13", List.of("000001F8.0001.0006", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding14", List.of("000001F8.0001.0006", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding15", List.of("char", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding16", List.of("nchar", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding17", List.of("clob", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding18", List.of("nclob", ClientDataType.STRING));

        ExecuteActionDTO executeActionDTO =
                getExecuteDTOForTestWithBindingAndValueAndDataType(bindingNameToValueAndDataTypeMap);

        Mono<ActionExecutionResult> insertQueryExecutionResultMono = oraclePluginExecutor.executeParameterized(
                sharedConnectionPool, executeActionDTO, getDefaultDatasourceConfig(oracleDB), insertQueryActionConfig);
        String insertQueryExpectedResultString = "[{\"affectedRows\":1}]";
        verifyColumnValue(insertQueryExecutionResultMono, insertQueryExpectedResultString);
    }

    @Test
    public void testInsertQueryVerifyNewRowAddedWithPreparedStatementWithBinding() {
        String sqlInsertQuery = MessageFormat.format(
                SQL_QUERY_TO_INSERT_ONE_ROW_WITH_BINDING_FORMAT, INSERT_TEST_WITH_PREPARED_STMT_TABLE_NAME);
        Map insertQueryFormData = setDataValueSafelyInFormData(null, "body", sqlInsertQuery);
        ActionConfiguration insertQueryActionConfig = new ActionConfiguration();
        insertQueryActionConfig.setFormData(insertQueryFormData);

        LinkedHashMap<String, List> bindingNameToValueAndDataTypeMap = new LinkedHashMap<>();
        bindingNameToValueAndDataTypeMap.put("binding1", List.of("varchar2", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding2", List.of("nvarchar2", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding3", List.of("5", ClientDataType.NUMBER));
        bindingNameToValueAndDataTypeMap.put("binding4", List.of("11.22", ClientDataType.NUMBER));
        bindingNameToValueAndDataTypeMap.put("binding5", List.of("03-OCT-02", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding6", List.of("11.22", ClientDataType.NUMBER));
        bindingNameToValueAndDataTypeMap.put("binding7", List.of("11.22", ClientDataType.NUMBER));
        bindingNameToValueAndDataTypeMap.put("binding8", List.of("1997-01-01 09:26:50.124", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding9", List.of("1997-01-01 09:26:50.124", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding10", List.of("1997-01-01 09:26:50.124", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding11", List.of("1", ClientDataType.NUMBER));
        bindingNameToValueAndDataTypeMap.put("binding12", List.of("1", ClientDataType.NUMBER));
        bindingNameToValueAndDataTypeMap.put("binding13", List.of("000001F8.0001.0006", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding14", List.of("000001F8.0001.0006", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding15", List.of("char", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding16", List.of("nchar", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding17", List.of("clob", ClientDataType.STRING));
        bindingNameToValueAndDataTypeMap.put("binding18", List.of("nclob", ClientDataType.STRING));

        ExecuteActionDTO executeActionDTO =
                getExecuteDTOForTestWithBindingAndValueAndDataType(bindingNameToValueAndDataTypeMap);
        oraclePluginExecutor
                .executeParameterized(
                        sharedConnectionPool,
                        executeActionDTO,
                        getDefaultDatasourceConfig(oracleDB),
                        insertQueryActionConfig)
                .block();

        String sqlSelectQuery = MessageFormat.format(
                "SELECT c_varchar2, c_nvarchar2, c_number, c_float, c_date, "
                        + "c_binary_float, c_binary_double, c_timestamp, c_interval_year, "
                        + "c_interval_day, c_rowid, c_urowid, c_char, c_nchar, c_clob, c_nclob FROM {0} WHERE c_number=5",
                INSERT_TEST_WITH_PREPARED_STMT_TABLE_NAME);
        Map selectQueryFormData = setDataValueSafelyInFormData(null, "body", sqlSelectQuery);
        ActionConfiguration selectQueryActionConfig = new ActionConfiguration();
        selectQueryActionConfig.setFormData(selectQueryFormData);
        Mono<ActionExecutionResult> selectQueryExecutionResultMono = oraclePluginExecutor.executeParameterized(
                sharedConnectionPool,
                new ExecuteActionDTO(),
                getDefaultDatasourceConfig(oracleDB),
                selectQueryActionConfig);
        String selectQueryExpectedResultString = "[" + "{"
                + "\"C_VARCHAR2\":\"varchar2\","
                + "\"C_NVARCHAR2\":\"nvarchar2\","
                + "\"C_NUMBER\":\"5\","
                + "\"C_FLOAT\":\"11.22\","
                + "\"C_DATE\":\"2002-10-03\","
                + "\"C_BINARY_FLOAT\":\"11.22\","
                + "\"C_BINARY_DOUBLE\":\"11.22\","
                + "\"C_TIMESTAMP\":\"1997-01-01T09:26:50.124Z\","
                + "\"C_INTERVAL_YEAR\":\"1-0\","
                + "\"C_INTERVAL_DAY\":\"0 1:0:0.0\","
                + "\"C_ROWID\":\"AAAAAAAAGAAAAH4AAB\","
                + "\"C_UROWID\":\"000001F8.0001.0006\","
                + "\"C_CHAR\":\"char                \","
                + "\"C_NCHAR\":\"nchar               \","
                + "\"C_CLOB\":\"clob\","
                + "\"C_NCLOB\":\"nclob\""
                + "}"
                + "]";
        verifyColumnValue(selectQueryExecutionResultMono, selectQueryExpectedResultString);
    }

    private void verifyColumnValue(Mono<ActionExecutionResult> executionResultMono, String expectedResult) {
        StepVerifier.create(executionResultMono)
                .assertNext(actionExecutionResult -> {
                    assertTrue(
                            actionExecutionResult.getIsExecutionSuccess(),
                            actionExecutionResult.getBody().toString());
                    if (expectedResult != null) {
                        assertEquals(
                                expectedResult, actionExecutionResult.getBody().toString());
                    }
                })
                .verifyComplete();
    }
}

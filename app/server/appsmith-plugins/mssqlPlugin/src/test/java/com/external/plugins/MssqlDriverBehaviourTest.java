package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Property;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.io.InputStream;
import java.sql.SQLException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Stream;

import static com.external.plugins.MssqlTestDBContainerManager.createDatasourceConfiguration;
import static com.external.plugins.MssqlTestDBContainerManager.mssqlPluginExecutor;
import static com.external.plugins.MssqlTestDBContainerManager.runSQLQueryOnMssqlTestDB;
import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Pins what the plugin returns for each SQL Server column type and for update counts. These values come from the JDBC
 * driver, so a driver upgrade must keep them. The expected values were recorded on mssql-jdbc 11.2.4 (APP-16536).
 */
@Testcontainers
public class MssqlDriverBehaviourTest {

    @SuppressWarnings("rawtypes")
    @Container
    public static final MSSQLServerContainer container = MssqlTestDBContainerManager.getMssqlDBForTest();

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static HikariDataSource pool;

    // One row with every column type the test gate lists. SQL Server 2022 has no json or vector type. Before
    // APP-16536, any SELECT of the rowversion or datetimeoffset column failed on both drivers.
    private static final String CREATE_TYPES_TABLE = "CREATE TABLE driver_types ("
            + " c_int int, c_bigint bigint, c_decimal decimal(10, 2), c_money money, c_bit bit,"
            + " c_float float, c_nvarchar nvarchar(50), c_varbinary varbinary(8), c_uniqueidentifier uniqueidentifier,"
            + " c_date date, c_time time, c_datetime datetime, c_datetime2 datetime2, c_smalldatetime smalldatetime,"
            + " c_datetimeoffset datetimeoffset, c_xml xml, c_rowversion rowversion, c_sql_variant sql_variant)";

    private static final String INSERT_TYPES_ROW = "INSERT INTO driver_types (c_int, c_bigint, c_decimal, c_money,"
            + " c_bit, c_float, c_nvarchar, c_varbinary, c_uniqueidentifier, c_date, c_time, c_datetime, c_datetime2,"
            + " c_smalldatetime, c_datetimeoffset, c_xml, c_sql_variant) VALUES ("
            + " 2147483647, 9223372036854775807, 12345.67, 922337203685477.5807, 1,"
            + " 1.5, N'héllo wörld', 0xDEADBEEF, '6F9619FF-8B86-D011-B42D-00C04FC964FF',"
            + " '2024-02-29', '13:45:30.1234567', '2024-02-29 13:45:30.123', '2024-02-29 13:45:30.1234567',"
            + " '2024-02-29 13:45:00', '2024-02-29 13:45:30.1234567 +05:30', '<a b=\"1\">text</a>', CAST(42 AS int))";

    private static final String CREATE_DML_TABLE = "CREATE TABLE driver_dml (id int PRIMARY KEY, name nvarchar(20))";
    private static final String CREATE_AUDIT_TABLE = "CREATE TABLE driver_audit (id int, note nvarchar(20))";
    private static final String CREATE_TRIGGERED_TABLE =
            "CREATE TABLE driver_triggered (id int PRIMARY KEY, name nvarchar(20))";
    // The trigger writes 3 audit rows for each inserted row, so its update count (3) differs from the insert's (1).
    private static final String CREATE_TRIGGER = "CREATE TRIGGER driver_triggered_audit ON driver_triggered"
            + " AFTER INSERT AS INSERT INTO driver_audit (id, note)"
            + " SELECT i.id, N'added' FROM inserted i CROSS JOIN (VALUES (1), (2), (3)) AS copies (n)";

    @BeforeAll
    public static void setUp() throws SQLException {
        pool = mssqlPluginExecutor
                .datasourceCreate(createDatasourceConfiguration(container))
                .block();
        runSQLQueryOnMssqlTestDB(CREATE_TYPES_TABLE, pool);
        runSQLQueryOnMssqlTestDB(INSERT_TYPES_ROW, pool);
        runSQLQueryOnMssqlTestDB(CREATE_DML_TABLE, pool);
        runSQLQueryOnMssqlTestDB(CREATE_AUDIT_TABLE, pool);
        runSQLQueryOnMssqlTestDB(CREATE_TRIGGERED_TABLE, pool);
        runSQLQueryOnMssqlTestDB(CREATE_TRIGGER, pool);
    }

    @AfterAll
    public static void tearDown() {
        if (pool != null) {
            pool.close();
        }
    }

    private ActionExecutionResult run(String sql, boolean preparedStatement) {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(sql);
        actionConfiguration.setPluginSpecifiedTemplates(
                List.of(new Property("preparedStatement", String.valueOf(preparedStatement))));

        ActionExecutionResult result = mssqlPluginExecutor
                .executeParameterized(pool, new ExecuteActionDTO(), dsConfig, actionConfiguration)
                .block();

        assertNotNull(result);
        assertTrue(result.getIsExecutionSuccess(), () -> "query failed: " + sql + " -> " + result.getBody());

        return result;
    }

    // The expected row as JSON text. Decimals are read as BigDecimal, so money and decimal keep every digit.
    private static String expectedTypeSnapshot() throws IOException {
        try (InputStream in = MssqlDriverBehaviourTest.class.getResourceAsStream("/mssql-driver-type-snapshot.json")) {
            assertNotNull(in, "missing test resource mssql-driver-type-snapshot.json");
            return objectMapper
                    .copy()
                    .enable(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS)
                    .readTree(in)
                    .toString();
        }
    }

    // The plugin returns datetime, datetime2 and smalldatetime as epoch milliseconds in the JVM's time zone. To keep
    // the snapshot the same in any zone, each one must be a number, and is then compared as a local date-time.
    private static final List<String> EPOCH_MILLIS_COLUMNS = List.of("c_datetime", "c_datetime2", "c_smalldatetime");

    // Every column type comes back with the same JSON value, with prepared statements on and off. The values are
    // compared as JSON text, so a number that turns into a string (or the reverse) fails too.
    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    public void columnTypes_returnTheRecordedJson(boolean preparedStatement) throws IOException {
        ActionExecutionResult result = run("SELECT * FROM driver_types", preparedStatement);
        ObjectNode row = (ObjectNode) ((ArrayNode) result.getBody()).get(0).deepCopy();

        for (String column : EPOCH_MILLIS_COLUMNS) {
            JsonNode value = row.get(column);

            assertTrue(value.isIntegralNumber(), () -> column + " should be epoch milliseconds, got " + value);
            row.put(
                    column,
                    LocalDateTime.ofInstant(Instant.ofEpochMilli(value.asLong()), ZoneId.systemDefault())
                            .toString());
        }

        // The server sets rowversion, so its value changes from run to run. Check its form (0x and 16 hex digits),
        // then compare it as a fixed placeholder.
        JsonNode rowversion = row.get("c_rowversion");

        assertTrue(
                rowversion.isTextual() && rowversion.asText().matches("0x[0-9A-F]{16}"),
                () -> "rowversion should be 0x and 16 hex digits, got " + rowversion);
        row.put("c_rowversion", "0x<rowversion>");

        assertEquals(
                expectedTypeSnapshot(),
                row.toString(),
                () -> "column values changed. Actual row: " + row.toPrettyString());
    }

    static Stream<Arguments> offsetAndRowversionEdgeCases() {
        return Stream.of(true, false)
                .flatMap(prepared -> Stream.of(
                        Arguments.of("SELECT CAST(NULL AS datetimeoffset) AS v", "null", prepared),
                        Arguments.of("SELECT CAST(NULL AS rowversion) AS v", "null", prepared),
                        // Offset 0 prints as Z, and trailing zeros in the fraction are dropped.
                        Arguments.of(
                                "SELECT CAST('2024-02-29 13:45:30.12 +00:00' AS datetimeoffset) AS v",
                                "\"2024-02-29T13:45:30.12Z\"",
                                prepared),
                        Arguments.of(
                                "SELECT CAST('2024-02-29 13:45:30.1234567 -08:00' AS datetimeoffset) AS v",
                                "\"2024-02-29T13:45:30.1234567-08:00\"",
                                prepared),
                        // datetimeoffset(0) has no fraction.
                        Arguments.of(
                                "SELECT CAST('2024-02-29 13:45:30 -03:30' AS datetimeoffset(0)) AS v",
                                "\"2024-02-29T13:45:30-03:30\"",
                                prepared),
                        // rowversion is 8 bytes, so the hex keeps leading zeros.
                        Arguments.of(
                                "SELECT CAST(CAST(4001 AS bigint) AS rowversion) AS v",
                                "\"0x0000000000000FA1\"",
                                prepared)));
    }

    // The exact text of a datetimeoffset or rowversion value, including NULL, offset 0, a negative offset and no
    // fraction. Apps will read these strings, so the format is pinned.
    @ParameterizedTest(name = "{0}, prepared statement {2}")
    @MethodSource("offsetAndRowversionEdgeCases")
    public void offsetAndRowversionValues_keepTheirFormat(String sql, String expectedJson, boolean preparedStatement) {
        ActionExecutionResult result = run(sql, preparedStatement);

        assertEquals(
                expectedJson, ((ArrayNode) result.getBody()).get(0).get("v").toString());
    }

    // A view reports a rowversion column as "timestamp" too, and an alias does not change the type.
    @ParameterizedTest
    @ValueSource(booleans = {true, false})
    public void offsetAndRowversionValues_throughAViewAndAliases(boolean preparedStatement) throws SQLException {
        runSQLQueryOnMssqlTestDB(
                "IF OBJECT_ID('driver_types_view') IS NULL EXEC('CREATE VIEW driver_types_view AS"
                        + " SELECT c_rowversion AS rv, c_datetimeoffset AS dto FROM driver_types')",
                pool);

        JsonNode row = ((ArrayNode)
                        run("SELECT rv AS version, dto AS changed FROM driver_types_view", preparedStatement)
                                .getBody())
                .get(0);

        assertTrue(row.get("version").asText().matches("0x[0-9A-F]{16}"), () -> "rowversion: " + row);
        assertEquals("2024-02-29T13:45:30.1234567+05:30", row.get("changed").asText());
    }

    // Each case: label, SQL, affectedRows with prepared statements on, affectedRows with prepared statements off.
    static Stream<Arguments> updateCountCases() {
        return Stream.of(
                Arguments.of("an insert of two rows", "INSERT INTO driver_dml VALUES (1, N'a'), (2, N'b')", 2, 2),
                Arguments.of("an update of one row", "UPDATE driver_dml SET name = N'c' WHERE id = 1", 1, 1),
                Arguments.of("a delete of two rows", "DELETE FROM driver_dml WHERE id IN (1, 2)", 2, 2),
                Arguments.of(
                        "two statements",
                        "INSERT INTO driver_dml VALUES (3, N'd'), (4, N'e'); UPDATE driver_dml SET name = N'f' WHERE id = 3",
                        2,
                        2),
                // Driver 11.2.4 reported the trigger's count (3) in both modes. 13.6.2 reports the insert's own count
                // (1) when prepared statements are off (APP-16536).
                Arguments.of("an insert that fires a trigger", "INSERT INTO driver_triggered VALUES (1, N'f')", 3, 1));
    }

    // affectedRows is the driver's update count. 12.2 and 13.2 changed how the driver reports counts for several
    // statements and for triggers, so each case is pinned with prepared statements on and off. The counts differ on
    // purpose, so a change of which count the driver reports fails the test:
    // - two statements: the first count is 2, the last is 1, and the sum is 3;
    // - a trigger: the insert's count is 1, the trigger's is 3, and the sum is 4. The trigger runs without
    //   SET NOCOUNT ON, so it has a count of its own.
    @ParameterizedTest(name = "{0}, prepared statement {3}")
    @MethodSource("updateCountCasesBothModes")
    public void updateCounts_matchTheRecordedValues(
            String label, String sql, int expectedAffectedRows, boolean preparedStatement) throws SQLException {
        runSQLQueryOnMssqlTestDB(
                "DELETE FROM driver_audit; DELETE FROM driver_triggered; DELETE FROM driver_dml", pool);

        if (sql.startsWith("UPDATE") || sql.startsWith("DELETE")) {
            runSQLQueryOnMssqlTestDB("INSERT INTO driver_dml VALUES (1, N'a'), (2, N'b')", pool);
        }

        ActionExecutionResult result = run(sql, preparedStatement);
        JsonNode body = ((ArrayNode) result.getBody()).get(0);

        assertEquals(expectedAffectedRows, body.get("affectedRows").asInt(), () -> label + ": " + result.getBody());
    }

    static Stream<Arguments> laterStatementErrors() {
        return Stream.of(true, false)
                .flatMap(prepared -> Stream.of(
                        Arguments.of(
                                "UPDATE driver_dml SET name = N'z'; INSERT INTO no_such_table VALUES (1)",
                                "Invalid object name 'no_such_table'",
                                prepared),
                        Arguments.of(
                                "UPDATE driver_dml SET name = N'z'; INSERT INTO driver_dml VALUES (1, N'dup')",
                                "Violation of PRIMARY KEY constraint",
                                prepared),
                        Arguments.of(
                                "UPDATE driver_dml SET name = N'z'; SELECT 1 / 0 AS x", "Divide by zero", prepared),
                        Arguments.of(
                                "UPDATE driver_dml SET name = N'y'; UPDATE driver_dml SET name = N'z';"
                                        + " INSERT INTO no_such_table VALUES (1)",
                                "Invalid object name 'no_such_table'",
                                prepared)));
    }

    // An error in a later statement of a multi-statement query fails the query and names the error. Before
    // APP-16536 it was hidden: the query reported success with the first statement's count. Other statements may
    // already have run (here, the UPDATE before the error, committed without a transaction), so the message says so,
    // and the table shows it.
    @ParameterizedTest(name = "{0}, prepared statement {2}")
    @MethodSource("laterStatementErrors")
    public void laterStatementError_failsTheQuery(String sql, String expectedError, boolean preparedStatement)
            throws SQLException {
        runSQLQueryOnMssqlTestDB(
                "DELETE FROM driver_audit; DELETE FROM driver_triggered; DELETE FROM driver_dml;"
                        + " INSERT INTO driver_dml VALUES (1, N'a'), (2, N'b')",
                pool);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(sql);
        actionConfiguration.setPluginSpecifiedTemplates(
                List.of(new Property("preparedStatement", String.valueOf(preparedStatement))));

        ActionExecutionResult result = mssqlPluginExecutor
                .executeParameterized(
                        pool, new ExecuteActionDTO(), createDatasourceConfiguration(container), actionConfiguration)
                .block();

        assertNotNull(result);
        assertFalse(result.getIsExecutionSuccess(), () -> "the query should fail: " + result.getBody());
        assertTrue(
                String.valueOf(result.getBody()).contains("A statement in this query failed")
                        && String.valueOf(result.getBody()).contains(expectedError),
                () -> "unexpected error: " + result.getBody());

        // The UPDATE before the error committed.
        assertEquals(
                "[{\"name\":\"z\"},{\"name\":\"z\"}]",
                run("SELECT name FROM driver_dml ORDER BY id", false).getBody().toString());
    }

    // Test plan D-17: identity, default and computed (stored and not stored) columns, written by leaving columns out,
    // with DEFAULT VALUES, with the DEFAULT keyword and with bound values. The same on driver 11.2.4 and 13.6.2.
    // A whole-number decimal comes back in exponent form (10.00 as 1E+1): Jackson strips trailing zeros.
    @ParameterizedTest(name = "prepared statement {0}")
    @ValueSource(booleans = {true, false})
    public void identityDefaultAndComputedColumns_workAndReadBack(boolean preparedStatement) throws SQLException {
        String table = "d17_" + (preparedStatement ? "on" : "off");
        runSQLQueryOnMssqlTestDB(
                "CREATE TABLE " + table + " (id int IDENTITY(100, 5) PRIMARY KEY, qty int NOT NULL DEFAULT 1,"
                        + " price decimal(10,2) NOT NULL DEFAULT 9.99, status nvarchar(20) NOT NULL DEFAULT N'new',"
                        + " total AS (qty * price), total_stored AS (qty * price) PERSISTED,"
                        + " label AS (CONCAT(status, N'-', id)))",
                pool);

        run("INSERT INTO " + table + " (qty) VALUES (2)", preparedStatement);
        run("INSERT INTO " + table + " DEFAULT VALUES", preparedStatement);
        run("INSERT INTO " + table + " (qty, price, status) VALUES (3, DEFAULT, DEFAULT)", preparedStatement);
        assertEquals(
                "[{\"id\":115,\"status\":\"new\",\"total\":1E+1,\"total_stored\":1E+1,\"label\":\"new-115\"}]",
                run(
                                "INSERT INTO " + table + " (qty, price) OUTPUT inserted.id, inserted.status,"
                                        + " inserted.total, inserted.total_stored, inserted.label VALUES (4, 2.50)",
                                preparedStatement)
                        .getBody()
                        .toString());

        assertEquals(
                "[{\"id\":100,\"qty\":2,\"price\":9.99,\"status\":\"new\",\"total\":19.98,\"total_stored\":19.98,"
                        + "\"label\":\"new-100\"},"
                        + "{\"id\":105,\"qty\":1,\"price\":9.99,\"status\":\"new\",\"total\":9.99,\"total_stored\":9.99,"
                        + "\"label\":\"new-105\"},"
                        + "{\"id\":110,\"qty\":3,\"price\":9.99,\"status\":\"new\",\"total\":29.97,\"total_stored\":29.97,"
                        + "\"label\":\"new-110\"},"
                        + "{\"id\":115,\"qty\":4,\"price\":2.5,\"status\":\"new\",\"total\":1E+1,\"total_stored\":1E+1,"
                        + "\"label\":\"new-115\"}]",
                run("SELECT * FROM " + table + " ORDER BY id", preparedStatement)
                        .getBody()
                        .toString());

        ActionConfiguration computedInsert = new ActionConfiguration();
        computedInsert.setBody("INSERT INTO " + table + " (qty, total) VALUES (1, 5)");
        computedInsert.setPluginSpecifiedTemplates(
                List.of(new Property("preparedStatement", String.valueOf(preparedStatement))));
        ActionExecutionResult refused = mssqlPluginExecutor
                .executeParameterized(
                        pool, new ExecuteActionDTO(), createDatasourceConfiguration(container), computedInsert)
                .block();

        assertNotNull(refused);
        assertFalse(refused.getIsExecutionSuccess());
        assertTrue(String.valueOf(refused.getBody()).contains("cannot be modified because it is either a computed"));
    }

    static Stream<Arguments> errorsAfterRows() {
        return Stream.of(true, false)
                .flatMap(prepared -> Stream.of(
                        Arguments.of(
                                "SELECT 1 AS a; INSERT INTO no_such_table VALUES (1)",
                                "Invalid object name 'no_such_table'",
                                prepared),
                        Arguments.of("SELECT 1 AS a; RAISERROR('stop here', 16, 1)", "stop here", prepared),
                        Arguments.of("EXEC driver_fails_after_rows", "Invalid object name 'no_such_table'", prepared)));
    }

    // A query whose first result is rows, followed by a failing statement, takes the rows branch before the remaining
    // results are read. It fails too, and so does a stored procedure that fails after its first result.
    @ParameterizedTest(name = "{0}, prepared statement {2}")
    @MethodSource("errorsAfterRows")
    public void errorAfterRows_failsTheQuery(String sql, String expectedError, boolean preparedStatement)
            throws SQLException {
        runSQLQueryOnMssqlTestDB(
                "IF OBJECT_ID('driver_fails_after_rows') IS NULL EXEC('CREATE PROCEDURE driver_fails_after_rows AS"
                        + " SELECT 1 AS first; INSERT INTO no_such_table VALUES (1)')",
                pool);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(sql);
        actionConfiguration.setPluginSpecifiedTemplates(
                List.of(new Property("preparedStatement", String.valueOf(preparedStatement))));

        ActionExecutionResult result = mssqlPluginExecutor
                .executeParameterized(
                        pool, new ExecuteActionDTO(), createDatasourceConfiguration(container), actionConfiguration)
                .block();

        assertNotNull(result);
        assertFalse(result.getIsExecutionSuccess(), () -> "the query should fail: " + result.getBody());
        assertTrue(
                String.valueOf(result.getBody()).contains("A statement in this query failed")
                        && String.valueOf(result.getBody()).contains(expectedError),
                () -> "unexpected error: " + result.getBody());
    }

    static Stream<Arguments> multiResultQueriesThatSucceed() {
        return Stream.of(true, false)
                .flatMap(prepared -> Stream.of(
                        Arguments.of("SELECT 1 AS a; SELECT 2 AS b", "[{\"a\":1}]", prepared),
                        Arguments.of(
                                "UPDATE driver_dml SET name = N'p'; PRINT 'done'", "[{\"affectedRows\":2}]", prepared),
                        Arguments.of(
                                "UPDATE driver_dml SET name = N'p'; RAISERROR('just information', 10, 1)",
                                "[{\"affectedRows\":2}]",
                                prepared),
                        // SET options stay on the pooled connection, so the query turns NOCOUNT back off for the next
                        // query.
                        Arguments.of(
                                "SET NOCOUNT ON; SELECT COUNT(*) AS n FROM driver_dml; SET NOCOUNT OFF",
                                "[{\"n\":2}]",
                                prepared),
                        Arguments.of("EXEC driver_multi_results", "[{\"affectedRows\":2}]", prepared),
                        Arguments.of("EXEC driver_multi_results_nocount", "[{\"first\":1}]", prepared)));
    }

    // Reading every result must not turn a good multi-result query into a failure. PRINT and RAISERROR with severity
    // 10 or less are messages, not errors. The response is still the first result.
    @ParameterizedTest(name = "{0}, prepared statement {2}")
    @MethodSource("multiResultQueriesThatSucceed")
    public void multiResultQuery_stillSucceeds(String sql, String expectedFirstResult, boolean preparedStatement)
            throws SQLException {
        runSQLQueryOnMssqlTestDB(
                "DELETE FROM driver_audit; DELETE FROM driver_triggered; DELETE FROM driver_dml;"
                        + " INSERT INTO driver_dml VALUES (1, N'a'), (2, N'b')",
                pool);
        runSQLQueryOnMssqlTestDB(
                "IF OBJECT_ID('driver_multi_results') IS NULL EXEC('CREATE PROCEDURE driver_multi_results AS"
                        + " SET NOCOUNT OFF; UPDATE driver_dml SET name = name; SELECT 1 AS first; SELECT 2 AS second')",
                pool);
        runSQLQueryOnMssqlTestDB(
                "IF OBJECT_ID('driver_multi_results_nocount') IS NULL EXEC('CREATE PROCEDURE"
                        + " driver_multi_results_nocount AS SET NOCOUNT ON; UPDATE driver_dml SET name = name;"
                        + " SELECT 1 AS first; SELECT 2 AS second')",
                pool);

        assertEquals(expectedFirstResult, run(sql, preparedStatement).getBody().toString());
    }

    static Stream<Arguments> updateCountCasesBothModes() {
        return updateCountCases().flatMap(args -> Stream.of(true, false).map(prepared -> {
            Object[] values = args.get();

            return Arguments.of(values[0], values[1], prepared ? values[2] : values[3], prepared);
        }));
    }

    // Test configuration shows the driver's message for a failed login. Pin its text, so a driver upgrade cannot
    // replace it with a less useful one.
    @Test
    public void testDatasource_withAWrongPassword_showsTheLoginFailedMessage() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration(container);
        ((DBAuth) dsConfig.getAuthentication()).setPassword("wrong-password");

        DatasourceTestResult result =
                mssqlPluginExecutor.testDatasource(dsConfig).block();

        assertNotNull(result);
        assertTrue(
                result.getInvalids().stream()
                        .anyMatch(message ->
                                message.contains("Login failed for user") && !message.contains("wrong-password")),
                () -> "unexpected messages: " + result.getInvalids());
    }

    // Driver 13.2 returns SQL Server 2025 and Azure SQL vector columns as a driver object. The plugin turns it off,
    // so a vector column keeps coming back as a JSON string.
    @Test
    public void connectionUrl_turnsOffTheNativeVectorType() {
        HikariDataSource connectionPool = mssqlPluginExecutor
                .datasourceCreate(createDatasourceConfiguration(container))
                .block();

        assertNotNull(connectionPool);

        try {
            assertTrue(
                    connectionPool.getJdbcUrl().contains("vectorTypeSupport=off;"),
                    () -> "JDBC URL should turn off the native vector type: " + connectionPool.getJdbcUrl());
        } finally {
            connectionPool.close();
        }
    }

    private static Stream<Arguments> endlessLaterResults() {
        return Stream.of(true, false)
                .flatMap(prepared -> Stream.of(
                        // Endless result sets after the first.
                        Arguments.of(
                                "SELECT 1 AS first_result; WHILE 1 = 1 SELECT 1 AS later_result",
                                prepared,
                                "ran longer than its timeout of 3000 ms"),
                        // Endless update counts after the first.
                        Arguments.of(
                                "SELECT 1 AS first_result; WHILE 1 = 1 UPDATE driver_dml SET name = name",
                                prepared,
                                "ran longer than its timeout of 3000 ms"),
                        // One statement that runs longer than the timeout. The driver's query timeout, or the timer,
                        // stops it.
                        Arguments.of("WAITFOR DELAY '00:00:20'", prepared, "ran longer than its timeout of 3000 ms"),
                        // A later statement that waits, after a first result the server sends at once. The wait
                        // happens inside a read of the later results.
                        Arguments.of(
                                "SELECT 1 AS first_result; RAISERROR('flush', 0, 1) WITH NOWAIT;"
                                        + " WAITFOR DELAY '00:00:20'; SELECT 2 AS later_result",
                                prepared,
                                "ran longer than its timeout of 3000 ms")));
    }

    // AIP-FD-38: a query that runs past its timeout must not hold a pooled connection and a worker thread. The
    // reactive timeout cannot interrupt the blocking JDBC call, so before the fix such a query ran on: the endless
    // ones forever, because the plugin reads the later results to find errors (APP-16536).
    @ParameterizedTest(name = "{0}, prepared statement {1}")
    @MethodSource("endlessLaterResults")
    void should_failAndFreeTheConnection_when_theQueryRunsPastItsTimeout(
            String sql, boolean preparedStatement, String expectedError) {
        // Given
        HikariDataSource connectionPool = mssqlPluginExecutor
                .datasourceCreate(createDatasourceConfiguration(container))
                .block();
        assertThat(connectionPool).isNotNull();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(sql);
        actionConfiguration.setTimeoutInMillisecond("3000");
        actionConfiguration.setPluginSpecifiedTemplates(
                List.of(new Property("preparedStatement", String.valueOf(preparedStatement))));

        try {
            // When
            // Before the fix, this call never returned: the reactive timeout cannot interrupt the blocking read.
            Duration took = StepVerifier.create(mssqlPluginExecutor.executeParameterized(
                            connectionPool,
                            new ExecuteActionDTO(),
                            createDatasourceConfiguration(container),
                            actionConfiguration))
                    // Then
                    .assertNext(result -> {
                        assertThat(result.getIsExecutionSuccess()).isFalse();
                        assertThat(String.valueOf(result.getBody())).contains(expectedError);
                    })
                    .expectComplete()
                    .verify(Duration.ofSeconds(30));
            assertThat(took).isLessThan(Duration.ofSeconds(10));

            // The connection goes back to the pool shortly after the timeout.
            await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> assertThat(
                            connectionPool.getHikariPoolMXBean().getActiveConnections())
                    .as("connections the query still holds after its timeout")
                    .isZero());
        } finally {
            connectionPool.close();
        }
    }
}

package com.external.plugins;

import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.TimeZone;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.external.plugins.MssqlTestDBContainerManager.createDatasourceConfiguration;
import static com.external.plugins.MssqlTestDBContainerManager.mssqlPluginExecutor;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Every SQL Server data type, written and read the ways an app does it, with prepared statements on and off:
 * <ul>
 *   <li>insert a literal value written in the SQL;</li>
 *   <li>insert a {{binding}} with prepared statements on, where the plugin decides the parameter type;</li>
 *   <li>insert a {{binding}} with prepared statements off, where the value is pasted into the SQL text;</li>
 *   <li>select the rows with prepared statements off and on;</li>
 *   <li>filter with WHERE v = {{binding}}, with prepared statements on and off.</li>
 * </ul>
 * The result of every step is pinned in src/test/resources/mssql-data-type-matrix.txt, including the known failures,
 * so any change, better or worse, shows up in review. The results were the same on driver 11.2.4 and 13.6.2
 * (APP-16536). After a deliberate change, copy target/mssql-data-type-matrix.actual.txt over the resource.
 */
@Testcontainers
public class MssqlDataTypeMatrixTest {

    @SuppressWarnings("rawtypes")
    @Container
    public static final MSSQLServerContainer container = MssqlTestDBContainerManager.getMssqlDBForTest();

    // label, column type, literal SQL value, bound value (null: no bound insert or filter), client type of the bound
    // value, and whether "WHERE v = value" is valid for the type (text, ntext, image and xml cannot be compared).
    record Case(String label, String type, String literal, String bound, ClientDataType clientType, boolean filter) {}

    static final List<Case> CASES = List.of(
            new Case("bit", "bit", "1", "true", ClientDataType.BOOLEAN, true),
            new Case("bit as number", "bit", "0", "0", ClientDataType.NUMBER, true),
            new Case("tinyint", "tinyint", "255", "255", ClientDataType.NUMBER, true),
            new Case("smallint", "smallint", "-32768", "-32768", ClientDataType.NUMBER, true),
            new Case("int", "int", "2147483647", "2147483647", ClientDataType.NUMBER, true),
            new Case("bigint", "bigint", "9223372036854775807", "9223372036854775807", ClientDataType.NUMBER, true),
            new Case("decimal(18,4)", "decimal(18,4)", "12345.6789", "12345.6789", ClientDataType.NUMBER, true),
            new Case("numeric(10,2)", "numeric(10,2)", "-99.95", "-99.95", ClientDataType.NUMBER, true),
            new Case("money", "money", "922337203685477.5807", "922337203685477.5807", ClientDataType.NUMBER, true),
            new Case("smallmoney", "smallmoney", "214748.3647", "214748.3647", ClientDataType.NUMBER, true),
            new Case("float", "float", "3.141592653589793", "3.141592653589793", ClientDataType.NUMBER, true),
            new Case("real", "real", "3.5", "3.5", ClientDataType.NUMBER, true),
            new Case("date", "date", "'2024-02-29'", "2024-02-29", ClientDataType.STRING, true),
            new Case("time", "time", "'13:45:30.1234567'", "13:45:30", ClientDataType.STRING, false),
            new Case("time(0)", "time(0)", "'13:45:30'", "13:45:30", ClientDataType.STRING, true),
            new Case(
                    "datetime",
                    "datetime",
                    "'2024-02-29 13:45:30.123'",
                    "2024-02-29 13:45:30",
                    ClientDataType.STRING,
                    false),
            new Case(
                    "datetime (whole second)",
                    "datetime",
                    "'2024-02-29 13:45:30'",
                    "2024-02-29 13:45:30",
                    ClientDataType.STRING,
                    true),
            new Case(
                    "datetime ISO T",
                    "datetime",
                    "'2024-02-29T13:45:30'",
                    "2024-02-29T13:45:30",
                    ClientDataType.STRING,
                    true),
            new Case(
                    "datetime2",
                    "datetime2",
                    "'2024-02-29 13:45:30.1234567'",
                    "2024-02-29 13:45:30",
                    ClientDataType.STRING,
                    false),
            new Case(
                    "datetime2(0)",
                    "datetime2(0)",
                    "'2024-02-29 13:45:30'",
                    "2024-02-29 13:45:30",
                    ClientDataType.STRING,
                    true),
            new Case(
                    "smalldatetime",
                    "smalldatetime",
                    "'2024-02-29 13:45:00'",
                    "2024-02-29 13:45:00",
                    ClientDataType.STRING,
                    true),
            new Case(
                    "datetimeoffset",
                    "datetimeoffset",
                    "'2024-02-29 13:45:30.1234567 +05:30'",
                    "2024-02-29 13:45:30.1234567 +05:30",
                    ClientDataType.STRING,
                    true),
            new Case(
                    "datetimeoffset ISO",
                    "datetimeoffset",
                    "'2024-02-29T13:45:30+05:30'",
                    "2024-02-29T13:45:30+05:30",
                    ClientDataType.STRING,
                    true),
            new Case("char(5)", "char(5)", "'ab'", "ab", ClientDataType.STRING, true),
            new Case("varchar(50)", "varchar(50)", "'hello'", "hello", ClientDataType.STRING, true),
            new Case(
                    "varchar(max)",
                    "varchar(max)",
                    "REPLICATE(CAST('x' AS varchar(max)), 9000)",
                    null,
                    ClientDataType.STRING,
                    false),
            new Case("varchar numeric text", "varchar(20)", "'00123'", "00123", ClientDataType.STRING, true),
            new Case("text", "text", "'old text'", "old text", ClientDataType.STRING, false),
            new Case("nchar(5)", "nchar(5)", "N'ab'", "ab", ClientDataType.STRING, true),
            new Case(
                    "nvarchar(50)", "nvarchar(50)", "N'héllo wörld 日本'", "héllo wörld 日本", ClientDataType.STRING, true),
            // Pasted as N'{{b}}' with prepared statements off. Without the N, the literal is varchar, so characters
            // outside the database code page (日本, 😀) are stored as "?". See the case above.
            new Case(
                    "nvarchar(50) N prefix",
                    "nvarchar(50)",
                    "N'héllo wörld 日本 😀'",
                    "héllo wörld 日本 😀",
                    ClientDataType.STRING,
                    true),
            new Case("nvarchar(max)", "nvarchar(max)", "N'emoji 😀'", "emoji 😀", ClientDataType.STRING, false),
            new Case("ntext", "ntext", "N'old ntext'", "old ntext", ClientDataType.STRING, false),
            new Case("binary(4)", "binary(4)", "0xDEADBEEF", null, ClientDataType.STRING, false),
            new Case("varbinary(8)", "varbinary(8)", "0xDEADBEEF", null, ClientDataType.STRING, false),
            new Case("varbinary(max)", "varbinary(max)", "0x0102030405", null, ClientDataType.STRING, false),
            new Case("image", "image", "0xDEADBEEF", null, ClientDataType.STRING, false),
            new Case(
                    "uniqueidentifier",
                    "uniqueidentifier",
                    "'6F9619FF-8B86-D011-B42D-00C04FC964FF'",
                    "6F9619FF-8B86-D011-B42D-00C04FC964FF",
                    ClientDataType.STRING,
                    true),
            new Case("xml", "xml", "'<a b=\"1\">t</a>'", "<a b=\"1\">t</a>", ClientDataType.STRING, false),
            new Case("sql_variant int", "sql_variant", "CAST(42 AS int)", "42", ClientDataType.NUMBER, false),
            new Case(
                    "sql_variant nvarchar",
                    "sql_variant",
                    "CAST(N'text' AS nvarchar(10))",
                    "text",
                    ClientDataType.STRING,
                    false),
            new Case(
                    "sql_variant datetime",
                    "sql_variant",
                    "CAST('2024-02-29 13:45:30' AS datetime)",
                    null,
                    ClientDataType.STRING,
                    false),
            new Case(
                    "sql_variant datetimeoffset",
                    "sql_variant",
                    "CAST('2024-02-29 13:45:30 +05:30' AS datetimeoffset)",
                    null,
                    ClientDataType.STRING,
                    false),
            new Case("hierarchyid", "hierarchyid", "'/1/2/'", "/1/2/", ClientDataType.STRING, false),
            new Case(
                    "geometry",
                    "geometry",
                    "geometry::STGeomFromText('POINT(1 2)', 0)",
                    null,
                    ClientDataType.STRING,
                    false),
            new Case(
                    "geography",
                    "geography",
                    "geography::Point(47.65, -122.34, 4326)",
                    null,
                    ClientDataType.STRING,
                    false),
            new Case("alias type", "dbo.phone_number", "'555-0100'", "555-0100", ClientDataType.STRING, true),
            // A bound time value written into a datetime column. With sendTimeAsDatetime=false the driver sends it as
            // time, so SQL Server gives it the date 1900-01-01 (1970-01-01 before APP-16536).
            new Case(
                    "time into datetime",
                    "datetime",
                    "'1900-01-01 13:45:30'",
                    "13:45:30",
                    ClientDataType.STRING,
                    false),
            // Text that looks like a time, bound into a varchar column with prepared statements on. The plugin binds
            // it as a time, so SQL Server stores its own time text (13:45:30.0000000). Before APP-16536 the driver
            // sent it as datetime, and the column got "Jan  1 1970  1:45PM".
            new Case("time text into varchar", "varchar(40)", "'13:45:30'", "13:45:30", ClientDataType.STRING, false),
            // Edge values. java.sql.Date and Timestamp use the Julian calendar before 1582, so the earliest dates can
            // shift by days when they pass through them.
            new Case("date min", "date", "'0001-01-01'", "0001-01-01", ClientDataType.STRING, true),
            new Case("date max", "date", "'9999-12-31'", "9999-12-31", ClientDataType.STRING, true),
            new Case(
                    "datetime2 min",
                    "datetime2(0)",
                    "'0001-01-01 00:00:00'",
                    "0001-01-01 00:00:00",
                    ClientDataType.STRING,
                    true),
            new Case(
                    "datetime2 max",
                    "datetime2(0)",
                    "'9999-12-31 23:59:59'",
                    "9999-12-31 23:59:59",
                    ClientDataType.STRING,
                    true),
            new Case(
                    "datetimeoffset min",
                    "datetimeoffset",
                    "'0001-01-01 00:00:00 +00:00'",
                    "0001-01-01 00:00:00 +00:00",
                    ClientDataType.STRING,
                    true),
            new Case(
                    "datetimeoffset max",
                    "datetimeoffset",
                    "'9999-12-31 23:59:59 +14:00'",
                    "9999-12-31 23:59:59 +14:00",
                    ClientDataType.STRING,
                    true),
            // A JavaScript number above 2^53 is already rounded when the client sends it.
            new Case(
                    "bigint from a rounded JS number",
                    "bigint",
                    "9007199254740993",
                    "9007199254740992",
                    ClientDataType.NUMBER,
                    true),
            new Case("empty string", "varchar(10)", "''", "", ClientDataType.STRING, true),
            new Case(
                    "nvarchar(max) over 4000 characters",
                    "nvarchar(max)",
                    "REPLICATE(CAST(N'x' AS nvarchar(max)), 5000)",
                    "x".repeat(5000),
                    ClientDataType.STRING,
                    false),
            new Case(
                    "uniqueidentifier lower case",
                    "uniqueidentifier",
                    "'6f9619ff-8b86-d011-b42d-00c04fc964ff'",
                    "6f9619ff-8b86-d011-b42d-00c04fc964ff",
                    ClientDataType.STRING,
                    true),
            new Case("decimal overflow", "decimal(5,2)", "1.5", "12345.678", ClientDataType.NUMBER, false),
            new Case("bit from text yes", "bit", "1", "yes", ClientDataType.STRING, false),
            new Case("null into int", "int", "NULL", "null", ClientDataType.NULL, false));

    // A long run of x (the 9,000-character varchar(max) value) is written as x{9000}, so the file stays readable.
    private static final Pattern LONG_RUN = Pattern.compile("x{20,}");

    private static HikariDataSource pool;
    private static TimeZone originalTimeZone;

    @BeforeAll
    public static void setUp() {
        // datetime, datetime2 and smalldatetime come back as epoch milliseconds in the JVM's time zone. Use UTC, so
        // the pinned numbers are the same on every machine.
        originalTimeZone = TimeZone.getDefault();
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        pool = mssqlPluginExecutor
                .datasourceCreate(createDatasourceConfiguration(container))
                .block();
    }

    @AfterAll
    public static void tearDown() {
        if (pool != null) {
            pool.close();
        }
        TimeZone.setDefault(originalTimeZone);
    }

    private static String run(String sql, boolean prepared, String bound, ClientDataType clientType) {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(sql);
        actionConfiguration.setPluginSpecifiedTemplates(
                List.of(new Property("preparedStatement", String.valueOf(prepared))));
        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();

        if (bound != null) {
            Param param = new Param();
            param.setKey("b");
            param.setValue(bound);
            param.setClientDataType(clientType);
            List<Param> params = new ArrayList<>();
            params.add(param);
            executeActionDTO.setParams(params);
        }

        try {
            ActionExecutionResult result = mssqlPluginExecutor
                    .executeParameterized(
                            pool, executeActionDTO, createDatasourceConfiguration(container), actionConfiguration)
                    .block();

            if (result == null) {
                return "NULL RESULT";
            }

            return (result.getIsExecutionSuccess() ? "OK " : "FAIL ") + result.getBody();
        } catch (Exception e) {
            return "ERROR " + e.getMessage();
        }
    }

    // With prepared statements off, the bound value is pasted into the SQL text, so a text value needs quotes.
    private static String pastedBinding(Case c) {
        if (c.clientType() == ClientDataType.NUMBER || c.clientType() == ClientDataType.NULL) {
            return "{{b}}";
        }

        return c.label().endsWith("N prefix") ? "N'{{b}}'" : "'{{b}}'";
    }

    private static String normalize(String outcome) {
        Matcher matcher = LONG_RUN.matcher(outcome.replace('\n', ' '));
        StringBuilder out = new StringBuilder();

        while (matcher.find()) {
            matcher.appendReplacement(out, "x{" + matcher.group().length() + "}");
        }

        return matcher.appendTail(out).toString();
    }

    @Test
    public void everyDataType_matchesTheRecordedResults() throws IOException {
        List<String> lines = new ArrayList<>();
        run("CREATE TYPE dbo.phone_number FROM varchar(20) NOT NULL", false, null, null);

        for (int i = 0; i < CASES.size(); i++) {
            Case c = CASES.get(i);
            String table = "matrix_" + i;
            String nullable = c.type().equals("dbo.phone_number") ? "" : " NULL";
            run("CREATE TABLE " + table + " (id int, v " + c.type() + nullable + ")", false, null, null);

            List<String[]> steps = new ArrayList<>();
            steps.add(new String[] {
                "insert literal, prepared off",
                run("INSERT INTO " + table + " VALUES (1, " + c.literal() + ")", false, null, null)
            });

            if (c.bound() != null) {
                steps.add(new String[] {
                    "insert {{b}}, prepared on",
                    run("INSERT INTO " + table + " VALUES (2, {{b}})", true, c.bound(), c.clientType())
                });
                steps.add(new String[] {
                    "insert " + pastedBinding(c) + ", prepared off",
                    run(
                            "INSERT INTO " + table + " VALUES (3, " + pastedBinding(c) + ")",
                            false,
                            c.bound(),
                            c.clientType())
                });
            }

            steps.add(new String[] {
                "select, prepared off", run("SELECT * FROM " + table + " ORDER BY id", false, null, null)
            });
            steps.add(new String[] {
                "select, prepared on", run("SELECT * FROM " + table + " ORDER BY id", true, null, null)
            });

            if (c.filter() && c.bound() != null) {
                steps.add(new String[] {
                    "where v = {{b}}, prepared on",
                    run("SELECT id FROM " + table + " WHERE v = {{b}} ORDER BY id", true, c.bound(), c.clientType())
                });
                steps.add(new String[] {
                    "where v = " + pastedBinding(c) + ", prepared off",
                    run(
                            "SELECT id FROM " + table + " WHERE v = " + pastedBinding(c) + " ORDER BY id",
                            false,
                            c.bound(),
                            c.clientType())
                });
            }

            for (String[] step : steps) {
                lines.add(c.label() + " | " + step[0] + " | " + normalize(step[1]));
            }
        }

        String actual = String.join("\n", lines) + "\n";
        Files.writeString(Path.of("target", "mssql-data-type-matrix.actual.txt"), actual, StandardCharsets.UTF_8);

        String expected;
        try (InputStream in = getClass().getResourceAsStream("/mssql-data-type-matrix.txt")) {
            assertNotNull(in, "missing test resource mssql-data-type-matrix.txt");
            expected = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }

        // Report the first line that differs, not the whole file.
        List<String> expectedLines = expected.lines().toList();
        List<String> actualLines = actual.lines().toList();

        for (int i = 0; i < Math.max(expectedLines.size(), actualLines.size()); i++) {
            String expectedLine = i < expectedLines.size() ? expectedLines.get(i) : "(no line)";
            String actualLine = i < actualLines.size() ? actualLines.get(i) : "(no line)";
            int lineNumber = i + 1;

            assertEquals(
                    expectedLine,
                    actualLine,
                    () -> "a data type result changed at line " + lineNumber
                            + "; compare target/mssql-data-type-matrix.actual.txt with the resource");
        }
    }
}

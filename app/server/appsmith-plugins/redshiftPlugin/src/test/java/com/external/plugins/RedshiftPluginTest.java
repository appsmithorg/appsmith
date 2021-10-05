package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.plugins.PluginExecutor;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;
import org.mockito.Mockito;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.Connection;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Time;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the RedshiftPlugin
 */
@Slf4j
public class RedshiftPluginTest {
    PluginExecutor pluginExecutor = new RedshiftPlugin.RedshiftPluginExecutor();

    private static String address;
    private static Integer port;
    private static String username;
    private static String password;
    private  static String dbName;

    @BeforeClass
    public static void setUp() {
        address = "address";
        port = 5439;
        username = "username";
        password = "password";
        dbName = "dbName";
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        DBAuth authDTO = new DBAuth();
        authDTO.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authDTO.setUsername(username);
        authDTO.setPassword(password);
        authDTO.setDatabaseName(dbName);

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(address);
        endpoint.setPort(port.longValue());

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authDTO);
        dsConfig.setEndpoints(List.of(endpoint));
        return dsConfig;
    }

    @Test
    public void testDatasourceCreateConnectionFailure() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(dsConnectionMono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithPluginException &&
                        throwable.getMessage().equals(
                                new AppsmithPluginException(
                                    AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR,
                                    "The connection attempt failed."
                                )
                                .getMessage()
                        )
                )
                .verify();
    }

    @Test
    public void testStaleConnectionCheck() throws SQLException {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("show databases");

        /* Mock java.sql.Connection:
         *      a. isClosed(): return true
         *      b. isValid() : return false
         */
        Connection mockConnection = mock(Connection.class);
        when(mockConnection.isClosed()).thenReturn(true);
        when(mockConnection.isValid(Mockito.anyInt())).thenReturn(false);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.execute(mockConnection, dsConfig, actionConfiguration);

        StepVerifier.create(resultMono)
                .expectErrorMatches(throwable -> throwable instanceof StaleConnectionException)
                .verify();
    }

    @Test
    public void itShouldValidateDatasourceWithEmptyEndpoints() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.setEndpoints(new ArrayList<>());

        Assert.assertEquals(Set.of("Missing endpoint."),
                pluginExecutor.validateDatasource(dsConfig));
    }

    @Test
    public void itShouldValidateDatasourceWithEmptyHost() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getEndpoints().get(0).setHost("");

        Assert.assertEquals(Set.of("Missing hostname."),
                pluginExecutor.validateDatasource(dsConfig));
    }

    @Test
    public void itShouldValidateDatasourceWithInvalidHostname() {
        String hostname = "jdbc://localhost";
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getEndpoints().get(0).setHost("jdbc://localhost");

        Assert.assertEquals(Set.of("Host value cannot contain `/` or `:` characters. Found `" + hostname + "`."),
                pluginExecutor.validateDatasource(dsConfig));
    }

    /* 1. CREATE TABLE users (
     *      id INTEGER PRIMARY KEY IDENTITY(1,1),
     *      username VARCHAR (50) UNIQUE NOT NULL,
     *      password VARCHAR (50) NOT NULL,
     *      email VARCHAR (355) UNIQUE NOT NULL,
     *      spouse_dob DATE,
     *      dob DATE NOT NULL,
     *      time1 TIME NOT NULL,
     *      time_tz TIME WITH TIME ZONE NOT NULL,
     *      created_on TIMESTAMP NOT NULL,
     *      created_on_tz TIMESTAMP WITH TIME ZONE NOT NULL
     *    );
     * 2. INSERT INTO users VALUES (
     *      1,
     *      'Jack',
     *      'jill',
     *      'jack@exemplars.com',
     *      NULL,
     *      '2018-12-31',
     *      '18:32:45',
     *      '04:05:06 PST',
     *      TIMESTAMP '2018-11-30 20:45:15',
     *      TIMESTAMP WITH TIME ZONE '2018-11-30 20:45:15 CET'
     *    );
     * 3. SELECT * FROM users WHERE id = 1;
     */
    @Test
    public void testExecute() throws SQLException {
        /* Mock java.sql.Connection:
         *      a. isClosed()
         *      b. isValid()
         */
        Connection mockConnection = mock(Connection.class);
        when(mockConnection.isClosed()).thenReturn(false);
        when(mockConnection.isValid(Mockito.anyInt())).thenReturn(true);

        /* Mock java.sql.Statement:
         *      a. execute(...)
         *      b. close()
         */
        Statement mockStatement = mock(Statement.class);
        when(mockConnection.createStatement()).thenReturn(mockStatement);
        when(mockStatement.execute(Mockito.any())).thenReturn(true);
        doNothing().when(mockStatement).close();

        /* Mock java.sql.ResultSet:
         *      a. getObject(...)
         *      b. getDate(...)
         *      c. getTime(...)
         *      d. getString(...)
         *      e. getObject(..., ...)
         *      d. next()
         *      e. close()
         */
        ResultSet mockResultSet = mock(ResultSet.class);
        when(mockStatement.getResultSet()).thenReturn(mockResultSet);
        when(mockResultSet.getObject(Mockito.anyInt())).thenReturn("", 1, "", "Jack", "", "jill", "", "jack@exemplars.com"
                , null, "", "", "", "", "");
        when(mockResultSet.getDate(Mockito.anyInt())).thenReturn(Date.valueOf("2018-12-31"), Date.valueOf("2018-11-30"));
        when(mockResultSet.getString(Mockito.anyInt())).thenReturn("18:32:45", "12:05:06+00");
        when(mockResultSet.getTime(Mockito.anyInt())).thenReturn(Time.valueOf("20:45:15"));
        when(mockResultSet.getObject(Mockito.anyInt(), Mockito.any(Class.class))).thenReturn(OffsetDateTime.parse(
                "2018-11-30T19:45:15+00"));
        when(mockResultSet.next()).thenReturn(true).thenReturn(false);
        doNothing().when(mockResultSet).close();

        /* Mock java.sql.ResultSetMetaData:
         *      a. getColumnCount()
         *      b. getColumnTypeName(...)
         *      c. getColumnName(...)
         */
        ResultSetMetaData mockResultSetMetaData = mock(ResultSetMetaData.class);
        when(mockResultSet.getMetaData()).thenReturn(mockResultSetMetaData);
        when(mockResultSetMetaData.getColumnCount()).thenReturn(0).thenReturn(10);
        when(mockResultSetMetaData.getColumnTypeName(Mockito.anyInt())).thenReturn("int4", "varchar", "varchar",
                "varchar", "date", "date", "time", "timetz", "timestamp", "timestamptz");
        when(mockResultSetMetaData.getColumnName(Mockito.anyInt())).thenReturn("id", "username", "password", "email",
                "spouse_dob", "dob", "time1", "time_tz", "created_on", "created_on_tz");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT * FROM users WHERE id = 1");
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Connection> dsConnectionMono = Mono.just(mockConnection);

        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals("2018-12-31", node.get("dob").asText());
                    assertEquals("18:32:45", node.get("time1").asText());
                    assertEquals("12:05:06+00", node.get("time_tz").asText());
                    assertEquals("2018-11-30T20:45:15Z", node.get("created_on").asText());
                    assertEquals("2018-11-30T19:45:15Z", node.get("created_on_tz").asText());
                    assertTrue(node.get("spouse_dob").isNull());
                    assertArrayEquals(
                            new String[]{
                                    "id",
                                    "username",
                                    "password",
                                    "email",
                                    "spouse_dob",
                                    "dob",
                                    "time1",
                                    "time_tz",
                                    "created_on",
                                    "created_on_tz",
                            },
                            new ObjectMapper()
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray()
                    );

                    /*
                     * - RequestParamDTO object only have attributes configProperty and value at this point.
                     * - The other two RequestParamDTO attributes - label and type are null at this point.
                     */
                    List<RequestParamDTO> expectedRequestParams = new ArrayList<>();
                    expectedRequestParams.add(new RequestParamDTO(ACTION_CONFIGURATION_BODY,
                            actionConfiguration.getBody(), null, null, null));
                    assertEquals(result.getRequest().getRequestParams().toString(), expectedRequestParams.toString());
                })
                .verifyComplete();
    }

    /* 1. CREATE TABLE users (
     *      id INTEGER PRIMARY KEY IDENTITY(1,1),
     *      username VARCHAR (50) UNIQUE NOT NULL,
     *      password VARCHAR (50) NOT NULL,
     *    );
     * 2. CREATE TABLE possessions(
     *      id serial PRIMARY KEY,
     *      title VARCHAR (50) NOT NULL,
     *      user_id int NOT NULL,
     *      constraint user_fk foreign key (user_id) references users(id)
     *    );
     * 3. CREATE TABLE campus(
     *      id timestamptz default now(),
     *      name timestamptz default now()
     *    );
     * 4. Run TABLES_QUERY
     * 5. Run KEYS_QUERY_PRIMARY_KEY
     * 6. Run KEYS_QUERY_FOREIGN_KEY
     */
    @Test
    public void testStructure() throws SQLException {
        /* Mock java.sql.Connection:
         *      a. isClosed()
         *      b. isValid()
         */
        Connection mockConnection = mock(Connection.class);
        when(mockConnection.isClosed()).thenReturn(false);
        when(mockConnection.isValid(Mockito.anyInt())).thenReturn(true);

        /* Mock java.sql.Statement:
         *      a. execute(...)
         *      b. close()
         */
        Statement mockStatement = mock(Statement.class);
        when(mockConnection.createStatement()).thenReturn(mockStatement);
        when(mockStatement.execute(Mockito.any())).thenReturn(true);
        doNothing().when(mockStatement).close();

        /* Mock java.sql.ResultSet:
         *      d. getString(...)
         *      d. next()
         *      e. close()
         */
        ResultSet mockResultSet = mock(ResultSet.class);
        when(mockStatement.executeQuery(Mockito.anyString())).thenReturn(mockResultSet, mockResultSet, mockResultSet);
        when(mockResultSet.next())
                .thenReturn(true, true, true, true, true, true, true, true, false)                  // TABLES_QUERY
                .thenReturn(true, true, false)                                                      // KEYS_QUERY_PRIMARY_KEY
                .thenReturn(true, false);                                                           // KEYS_QUERY_FOREIGN_KEY
        when(mockResultSet.getString("kind")).thenReturn("r", "r", "r", "r", "r", "r", "r", "r");// TABLES_QUERY
        when(mockResultSet.getString("schema_name")).thenReturn("public", "public", "public", "public", "public",
                "public", "public", "public");                                   // TABLES_QUERY
        when(mockResultSet.getString("table_name")).thenReturn("campus", "campus", "possessions", "possessions",
                "possessions", "users", "users", "users");                       // TABLES_QUERY
        when(mockResultSet.getString("name")).thenReturn("id", "name", "id", "title", "user_id", "id", "username",
                "password");                                                     // TABLES_QUERY
        when(mockResultSet.getString("column_type")).thenReturn("timestamptz", "timestamptz", "int4", "varchar",
                "int4", "int4", "varchar", "varchar");                           // TABLES_QUERY
        when(mockResultSet.getString("default_expr")).thenReturn("now()", "now()", null, null, null, "\"identity\"" +
                "(101507, 0, '1,1'::text)", null, null);                         // TABLES_QUERY
        when(mockResultSet.getString("constraint_name"))
                .thenReturn("possessions_pkey", "users_pkey")       // KEYS_QUERY_PRIMARY_KEY
                .thenReturn("user_fk");                                          // KEYS_QUERY_FOREIGN_KEY
        when(mockResultSet.getString("constraint_type"))
                .thenReturn("p", "p")                               // KEYS_QUERY_PRIMARY_KEY
                .thenReturn("f");                                                // KEYS_QUERY_FOREIGN_KEY
        when(mockResultSet.getString("self_schema"))
                .thenReturn("public", "public")                     // KEYS_QUERY_PRIMARY_KEY
                .thenReturn("public");                                           // KEYS_QUERY_FOREIGN_KEY
        when(mockResultSet.getString("self_table"))
                .thenReturn("possessions", "users")                 // KEYS_QUERY_PRIMARY_KEY
                .thenReturn("possessions");                                      // KEYS_QUERY_FOREIGN_KEY
        when(mockResultSet.getString("self_column"))
                .thenReturn("id", "id")                             // KEYS_QUERY_PRIMARY_KEY
                .thenReturn("user_id");                                          // KEYS_QUERY_FOREIGN_KEY
        when(mockResultSet.getString("foreign_schema")).thenReturn("public"); // KEYS_QUERY_FOREIGN_KEY
        when(mockResultSet.getString("foreign_table")).thenReturn("users");   // KEYS_QUERY_FOREIGN_KEY
        when(mockResultSet.getString("foreign_column")).thenReturn("id");     // KEYS_QUERY_FOREIGN_KEY
        doNothing().when(mockResultSet).close();

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Connection> dsConnectionMono = Mono.just(mockConnection);
        Mono<DatasourceStructure> structureMono = dsConnectionMono
                .flatMap(connection -> pluginExecutor.getStructure(connection, dsConfig));

        StepVerifier.create(structureMono)
                .assertNext(structure -> {
                    assertNotNull(structure);
                    assertEquals(3, structure.getTables().size());

                    final DatasourceStructure.Table campusTable = structure.getTables().get(0);
                    assertEquals("public.campus", campusTable.getName());
                    assertEquals(DatasourceStructure.TableType.TABLE, campusTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[]{
                                    new DatasourceStructure.Column("id", "timestamptz", "now()", false),
                                    new DatasourceStructure.Column("name", "timestamptz", "now()", false)
                            },
                            campusTable.getColumns().toArray()
                    );
                    assertEquals(campusTable.getKeys().size(), 0);

                    final DatasourceStructure.Table possessionsTable = structure.getTables().get(1);
                    assertEquals("public.possessions", possessionsTable.getName());
                    assertEquals(DatasourceStructure.TableType.TABLE, possessionsTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[]{
                                    new DatasourceStructure.Column("id", "int4", null, false),
                                    new DatasourceStructure.Column("title", "varchar", null, false),
                                    new DatasourceStructure.Column("user_id", "int4", null, false)
                            },
                            possessionsTable.getColumns().toArray()
                    );

                    final DatasourceStructure.PrimaryKey possessionsPrimaryKey = new DatasourceStructure.PrimaryKey("possessions_pkey", new ArrayList<>());
                    possessionsPrimaryKey.getColumnNames().add("id");
                    final DatasourceStructure.ForeignKey possessionsUserForeignKey = new DatasourceStructure.ForeignKey(
                            "user_fk",
                            List.of("user_id"),
                            List.of("users.id")
                    );
                    assertArrayEquals(
                            new DatasourceStructure.Key[]{possessionsPrimaryKey, possessionsUserForeignKey},
                            possessionsTable.getKeys().toArray()
                    );

                    assertArrayEquals(
                            new DatasourceStructure.Template[]{
                                    new DatasourceStructure.Template("SELECT", "SELECT * FROM public.\"possessions\" LIMIT 10;"),
                                    new DatasourceStructure.Template("INSERT", "INSERT INTO public.\"possessions\" " +
                                            "(\"id\", \"title\", \"user_id\")\n  VALUES (1, '', 1);"),
                                    new DatasourceStructure.Template("UPDATE", "UPDATE public.\"possessions\" SET\n" +
                                            "    \"id\" = 1\n" +
                                            "    \"title\" = ''\n" +
                                            "    \"user_id\" = 1\n" +
                                            "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!"),
                                    new DatasourceStructure.Template("DELETE", "DELETE FROM public.\"possessions\"\n" +
                                            "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!"),
                            },
                            possessionsTable.getTemplates().toArray()
                    );

                    final DatasourceStructure.Table usersTable = structure.getTables().get(2);
                    assertEquals("public.users", usersTable.getName());
                    assertEquals(DatasourceStructure.TableType.TABLE, usersTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[]{
                                    new DatasourceStructure.Column("id", "int4", "\"identity\"(101507, " +
                                            "0, '1,1'::text)", true),
                                    new DatasourceStructure.Column("username", "varchar", null, false),
                                    new DatasourceStructure.Column("password", "varchar", null, false)
                            },
                            usersTable.getColumns().toArray()
                    );

                    final DatasourceStructure.PrimaryKey usersPrimaryKey = new DatasourceStructure.PrimaryKey("users_pkey", new ArrayList<>());
                    usersPrimaryKey.getColumnNames().add("id");
                    assertArrayEquals(
                            new DatasourceStructure.Key[]{usersPrimaryKey},
                            usersTable.getKeys().toArray()
                    );

                    assertArrayEquals(
                            new DatasourceStructure.Template[]{
                                    new DatasourceStructure.Template("SELECT", "SELECT * FROM public.\"users\" LIMIT 10;"),
                                    new DatasourceStructure.Template("INSERT", "INSERT INTO public.\"users\" (\"username\", \"password\")\n" +
                                            "  VALUES ('', '');"),
                                    new DatasourceStructure.Template("UPDATE", "UPDATE public.\"users\" SET\n" +
                                            "    \"username\" = ''\n" +
                                            "    \"password\" = ''\n" +
                                            "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!"),
                                    new DatasourceStructure.Template("DELETE", "DELETE FROM public.\"users\"\n" +
                                            "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!"),
                            },
                            usersTable.getTemplates().toArray()
                    );
                })
                .verifyComplete();
    }

    @Test
    public void testDuplicateColumnNames() throws SQLException {
        /* Mock java.sql.Connection:
         *      a. isClosed()
         *      b. isValid()
         */
        Connection mockConnection = mock(Connection.class);
        when(mockConnection.isClosed()).thenReturn(false);
        when(mockConnection.isValid(Mockito.anyInt())).thenReturn(true);

        /* Mock java.sql.Statement:
         *      a. execute(...)
         *      b. close()
         */
        Statement mockStatement = mock(Statement.class);
        when(mockConnection.createStatement()).thenReturn(mockStatement);
        when(mockStatement.execute(Mockito.any())).thenReturn(true);
        doNothing().when(mockStatement).close();

        /* Mock java.sql.ResultSet:
         *      a. getObject(...)
         *      d. next()
         *      e. close()
         */
        ResultSet mockResultSet = mock(ResultSet.class);
        when(mockStatement.getResultSet()).thenReturn(mockResultSet);
        when(mockResultSet.getObject(Mockito.anyInt())).thenReturn("", 1, "", 1, "", "jill", "", "jill");
        when(mockResultSet.next()).thenReturn(true).thenReturn(false);
        doNothing().when(mockResultSet).close();

        /* Mock java.sql.ResultSetMetaData:
         *      a. getColumnCount()
         *      b. getColumnTypeName(...)
         *      c. getColumnName(...)
         */
        ResultSetMetaData mockResultSetMetaData = mock(ResultSetMetaData.class);
        when(mockResultSet.getMetaData()).thenReturn(mockResultSetMetaData);
        when(mockResultSetMetaData.getColumnCount()).thenReturn(4);
        when(mockResultSetMetaData.getColumnTypeName(Mockito.anyInt())).thenReturn("int4", "int4", "varchar",
                "varchar");
        when(mockResultSetMetaData.getColumnName(Mockito.anyInt())).thenReturn("id", "id", "username", "username");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT id, id, username, username FROM users WHERE id = 1");
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Connection> dsConnectionMono = Mono.just(mockConnection);

        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotEquals(0, result.getMessages().size());

                    String expectedMessage = "Your Redshift query result may not have all the columns because " +
                            "duplicate column names were found for the column(s)";
                    assertTrue(
                            result.getMessages().stream()
                                    .anyMatch(message -> message.contains(expectedMessage))
                    );

                    /*
                     * - Check if all of the duplicate column names are reported.
                     */
                    Set<String> expectedColumnNames = Stream.of("id", "username")
                            .collect(Collectors.toCollection(HashSet::new));
                    Set<String> foundColumnNames = new HashSet<>();
                    result.getMessages().stream()
                            .filter(message -> message.contains(expectedMessage))
                            .forEach(message -> {
                                Arrays.stream(message.split(":")[1].split("\\.")[0].split(","))
                                        .forEach(columnName -> foundColumnNames.add(columnName.trim()));
                            });
                    assertTrue(expectedColumnNames.equals(foundColumnNames));
                })
                .verifyComplete();
    }
}

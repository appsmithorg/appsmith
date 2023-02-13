package com.external.plugins;


import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.RequestParamDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.services.SharedConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.util.Assert;
import org.testcontainers.containers.JdbcDatabaseContainer;
import org.testcontainers.containers.OracleContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import javax.sql.DataSource;
import java.sql.DriverManager;
import java.sql.Connection;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.util.Properties;

import static com.appsmith.external.constants.ActionConstants.ACTION_CONFIGURATION_BODY;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

@Slf4j
@Testcontainers
public class OraclePluginTest {

    public class MockSharedConfig implements SharedConfig {

        @Override
        public int getCodecSize() {
            return 10 * 1024 * 1024;
        }

        @Override
        public int getMaxResponseSize() {
            return 10000;
        }

        @Override
        public String getRemoteExecutionUrl() {
            return "";
        }
    }

    OraclePlugin.OraclePluginExecutor pluginExecutor = new OraclePlugin.OraclePluginExecutor(new MockSharedConfig());
    public static final DockerImageName ORACLE_DOCKER_IMAGE_NAME = DockerImageName.parse(
            "gvenzl/oracle-xe:18.4.0-slim"
    );
    @Container
    public static final OracleContainer container = new OracleContainer(ORACLE_DOCKER_IMAGE_NAME)
            .withDatabaseName("testDB")
            .withUsername("testUser")
            .withPassword("testPassword");

    private static String address;
    private static Integer port;
    private static String username, password, database;

    @BeforeAll
    public static void setUp() {
        if (address != null) {
            return;
        }
        container.start();
        address = container.getContainerIpAddress();
        port = container.getFirstMappedPort();
        username = container.getUsername();
        password = container.getPassword();
        database = container.getDatabaseName();

        Properties properties = new Properties();
        properties.putAll(Map.of(
                "user", username,
                "password", password
        ));

        try (Connection connection = DriverManager.getConnection(
                "jdbc:oracle:thin:@//" + address + ":" + port + "/" + database,
                properties
        )) {

            try (Statement statement = connection.createStatement()) {
                statement.execute("CREATE TABLE users (\n" +
                        "    id NUMBER,\n" +
                        "    username VARCHAR2 (50) UNIQUE,\n" +
                        "    password VARCHAR2 (50) ,\n" +
                        "    email VARCHAR2 (355) UNIQUE ,\n" +
                        "    spouse_dob DATE,\n" +
                        "    dob DATE ,\n" +
                        "    char_10_col char(10),\n" +
                        "    clob_col clob, \n" +
                        "    number_3_sf_2_dp NUMBER(3,2), \n" +
                        "    integer_col INTEGER, \n" +
                        "    float_col float(10), \n" +
                        "    real_col real, \n" +
                        "    binary_float_col binary_float, \n" +
                        "    binary_double_col binary_double, \n" +
                        "    timestamp_with_3_frac_sec_col timestamp(3), \n" +
                        "    timestamp_with_tz timestamp with time zone, \n" +
                        "    timestamp_with_local_tz timestamp with local time zone, \n" +
                        "    year_to_month_col interval year to month, \n" +
                        "    day_to_second_col interval day to second, \n" +
                        "    raw_col raw(1000), \n" +
                        "    blob_col blob, \n" +
                        "    PRIMARY KEY(id)" +
                        ")");
            }

            try (Statement statement = connection.createStatement()) {
                statement.execute(
                        "INSERT INTO users VALUES (" +
                                "1, 'Jack', 'jill', 'jack@exemplars.com', NULL, TO_DATE('2018-12-31', 'yyyy/mm/dd')" +
                                ", '10char', NULL, 9.99, 100, 99.99, 99.99, 99.99, 99.99, to_timestamp ( '2022-06-07 09:00:00.123 AM', 'YYYY-MM-DD HH:MI:SS.FF AM' )" +
                                ", to_timestamp ( '2022-06-07 09:00:00.123 AM', 'YYYY-MM-DD HH:MI:SS.FF AM' ), to_timestamp ( '2022-06-07 09:00:00.123 AM', 'YYYY-MM-DD HH:MI:SS.FF AM' )" +
                                ", NULL, NULL, NULL, NULL)");
            }
        } catch (SQLException throwable) {
            throwable.printStackTrace();
        }
    }

    private void runTest(OracleContainer container, String databaseName, String username, String password)
            throws SQLException {
        //Test config was honored
        assertEquals(databaseName, container.getDatabaseName());
        assertEquals(username, container.getUsername());
        assertEquals(password, container.getPassword());

        //Test we can get a connection
        container.start();
        ResultSet resultSet = performQuery(container, "SELECT 1 FROM dual");
        int resultSetInt = resultSet.getInt(1);
        assertEquals(1, resultSetInt);
    }

    public void testDefaultSettings() throws SQLException {
        try (OracleContainer oracle = new OracleContainer(ORACLE_DOCKER_IMAGE_NAME);) {
            runTest(oracle, "xepdb1", "test", "test");
            String urlSuffix = oracle.getJdbcUrl().split("(\\/)(?!.*\\/)", 2)[1];
            assertEquals("xepdb1", urlSuffix);
        }
    }

    public void testPluggableDatabase() throws SQLException {
        try (OracleContainer oracle = new OracleContainer(ORACLE_DOCKER_IMAGE_NAME).withDatabaseName("testDB")) {
            runTest(oracle, "testDB", "test", "test");
        }
    }

    @Test
    public void testConnectOracleContainer() {

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        Mono<HikariDataSource> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        // TODO: fix it.
        /*StepVerifier.create(dsConnectionMono)
                .assertNext(assertNotNull)
                .verifyComplete();*/
    }

    @Test
    public void testAliasColumnNames() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<HikariDataSource> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT id as \"user_id\" FROM users WHERE id = 1");
        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "false"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    System.out.println("alias result = " + node.asText());
                    assertArrayEquals(
                            new String[]{
                                    "user_id"
                            },
                            new ObjectMapper()
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray()
                    );
                })
                .verifyComplete();
    }

    @Test
    public void testExecute() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<HikariDataSource> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT * FROM users WHERE id = 1");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "false"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    System.out.println("query result = " + node.get("dob"));
                    System.out.println("query result = " + node.get("DOB"));
                    assertEquals("2018-12-31", node.get("DOB").asText());
                    assertTrue(node.get("SPOUSE_DOB").isNull());
                    // Check the order of the columns.
                    assertArrayEquals(
                            new String[]{
                                    "ID",
                                    "USERNAME",
                                    "PASSWORD",
                                    "EMAIL",
                                    "SPOUSE_DOB",
                                    "DOB",
                                    "CHAR_10_COL",
                                    "CLOB_COL",
                                    "NUMBER_3_SF_2_DP",
                                    "INTEGER_COL",
                                    "FLOAT_COL",
                                    "REAL_COL",
                                    "BINARY_FLOAT_COL",
                                    "BINARY_DOUBLE_COL",
                                    "TIMESTAMP_WITH_3_FRAC_SEC_COL",
                                    "TIMESTAMP_WITH_TZ",
                                    "TIMESTAMP_WITH_LOCAL_TZ",
                                    "YEAR_TO_MONTH_COL",
                                    "DAY_TO_SECOND_COL",
                                    "RAW_COL",
                                    "BLOB_COL"
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

    @Test
    public void testPreparedStatementWithoutQuotes() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        // First test with the binding not surrounded with quotes
        actionConfiguration.setBody("SELECT * FROM users where id = {{binding1}}");

        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("preparedStatement", "true"));
        actionConfiguration.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param = new Param();
        param.setKey("binding1");
        param.setValue("1");
        params.add(param);
        executeActionDTO.setParams(params);

        Mono<HikariDataSource> connectionCreateMono = pluginExecutor.datasourceCreate(dsConfig).cache();

        Mono<ActionExecutionResult> resultMono = connectionCreateMono
                .flatMap(pool -> pluginExecutor.executeParameterized(pool, executeActionDTO, dsConfig, actionConfiguration));

        StepVerifier.create(resultMono)
                .assertNext(result -> {

                    assertTrue(result.getIsExecutionSuccess());

                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
                    assertEquals("2018-12-31", node.get("DOB").asText());
                    assertTrue(node.get("SPOUSE_DOB").isNull());
                    assertEquals(9.99, node.get("NUMBER_3_SF_2_DP").asDouble(), 0.0);

                    // Check the order of the columns.
                    assertArrayEquals(
                            new String[]{
                                    "ID",
                                    "USERNAME",
                                    "PASSWORD",
                                    "EMAIL",
                                    "SPOUSE_DOB",
                                    "DOB",
                                    "CHAR_10_COL",
                                    "CLOB_COL",
                                    "NUMBER_3_SF_2_DP",
                                    "INTEGER_COL",
                                    "FLOAT_COL",
                                    "REAL_COL",
                                    "BINARY_FLOAT_COL",
                                    "BINARY_DOUBLE_COL",
                                    "TIMESTAMP_WITH_3_FRAC_SEC_COL",
                                    "TIMESTAMP_WITH_TZ",
                                    "TIMESTAMP_WITH_LOCAL_TZ",
                                    "YEAR_TO_MONTH_COL",
                                    "DAY_TO_SECOND_COL",
                                    "RAW_COL",
                                    "BLOB_COL"
                            },
                            new ObjectMapper()
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray()
                    );

                    // Assert the debug request parameters are getting set.
                    ActionExecutionRequest request = result.getRequest();
                    List<Map.Entry<String, String>> parameters = (List<Map.Entry<String, String>>) request.getProperties().get("ps-parameters");
                    assertEquals(parameters.size(), 1);
                    Map.Entry<String, String> parameterEntry = parameters.get(0);
                    assertEquals(parameterEntry.getKey(), "1");
                    assertEquals(parameterEntry.getValue(), "INTEGER");
                })
                .verifyComplete();
    }

    public void testCustomUser() throws SQLException {
        try (
                OracleContainer oracle = new OracleContainer(ORACLE_DOCKER_IMAGE_NAME)
                        .withUsername("testUser")
                        .withPassword("testPassword")
        ) {
            runTest(oracle, "xepdb1", "testUser", "testPassword");
        }
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        DBAuth authDTO = new DBAuth();
        authDTO.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authDTO.setUsername(username);
        authDTO.setPassword(password);
        authDTO.setDatabaseName(database);

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(address);
        endpoint.setPort(port.longValue());

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authDTO);
        dsConfig.setEndpoints(List.of(endpoint));

        /* set ssl mode and read/write mode */
        dsConfig.setConnection(new com.appsmith.external.models.Connection());
        dsConfig.getConnection().setSsl(new SSLDetails());
        dsConfig.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);
        dsConfig.getConnection().setMode(com.appsmith.external.models.Connection.Mode.READ_WRITE);

        return dsConfig;
    }

    protected ResultSet performQuery(JdbcDatabaseContainer<?> container, String sql) throws SQLException {
        DataSource ds = getDataSource(container);
        Statement statement = ds.getConnection().createStatement();
        statement.execute(sql);
        ResultSet resultSet = statement.getResultSet();
        resultSet.next();
        return resultSet;
    }

    protected DataSource getDataSource(JdbcDatabaseContainer<?> container) {
        HikariConfig hikariConfig = new HikariConfig();
        hikariConfig.setJdbcUrl(container.getJdbcUrl());
        hikariConfig.setUsername(container.getUsername());
        hikariConfig.setPassword(container.getPassword());
        hikariConfig.setDriverClassName(container.getDriverClassName());
        return new HikariDataSource(hikariConfig);
    }
}

package com.external.plugins;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.util.List;

import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.OracleContainer;
import org.testcontainers.utility.DockerImageName;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.SSLDetails;

import io.r2dbc.spi.Connection;
import io.r2dbc.spi.ConnectionFactories;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

/**
 * Unit test for OraclePlugin
 */
public class OraclePluginTest 
{
	OraclePlugin.OraclePluginExecutor pluginExecutor = new OraclePlugin.OraclePluginExecutor();
	
	@SuppressWarnings("rawtypes") // The type parameter for the container type is just itself and is pseudo-optional.
    @ClassRule
    public static OracleContainer oracleContainer = new OracleContainer(
            DockerImageName.parse("").asCompatibleSubstituteFor("oracle"))
            .withUsername("oracle")
            .withPassword("password")
            .withDatabaseName("test_db");
	
	private static String address;
    private static Integer port;
    private static String username;
    private static String password;
    private static String database;
    private static DatasourceConfiguration dsConfig;

    @BeforeClass
    public static void setUp() {
        address = oracleContainer.getContainerIpAddress();
        port = oracleContainer.getFirstMappedPort();
        username = oracleContainer.getUsername();
        password = oracleContainer.getPassword();
        database = oracleContainer.getDatabaseName();
        dsConfig = createDatasourceConfiguration();

        Mono.from(ConnectionFactories.get(
  			  "r2dbc:oracle://localhost:1521/testdb").create())
                .map(connection -> {
                    return connection.createBatch()
                            .add("create table users (\n" +
                                    "    id int auto_increment primary key,\n" +
                                    "    username varchar (250) unique not null,\n" +
                                    "    password varchar (250) not null,\n" +
                                    "    email varchar (250) unique not null,\n" +
                                    "    spouse_dob date,\n" +
                                    "    dob date not null,\n" +
                                    "    yob year not null,\n" +
                                    "    time1 time not null,\n" +
                                    "    created_on timestamp not null,\n" +
                                    "    updated_on datetime not null,\n" +
                                    "    constraint unique index (username, email)\n" +
                                    ")"
                            )
                            .add("create table possessions (\n" +
                                    "    id int primary key,\n" +
                                    "    title varchar (250) not null,\n" +
                                    "    user_id int not null,\n" +
                                    "    username varchar (250) not null,\n" +
                                    "    email varchar (250) not null\n" +
                                    ")"
                            )
                            .add("alter table possessions add foreign key (username, email) \n" +
                                    "references users (username, email)"
                            )
                            .add("SET SESSION sql_mode = '';\n")
                            .add("INSERT INTO users VALUES (" +
                                    "1, 'Jack', 'jill', 'jack@exemplars.com', NULL, '2018-12-31', 2018," +
                                    " '18:32:45'," +
                                    " '2018-11-30 20:45:15', '0000-00-00 00:00:00'" +
                                    ")"
                            )
                            .add("INSERT INTO users VALUES (" +
                                    "2, 'Jill', 'jack', 'jill@exemplars.com', NULL, '2019-12-31', 2019," +
                                    " '15:45:30'," +
                                    " '2019-11-30 23:59:59', '2019-11-30 23:59:59'" +
                                    ")"
                            );
                })
                .flatMapMany(batch -> Flux.from(batch.execute()))
                .blockLast(); //wait until completion of all the queries

        return;
    }

    private static DatasourceConfiguration createDatasourceConfiguration() {
        DBAuth authDTO = new DBAuth();
        authDTO.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authDTO.setUsername(username);
        authDTO.setPassword(password);
        authDTO.setDatabaseName(database);

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(address);
        endpoint.setPort(port.longValue());

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();

        /* set endpoint */
        datasourceConfiguration.setAuthentication(authDTO);
        datasourceConfiguration.setEndpoints(List.of(endpoint));

        /* set ssl mode */
        datasourceConfiguration.setConnection(new com.appsmith.external.models.Connection());
        datasourceConfiguration.getConnection().setSsl(new SSLDetails());
        datasourceConfiguration.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);

        return datasourceConfiguration;
    }

    @Test
    public void testConnectOracleContainer() {

        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(dsConnectionMono)
                .assertNext(Assert::assertNotNull)
                .verifyComplete();
    }
    
    @Test
    public void testTestDatasource() {
        dsConfig = createDatasourceConfiguration();

        /* Expect no error */
        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> {
                    assertEquals(0, datasourceTestResult.getInvalids().size());
                })
                .verifyComplete();

        /* Create bad datasource configuration and expect error */
        dsConfig.getEndpoints().get(0).setHost("badHost");
        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> {
                    assertNotEquals(0, datasourceTestResult.getInvalids().size());
                })
                .verifyComplete();

        /* Reset dsConfig */
        dsConfig = createDatasourceConfiguration();
    }
    
    @Test
    public void testExecute() {
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("show databases");

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.executeParameterized(conn, new ExecuteActionDTO(), dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                })
                .verifyComplete();
    }
}

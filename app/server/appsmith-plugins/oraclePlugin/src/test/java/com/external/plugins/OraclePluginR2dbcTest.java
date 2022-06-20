/*
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

*/
/**
 * Unit test for OraclePlugin
 *//*

public class OraclePluginR2dbcTest
{
    OraclePluginR2dbc.OraclePluginExecutor pluginExecutor = new OraclePluginR2dbc.OraclePluginExecutor();

    @SuppressWarnings("rawtypes") // The type parameter for the container type is just itself and is pseudo-optional.
    @ClassRule
    public static OracleContainer oracleContainer = new OracleContainer(
            //DockerImageName.parse("banglamon/oracle193db:19.3.0-ee"))
            */
/*DockerImageName.parse("oracledb19c/oracle.19.3.0-ee:oracle19.3.0-ee"))
            .withExposedPorts(1521)
            .withUsername("system") //  AS SYSDBA
            .withPassword("oracle")
            .withEnv("ORACLE_SID", "SE")
            .withEnv("ORACLE_PDB", "SEPDB");*//*

            DockerImageName.parse("container-registry.oracle.com/database/enterprise:12.2.0.1-slim"))
            .withExposedPorts(1521)
            .withUsername("system") //  AS SYSDBA
            .withPassword("Oradoc_db1")
            .withEnv("ORACLE_SID", "ORCLCDB")
            .withEnv("ORACLE_PDB", "ORCLPDB1");
            //.withCommand("docker run -d --name oracle19db -p 1521:1521 -e ORACLE_SID=SE -e ORACLE_PDB=SEPDB -e ORACLE_PWD=Oracle123 -v /u01/app/oracle/oradata:/opt/oracle/oradata banglamon/oracle193db:19.3.0-ee");
            //.withDatabaseName("SE");

    private static String address;
    private static Integer port;
    private static String username;
    private static String password;
    private static String database;
    private static DatasourceConfiguration dsConfig;
    private static String databaseURL;

    //@BeforeClass
    public static void setUp() {
        address = oracleContainer.getContainerIpAddress();
        port = oracleContainer.getFirstMappedPort();
        username = oracleContainer.getUsername();
        password = oracleContainer.getPassword();
        database = "ORCLCDB.localdomain"; // oracleContainer.getSid(); // "SE";//
        //dsConfig = createDatasourceConfiguration();
        databaseURL = oracleContainer.getJdbcUrl();
        StringBuilder urlBuilder = new StringBuilder();
        urlBuilder.append("r2dbc:oracle://");
        urlBuilder.append(address);
        urlBuilder.append(":");
        urlBuilder.append(port);
        urlBuilder.append("/"+database);
        if(true){
            return;
        }
        Mono.from(ConnectionFactories.get(
                        urlBuilder.toString()).create())
                .map(connection -> {
                    return connection.createBatch()
                            .add("create table table1 (\n" +
                                    "    t_id NUMBER\n" +
                                    ")"
                            )
                            */
/*.add("create table possessions (\n" +
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
                            )*//*
;
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

        */
/* set endpoint *//*

        datasourceConfiguration.setAuthentication(authDTO);
        datasourceConfiguration.setEndpoints(List.of(endpoint));

        */
/* set ssl mode *//*

        datasourceConfiguration.setConnection(new com.appsmith.external.models.Connection());
        datasourceConfiguration.getConnection().setSsl(new SSLDetails());
        datasourceConfiguration.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);
        datasourceConfiguration.getConnection().setMode(com.appsmith.external.models.Connection.Mode.READ_WRITE);

        return datasourceConfiguration;
    }

    //@Test
    public void testConnectOracleContainer() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        */
/*dsConnectionMono.map(connection -> {
            return connection.createBatch()
                    .add("create table table2 (\n" +
                            "    t_id number\n" +
                            ")"
                    );
        }).flatMapMany(batch -> Flux.from(batch.execute()))
        .blockLast();*//*

        StepVerifier.create(dsConnectionMono)
                .assertNext(Assert::assertNotNull)
                .verifyComplete();
    }
    //@Test
    public void testBasicConnectivity() {
        // DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        */
/*StepVerifier.create(pluginExecutor.testDirectDbConnection())
                .assertNext(Assert::assertNotNull)
                .verifyComplete();*//*

        pluginExecutor.testDirectDbConnection();
    }

    //@Test
    public void testTestDatasource() {
        dsConfig = createDatasourceConfiguration();

        */
/* Expect no error *//*

        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> {
                    assertEquals(0, datasourceTestResult.getInvalids().size());
                })
                .verifyComplete();

        */
/* Create bad datasource configuration and expect error *//*

        dsConfig.getEndpoints().get(0).setHost("badHost");
        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> {
                    assertNotEquals(0, datasourceTestResult.getInvalids().size());
                })
                .verifyComplete();

        */
/* Reset dsConfig *//*

        //dsConfig = createDatasourceConfiguration();
    }

    //@Test
    public void testExecute() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT INSTANCE_NAME, STATUS, DATABASE_STATUS FROM V$INSTANCE");

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
    */
/*@Test
    public void testBasicQueryExecute() {
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        String query = "create table table2 (\n" +
                "    t_id number\n" +
                ")";
        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.runBasicQuery(query, conn));

    }*//*

}
*/

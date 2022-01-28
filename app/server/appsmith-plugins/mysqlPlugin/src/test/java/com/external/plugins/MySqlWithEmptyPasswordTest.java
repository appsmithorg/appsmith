package com.external.plugins;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.SSLDetails;
import io.r2dbc.spi.Connection;
import io.r2dbc.spi.ConnectionFactories;
import io.r2dbc.spi.ConnectionFactoryOptions;
import lombok.extern.slf4j.Slf4j;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.containers.MySQLR2DBCDatabaseContainer;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Set;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

@Slf4j
public class MySqlWithEmptyPasswordTest {

    @SuppressWarnings("rawtypes") // The type parameter for the container type is just itself and is pseudo-optional.
    @ClassRule
    public static MySQLContainer mySQLContainer = (MySQLContainer) new MySQLContainer(
            DockerImageName.parse("mysql/mysql-server:8.0.25").asCompatibleSubstituteFor("mysql"))
//            "mysql:8.0.28")
            .withUsername("root")
            .withPassword("")
            .withDatabaseName("test_db")
            .withEnv("MYSQL_ROOT_HOST", "%");


    private static String address;
    private static Integer port;
    private static String username;
    private static String password;
    private static String database;
    private static DatasourceConfiguration dsConfig;

    MySqlPlugin.MySqlPluginExecutor pluginExecutor = new MySqlPlugin.MySqlPluginExecutor();

    @BeforeClass
    public static void setUp() {
        address = mySQLContainer.getContainerIpAddress();
        port = mySQLContainer.getFirstMappedPort();
        username = mySQLContainer.getUsername();
        password = mySQLContainer.getPassword();
        database = mySQLContainer.getDatabaseName();
//        dsConfig = createDatasourceConfiguration();

        ConnectionFactoryOptions baseOptions = MySQLR2DBCDatabaseContainer.getOptions(mySQLContainer);
        ConnectionFactoryOptions.Builder ob = ConnectionFactoryOptions.builder().from(baseOptions);

        Mono.from(ConnectionFactories.get(ob.build()).create())
                .map(connection -> connection.createBatch()
                        .add("CREATE USER 'mysql'@'%';\n" +
                                "GRANT ALL PRIVILEGES ON *.* TO 'mysql'@'%' WITH GRANT OPTION;\n" +
                                "FLUSH PRIVILEGES;")
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
                        ))
                .flatMap(batch -> Mono.from(batch.execute()))
                .block();

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
        datasourceConfiguration.getConnection().setMode(com.appsmith.external.models.Connection.Mode.READ_WRITE);
        datasourceConfiguration.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);
        return datasourceConfiguration;
    }

    @Test
    public void testDatasourceWithNullPassword() {
        dsConfig = createDatasourceConfiguration();


        // change to ordinary user
        DBAuth auth = ((DBAuth) dsConfig.getAuthentication());
        auth.setPassword("");
        auth.setUsername("mysql");

        // check user pass
        assertEquals("mysql", auth.getUsername());
        assertEquals("", auth.getPassword());


        // Validate datastore
        Set<String> output = pluginExecutor.validateDatasource(dsConfig);
        assertTrue(output.isEmpty());
        // test connect
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(dsConnectionMono)
                .assertNext(Assert::assertNotNull)
                .verifyComplete();

        /* Expect no error */
        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> assertEquals(0, datasourceTestResult.getInvalids().size()))
                .verifyComplete();


    }

    @Test
    public void testDatasourceWithRootUserAndNullPassword() {
        dsConfig = createDatasourceConfiguration();

        // check user pass
        DBAuth auth = ((DBAuth) dsConfig.getAuthentication());
        assertEquals("root", auth.getUsername());
        assertEquals("", auth.getPassword());


        // Validate datastore
        Set<String> output = pluginExecutor.validateDatasource(dsConfig);
        assertTrue(output.isEmpty());
        // test connect
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(dsConnectionMono)
                .assertNext(Assert::assertNotNull)
                .verifyComplete();

        /* Expect no error */
        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> assertEquals(0, datasourceTestResult.getInvalids().size()))
                .verifyComplete();


    }

}

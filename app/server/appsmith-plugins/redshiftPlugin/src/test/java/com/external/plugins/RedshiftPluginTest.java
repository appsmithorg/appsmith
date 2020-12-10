package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Endpoint;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.extern.slf4j.Slf4j;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.localstack.LocalStackContainer;
import org.testcontainers.containers.localstack.LocalStackContainer.Service;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.redshift.RedshiftClient;
import software.amazon.awssdk.services.redshift.model.CreateClusterRequest;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

/**
 * Unit tests for the RedshiftPlugin
 */
@Slf4j
public class RedshiftPluginTest {
    static DockerImageName localstackImage = DockerImageName.parse("localstack/localstack:0.11.3");

    @ClassRule
    public static LocalStackContainer localstack = new LocalStackContainer(localstackImage)
            .withServices(Service.REDSHIFT);

    RedshiftPlugin.RedshiftPluginExecutor pluginExecutor = new RedshiftPlugin.RedshiftPluginExecutor();

    private static String address;
    private static Integer port;
    private static String username, password, dbName;

    @BeforeClass
    public static void setUp() {
        address = "redshift-cluster-1.cchikskpf5ok.us-east-2.redshift.amazonaws.com";
        port = 5439;
        username = "test";
        password = "Passw0rd";
        dbName = "test";
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        AuthenticationDTO authDTO = new AuthenticationDTO();
        authDTO.setAuthType(AuthenticationDTO.Type.USERNAME_PASSWORD);
        authDTO.setUsername(username);
        authDTO.setPassword(password);
        authDTO.setDatabaseName("dev");

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(address);
        endpoint.setPort(port.longValue());

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authDTO);
        dsConfig.setEndpoints(List.of(endpoint));
        return dsConfig;
    }

    @Test
    public void testConnectRedshiftContainer() {

        RedshiftClient redshiftClient = RedshiftClient
                .builder()
                .endpointOverride(localstack.getEndpointOverride(Service.REDSHIFT))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(
                        localstack.getAccessKey(), localstack.getSecretKey()
                )))
                .region(Region.of(localstack.getRegion()))
                .build();

        CreateClusterRequest clusterRequest =
                CreateClusterRequest.builder().dbName(dbName).masterUsername(username).masterUserPassword(password).build();
        redshiftClient.createCluster(clusterRequest);

        /*DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        StepVerifier.create(dsConnectionMono)
                .assertNext(Assert::assertNotNull)
                .verifyComplete();*/
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

    /*@Test
    public void testAliasColumnNames() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT id as user_id FROM users WHERE id = 1");

        Mono<ActionExecutionResult> executeMono = dsConnectionMono
                .flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(result -> {
                    final JsonNode node = ((ArrayNode) result.getBody()).get(0);
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
    }*/

    @Test
    public void testExecute() {
        /*DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<Connection> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("SELECT * FROM users WHERE id = 1");

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
                    assertEquals("04:05:06-08", node.get("time_tz").asText());
                    assertEquals("2018-11-30T20:45:15Z", node.get("created_on").asText());
                    assertEquals("2018-11-30T19:45:15Z", node.get("created_on_tz").asText());
                    assertEquals("1 years 5 mons 0 days 2 hours 0 mins 0.0 secs", node.get("interval1").asText());
                    assertTrue(node.get("spouse_dob").isNull());

                    // Check the order of the columns.
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
                                    "interval1",
                            },
                            new ObjectMapper()
                                    .convertValue(node, LinkedHashMap.class)
                                    .keySet()
                                    .toArray()
                    );
                })
                .verifyComplete();*/
    }

    /*@Test
    public void testStructure() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<DatasourceStructure> structureMono = pluginExecutor.datasourceCreate(dsConfig)
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
                                    new DatasourceStructure.Column("id", "timestamptz", "now()"),
                                    new DatasourceStructure.Column("name", "timestamptz", "now()")
                            },
                            campusTable.getColumns().toArray()
                    );
                    assertEquals(campusTable.getKeys().size(), 0);

                    final DatasourceStructure.Table possessionsTable = structure.getTables().get(1);
                    assertEquals("public.possessions", possessionsTable.getName());
                    assertEquals(DatasourceStructure.TableType.TABLE, possessionsTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[]{
                                    new DatasourceStructure.Column("id", "int4", "nextval('possessions_id_seq'::regclass)"),
                                    new DatasourceStructure.Column("title", "varchar", null),
                                    new DatasourceStructure.Column("user_id", "int4", null),
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
                                    new DatasourceStructure.Template("INSERT", "INSERT INTO public.\"possessions\" (\"title\", \"user_id\")\n" +
                                            "  VALUES ('', 1);"),
                                    new DatasourceStructure.Template("UPDATE", "UPDATE public.\"possessions\" SET\n" +
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
                                    new DatasourceStructure.Column("id", "int4", "nextval('users_id_seq'::regclass)"),
                                    new DatasourceStructure.Column("username", "varchar", null),
                                    new DatasourceStructure.Column("password", "varchar", null),
                                    new DatasourceStructure.Column("email", "varchar", null),
                                    new DatasourceStructure.Column("spouse_dob", "date", null),
                                    new DatasourceStructure.Column("dob", "date", null),
                                    new DatasourceStructure.Column("time1", "time", null),
                                    new DatasourceStructure.Column("time_tz", "timetz", null),
                                    new DatasourceStructure.Column("created_on", "timestamp", null),
                                    new DatasourceStructure.Column("created_on_tz", "timestamptz", null),
                                    new DatasourceStructure.Column("interval1", "interval", null),
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
                                    new DatasourceStructure.Template("INSERT", "INSERT INTO public.\"users\" (\"username\", \"password\", \"email\", \"spouse_dob\", \"dob\", \"time1\", \"time_tz\", \"created_on\", \"created_on_tz\", \"interval1\")\n" +
                                            "  VALUES ('', '', '', '2019-07-01', '2019-07-01', '18:32:45', '04:05:06 PST', TIMESTAMP '2019-07-01 10:00:00', TIMESTAMP WITH TIME ZONE '2019-07-01 06:30:00 CET', 1);"),
                                    new DatasourceStructure.Template("UPDATE", "UPDATE public.\"users\" SET\n" +
                                            "    \"username\" = ''\n" +
                                            "    \"password\" = ''\n" +
                                            "    \"email\" = ''\n" +
                                            "    \"spouse_dob\" = '2019-07-01'\n" +
                                            "    \"dob\" = '2019-07-01'\n" +
                                            "    \"time1\" = '18:32:45'\n" +
                                            "    \"time_tz\" = '04:05:06 PST'\n" +
                                            "    \"created_on\" = TIMESTAMP '2019-07-01 10:00:00'\n" +
                                            "    \"created_on_tz\" = TIMESTAMP WITH TIME ZONE '2019-07-01 06:30:00 CET'\n" +
                                            "    \"interval1\" = 1\n" +
                                            "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!"),
                                    new DatasourceStructure.Template("DELETE", "DELETE FROM public.\"users\"\n" +
                                            "  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!"),
                            },
                            usersTable.getTemplates().toArray()
                    );
                })
                .verifyComplete();
    }*/
}

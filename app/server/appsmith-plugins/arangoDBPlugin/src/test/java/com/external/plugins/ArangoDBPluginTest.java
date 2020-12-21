package com.external.plugins;

import com.appsmith.external.models.*;
import com.arangodb.*;
import com.arangodb.entity.CollectionType;
import com.arangodb.entity.Permissions;
import com.arangodb.model.CollectionCreateOptions;
import com.arangodb.model.CollectionSchema;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.GenericContainer;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static org.junit.Assert.*;

/**
 * Unit tests for MongoPlugin
 */

public class ArangoDBPluginTest {

    ArangoDBPlugin.ArangoDBPluginExecutor pluginExecutor = new ArangoDBPlugin.ArangoDBPluginExecutor();

    private static String address;
    private static Integer port;
    private static final String user = "root";
    private static final String password = "openSesame";
    private static final String dbName = "test";
    private static final String collectionName = "users";
    private static ArangoDB arangoDB;

    @SuppressWarnings("rawtypes")
    @ClassRule
    public static GenericContainer container = new GenericContainer(CompletableFuture.completedFuture("arangodb/arangodb:3.7.5"))
            .withEnv(Map.of("ARANGO_ROOT_PASSWORD", password))
            .withExposedPorts(8529);

    @BeforeClass
    public static void setUp() {
        address = container.getContainerIpAddress();
        port = container.getFirstMappedPort();

        //connect
        arangoDB = new ArangoDB.Builder()
                .host(address, port)
                .user(user)
                .password(password)
                .useSsl(false)
                .useProtocol(Protocol.HTTP_VPACK)
                .build();

        //create database
        try {
            arangoDB.createDatabase(dbName);
        } catch (ArangoDBException arangoDBException) {
            //ignore
            System.out.println(arangoDBException);
        }
        ArangoDatabase arangoDatabase = arangoDB.db(dbName);
        arangoDatabase.grantAccess(user, Permissions.RW);

        //create collection
        CollectionSchema schema = new CollectionSchema();
        schema.setRule("{\n" +
                "  \"message\": \"\",\n" +
                "  \"level\": \"strict\",\n" +
                "  \"rule\": {\n" +
                "    \"properties\": {\n" +
                "      \"name\": {\n" +
                "        \"type\": \"string\"\n" +
                "      },\n" +
                "      \"dob\": {\n" +
                "        \"required\": [\n" +
                "          \"day\",\n" +
                "          \"month\",\n" +
                "          \"year\"\n" +
                "        ],\n" +
                "        \"type\": \"object\",\n" +
                "        \"properties\": {\n" +
                "          \"year\": {\n" +
                "            \"type\": \"integer\"\n" +
                "          },\n" +
                "          \"month\": {\n" +
                "            \"type\": \"integer\"\n" +
                "          },\n" +
                "          \"day\": {\n" +
                "            \"type\": \"integer\"\n" +
                "          }\n" +
                "        }\n" +
                "      },\n" +
                "      \"netWorth\": {\n" +
                "        \"type\": \"string\"\n" +
                "      },\n" +
                "      \"age\": {\n" +
                "        \"type\": \"integer\"\n" +
                "      },\n" +
                "      \"gender\": {\n" +
                "        \"type\": \"string\"\n" +
                "      },\n" +
                "      \"luckyNumber\": {\n" +
                "        \"type\": \"integer\"\n" +
                "      }\n" +
                "    },\n" +
                "    \"$schema\": \"http://json-schema.org/draft-04/schema#\",\n" +
                "    \"type\": \"object\",\n" +
                "    \"required\": [\n" +
                "      \"age\",\n" +
                "      \"dob\",\n" +
                "      \"gender\",\n" +
                "      \"luckyNumber\",\n" +
                "      \"name\",\n" +
                "      \"netWorth\"\n" +
                "    ]\n" +
                "  }\n" +
                "}");
        schema.setMessage("");
        schema.setLevel(CollectionSchema.Level.NONE);
        CollectionCreateOptions options = new CollectionCreateOptions();
        options.type(CollectionType.DOCUMENT);
        options.setSchema(schema);

        ArangoCollection collection = arangoDatabase.collection(collectionName);
        if (collection.exists()) {
            collection.drop();
        }
        arangoDatabase.createCollection(collectionName, options);
        collection.grantAccess(user, Permissions.RW);

        //insert test documents
        collection.insertDocuments(
        List.of(Map.of(
                        "name", "Cierra Vega",
                        "gender", "F",
                        "age", 20,
                        "luckyNumber", 987654321L,
                        "dob", LocalDate.of(2018, 12, 31),
                        "netWorth", new BigDecimal("123456.789012")
                ),
                Map.of("name", "Alden Cantrell", "gender", "M", "age", 30),
                Map.of("name", "Kierra Gentry", "gender", "F", "age", 40)
        ));
    }

    @AfterClass
    public static void tearDown() {
        arangoDB.shutdown();
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(address);
        endpoint.setPort(port.longValue());

        Connection connection = new Connection();
        connection.setMode(Connection.Mode.READ_WRITE);
        connection.setType(Connection.Type.DIRECT);
        connection.setDefaultDatabaseName(dbName);

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setConnection(connection);
        dsConfig.setEndpoints(List.of(endpoint));

        DBAuth authentication = new DBAuth();
        authentication.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authentication.setUsername(user);
        authentication.setPassword(password);
        authentication.setDatabaseName(dbName);
        dsConfig.setAuthentication(authentication);

        return dsConfig;
    }

    @Test
    public void testConnectToArangoDB() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        Mono<ArangoDatabase> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        StepVerifier.create(dsConnectionMono)
                .assertNext(obj -> {
                    ArangoDatabase client = obj;
                    assertNotNull(client);
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteReadQuery() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<ArangoDatabase> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("FOR user IN users" +
                " FILTER user.age > 30" +
                " SORT user.id ASC" +
                " LIMIT 10" +
                " RETURN user");

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn ->
                pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteWriteQuery() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<ArangoDatabase> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("INSERT {" +
                " name: 'John Smith'," +
                " email: ['john@appsmith.com](mailto:%22john@appsmith.com)']," +
                " gender: 'M'," +
                " age: 50" +
                " } INTO users");
        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                })
                .verifyComplete();
    }

    @Test
    public void testStructure() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<DatasourceStructure> structureMono = pluginExecutor.datasourceCreate(dsConfig)
                .flatMap(connection -> pluginExecutor.getStructure(connection, dsConfig));

        StepVerifier.create(structureMono)
                .assertNext(structure -> {
                    assertNotNull(structure);
                    assertEquals(1, structure.getTables().size());

                    final DatasourceStructure.Table possessionsTable = structure.getTables().get(0);
                    assertEquals("users", possessionsTable.getName());
                    assertEquals(DatasourceStructure.TableType.COLLECTION, possessionsTable.getType());
                    assertArrayEquals(
                            new DatasourceStructure.Column[]{
                            },
                            possessionsTable.getColumns().toArray()
                    );

                    assertArrayEquals(
                            new DatasourceStructure.Key[]{},
                            possessionsTable.getKeys().toArray()
                    );

                })
                .verifyComplete();
    }
}

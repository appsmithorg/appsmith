package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Endpoint;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoClients;
import com.mongodb.reactivestreams.client.ClientSession;
import com.mongodb.reactivestreams.client.MongoCollection;
import com.mongodb.reactivestreams.client.MongoDatabase;
import com.mongodb.reactivestreams.client.Success;
import org.reactivestreams.Publisher;
import java.util.concurrent.TimeUnit;

import org.json.JSONObject;
import org.bson.Document;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.GenericContainer;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;
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

public class MongoPluginTest {

    MongoPlugin.MongoPluginExecutor pluginExecutor = new MongoPlugin.MongoPluginExecutor();

    private static String address;
    private static Integer port;

    @SuppressWarnings("rawtypes")
    @ClassRule
    public static GenericContainer mongoContainer = new GenericContainer(CompletableFuture.completedFuture("mongo:4.4"))
            .withExposedPorts(27017);

    private JsonNode value;

    @BeforeClass
    public static void setUp() {
        address = mongoContainer.getContainerIpAddress();
        port = mongoContainer.getFirstMappedPort();
        String uri = "mongodb://" + address + ":" + Integer.toString(port);
        final MongoClient mongoClient = MongoClients.create(uri);

        Flux.from(mongoClient.getDatabase("test").listCollectionNames()).collectList().
        flatMap(collectionNamesList -> {
            final MongoCollection<Document> usersCollection = mongoClient.getDatabase("test").getCollection(
                    "users");
            if(collectionNamesList.size() == 0) {
                Mono.from(usersCollection.insertMany(List.of(
                        new Document(Map.of(
                                "name", "Cierra Vega",
                                "gender", "F",
                                "age", 20,
                                "luckyNumber", 987654321L,
                                "dob", LocalDate.of(2018, 12, 31),
                                "netWorth", new BigDecimal("123456.789012")
                        )),
                        new Document(Map.of("name", "Alden Cantrell", "gender", "M", "age", 30)),
                        new Document(Map.of("name", "Kierra Gentry", "gender", "F", "age", 40))
                ))).block();
            }

            return Mono.just(usersCollection);
        }).block();
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(address);
        endpoint.setPort(port.longValue());

        Connection connection = new Connection();
        connection.setMode(Connection.Mode.READ_WRITE);
        connection.setType(Connection.Type.DIRECT);
        connection.setDefaultDatabaseName("test");

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setConnection(connection);
        dsConfig.setEndpoints(List.of(endpoint));
        return dsConfig;
    }

    @Test
    public void testConnectToMongo() {
        System.out.println(mongoContainer.getContainerIpAddress());
        System.out.println(mongoContainer.getFirstMappedPort());
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        System.out.println(dsConfig);

        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        StepVerifier.create(dsConnectionMono)
                .assertNext(obj -> {
                    MongoClient client = (MongoClient) obj;
                    System.out.println(client);
                    assertNotNull(client);
                })
                .verifyComplete();
    }

    /**
     * 1. Test "testDatasource" method in MongoPluginExecutor class.
     */
    @Test
    public void testDatasourceFail() {
        System.out.println(mongoContainer.getContainerIpAddress());
        System.out.println(mongoContainer.getFirstMappedPort());
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getEndpoints().get(0).setHost("badHost");
        System.out.println(dsConfig);

        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> {
                    assertNotNull(datasourceTestResult);
                    assertFalse(datasourceTestResult.isSuccess());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteReadQuery() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("{\n" +
                "      find: \"users\",\n" +
                "      filter: { age: { $gte: 30 } },\n" +
                "      sort: { id: 1 },\n" +
                "      limit: 10,\n" +
                "    }");

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(2, ((ArrayNode) result.getBody()).size());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteWriteQuery() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("{\n" +
                "      insert: \"users\",\n" +
                "      documents: [\n" +
                "        {\n" +
                "          name: \"John Smith\",\n" +
                "          email: [\"john@appsmith.com](mailto:%22john@appsmith.com)\"],\n" +
                "          gender: \"M\",\n" +
                "          age: \"50\",\n" +
                "        },\n" +
                "      ],\n" +
                "    }");
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
    public void testFindAndModify() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("{\n" +
                "  findAndModify: \"users\",\n" +
                "  query: " +
                "{ " +
                "name: \"Alden Cantrell\"" +
                " },\n" +
                "  update: { $set: { gender: \"F\" }}\n" +
                "}");
        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    value = ((ObjectNode) result.getBody()).get("value");
                    assertNotNull(value);
                    assertEquals("M", value.get("gender").asText());
                    assertEquals("Alden Cantrell", value.get("name").asText());
                    assertEquals(30, value.get("age").asInt());
                })
                .verifyComplete();
    }

    @Test
    public void testCleanUp() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("{\n" +
                "      find: \"users\",\n" +
                "      limit: 1,\n" +
                "    }");

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    final ArrayNode body = (ArrayNode) result.getBody();
                    assertEquals(1, body.size());
                    final JsonNode node = body.get(0);
                    assertTrue(node.get("_id").isTextual());
                    assertTrue(node.get("luckyNumber").isNumber());
                    assertEquals("2018-12-31T00:00:00Z", node.get("dob").asText());
                    assertEquals("123456.789012", node.get("netWorth").toString());
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
                                    new DatasourceStructure.Column("_id", "ObjectId", null),
                                    new DatasourceStructure.Column("age", "Integer", null),
                                    new DatasourceStructure.Column("dob", "Date", null),
                                    new DatasourceStructure.Column("gender", "String", null),
                                    new DatasourceStructure.Column("luckyNumber", "Long", null),
                                    new DatasourceStructure.Column("name", "String", null),
                                    new DatasourceStructure.Column("netWorth", "BigDecimal", null),
                            },
                            possessionsTable.getColumns().toArray()
                    );

                    assertArrayEquals(
                            new DatasourceStructure.Key[]{},
                            possessionsTable.getKeys().toArray()
                    );

                    assertArrayEquals(
                            new DatasourceStructure.Template[]{
                                    new DatasourceStructure.Template("Find", "{\n" +
                                            "  \"find\": \"users\",\n" +
                                            "  \"filter\": {\n" +
                                            "    \"gender\": \"F\"\n" +
                                            "  },\n" +
                                            "  \"sort\": {\n" +
                                            "    \"_id\": 1\n" +
                                            "  },\n" +
                                            "  \"limit\": 10\n" +
                                            "}\n"),
                                    new DatasourceStructure.Template("Find by ID", "{\n" +
                                            "  \"find\": \"users\",\n" +
                                            "  \"filter\": {\n" +
                                            "    \"_id\": ObjectId(\"id_to_query_with\")\n" +
                                            "  }\n" +
                                            "}\n"),
                                    new DatasourceStructure.Template("Insert", "{\n" +
                                            "  \"insert\": \"users\",\n" +
                                            "  \"documents\": [\n" +
                                            "    {\n" +
                                            "      \"_id\": ObjectId(\"a_valid_object_id_hex\"),\n" +
                                            "      \"age\": 1,\n" +
                                            "      \"dob\": new Date(\"2019-07-01\"),\n" +
                                            "      \"gender\": \"new value\",\n" +
                                            "      \"luckyNumber\": NumberLong(\"1\"),\n" +
                                            "      \"name\": \"new value\",\n" +
                                            "      \"netWorth\": NumberDecimal(\"1\"),\n" +
                                            "    }\n" +
                                            "  ]\n" +
                                            "}\n"),
                                    new DatasourceStructure.Template("Update", "{\n" +
                                            "  \"update\": \"users\",\n" +
                                            "  \"updates\": [\n" +
                                            "    {\n" +
                                            "      \"q\": {\n" +
                                            "        \"_id\": ObjectId(\"id_of_document_to_update\")\n" +
                                            "      },\n" +
                                            "      \"u\": { \"$set\": { \"gender\": \"new value\" } }\n" +
                                            "    }\n" +
                                            "  ]\n" +
                                            "}\n"),
                                    new DatasourceStructure.Template("Delete", "{\n" +
                                            "  \"delete\": \"users\",\n" +
                                            "  \"deletes\": [\n" +
                                            "    {\n" +
                                            "      \"q\": {\n" +
                                            "        \"_id\": \"id_of_document_to_delete\"\n" +
                                            "      },\n" +
                                            "      \"limit\": 1\n" +
                                            "    }\n" +
                                            "  ]\n" +
                                            "}\n"),
                            },
                            possessionsTable.getTemplates().toArray()
                    );
                })
                .verifyComplete();
    }
}

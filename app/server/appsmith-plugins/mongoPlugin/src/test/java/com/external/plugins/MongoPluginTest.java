package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.SSLDetails;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mongodb.MongoCommandException;
import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoClients;
import com.mongodb.reactivestreams.client.MongoCollection;
import org.bson.Document;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.GenericContainer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.when;

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
        connection.setSsl(new SSLDetails());
        connection.getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setConnection(connection);
        dsConfig.setEndpoints(List.of(endpoint));

        return dsConfig;
    }

    @Test
    public void testConnectToMongo() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();

        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);
        StepVerifier.create(dsConnectionMono)
                .assertNext(obj -> {
                    MongoClient client = obj;
                    assertNotNull(client);
                })
                .verifyComplete();
    }

    /**
     * 1. Test "testDatasource" method in MongoPluginExecutor class.
     */
    @Test
    public void testDatasourceFail() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getEndpoints().get(0).setHost("badHost");

        StepVerifier.create(pluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> {
                    assertNotNull(datasourceTestResult);
                    assertFalse(datasourceTestResult.isSuccess());
                })
                .verifyComplete();
    }

    /*
     * 1. Test that when a query is attempted to run on mongodb but refused because of lack of authorization, then
     *    also, it indicates a successful connection establishment.
     */
    @Test
    public void testDatasourceWithUnauthorizedException() throws NoSuchFieldException {
        /*
         * 1. Create mock exception of type: MongoCommandException.
         *      - mock method getErrorCodeName() to return String "Unauthorized".
         */
        MongoCommandException mockMongoCommandException = mock(MongoCommandException.class);
        when(mockMongoCommandException.getErrorCodeName()).thenReturn("Unauthorized");
        when(mockMongoCommandException.getMessage()).thenReturn("Mock Unauthorized Exception");

        /*
         * 1. Spy MongoPluginExecutor class.
         *      - On calling testDatasource(...) -> call the real method.
         *      - On calling datasourceCreate(...) -> throw the mock exception defined above.
         */
        MongoPlugin.MongoPluginExecutor mongoPluginExecutor    = new MongoPlugin.MongoPluginExecutor();
        MongoPlugin.MongoPluginExecutor spyMongoPluginExecutor = spy(mongoPluginExecutor);
        /* Please check this out before modifying this line: https://stackoverflow
         * .com/questions/11620103/mockito-trying-to-spy-on-method-is-calling-the-original-method
         */
        doReturn(Mono.error(mockMongoCommandException)).when(spyMongoPluginExecutor).datasourceCreate(any());

        /*
         * 1. Test that MongoCommandException with error code "Unauthorized" is caught and no error is reported.
         */
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        StepVerifier
                .create(spyMongoPluginExecutor.testDatasource(dsConfig))
                .assertNext(datasourceTestResult -> {
                    assertTrue(datasourceTestResult.isSuccess());
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
    public void testExecuteInvalidReadQuery() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("{\n" +
                "      find: \"users\",\n" +
                "      filter: { $is: {} },\n" +
                "      sort: { id: 1 },\n" +
                "      limit: 10,\n" +
                "    }");

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertFalse(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals("unknown top level operator: $is", result.getBody());
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

    @Test
    public void testErrorMessageOnSrvUrl() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getEndpoints().get(0).setHost("mongodb+srv:://url.net");
        Mono<Set<String>> invalidsMono = Mono.just(pluginExecutor.validateDatasource(dsConfig));

        StepVerifier.create(invalidsMono)
                .assertNext(invalids -> {
                    assertTrue(invalids
                            .stream()
                            .anyMatch(error -> error.contains("MongoDb SRV URLs are not yet supported")));
                })
                .verifyComplete();
    }

    @Test
    public void testTestDatasourceTimeoutError() {
        String badHost = "mongo-bad-url.mongodb.net";
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        dsConfig.getEndpoints().get(0).setHost(badHost);

        Mono<DatasourceTestResult> datasourceTestResult = pluginExecutor.testDatasource(dsConfig);

        StepVerifier.create(datasourceTestResult)
                .assertNext(result -> {
                    assertFalse(result.isSuccess());
                    assertTrue(result.getInvalids().size() == 1);
                    assertTrue(result
                            .getInvalids()
                            .stream()
                            .anyMatch(error -> error.contains(
                                    "Connection timed out. Please check if the datasource configuration fields have " +
                                            "been filled correctly."
                            )));
                })
                .verifyComplete();
    }

    @Test
    public void testSslToggleMissingError() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.getConnection().getSsl().setAuthType(null);

        Mono<Set<String>> invalidsMono = Mono.just(pluginExecutor)
                .map(executor -> executor.validateDatasource(datasourceConfiguration));


        StepVerifier.create(invalidsMono)
                .assertNext(invalids -> {
                    String expectedError = "Appsmith server has failed to fetch SSL configuration from datasource " +
                            "configuration form. Please reach out to Appsmith customer support to resolve this.";
                    assertTrue(invalids
                            .stream()
                            .anyMatch(error -> expectedError.equals(error))
                    );
                })
                .verifyComplete();
    }

    @Test
    public void testSslDefault() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DEFAULT);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("{\n" +
                "      find: \"users\",\n" +
                "      filter: { age: { $gte: 30 } },\n" +
                "      sort: { id: 1 },\n" +
                "      limit: 10,\n" +
                "    }");

        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(datasourceConfiguration);
        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.execute(conn,
                datasourceConfiguration,
                actionConfiguration));

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
    public void testSslDisabled() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.getConnection().getSsl().setAuthType(SSLDetails.AuthType.DISABLED);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("{\n" +
                "      find: \"users\",\n" +
                "      filter: { age: { $gte: 30 } },\n" +
                "      sort: { id: 1 },\n" +
                "      limit: 10,\n" +
                "    }");

        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(datasourceConfiguration);
        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.execute(conn,
                datasourceConfiguration,
                actionConfiguration));

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
    public void testSslEnabled() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        datasourceConfiguration.getConnection().getSsl().setAuthType(SSLDetails.AuthType.ENABLED);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("{\n" +
                "      find: \"users\",\n" +
                "      filter: { age: { $gte: 30 } },\n" +
                "      sort: { id: 1 },\n" +
                "      limit: 10,\n" +
                "    }");

        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(datasourceConfiguration);
        Mono<ActionExecutionResult> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.execute(conn,
                datasourceConfiguration,
                actionConfiguration));

        /*
         * - This test case is exactly same as the one's used in DEFAULT and DISABLED tests.
         * - Expect error here because testcontainer does not support SSL connection.
         */
        StepVerifier.create(executeMono)
                .assertNext(result -> assertFalse(result.getIsExecutionSuccess()))
                .verifyComplete();
    }
}

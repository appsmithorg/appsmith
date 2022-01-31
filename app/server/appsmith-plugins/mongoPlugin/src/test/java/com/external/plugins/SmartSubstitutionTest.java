package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.*;
import com.fasterxml.jackson.databind.node.ArrayNode;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static com.appsmith.external.helpers.PluginUtils.setValueSafelyInFormData;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.SMART_SUBSTITUTION;
import static org.junit.Assert.*;

public class SmartSubstitutionTest {
    @SuppressWarnings("rawtypes")
    @ClassRule
    public final static GenericContainer mongoContainer = new GenericContainer(CompletableFuture.completedFuture("mongo:4.4"))
            .withExposedPorts(27017);
    private static MongoClient mongoClient;
    private static String address;
    private static Integer port;
    private final MongoPlugin.MongoPluginExecutor pluginExecutor = new MongoPlugin.MongoPluginExecutor();

    @BeforeClass
    public static void setUp() {
        address = mongoContainer.getContainerIpAddress();
        port = mongoContainer.getFirstMappedPort();
        String uri = "mongodb://" + address + ":" + port;
        mongoClient = MongoClients.create(uri);

        Flux.from(mongoClient.getDatabase("test").listCollectionNames()).collectList().
                flatMap(collectionNamesList -> {
                    if (collectionNamesList.size() == 0) {
                        final MongoCollection<Document> usersCollection = mongoClient.getDatabase("test").getCollection(
                                "users");
                        Mono.from(usersCollection.insertMany(List.of(
                                new Document(Map.of(
                                        "name", "Cierra Vega",
                                        "gender", "F",
                                        "age", 20,
                                        "luckyNumber", 987654321L,
                                        "dob", LocalDate.of(2018, 12, 31),
                                        "netWorth", new BigDecimal("123456.789012"),
                                        "updatedByCommand", false
                                )),
                                new Document(Map.of("name", "Alden Cantrell", "gender", "M", "age", 30)),
                                new Document(Map.of("name", "Kierra Gentry", "gender", "F", "age", 40))
                        ))).block();
                    }

                    return Mono.empty();
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
    public void testSmartSubstitutionWithObjectIdInDoubleQuotes() {
        final MongoCollection<Document> usersCollection = mongoClient.getDatabase("test").getCollection("users");
        List<String> documentIds = new ArrayList<>();
        Flux.from(usersCollection.find())
                .map(doc -> documentIds.add(doc.get("_id").toString()))
                .collectList()
                .block();

        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        String findQuery = "{\n" +
                "   \"find\": \"users\",\n" +
                "   \"filter\": {\n" +
                "           \"_id\": {\n" +
                "               $in: {{Input1.text}}\n" +
                "            }\n" +
                "    }\n" +
                "}";
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(findQuery);

        StringBuilder sb = new StringBuilder();
        documentIds.stream()
                .forEach(id -> sb.append(" \"ObjectId(\\\"" + id + "\\\")\","));
        sb.setLength(sb.length() - 1);
        String objectIdsAsArray = "[" + sb + "]";

        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setValueSafelyInFormData(configMap, COMMAND, "RAW");
        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input1.text");
        param1.setValue(objectIdsAsArray);
        params.add(param1);
        executeActionDTO.setParams(params);

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.executeParameterized(conn,
                executeActionDTO, dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(3, ((ArrayNode) result.getBody()).size());
                })
                .verifyComplete();

    }

    @Test
    public void testSmartSubstitutionWithISODateInDoubleQuotes() {
        final MongoCollection<Document> usersCollection = mongoClient.getDatabase("test").getCollection("users");
        List<String> dobs = new ArrayList<>();
        Flux.from(usersCollection.find())
                .filter(doc -> doc.get("dob") != null)
                .map(doc -> dobs.add(doc.get("dob").toString()))
                .collectList()
                .block();

        // todo remove
        dobs.forEach(System.out::println);


        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        String findQuery = "{\n" +
                "   \"find\": \"users\",\n" +
                "   \"filter\": {\n" +
                "           \"dob\": {\n" +
                "               $in: {{Input1.text}}\n" +
                "            }\n" +
                "    }\n" +
                "}";
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(findQuery);

        StringBuilder sb = new StringBuilder();
        dobs.forEach(id -> sb.append(" \"ISODate(\\\"").append(id).append("\\\")\","));
        sb.setLength(sb.length() - 1);
        String objectIdsAsArray = "[" + sb + "]";

        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setValueSafelyInFormData(configMap, COMMAND, "RAW");
        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input1.text");
        param1.setValue(objectIdsAsArray);
        params.add(param1);
        executeActionDTO.setParams(params);

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.executeParameterized(conn,
                executeActionDTO, dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(3, ((ArrayNode) result.getBody()).size());
                })
                .verifyComplete();

    }

}

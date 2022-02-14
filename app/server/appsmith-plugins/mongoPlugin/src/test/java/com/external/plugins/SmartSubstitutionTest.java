package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.SSLDetails;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoClients;
import com.mongodb.reactivestreams.client.MongoCollection;
import org.bson.Document;
import org.bson.types.BSONTimestamp;
import org.bson.types.Decimal128;
import org.bson.types.ObjectId;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.GenericContainer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.Date;
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
                                        "_id", new ObjectId("6200fdea5c4142fa578cd971"),
                                        "name", "Cierra Vega",
                                        "gender", "F",
                                        "age", 20,
                                        "dob", new Date(0),
                                        "netWorth", Decimal128.parse("123456.789012"),
                                        "updatedByCommand", false,
                                        "aLong", 9_000_000_000_000_000_000L,
                                        "ts", new BSONTimestamp(1421006159, 4)
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
                // TODO 1 the working one
                "           \"_id\": {\n" +
                "               $in: {{Input1.text}}\n" +
                "            }\n" +
//                "           \"_id\": {{Input1.text}}\n"+
                // TODO 2 not working
//                "           \"_id\": ObjectId(\"6200fdea5c4142fa578cd971\")\n"+
                "    }\n" +
                "}";
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(findQuery);

        StringBuilder sb = new StringBuilder();
        documentIds.stream()
                .forEach(id -> sb.append(" \"ObjectId(\\\"" + id + "\\\")\","));
        System.out.println("Doc Ids:");
        documentIds.forEach(System.out::println);
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
        // TODO 1 the working one
        param1.setValue(objectIdsAsArray);
        // TODO 2 not working
//        param1.setValue("\"ObjectId(\\\"6200fdea5c4142fa578cd971\\\")\"");
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
    public void testSmartSubstitutionWithMongoTypes() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<MongoClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        final String findQuery = "" +
                "{\n" +
                "   \"find\": \"users\",\n" +
                "   \"filter\": {\n" +
                "dob:{ $in: {{Input1.dob}} },\n" +
                "netWorth:{ $in: {{Input1.netWorth}} },\n" +
                "aLong:{ $in: {{Input1.aLong}} },\n" +
                "ts:{ $in: {{Input1.ts}} },\n" +
                "    },\n" +
                "}";

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody(findQuery);

        Map<String, Object> configMap = new HashMap<>();
        setValueSafelyInFormData(configMap, SMART_SUBSTITUTION, Boolean.TRUE);
        setValueSafelyInFormData(configMap, COMMAND, "RAW");
        actionConfiguration.setFormData(configMap);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        final List<Param> params = new ArrayList<>();
        final Param dob = new Param("Input1.dob", "[ 'ISODate(\\'1970-01-01T00:00:00.000Z\\')' ]");
        params.add(dob);
        final Param netWorth = new Param("Input1.netWorth", "[ 'NumberDecimal(\"123456.789012\")' ]");
        params.add(netWorth);
        final Param aLong = new Param("Input1.aLong", "[ \"NumberLong(9000000000000000000)\" ]");
        params.add(aLong);
        final Param ts = new Param("Input1.ts", "[ \"Timestamp(1421006159, 4)\" ]");
        params.add(ts);
        executeActionDTO.setParams(params);

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.executeParameterized(conn,
                executeActionDTO, dsConfig, actionConfiguration));
        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(1, ((ArrayNode) result.getBody()).size());
                })
                .verifyComplete();

    }


//    private String buildQueryForEverySpecialType(boolean useDoubleQuote) {
//        final char quote = useDoubleQuote ? '"' : '\'';
//
//        Map<String, String> kvs = Map.of(
//                "_id","ObjectId(\"6200fdea5c4142fa578cd971\")",
//                "dob", "ISODate(\"1970-01-01T00:00:00.000Z\")",
//                "netWorth", "NumberDecimal(\"123456.789012\")",
//                "aLong", "NumberLong(9000000000000000000)",
//                "ts", "Timestamp(1421006159, 4)"
//        );
//
//        StringBuilder findQuery = new StringBuilder();
//        findQuery.append("{\n" +
//                "   \"find\": \"users\",\n" +
//                "   \"filter\": {\n");
//
////        kvs.forEach((k, v) -> findQuery.append(k).append(": ").append(quote).append(v).append(quote).append(",\n"));
//        kvs.forEach((k, v) -> findQuery.append(k).append(": {{Input1.").append(k).append("}},\n"));
//        findQuery.setLength(findQuery.length() - 2);
//        findQuery.append("    }\n" +
//                "}");
//
//       return findQuery.toString();
//    }


//    private List<Param> createParams(boolean useDoubleQuote) {
//        final char quote = useDoubleQuote ? '"' : '\'';
//
//        Map<String, String> kvs = Map.of(
//                "_id","ObjectId(\"6200fdea5c4142fa578cd971\")",
//                "dob", "ISODate(\"1970-01-01T00:00:00.000Z\")",
//                "netWorth", "NumberDecimal(\"123456.789012\")",
//                "aLong", "NumberLong(9000000000000000000)",
//                "ts", "Timestamp(1421006159, 4)"
//        );
//        final List<Param> params = new ArrayList<>();
//        final StringBuilder sb = new StringBuilder();
//        kvs.forEach((k, v) ->{
//            sb.setLength(0);
//            final String paramKey = "Input1." + k;
//            final String paramValue = sb.append(quote).append(v).append(quote).toString();
//            params.add(new Param(paramKey, paramValue));
//        } );
//        return params;
//    }

}

package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import lombok.extern.log4j.Log4j;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.GenericContainer;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeDefinition;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.CreateTableRequest;
import software.amazon.awssdk.services.dynamodb.model.KeySchemaElement;
import software.amazon.awssdk.services.dynamodb.model.KeyType;
import software.amazon.awssdk.services.dynamodb.model.ProvisionedThroughput;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.ScalarAttributeType;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

@Log4j
public class DynamoPluginTest {

    private final static DynamoPlugin.DynamoPluginExecutor pluginExecutor = new DynamoPlugin.DynamoPluginExecutor();

    @SuppressWarnings("rawtypes")
    @ClassRule
    public static GenericContainer container = new GenericContainer(CompletableFuture.completedFuture("amazon/dynamodb-local"))
            .withExposedPorts(8000);

    private final static DatasourceConfiguration dsConfig = new DatasourceConfiguration();

    @BeforeClass
    public static void setUp() {
        final String host = "localhost";
        final Integer port = container.getMappedPort(8000);

        final StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(
                AwsBasicCredentials.create("dummy", "dummy")
        );

        DynamoDbClient ddb = DynamoDbClient.builder()
                .region(Region.AP_SOUTH_1)
                .endpointOverride(URI.create("http://" + host + ":" + port))
                .credentialsProvider(credentialsProvider)
                .build();

        ddb.createTable(CreateTableRequest.builder()
                .tableName("cities")
                .attributeDefinitions(
                        AttributeDefinition.builder().attributeName("Id").attributeType(ScalarAttributeType.S).build()
                )
                .keySchema(
                        KeySchemaElement.builder().attributeName("Id").keyType(KeyType.HASH).build()
                )
                .provisionedThroughput(
                        ProvisionedThroughput.builder().readCapacityUnits(5L).writeCapacityUnits(5L).build()
                )
                .build());

        ddb.putItem(PutItemRequest.builder()
                .tableName("cities")
                .item(Map.of(
                        "Id", AttributeValue.builder().s("1").build(),
                        "City", AttributeValue.builder().s("New Delhi").build()
                ))
                .build());

        ddb.putItem(PutItemRequest.builder()
                .tableName("cities")
                .item(Map.of(
                        "Id", AttributeValue.builder().s("2").build(),
                        "City", AttributeValue.builder().s("Bangalore").build()
                ))
                .build());

        System.out.println(ddb.listTables());

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(host);
        endpoint.setPort(port.longValue());
        dsConfig.setAuthentication(new AuthenticationDTO());
        dsConfig.getAuthentication().setUsername("dummy");
        dsConfig.getAuthentication().setPassword("dummy");
        dsConfig.getAuthentication().setDatabaseName(Region.AP_SOUTH_1.toString());
        dsConfig.setEndpoints(List.of(endpoint));
    }

    private Mono<ActionExecutionResult> execute(String action, String jsonActionConfiguration) {
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setPath(action);
        actionConfiguration.setBody(jsonActionConfiguration);

        return pluginExecutor
                .datasourceCreate(dsConfig)
                .flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));
    }

    @Test
    public void testListTables() {
        StepVerifier.create(execute("ListTables", null))
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertArrayEquals(
                            new String[]{"cities"},
                            ((Map<String, List<String>>) result.getBody()).get("TableNames").toArray()
                    );
                })
                .verifyComplete();
    }

    @Test
    public void testGetItem() {
        final String body = "{\n" +
                "  \"TableName\": \"cities\",\n" +
                "  \"Key\": {\n" +
                "    \"Id\": {\n" +
                "      \"S\": \"1\"\n" +
                "    }\n" +
                "  }\n" +
                "}\n";

        StepVerifier.create(execute("GetItem", body))
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    final Map<String, Map<String, Object>> item = ((Map<String, Map<String, Map<String, Object>>>) result.getBody()).get("Item");
                    assertEquals("New Delhi", item.get("City").get("S"));
                })
                .verifyComplete();
    }

    @Test
    public void testPutItem() {
        final String body = "{\n" +
                "  \"TableName\": \"cities\",\n" +
                "  \"Item\": {\n" +
                "    \"Id\": {\n" +
                "      \"S\": \"9\"\n" +
                "    },\n" +
                "    \"City\": {\n" +
                "      \"S\": \"Mumbai\"\n" +
                "    }\n" +
                "  }\n" +
                "}\n";

        StepVerifier.create(execute("PutItem", body))
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertNotNull(((Map<String, List<String>>) result.getBody()).get("Attributes"));
                })
                .verifyComplete();
    }

    @Test
    public void testUpdateItem() {
        final String body = "{\n" +
                "  \"TableName\": \"cities\",\n" +
                "  \"Key\": {\n" +
                "    \"Id\": {\n" +
                "      \"S\": \"2\"\n" +
                "    }\n" +
                "  },\n" +
                "  \"UpdateExpression\": \"set City = :new_city\",\n" +
                "  \"ExpressionAttributeValues\": {\n" +
                "    \":new_city\": {\n" +
                "      \"S\": \"Bengaluru\"\n" +
                "    }\n" +
                "  },\n" +
                "  \"ReturnValues\": \"ALL_NEW\"\n" +
                "}\n";

        StepVerifier.create(execute("UpdateItem", body))
                .assertNext(result -> {
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    final Map<String, Map<String, Object>> attributes = ((Map<String, Map<String, Map<String, Object>>>) result.getBody()).get("Attributes");
                    assertEquals("Bengaluru", attributes.get("City").get("S"));
                })
                .verifyComplete();
    }

}

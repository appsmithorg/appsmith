package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import lombok.extern.log4j.Log4j;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.GenericContainer;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
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

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

@Log4j
public class DynamoPluginTest {

    DynamoPlugin.DynamoPluginExecutor pluginExecutor = new DynamoPlugin.DynamoPluginExecutor();

    @SuppressWarnings("rawtypes")
    @ClassRule
    public static GenericContainer dynaliteContainer = new GenericContainer("amazon/dynamodb-local")
            .withExposedPorts(8000);

    String address;
    Integer port;
    String username;
    String password;
    String database;

    DatasourceConfiguration dsConfig;

    @Before
    public void setUp() {
        if (address != null) {
            return;
        }

        address = "localhost";
        port = dynaliteContainer.getMappedPort(8000);

        final StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(
                AwsBasicCredentials.create("dummy", "dummy")
        );

        DynamoDbClient ddb = DynamoDbClient.builder()
                .endpointOverride(URI.create("http://" + address + ":" + port))
                .credentialsProvider(credentialsProvider)
                .build();

        ddb.createTable(CreateTableRequest.builder()
                .tableName("cities")
                .attributeDefinitions(
                        AttributeDefinition.builder().attributeName("City").attributeType(ScalarAttributeType.S).build()
                )
                .keySchema(
                        KeySchemaElement.builder().attributeName("City").keyType(KeyType.HASH).build()
                )
                .provisionedThroughput(
                        ProvisionedThroughput.builder().readCapacityUnits(5L).writeCapacityUnits(5L).build()
                )
                .build());

        ddb.putItem(PutItemRequest.builder()
                .tableName("cities")
                .item(Map.of(
                        "City", AttributeValue.builder().s("New Delhi").build()
                ))
                .build());

        System.out.println(ddb.listTables());
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(address);
        endpoint.setPort(port.longValue());

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(new AuthenticationDTO());
        dsConfig.getAuthentication().setUsername("dummy");
        dsConfig.getAuthentication().setPassword("dummy");
        dsConfig.setEndpoints(List.of(endpoint));
        return dsConfig;
    }

    @Test
    public void testListTables() {
        DatasourceConfiguration dsConfig = createDatasourceConfiguration();
        Mono<DynamoDbClient> dsConnectionMono = pluginExecutor.datasourceCreate(dsConfig);

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setBody("{\n" +
                "  \"action\": \"ListTables\"\n" +
                "}\n");

        Mono<Object> executeMono = dsConnectionMono.flatMap(conn -> pluginExecutor.execute(conn, dsConfig, actionConfiguration));

        StepVerifier.create(executeMono)
                .assertNext(obj -> {
                    ActionExecutionResult result = (ActionExecutionResult) obj;
                    assertNotNull(result);
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertArrayEquals(
                            ((Map<String, List<String>>) result.getBody()).get("TableNames").toArray(),
                            new String[]{"cities"}
                    );
                })
                .verifyComplete();
    }

}

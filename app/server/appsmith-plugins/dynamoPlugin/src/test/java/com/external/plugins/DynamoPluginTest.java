package com.external.plugins;

import com.appsmith.external.models.DatasourceConfiguration;
import lombok.extern.log4j.Log4j;
import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Test;
import org.testcontainers.containers.GenericContainer;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.net.URI;

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

        System.out.println("setup");

        DynamoDbClient ddb = DynamoDbClient.builder()
                .endpointOverride(URI.create("http://localhost:" + dynaliteContainer.getMappedPort(8000)))
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create("dummy", "dummy")))
                .build();

        System.out.println(ddb.listTables());
    }

    @Test
    public void testConnectMySQLContainer() {
        StepVerifier.create(Mono.just(1L))
                .assertNext(Assert::assertNotNull)
                .verifyComplete();
    }

}

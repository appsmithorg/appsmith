package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.util.RestrictedHostFilter;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import reactor.test.StepVerifier;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The restricted host policy on a DynamoDB datasource's endpoint: a datasource whose endpoint host the policy blocks is
 * not created or tested, an endpoint host that is not a plain host name is refused, and a client refuses to connect
 * when its host resolves to a blocked address at connect time.
 */
@DisplayName("GHSA-87p7-fqr2-4grw")
class DynamoPluginRestrictedHostPolicyTest {

    private static final Duration CALL_TIMEOUT = Duration.ofSeconds(60);

    private final List<DynamoDbClient> clients = new ArrayList<>();
    private MockWebServer server;

    @BeforeAll
    static void enableRestrictedHostPolicy() {
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(false);
    }

    @AfterAll
    static void restoreRestrictedHostPolicy() {
        RestrictedHostFilter.resetSsrfFilterDisabledForTesting();
    }

    @BeforeEach
    void startServer() throws IOException {
        server = new MockWebServer();
        for (int i = 0; i < 2; i++) {
            server.enqueue(new MockResponse()
                    .addHeader("Content-Type", "application/x-amz-json-1.0")
                    .setBody("{\"TableNames\":[\"Music\"]}"));
        }
        server.start(InetAddress.getByName("127.0.0.1"), 0);
    }

    @AfterEach
    void cleanUp() throws IOException {
        RestrictedHostFilter.clearAlwaysAllowedHostsForTesting();
        clients.forEach(DynamoDbClient::close);
        server.shutdown();
    }

    @ParameterizedTest
    @EnumSource(DynamoClientPath.class)
    void should_rejectDatasource_when_endpointHostIsBlocked(DynamoClientPath path) {
        // When
        StepVerifier.create(path.create(datasource("localhost", server.getPort())))
                // Then
                .expectErrorSatisfies(error -> assertThat(error)
                        .isInstanceOf(AppsmithPluginException.class)
                        .hasMessage(RestrictedHostFilter.HOST_NOT_ALLOWED))
                .verify(CALL_TIMEOUT);
        assertThat(server.getRequestCount()).isZero();
    }

    @ParameterizedTest
    @EnumSource(DynamoClientPath.class)
    void should_rejectDatasource_when_endpointHostIsNotAHostName(DynamoClientPath path) {
        // When
        StepVerifier.create(path.create(datasource("dynamodb.example.com/tables", 8000)))
                // Then
                .expectErrorSatisfies(error -> assertThat(error)
                        .isInstanceOf(AppsmithPluginException.class)
                        .hasMessage("The endpoint host is not a valid host name or IP address."))
                .verify(CALL_TIMEOUT);
    }

    @ParameterizedTest
    @ValueSource(longs = {0L, 65536L, 4294967376L})
    void should_rejectDatasource_when_endpointPortIsOutOfRange(long port) {
        // When
        StepVerifier.create(DynamoClientPath.WITHOUT_FLAG.create(datasource("dynamodb.example.com", port)))
                // Then
                .expectErrorSatisfies(error -> assertThat(error)
                        .isInstanceOf(AppsmithPluginException.class)
                        .hasMessage("The endpoint port must be from 1 to 65535."))
                .verify(CALL_TIMEOUT);
    }

    @ParameterizedTest
    @EnumSource(DynamoClientPath.class)
    void should_reportHostNotAllowed_when_testingDatasourceWithBlockedEndpointHost(DynamoClientPath path) {
        // When
        DatasourceTestResult result =
                path.test(datasource("localhost", server.getPort())).block(CALL_TIMEOUT);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getInvalids()).containsExactly(RestrictedHostFilter.HOST_NOT_ALLOWED);
        assertThat(server.getRequestCount()).isZero();
    }

    @ParameterizedTest
    @EnumSource(DynamoClientPath.class)
    void should_refuseToConnect_when_endpointHostResolvesToBlockedAddressAtConnectTime(DynamoClientPath path) {
        // Given
        RestrictedHostFilter.setAlwaysAllowedHostsForTesting("localhost");
        DynamoDbClient client =
                path.create(datasource("localhost", server.getPort())).block(CALL_TIMEOUT);
        assertThat(client).isNotNull();
        clients.add(client);
        RestrictedHostFilter.clearAlwaysAllowedHostsForTesting();

        // When / Then
        assertThatThrownBy(client::listTables)
                .rootCause()
                .isInstanceOf(UnknownHostException.class)
                .hasMessage(RestrictedHostFilter.HOST_NOT_ALLOWED);
        assertThat(server.getRequestCount()).isZero();
    }

    @ParameterizedTest
    @EnumSource(DynamoClientPath.class)
    void should_createClient_when_endpointHostIsAllowed(DynamoClientPath path) {
        // When
        DynamoDbClient client = path.create(datasource("10.20.30.40", 8000)).block(CALL_TIMEOUT);

        // Then
        assertThat(client).isNotNull();
        clients.add(client);
    }

    private static DatasourceConfiguration datasource(String host, long port) {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(host);
        endpoint.setPort(port);
        DBAuth auth = new DBAuth();
        auth.setUsername("access-key");
        auth.setPassword("secret-key");
        auth.setDatabaseName("us-east-1");
        DatasourceConfiguration datasource = new DatasourceConfiguration();
        datasource.setAuthentication(auth);
        datasource.setEndpoints(List.of(endpoint));
        return datasource;
    }
}

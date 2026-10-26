package com.external.plugins;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import software.amazon.awssdk.core.client.config.SdkClientConfiguration;
import software.amazon.awssdk.core.client.config.SdkClientOption;
import software.amazon.awssdk.http.SdkHttpClient;
import software.amazon.awssdk.http.SdkHttpConfigurationOption;
import software.amazon.awssdk.http.SdkHttpService;
import software.amazon.awssdk.http.apache.ApacheHttpClient;
import software.amazon.awssdk.http.apache.ApacheSdkHttpService;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.utils.AttributeMap;

import java.io.IOException;
import java.lang.reflect.Field;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.ServiceLoader;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The HTTP client of a DynamoDB client: Apache's, on every client path, owned by the DynamoDB client so that closing
 * the DynamoDB client releases its connection pool, and keeping connections for one day only on the client the
 * connection time-to-live flag turns on.
 */
class DynamoPluginHttpClientTest {

    private MockWebServer server;

    @BeforeEach
    void startServer() throws IOException {
        server = new MockWebServer();
        for (int i = 0; i < 2; i++) {
            server.enqueue(new MockResponse()
                    .addHeader("Content-Type", "application/x-amz-json-1.0")
                    .setBody("{\"TableNames\":[\"Music\"]}"));
        }
        server.start();
    }

    @AfterEach
    void stopServer() throws IOException {
        server.shutdown();
    }

    @ParameterizedTest
    @EnumSource(DynamoClientPath.class)
    void should_shutDownConnectionPool_when_clientIsClosed(DynamoClientPath path) {
        // Given
        DynamoDbClient client = path.create(datasource()).block(Duration.ofSeconds(30));
        assertThat(client.listTables().tableNames()).containsExactly("Music");

        // When
        client.close();

        // Then
        assertThatThrownBy(client::listTables)
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Connection pool shut down");
        assertThat(server.getRequestCount()).isEqualTo(1);
    }

    @Test
    void should_keepConnectionsForOneDay_when_timeToLiveFlagIsOn() {
        // Given
        DynamoDbClient client = DynamoClientPath.FLAG_ON.create(datasource()).block(Duration.ofSeconds(30));

        // When
        Duration timeToLive;
        try {
            timeToLive = connectionTimeToLive(client);
        } finally {
            client.close();
        }

        // Then
        assertThat(timeToLive).isEqualTo(Duration.ofDays(1));
    }

    @ParameterizedTest
    @EnumSource(
            value = DynamoClientPath.class,
            names = {"WITHOUT_FLAG", "FLAG_OFF"})
    void should_setNoConnectionTimeToLive_when_timeToLiveFlagIsOffOrNotPassed(DynamoClientPath path) {
        // Given
        DynamoDbClient client = path.create(datasource()).block(Duration.ofSeconds(30));

        // When
        Duration timeToLive;
        try {
            timeToLive = connectionTimeToLive(client);
        } finally {
            client.close();
        }

        // Then
        assertThat(timeToLive).isEqualTo(Duration.ZERO);
    }

    @Test
    void should_findOnlyApacheHttpService_when_loadingSyncHttpServices() {
        // Given
        ServiceLoader<SdkHttpService> loader =
                ServiceLoader.load(SdkHttpService.class, SdkHttpService.class.getClassLoader());

        // When
        List<Class<?>> services = new ArrayList<>();
        loader.forEach(service -> services.add(service.getClass()));

        // Then
        assertThat(services).containsExactly(ApacheSdkHttpService.class);
    }

    /**
     * The connection time-to-live the client's Apache HTTP client was built with; zero means none. The SDK exposes no
     * read-back of HTTP settings, so this reads them from SDK fields through {@link #readField}.
     */
    private static Duration connectionTimeToLive(DynamoDbClient client) {
        SdkClientConfiguration configuration = (SdkClientConfiguration) readField(client, "clientConfiguration");
        SdkHttpClient httpClient = configuration.option(SdkClientOption.SYNC_HTTP_CLIENT);
        assertThat(httpClient).isInstanceOf(ApacheHttpClient.class);
        AttributeMap options = (AttributeMap) readField(httpClient, "resolvedOptions");
        return options.get(SdkHttpConfigurationOption.CONNECTION_TIME_TO_LIVE);
    }

    private static Object readField(Object target, String name) {
        for (Class<?> type = target.getClass(); type != null; type = type.getSuperclass()) {
            try {
                Field field = type.getDeclaredField(name);
                field.setAccessible(true);
                return field.get(target);
            } catch (NoSuchFieldException e) {
                // Look in the superclass.
            } catch (IllegalAccessException e) {
                throw new AssertionError("Cannot read " + type.getName() + "." + name, e);
            }
        }
        throw new AssertionError("AWS SDK internals changed: no field '" + name + "' on "
                + target.getClass().getName()
                + " or its superclasses. Re-point connectionTimeToLive/readField at the new field names;"
                + " do not delete the time-to-live tests.");
    }

    private DatasourceConfiguration datasource() {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(server.getHostName());
        endpoint.setPort((long) server.getPort());
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

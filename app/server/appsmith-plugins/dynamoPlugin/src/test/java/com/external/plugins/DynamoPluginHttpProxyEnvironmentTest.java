package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * The DynamoDB client takes no proxy settings from the environment: {@code HTTP_PROXY} is not used, and
 * {@code NO_PROXY} does not exempt hosts from a proxy set by system properties. The environment of a JVM is fixed when
 * it starts, so this test runs in its own surefire execution, {@code http-proxy-environment} in this module's pom: that
 * JVM has {@code HTTP_PROXY} pointing at a local listener on the port named by the {@value #PORT_PROPERTY} system
 * property, {@code NO_PROXY} set to {@value #NO_PROXY_HOST}, and no other proxy variables. The test is skipped in JVMs
 * that do not set that property.
 */
class DynamoPluginHttpProxyEnvironmentTest {

    private static final String PORT_PROPERTY = "dynamo.httpProxyEnvironment.port";
    private static final String NO_PROXY_HOST = "dynamodb.no-proxy-test.invalid";
    private static final String UNRESOLVABLE_REGION = "proxy-test-1";
    private static final List<String> PROXY_PROPERTIES = List.of(
            "http.proxyHost",
            "http.proxyPort",
            "http.proxyUser",
            "http.proxyPassword",
            "https.proxyHost",
            "https.proxyPort",
            "https.proxyUser",
            "https.proxyPassword",
            "http.nonProxyHosts");

    private final DynamoPlugin.DynamoPluginExecutor executor = new DynamoPlugin.DynamoPluginExecutor();
    private final Map<String, String> savedProperties = new HashMap<>();
    private ProxyListener proxy;
    private MockWebServer server;

    @BeforeEach
    void startServers() throws IOException {
        String port = System.getProperty(PORT_PROPERTY);
        assumeTrue(port != null, "runs in the http-proxy-environment surefire execution");
        assertThat(System.getenv("HTTP_PROXY")).isEqualTo("http://127.0.0.1:" + port);
        assertThat(System.getenv("NO_PROXY")).isEqualTo(NO_PROXY_HOST);
        assertThat(System.getenv()).doesNotContainKeys("HTTPS_PROXY", "https_proxy", "http_proxy", "no_proxy");
        // No proxy system properties, as on Linux; the macOS JDK presets http.nonProxyHosts.
        for (String key : PROXY_PROPERTIES) {
            savedProperties.put(key, System.getProperty(key));
            System.clearProperty(key);
        }
        proxy = new ProxyListener(Integer.parseInt(port));
        server = new MockWebServer();
        server.enqueue(new MockResponse()
                .addHeader("Content-Type", "application/x-amz-json-1.0")
                .setBody("{\"TableNames\":[\"direct\"]}"));
        server.start();
    }

    @AfterEach
    void stopServers() throws IOException {
        if (proxy == null) {
            return;
        }
        proxy.close();
        server.shutdown();
        savedProperties.forEach((key, value) -> {
            if (value == null) {
                System.clearProperty(key);
            } else {
                System.setProperty(key, value);
            }
        });
    }

    @ParameterizedTest
    @EnumSource(DynamoClientPath.class)
    void should_connectDirectly_when_httpProxyEnvironmentVariableIsSet(DynamoClientPath path) {
        // Given
        Endpoint endpoint = endpoint("localhost", server.getPort());

        // When
        ActionExecutionResult result = listTables(path, endpoint);

        // Then
        assertThat(result.getIsExecutionSuccess())
                .as(String.valueOf(result.getBody()))
                .isTrue();
        assertThat(server.getRequestCount()).isEqualTo(1);
        assertThat(proxy.requestLines()).isEmpty();
    }

    @ParameterizedTest
    @EnumSource(DynamoClientPath.class)
    void should_notTunnelThroughProxy_when_httpProxyEnvironmentVariableIsSetAndEndpointIsHttps(DynamoClientPath path) {
        // Given
        Endpoint endpoint = null;

        // When
        ActionExecutionResult result = listTables(path, endpoint);

        // Then
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(proxy.requestLines()).isEmpty();
    }

    @ParameterizedTest
    @EnumSource(DynamoClientPath.class)
    void should_sendRequestToPropertyProxy_when_noProxyEnvironmentVariableListsEndpointHost(DynamoClientPath path) {
        // Given
        System.setProperty("http.proxyHost", "127.0.0.1");
        System.setProperty("http.proxyPort", String.valueOf(proxy.port()));
        Endpoint endpoint = endpoint(NO_PROXY_HOST, 8000);

        // When
        ActionExecutionResult result = listTables(path, endpoint);

        // Then
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(proxy.requestLines()).containsExactly("POST http://" + NO_PROXY_HOST + ":8000/ HTTP/1.1");
    }

    private static Endpoint endpoint(String host, int port) {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost(host);
        endpoint.setPort((long) port);
        return endpoint;
    }

    /**
     * Runs ListTables on a client created on {@code path}. Without an endpoint the client addresses DynamoDB over https
     * in a region whose host name does not resolve.
     */
    private ActionExecutionResult listTables(DynamoClientPath path, Endpoint endpoint) {
        DBAuth auth = new DBAuth();
        auth.setUsername("access-key");
        auth.setPassword("secret-key");
        auth.setDatabaseName(endpoint == null ? UNRESOLVABLE_REGION : "us-east-1");
        DatasourceConfiguration datasource = new DatasourceConfiguration();
        datasource.setAuthentication(auth);
        if (endpoint != null) {
            datasource.setEndpoints(List.of(endpoint));
        }
        ActionConfiguration action = new ActionConfiguration();
        action.setPath("ListTables");
        DynamoDbClient client = path.create(datasource).block(Duration.ofSeconds(30));
        try {
            return executor.execute(client, datasource, action).block(Duration.ofSeconds(120));
        } finally {
            client.close();
        }
    }

    /**
     * A stand-in proxy on the port HTTP_PROXY names: records each request line and refuses it, with a DynamoDB client
     * error so that the SDK does not retry it.
     */
    private static final class ProxyListener implements AutoCloseable {

        private static final String REFUSAL_BODY =
                "{\"__type\":\"com.amazonaws.dynamodb.v20120810#ResourceNotFoundException\",\"message\":\"proxied\"}";

        private final ServerSocket server;
        private final List<String> requestLines = new CopyOnWriteArrayList<>();

        ProxyListener(int port) throws IOException {
            server = new ServerSocket(port, 50, InetAddress.getByName("127.0.0.1"));
            Thread acceptor = new Thread(this::acceptConnections, "http-proxy-environment-listener");
            acceptor.setDaemon(true);
            acceptor.start();
        }

        int port() {
            return server.getLocalPort();
        }

        List<String> requestLines() {
            return requestLines;
        }

        private void acceptConnections() {
            while (!server.isClosed()) {
                try (Socket socket = server.accept()) {
                    socket.setSoTimeout(10_000);
                    BufferedReader in = new BufferedReader(
                            new InputStreamReader(socket.getInputStream(), StandardCharsets.ISO_8859_1));
                    String requestLine = in.readLine();
                    String header;
                    while ((header = in.readLine()) != null && !header.isEmpty()) {
                        // Headers are not recorded.
                    }
                    requestLines.add(String.valueOf(requestLine));
                    byte[] body = REFUSAL_BODY.getBytes(StandardCharsets.UTF_8);
                    OutputStream out = socket.getOutputStream();
                    out.write(("HTTP/1.1 400 Bad Request\r\nContent-Type: application/x-amz-json-1.0\r\n"
                                    + "Content-Length: " + body.length + "\r\nConnection: close\r\n\r\n")
                            .getBytes(StandardCharsets.ISO_8859_1));
                    out.write(body);
                    out.flush();
                } catch (IOException e) {
                    if (server.isClosed()) {
                        return;
                    }
                }
            }
        }

        @Override
        public void close() throws IOException {
            server.close();
        }
    }
}

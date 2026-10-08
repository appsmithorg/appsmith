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
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Which proxy settings the DynamoDB client uses, on every client path: the {@code http.proxy*} system properties, for
 * every endpoint, minus the hosts in {@code http.nonProxyHosts}; the {@code https.proxy*} properties are not used.
 * Requests that are not proxied go to a local server that answers like DynamoDB; the local proxy listener records each
 * request and refuses it.
 */
class DynamoPluginProxyTest {

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
    void isolateProxyProperties() throws IOException {
        for (String key : PROXY_PROPERTIES) {
            savedProperties.put(key, System.getProperty(key));
            System.clearProperty(key);
        }
        proxy = new ProxyListener();
        server = new MockWebServer();
        server.enqueue(new MockResponse()
                .addHeader("Content-Type", "application/x-amz-json-1.0")
                .setBody("{\"TableNames\":[\"direct\"]}"));
        server.start();
    }

    @AfterEach
    void restoreProxyProperties() throws IOException {
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
    void should_sendRequestToHttpProxy_when_httpProxyPropertiesAreSet(DynamoClientPath path) {
        // Given
        useHttpProxy();

        // When
        ActionExecutionResult result = listTables(path, localEndpoint());

        // Then
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(proxy.requestLines()).containsExactly("POST http://localhost:" + server.getPort() + "/ HTTP/1.1");
        assertThat(server.getRequestCount()).isZero();
    }

    @ParameterizedTest
    @EnumSource(DynamoClientPath.class)
    void should_tunnelThroughHttpProxy_when_httpProxyPropertiesAreSetAndEndpointIsHttps(DynamoClientPath path) {
        // Given
        useHttpProxy();

        // When
        ActionExecutionResult result = listTables(path, null);

        // Then
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(proxy.requestLines())
                .isNotEmpty()
                .allMatch(("CONNECT dynamodb." + UNRESOLVABLE_REGION + ".amazonaws.com:443 HTTP/1.1")::equals);
    }

    @ParameterizedTest
    @EnumSource(DynamoClientPath.class)
    void should_connectDirectly_when_onlyHttpsProxyPropertiesAreSet(DynamoClientPath path) {
        // Given
        useHttpsProxy();

        // When
        ActionExecutionResult result = listTables(path, localEndpoint());

        // Then
        assertThat(result.getIsExecutionSuccess())
                .as(String.valueOf(result.getBody()))
                .isTrue();
        assertThat(server.getRequestCount()).isEqualTo(1);
        assertThat(proxy.requestLines()).isEmpty();
    }

    @ParameterizedTest
    @EnumSource(DynamoClientPath.class)
    void should_notUseHttpsProxy_when_onlyHttpsProxyPropertiesAreSetAndEndpointIsHttps(DynamoClientPath path) {
        // Given
        useHttpsProxy();

        // When
        ActionExecutionResult result = listTables(path, null);

        // Then
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(proxy.requestLines()).isEmpty();
    }

    @ParameterizedTest
    @EnumSource(DynamoClientPath.class)
    void should_connectDirectly_when_nonProxyHostsMatchesEndpointHost(DynamoClientPath path) {
        // Given
        useHttpProxy();
        System.setProperty("http.nonProxyHosts", "*.example.com|localhost");

        // When
        ActionExecutionResult result = listTables(path, localEndpoint());

        // Then
        assertThat(result.getIsExecutionSuccess())
                .as(String.valueOf(result.getBody()))
                .isTrue();
        assertThat(server.getRequestCount()).isEqualTo(1);
        assertThat(proxy.requestLines()).isEmpty();
    }

    @ParameterizedTest
    @EnumSource(DynamoClientPath.class)
    void should_answerProxyChallengeWithHttpProxyCredentials_when_httpProxyUserIsSet(DynamoClientPath path) {
        // Given
        useHttpProxy();
        System.setProperty("http.proxyUser", "http-user");
        System.setProperty("http.proxyPassword", "http-pass");
        System.setProperty("https.proxyUser", "https-user");
        System.setProperty("https.proxyPassword", "https-pass");
        proxy.challengeFor("http-user", "http-pass");

        // When
        ActionExecutionResult result = listTables(path, localEndpoint());

        // Then
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(proxy.credentialOutcomes()).containsExactly("expected");
    }

    private void useHttpProxy() {
        System.setProperty("http.proxyHost", "127.0.0.1");
        System.setProperty("http.proxyPort", String.valueOf(proxy.port()));
    }

    private void useHttpsProxy() {
        System.setProperty("https.proxyHost", "127.0.0.1");
        System.setProperty("https.proxyPort", String.valueOf(proxy.port()));
    }

    private Endpoint localEndpoint() {
        Endpoint endpoint = new Endpoint();
        endpoint.setHost("localhost");
        endpoint.setPort((long) server.getPort());
        return endpoint;
    }

    /**
     * Runs ListTables on a client created on {@code path} with the current proxy settings. Without an endpoint the
     * client addresses DynamoDB over https in a region whose host name does not resolve.
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
     * A stand-in proxy: records each request line and refuses it, after a 407 challenge when credentials are expected.
     * A refused request gets a DynamoDB client error, so the SDK does not retry it; a refused CONNECT gets a 502. It
     * records only whether a Proxy-Authorization header matched the expected credentials, never its value.
     */
    private static final class ProxyListener implements AutoCloseable {

        private static final String REFUSAL_BODY =
                "{\"__type\":\"com.amazonaws.dynamodb.v20120810#ResourceNotFoundException\",\"message\":\"proxied\"}";

        private final ServerSocket server;
        private final List<String> requestLines = new CopyOnWriteArrayList<>();
        private final List<String> credentialOutcomes = new CopyOnWriteArrayList<>();
        private volatile String expectedAuthorization;

        ProxyListener() throws IOException {
            server = new ServerSocket(0, 50, InetAddress.getLoopbackAddress());
            Thread acceptor = new Thread(this::acceptConnections, "proxy-test-listener");
            acceptor.setDaemon(true);
            acceptor.start();
        }

        int port() {
            return server.getLocalPort();
        }

        void challengeFor(String user, String password) {
            expectedAuthorization = "Basic "
                    + Base64.getEncoder().encodeToString((user + ":" + password).getBytes(StandardCharsets.UTF_8));
        }

        List<String> requestLines() {
            return requestLines;
        }

        List<String> credentialOutcomes() {
            return credentialOutcomes;
        }

        private void acceptConnections() {
            while (!server.isClosed()) {
                try {
                    Socket socket = server.accept();
                    Thread handler = new Thread(() -> handle(socket), "proxy-test-connection");
                    handler.setDaemon(true);
                    handler.start();
                } catch (IOException e) {
                    return;
                }
            }
        }

        private void handle(Socket socket) {
            try (socket) {
                socket.setSoTimeout(10_000);
                BufferedReader in =
                        new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.ISO_8859_1));
                OutputStream out = socket.getOutputStream();
                String requestLine;
                while ((requestLine = in.readLine()) != null && !requestLine.isEmpty()) {
                    String authorization = null;
                    int contentLength = 0;
                    String header;
                    while ((header = in.readLine()) != null && !header.isEmpty()) {
                        int colon = header.indexOf(':');
                        if (colon <= 0) {
                            continue;
                        }
                        String name = header.substring(0, colon).trim();
                        String value = header.substring(colon + 1).trim();
                        if (name.equalsIgnoreCase("Proxy-Authorization")) {
                            authorization = value;
                        } else if (name.equalsIgnoreCase("Content-Length")) {
                            contentLength = Integer.parseInt(value);
                        }
                    }
                    for (int i = 0; i < contentLength; i++) {
                        in.read();
                    }
                    requestLines.add(requestLine);
                    if (expectedAuthorization != null && authorization == null) {
                        out.write(("HTTP/1.1 407 Proxy Authentication Required\r\n"
                                        + "Proxy-Authenticate: Basic realm=\"test\"\r\nContent-Length: 0\r\n\r\n")
                                .getBytes(StandardCharsets.ISO_8859_1));
                        out.flush();
                        continue;
                    }
                    if (authorization != null) {
                        credentialOutcomes.add(authorization.equals(expectedAuthorization) ? "expected" : "unexpected");
                    }
                    if (requestLine.startsWith("CONNECT ")) {
                        out.write("HTTP/1.1 502 Bad Gateway\r\nContent-Length: 0\r\nConnection: close\r\n\r\n"
                                .getBytes(StandardCharsets.ISO_8859_1));
                    } else {
                        byte[] body = REFUSAL_BODY.getBytes(StandardCharsets.UTF_8);
                        out.write(("HTTP/1.1 400 Bad Request\r\nContent-Type: application/x-amz-json-1.0\r\n"
                                        + "Content-Length: " + body.length + "\r\nConnection: close\r\n\r\n")
                                .getBytes(StandardCharsets.ISO_8859_1));
                        out.write(body);
                    }
                    out.flush();
                    return;
                }
            } catch (IOException e) {
                // The client closed the connection; nothing more to record.
            }
        }

        @Override
        public void close() throws IOException {
            server.close();
        }
    }
}

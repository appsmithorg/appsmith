package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.utils.S3Connection;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import software.amazon.awssdk.services.s3.model.ListBucketsResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

import static com.external.plugins.S3TestFixtures.BUCKET_NAME;
import static com.external.plugins.S3TestFixtures.MINIO;
import static com.external.plugins.S3TestFixtures.action;
import static com.external.plugins.S3TestFixtures.awaitValue;
import static com.external.plugins.S3TestFixtures.md5Hex;
import static com.external.plugins.S3TestFixtures.noParams;
import static com.external.plugins.S3TestFixtures.utf8;
import static com.external.plugins.constants.FieldName.BUCKET;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.PATH;
import static com.external.plugins.constants.FieldName.READ_DATATYPE;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Which proxy the S3 client uses: the https proxy settings, for every endpoint. Requests to hosts under
 * {@value #UNRESOLVABLE_HOST} can only reach the local proxy listener, which records them and refuses them; requests
 * that are not proxied go straight to a local server that answers like S3.
 */
class AmazonS3PluginProxyTest {

    private static final String UNRESOLVABLE_HOST = "storage.proxy-test.invalid";
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

    private final AmazonS3Plugin.S3PluginExecutor executor = new AmazonS3Plugin.S3PluginExecutor();
    private final Map<String, String> savedProperties = new HashMap<>();
    private ProxyListener proxy;
    private S3WireServer server;

    @BeforeEach
    void isolateProxyProperties() throws IOException {
        for (String key : PROXY_PROPERTIES) {
            savedProperties.put(key, System.getProperty(key));
            System.clearProperty(key);
        }
        proxy = new ProxyListener();
        server = new S3WireServer();
        byte[] content = utf8("direct");
        server.respond(request -> S3WireServer.object(content, md5Hex(content)));
    }

    @AfterEach
    void restoreProxyProperties() throws IOException {
        proxy.close();
        server.close();
        savedProperties.forEach((key, value) -> {
            if (value == null) {
                System.clearProperty(key);
            } else {
                System.setProperty(key, value);
            }
        });
    }

    @Test
    void should_tunnelThroughHttpsProxy_when_endpointIsHttps() {
        // Given
        useHttpsProxy();

        // When
        ActionExecutionResult result = readFile("https://" + UNRESOLVABLE_HOST);

        // Then
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(proxy.requestLines())
                .isNotEmpty()
                .allMatch(("CONNECT " + UNRESOLVABLE_HOST + ":443 HTTP/1.1")::equals);
    }

    @Test
    void should_sendRequestToHttpsProxy_when_endpointIsHttp() {
        // Given
        useHttpsProxy();

        // When
        ActionExecutionResult result = readFile("http://" + UNRESOLVABLE_HOST);

        // Then
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(proxy.requestLines())
                .isNotEmpty()
                .allMatch(("GET http://" + UNRESOLVABLE_HOST + "/" + BUCKET_NAME + "/a.txt HTTP/1.1")::equals);
    }

    @Test
    void should_connectDirectly_when_onlyHttpProxyPropertiesAreSet() {
        // Given
        System.setProperty("http.proxyHost", "127.0.0.1");
        System.setProperty("http.proxyPort", String.valueOf(proxy.port()));

        // When
        ActionExecutionResult result = readFile(server.endpoint());

        // Then
        assertThat(result.getIsExecutionSuccess())
                .as(String.valueOf(result.getBody()))
                .isTrue();
        assertThat(server.requests()).hasSize(1);
        assertThat(proxy.requestLines()).isEmpty();
    }

    @Test
    void should_connectDirectly_when_nonProxyHostsMatchesEndpointHost() {
        // Given
        useHttpsProxy();
        System.setProperty("http.nonProxyHosts", "*.example.com|localhost");

        // When
        ActionExecutionResult result = readFile(server.endpoint());

        // Then
        assertThat(result.getIsExecutionSuccess())
                .as(String.valueOf(result.getBody()))
                .isTrue();
        assertThat(server.requests()).hasSize(1);
        assertThat(proxy.requestLines()).isEmpty();
    }

    @Test
    void should_answerProxyChallengeWithHttpsProxyCredentials_when_httpsProxyUserIsSet() {
        // Given
        useHttpsProxy();
        System.setProperty("https.proxyUser", "https-user");
        System.setProperty("https.proxyPassword", "https-pass");
        System.setProperty("http.proxyUser", "http-user");
        System.setProperty("http.proxyPassword", "http-pass");
        proxy.challengeFor("https-user", "https-pass");

        // When
        ActionExecutionResult result = readFile("https://" + UNRESOLVABLE_HOST);

        // Then
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(proxy.credentialOutcomes()).contains("expected").doesNotContain("unexpected");
    }

    /**
     * A proxy host that is not a valid URI host (common for Docker Compose service names) is used as given: the
     * request goes to it, which here fails resolving that name.
     */
    @Test
    void should_sendRequestToProxyHost_when_proxyHostContainsUnderscore() {
        // Given
        System.setProperty("https.proxyHost", "squid_proxy");
        System.setProperty("https.proxyPort", "3128");
        S3Connection connection = awaitValue(executor.datasourceCreate(datasource(server.endpoint())));

        // When
        Mono<ListBucketsResponse> result =
                Mono.fromCallable(() -> connection.client().listBuckets()).doFinally(signal -> connection.close());

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertThat(rootCause(error))
                        .isInstanceOf(UnknownHostException.class)
                        .hasMessageContaining("squid_proxy"))
                .verify(Duration.ofSeconds(60));
        assertThat(server.requests()).isEmpty();
    }

    /** Errors from datasource creation reach users, so they must not repeat a configured value. */
    @Test
    void should_failWithoutRepeatingProxyHost_when_httpsProxyHostIsAUrlWithCredentials() {
        // Given
        String secret = "s3cret-value";
        String configuredHost = "http://proxy-user:" + secret + "@proxy.example";
        System.setProperty("https.proxyHost", configuredHost);
        System.setProperty("https.proxyPort", "3128");

        // When
        Mono<S3Connection> connection = executor.datasourceCreate(datasource(server.endpoint()));

        // Then
        StepVerifier.create(connection)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithPluginException.class);
                    assertThat(((AppsmithPluginException) error).getDownstreamErrorMessage())
                            .contains("https proxy host")
                            .doesNotContain(secret)
                            .doesNotContain("proxy-user");
                    for (Throwable link = error; link != null; link = link.getCause()) {
                        assertThat(String.valueOf(link.getMessage()))
                                .doesNotContain(secret)
                                .doesNotContain(configuredHost);
                        assertThat(link.toString()).doesNotContain(secret).doesNotContain(configuredHost);
                    }
                })
                .verify(Duration.ofSeconds(30));
    }

    private void useHttpsProxy() {
        System.setProperty("https.proxyHost", "127.0.0.1");
        System.setProperty("https.proxyPort", String.valueOf(proxy.port()));
    }

    /** Reads {@code a.txt} from the bucket on a connection created with the current proxy settings. */
    private ActionExecutionResult readFile(String endpoint) {
        DatasourceConfiguration configuration = datasource(endpoint);
        S3Connection connection = awaitValue(executor.datasourceCreate(configuration));
        try {
            return awaitValue(executor.executeParameterized(
                    connection,
                    noParams(),
                    configuration,
                    action(Map.of(COMMAND, "READ_FILE", BUCKET, BUCKET_NAME, PATH, "a.txt", READ_DATATYPE, "NO"))));
        } finally {
            connection.close();
        }
    }

    private static DatasourceConfiguration datasource(String endpoint) {
        return S3TestFixtures.datasource(MINIO, endpoint, "", BUCKET_NAME);
    }

    private static Throwable rootCause(Throwable error) {
        Throwable cause = error;
        while (cause.getCause() != null) {
            cause = cause.getCause();
        }
        return cause;
    }

    /**
     * A stand-in proxy: records each request line and answers 502, or first 407 when a credentials challenge is set.
     * It records only whether a Proxy-Authorization header matched the expected credentials, never its value.
     */
    private static final class ProxyListener implements AutoCloseable {

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
                    String header;
                    while ((header = in.readLine()) != null && !header.isEmpty()) {
                        int colon = header.indexOf(':');
                        if (colon > 0 && header.substring(0, colon).trim().equalsIgnoreCase("Proxy-Authorization")) {
                            authorization = header.substring(colon + 1).trim();
                        }
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
                    out.write("HTTP/1.1 502 Bad Gateway\r\nContent-Length: 0\r\nConnection: close\r\n\r\n"
                            .getBytes(StandardCharsets.ISO_8859_1));
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

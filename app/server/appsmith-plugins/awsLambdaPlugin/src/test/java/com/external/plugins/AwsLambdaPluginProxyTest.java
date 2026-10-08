package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.external.plugins.AwsHttpsProxyConfiguration.HttpsProxy;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.ListFunctionsResponse;

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
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.UnaryOperator;
import java.util.stream.Stream;

import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;

/**
 * Which proxy the Lambda client uses. The region {@value #REGION} has no Lambda endpoint, so a request that is not
 * sent to a proxy fails at DNS lookup of {@value #LAMBDA_HOST} and never reaches AWS, while a proxied request only
 * reaches the local listener. The tests that expect a direct attempt therefore depend on DNS answering promptly.
 */
class AwsLambdaPluginProxyTest {

    private static final String REGION = "zz-proxytest-1";
    private static final String LAMBDA_HOST = "lambda." + REGION + ".amazonaws.com";
    private static final String CONNECT_LINE = "CONNECT " + LAMBDA_HOST + ":443 HTTP/1.1";
    private static final UnaryOperator<String> NOTHING_SET = name -> null;
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

    private final AwsLambdaPlugin.AwsLambdaPluginExecutor pluginExecutor =
            new AwsLambdaPlugin.AwsLambdaPluginExecutor();
    private final Map<String, String> savedProperties = new HashMap<>();
    private ProxyListener proxy;

    @BeforeEach
    void isolateProxyProperties() throws IOException {
        for (String key : PROXY_PROPERTIES) {
            savedProperties.put(key, System.getProperty(key));
            System.clearProperty(key);
        }
        proxy = new ProxyListener();
    }

    @AfterEach
    void restoreProxyProperties() throws IOException {
        proxy.close();
        savedProperties.forEach((key, value) -> {
            if (value == null) {
                System.clearProperty(key);
            } else {
                System.setProperty(key, value);
            }
        });
    }

    @Test
    void should_tunnelThroughProxy_when_httpsProxyPropertiesAreSet() {
        // Given
        System.setProperty("https.proxyHost", "127.0.0.1");
        System.setProperty("https.proxyPort", String.valueOf(proxy.port()));

        // When
        Mono<ActionExecutionResult> result = listFunctions();

        // Then
        StepVerifier.create(result).expectError().verify(Duration.ofSeconds(60));
        assertThat(proxy.requestLines()).isNotEmpty().allMatch(CONNECT_LINE::equals);
    }

    @Test
    void should_connectDirectly_when_onlyHttpProxyPropertiesAreSet() {
        // Given
        System.setProperty("http.proxyHost", "127.0.0.1");
        System.setProperty("http.proxyPort", String.valueOf(proxy.port()));

        // When
        Mono<ListFunctionsResponse> result = listFunctionsWithCreatedClient();

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertThat(rootCause(error))
                        .isInstanceOf(UnknownHostException.class)
                        .hasMessageContaining(LAMBDA_HOST))
                .verify(Duration.ofSeconds(60));
        assertThat(proxy.requestLines()).isEmpty();
    }

    @Test
    void should_connectDirectly_when_nonProxyHostsMatchesLambdaHost() {
        // Given
        System.setProperty("https.proxyHost", "127.0.0.1");
        System.setProperty("https.proxyPort", String.valueOf(proxy.port()));
        System.setProperty("http.nonProxyHosts", "localhost|*.amazonaws.com");

        // When
        Mono<ListFunctionsResponse> result = listFunctionsWithCreatedClient();

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertThat(rootCause(error))
                        .isInstanceOf(UnknownHostException.class)
                        .hasMessageContaining(LAMBDA_HOST))
                .verify(Duration.ofSeconds(60));
        assertThat(proxy.requestLines()).isEmpty();
    }

    @Test
    void should_answerProxyChallengeWithHttpsProxyCredentials_when_httpsProxyUserIsSet() {
        // Given
        System.setProperty("https.proxyHost", "127.0.0.1");
        System.setProperty("https.proxyPort", String.valueOf(proxy.port()));
        System.setProperty("https.proxyUser", "https-user");
        System.setProperty("https.proxyPassword", "https-pass");
        System.setProperty("http.proxyUser", "http-user");
        System.setProperty("http.proxyPassword", "http-pass");
        proxy.challengeFor("https-user", "https-pass");

        // When
        Mono<ActionExecutionResult> result = listFunctions();

        // Then
        StepVerifier.create(result).expectError().verify(Duration.ofSeconds(60));
        assertThat(proxy.credentialOutcomes()).contains("expected").doesNotContain("unexpected");
    }

    /**
     * A proxy host that is not a valid URI host (common for Docker Compose service names) is used as given: the
     * request goes to it, which here fails resolving that name rather than the Lambda host.
     */
    @Test
    void should_sendRequestToProxyHost_when_proxyHostContainsUnderscore() {
        // Given
        System.setProperty("https.proxyHost", "squid_proxy");
        System.setProperty("https.proxyPort", "3128");

        // When
        Mono<ListFunctionsResponse> result = listFunctionsWithCreatedClient();

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertThat(rootCause(error))
                        .isInstanceOf(UnknownHostException.class)
                        .hasMessageContaining("squid_proxy")
                        .hasMessageNotContaining(LAMBDA_HOST))
                .verify(Duration.ofSeconds(60));
    }

    /** Errors from client creation reach users, so they must not repeat a configured value. */
    @Test
    void should_rejectProxyHostWithoutRepeatingIt_when_httpsProxyHostIsAUrlWithCredentials() {
        // Given
        String secret = "s3cret-value";
        String configuredHost = "http://proxy-user:" + secret + "@proxy.example";
        System.setProperty("https.proxyHost", configuredHost);
        System.setProperty("https.proxyPort", "3128");

        // When
        Mono<LambdaClient> client = pluginExecutor.datasourceCreate(datasourceConfiguration());

        // Then
        StepVerifier.create(client)
                .expectErrorSatisfies(error -> {
                    assertThat(error)
                            .isInstanceOf(IllegalArgumentException.class)
                            .hasMessage(AwsHttpsProxyConfiguration.INVALID_PROXY_HOST_MESSAGE);
                    for (Throwable link = error; link != null; link = link.getCause()) {
                        assertThat(String.valueOf(link.getMessage()))
                                .doesNotContain(secret)
                                .doesNotContain(configuredHost);
                        assertThat(link.toString()).doesNotContain(secret).doesNotContain(configuredHost);
                    }
                })
                .verify(Duration.ofSeconds(30));
    }

    @ParameterizedTest
    @MethodSource("environmentOnlySettings")
    void should_resolveProxyFromHttpsSettings_when_onlyEnvironmentVariablesAreSet(
            Map<String, String> environment, String expectedHost, int expectedPort) {
        // Given
        UnaryOperator<String> environmentLookup = environment::get;

        // When
        HttpsProxy proxy = AwsHttpsProxyConfiguration.resolve(NOTHING_SET, environmentLookup);

        // Then
        assertThat(proxy.host()).isEqualTo(expectedHost);
        assertThat(proxy.port()).isEqualTo(expectedPort);
    }

    static Stream<Arguments> environmentOnlySettings() {
        return Stream.of(
                Arguments.of(Map.of("HTTPS_PROXY", "http://proxy.example:3128"), "proxy.example", 3128),
                Arguments.of(Map.of("https_proxy", "http://proxy.example:3128"), "proxy.example", 3128),
                Arguments.of(Map.of("HTTPS_PROXY", " http://proxy.example:3128 "), "proxy.example", 3128),
                Arguments.of(Map.of("HTTPS_PROXY", "http://squid_proxy:3128"), "squid_proxy", 3128));
    }

    /** No proxy is taken from an unusable HTTPS_PROXY; the helper logs a warning without the value instead. */
    @ParameterizedTest
    @ValueSource(strings = {"socks5://proxy.example:1080", "http://proxy.example", "proxy.example:3128"})
    void should_useNoProxy_when_httpsProxyEnvironmentVariableIsUnusable(String value) {
        // Given
        UnaryOperator<String> environment = name -> "HTTPS_PROXY".equals(name) ? value : null;
        AtomicReference<HttpsProxy> resolved = new AtomicReference<>();

        // When
        Throwable thrown =
                catchThrowable(() -> resolved.set(AwsHttpsProxyConfiguration.resolve(NOTHING_SET, environment)));

        // Then
        assertThat(thrown).isNull();
        assertThat(resolved.get()).isNull();
    }

    @ParameterizedTest
    @MethodSource("settingsWithoutHttpsProxy")
    void should_useNoProxy_when_noHttpsProxyIsConfigured(
            Map<String, String> properties, Map<String, String> environment) {
        // Given
        UnaryOperator<String> propertyLookup = properties::get;
        UnaryOperator<String> environmentLookup = environment::get;

        // When
        HttpsProxy proxy = AwsHttpsProxyConfiguration.resolve(propertyLookup, environmentLookup);

        // Then
        assertThat(proxy).isNull();
    }

    static Stream<Arguments> settingsWithoutHttpsProxy() {
        return Stream.of(
                Arguments.of(Map.of(), Map.of()),
                Arguments.of(Map.of(), Map.of("HTTP_PROXY", "http://proxy.example:3128")),
                Arguments.of(Map.of("http.proxyHost", "proxy.example", "http.proxyPort", "3128"), Map.of()));
    }

    @Test
    void should_useUnderscoreProxyHost_when_setAsHttpsProxyHostProperty() {
        // Given
        Map<String, String> properties = Map.of("https.proxyHost", "squid_proxy", "https.proxyPort", "3128");

        // When
        HttpsProxy proxy = AwsHttpsProxyConfiguration.resolve(properties::get, NOTHING_SET);

        // Then
        assertThat(proxy.host()).isEqualTo("squid_proxy");
        assertThat(proxy.port()).isEqualTo(3128);
    }

    @Test
    void should_preferHttpsProxyProperties_when_environmentVariableIsAlsoSet() {
        // Given
        Map<String, String> properties = Map.of("https.proxyHost", "property.example", "https.proxyPort", "8080");
        Map<String, String> environment = Map.of("HTTPS_PROXY", "http://env-user:env-pass@env.example:3128");

        // When
        HttpsProxy proxy = AwsHttpsProxyConfiguration.resolve(properties::get, environment::get);

        // Then
        assertThat(proxy.host()).isEqualTo("property.example");
        assertThat(proxy.port()).isEqualTo(8080);
        assertThat(proxy.username()).isEqualTo("env-user");
        assertThat(proxy.password()).isEqualTo("env-pass");
    }

    @Test
    void should_useNoProxyEnvironmentVariable_when_nonProxyHostsPropertyIsUnset() {
        // Given
        Map<String, String> environment =
                Map.of("HTTPS_PROXY", "http://proxy.example:3128", "NO_PROXY", "localhost,*.AmazonAWS.com");

        // When
        HttpsProxy proxy = AwsHttpsProxyConfiguration.resolve(NOTHING_SET, environment::get);

        // Then
        assertThat(proxy.nonProxyHostPatterns()).isEqualTo(Set.of("localhost", ".*?.amazonaws.com"));
    }

    @Test
    void should_ignoreNoProxyEnvironmentVariable_when_nonProxyHostsPropertyIsSet() {
        // Given
        Map<String, String> properties = Map.of("http.nonProxyHosts", "internal.example");
        Map<String, String> environment =
                Map.of("HTTPS_PROXY", "http://proxy.example:3128", "NO_PROXY", "*.amazonaws.com");

        // When
        HttpsProxy proxy = AwsHttpsProxyConfiguration.resolve(properties::get, environment::get);

        // Then
        assertThat(proxy.nonProxyHostPatterns()).isEqualTo(Set.of("internal.example"));
    }

    @Test
    void should_notShowConfiguredValues_when_resolvedProxyIsPrinted() {
        // Given
        Map<String, String> environment = Map.of("HTTPS_PROXY", "http://env-user:s3cret-value@env.example:3128");

        // When
        HttpsProxy proxy = AwsHttpsProxyConfiguration.resolve(NOTHING_SET, environment::get);

        // Then
        assertThat(proxy.toString()).doesNotContain("s3cret-value").doesNotContain("env.example");
    }

    private Mono<ActionExecutionResult> listFunctions() {
        Map<String, Object> formData = new HashMap<>();
        setDataValueSafelyInFormData(formData, "command", "LIST_FUNCTIONS");
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);
        DatasourceConfiguration datasourceConfiguration = datasourceConfiguration();
        return pluginExecutor.datasourceCreate(datasourceConfiguration).flatMap(client -> pluginExecutor
                .execute(client, datasourceConfiguration, actionConfiguration)
                .doFinally(signal -> client.close()));
    }

    /** ListFunctions on the client built by datasourceCreate, so the SDK's own exception chain is kept. */
    private Mono<ListFunctionsResponse> listFunctionsWithCreatedClient() {
        return pluginExecutor.datasourceCreate(datasourceConfiguration()).map(client -> {
            try (client) {
                return client.listFunctions();
            }
        });
    }

    private static Throwable rootCause(Throwable error) {
        Throwable cause = error;
        while (cause.getCause() != null) {
            cause = cause.getCause();
        }
        return cause;
    }

    private static DatasourceConfiguration datasourceConfiguration() {
        DBAuth authentication = new DBAuth();
        authentication.setAuthenticationType("accessKey");
        authentication.setUsername("test-access-key");
        authentication.setPassword("test-secret-key");
        DatasourceConfiguration configuration = new DatasourceConfiguration();
        configuration.setAuthentication(authentication);
        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null); // index 0 is not used.
        properties.add(new Property("region", REGION));
        configuration.setProperties(properties);
        return configuration;
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

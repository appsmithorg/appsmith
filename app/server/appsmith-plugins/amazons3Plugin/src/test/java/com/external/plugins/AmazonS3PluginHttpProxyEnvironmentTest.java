package com.external.plugins;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.utils.S3Connection;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

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
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * The S3 client takes no proxy from the {@code HTTP_PROXY} environment variable. The environment of a JVM is fixed
 * when it starts, so this test runs in its own surefire execution, {@code http-proxy-environment} in this module's
 * pom: that JVM has {@code HTTP_PROXY} pointing at a local listener on the port named by the {@value #PORT_PROPERTY}
 * system property, and no https proxy settings. The test is skipped in JVMs that do not set that property.
 */
class AmazonS3PluginHttpProxyEnvironmentTest {

    private static final String PORT_PROPERTY = "s3.httpProxyEnvironment.port";

    @Test
    void should_connectDirectly_when_onlyHttpProxyEnvironmentVariableIsSet() throws IOException {
        // Given
        String port = System.getProperty(PORT_PROPERTY);
        assumeTrue(port != null, "runs in the http-proxy-environment surefire execution");
        assertThat(System.getenv("HTTP_PROXY")).isEqualTo("http://127.0.0.1:" + port);
        assertThat(System.getenv()).doesNotContainKeys("HTTPS_PROXY", "https_proxy", "NO_PROXY", "no_proxy");
        assertThat(System.getProperty("https.proxyHost")).isNull();
        assertThat(System.getProperty("http.proxyHost")).isNull();
        AtomicInteger proxyConnections = new AtomicInteger();
        byte[] content = utf8("direct");
        try (ServerSocket proxy = listen(Integer.parseInt(port), proxyConnections);
                S3WireServer server = new S3WireServer()) {
            server.respond(request -> S3WireServer.object(content, md5Hex(content)));
            AmazonS3Plugin.S3PluginExecutor executor = new AmazonS3Plugin.S3PluginExecutor();
            DatasourceConfiguration configuration =
                    S3TestFixtures.datasource(MINIO, "http://direct-target." + server.hostAndPort(), "", BUCKET_NAME);
            S3Connection connection = awaitValue(executor.datasourceCreate(configuration));

            // When
            ActionExecutionResult result;
            try {
                result = awaitValue(executor.executeParameterized(
                        connection,
                        noParams(),
                        configuration,
                        action(Map.of(COMMAND, "READ_FILE", BUCKET, BUCKET_NAME, PATH, "a.txt", READ_DATATYPE, "NO"))));
            } finally {
                connection.close();
            }

            // Then
            assertThat(result.getIsExecutionSuccess())
                    .as(String.valueOf(result.getBody()))
                    .isTrue();
            assertThat(((Map<?, ?>) result.getBody()).get("fileData")).isEqualTo("direct");
            assertThat(server.requests()).hasSize(1);
            assertThat(proxyConnections).hasValue(0);
        }
    }

    /** A listener that counts and closes every connection it accepts, so a proxied request fails. */
    private static ServerSocket listen(int port, AtomicInteger connections) throws IOException {
        ServerSocket listener = new ServerSocket(port, 50, InetAddress.getByName("127.0.0.1"));
        Thread acceptor = new Thread(
                () -> {
                    while (!listener.isClosed()) {
                        try (Socket socket = listener.accept()) {
                            connections.incrementAndGet();
                        } catch (IOException e) {
                            return;
                        }
                    }
                },
                "http-proxy-environment-listener");
        acceptor.setDaemon(true);
        acceptor.start();
        return listener;
    }
}

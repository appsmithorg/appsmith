package com.external.plugins;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.utils.S3Connection;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.Map;

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
 * pom: that JVM has {@code HTTP_PROXY} pointing at the loopback port named by the {@value #PORT_PROPERTY} system
 * property, and no https proxy settings. The test opens no listener on that port, so a request sent to the proxy never
 * reaches the S3 server. The test is skipped in JVMs that do not set that property.
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
        byte[] content = utf8("direct");
        try (S3WireServer server = wireServerNotOn(port)) {
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
        }
    }

    /**
     * A wire server on any port but {@code proxyPort}; on that port, a proxied request would reach the S3 server. The
     * proxy port is free, so a server can land on it. If one does, a second server is started while the first still
     * holds that port, so the second gets a different port, and the first is closed.
     */
    private static S3WireServer wireServerNotOn(String proxyPort) throws IOException {
        S3WireServer server = new S3WireServer();
        if (!server.hostAndPort().equals("localhost:" + proxyPort)) {
            return server;
        }
        try (server) {
            return new S3WireServer();
        }
    }
}

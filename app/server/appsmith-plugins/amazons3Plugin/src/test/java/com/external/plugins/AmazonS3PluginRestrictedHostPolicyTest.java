package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.util.RestrictedHostFilter;
import com.external.utils.S3Connection;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import reactor.test.StepVerifier;

import java.net.UnknownHostException;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import static com.external.plugins.S3TestFixtures.BUCKET_NAME;
import static com.external.plugins.S3TestFixtures.GCS;
import static com.external.plugins.S3TestFixtures.MINIO;
import static com.external.plugins.S3TestFixtures.OTHER;
import static com.external.plugins.S3TestFixtures.awaitValue;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The restricted host policy on the endpoint of every S3 provider other than Amazon: a datasource whose endpoint host the
 * policy blocks is not created or tested, and a connection refuses to connect when its host resolves to a blocked
 * address at connect time.
 */
@DisplayName("GHSA-87p7-fqr2-4grw")
class AmazonS3PluginRestrictedHostPolicyTest {

    private static final Duration CALL_TIMEOUT = Duration.ofSeconds(60);

    private static TestTls tls;

    private final AmazonS3Plugin.S3PluginExecutor executor = new AmazonS3Plugin.S3PluginExecutor();
    private final List<S3Connection> connections = new ArrayList<>();
    private final List<S3WireServer> servers = new ArrayList<>();

    @BeforeAll
    static void enableRestrictedHostPolicy() throws Exception {
        tls = TestTls.generate(Path.of("target", "restricted-host-tls")).trustInThisJvm();
        RestrictedHostFilter.setSsrfFilterDisabledForTesting(false);
    }

    @AfterAll
    static void restoreRestrictedHostPolicy() {
        RestrictedHostFilter.resetSsrfFilterDisabledForTesting();
        tls.close();
    }

    @AfterEach
    void cleanUp() throws Exception {
        RestrictedHostFilter.clearAlwaysAllowedHostsForTesting();
        RestrictedHostFilter.setOwnHostsForTesting();
        connections.forEach(executor::datasourceDestroy);
        for (S3WireServer server : servers) {
            server.close();
        }
    }

    @ParameterizedTest(name = "{0}")
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_rejectDatasource_when_endpointHostIsBlocked(String provider) throws Exception {
        // Given
        S3WireServer server = startServer(false);

        // When
        StepVerifier.create(executor.datasourceCreate(datasource(provider, server.endpoint())))
                // Then
                .expectErrorSatisfies(error -> assertThat(error)
                        .isInstanceOf(AppsmithPluginException.class)
                        .hasMessage(RestrictedHostFilter.HOST_NOT_ALLOWED))
                .verify(CALL_TIMEOUT);
        assertThat(server.requests()).isEmpty();
    }

    @ParameterizedTest(name = "{0}")
    @CsvSource({
        "upcloud, storage.de-fra1.upcloudobjects.com",
        "wasabi, s3.eu-central-1.wasabisys.com",
        "digital-ocean-spaces, fra1.digitaloceanspaces.com",
        "dream-objects, objects-us-east-1.dream.io"
    })
    void should_rejectDatasource_when_namedProviderEndpointHostIsBlocked(String provider, String endpoint) {
        // Given
        RestrictedHostFilter.setOwnHostsForTesting(endpoint);

        // When
        StepVerifier.create(executor.datasourceCreate(datasource(provider, endpoint)))
                // Then
                .expectErrorSatisfies(error -> assertThat(error)
                        .isInstanceOf(AppsmithPluginException.class)
                        .hasMessage(RestrictedHostFilter.HOST_NOT_ALLOWED))
                .verify(CALL_TIMEOUT);
    }

    @ParameterizedTest(name = "{0}")
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_reportHostNotAllowed_when_testingDatasourceWithBlockedEndpointHost(String provider) throws Exception {
        // Given
        S3WireServer server = startServer(false);
        server.respond(request -> S3WireServer.listBuckets(List.of(BUCKET_NAME)));

        // When
        DatasourceTestResult result = awaitValue(executor.testDatasource(datasource(provider, server.endpoint())));

        // Then
        assertThat(result.getInvalids()).containsExactly(RestrictedHostFilter.HOST_NOT_ALLOWED);
        assertThat(server.requests()).isEmpty();
    }

    @ParameterizedTest(name = "{0} over https={1}")
    @CsvSource({"minio, false", "other, false", "minio, true", "other, true"})
    void should_refuseToConnect_when_endpointHostResolvesToBlockedAddressAtConnectTime(String provider, boolean https)
            throws Exception {
        // Given
        S3WireServer server = startServer(https);
        server.respond(request -> S3WireServer.listBuckets(List.of(BUCKET_NAME)));
        RestrictedHostFilter.setAlwaysAllowedHostsForTesting("localhost");
        S3Connection connection = awaitValue(executor.datasourceCreate(datasource(provider, server.endpoint())));
        connections.add(connection);
        RestrictedHostFilter.clearAlwaysAllowedHostsForTesting();

        // When / Then
        assertThatThrownBy(() -> connection.client().listBuckets())
                .rootCause()
                .isInstanceOf(UnknownHostException.class)
                .hasMessage(RestrictedHostFilter.HOST_NOT_ALLOWED);
        assertThat(server.requests()).isEmpty();
    }

    @ParameterizedTest(name = "{0}")
    @CsvSource({"minio, http://10.20.30.40:9000", "other, https://203.0.113.10", "google-cloud-storage, 192.0.2.10"})
    void should_createConnection_when_endpointHostIsAllowed(String provider, String endpoint) {
        // When
        S3Connection connection = awaitValue(executor.datasourceCreate(datasource(provider, endpoint)));
        connections.add(connection);

        // Then
        assertThat(connection).isNotNull();
    }

    private S3WireServer startServer(boolean https) throws Exception {
        S3WireServer server = new S3WireServer(https ? tls.serverSocketFactory() : null);
        servers.add(server);
        return server;
    }

    private static DatasourceConfiguration datasource(String provider, String endpoint) {
        String region = OTHER.equals(provider) ? "eu-west-3" : "";
        return S3TestFixtures.datasource(provider, endpoint, region, BUCKET_NAME);
    }
}

package com.external.plugins;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.external.plugins.S3WireServer.Request;
import com.external.utils.S3Connection;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.external.plugins.S3TestFixtures.BUCKET_NAME;
import static com.external.plugins.S3TestFixtures.GCS;
import static com.external.plugins.S3TestFixtures.MINIO;
import static com.external.plugins.S3TestFixtures.OTHER;
import static com.external.plugins.S3TestFixtures.action;
import static com.external.plugins.S3TestFixtures.assertBulkDeleteChecksums;
import static com.external.plugins.S3TestFixtures.awaitValue;
import static com.external.plugins.S3TestFixtures.md5Base64;
import static com.external.plugins.S3TestFixtures.md5Hex;
import static com.external.plugins.S3TestFixtures.noParams;
import static com.external.plugins.S3TestFixtures.utf8;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.BUCKET;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.CREATE_DATATYPE;
import static com.external.plugins.constants.FieldName.PATH;
import static com.external.plugins.constants.FieldName.READ_DATATYPE;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * The requests the plugin sends over TLS, which is how Google Cloud Storage and most hosted providers are reached. Over
 * TLS the payload is not signed: uploads carry a plain body with {@code x-amz-content-sha256: UNSIGNED-PAYLOAD}, never
 * aws-chunked framing or checksum trailers, which some S3-compatible servers reject.
 */
class AmazonS3PluginHttpsWireTest {

    private static TestTls tls;

    private final AmazonS3Plugin.S3PluginExecutor executor = new AmazonS3Plugin.S3PluginExecutor();
    private final List<S3Connection> connections = new ArrayList<>();
    private S3WireServer server;

    @BeforeAll
    static void createTlsIdentity() throws Exception {
        tls = TestTls.generate(Path.of("target", "wire-tls")).trustInThisJvm();
    }

    @AfterAll
    static void restoreTrustStore() {
        tls.close();
    }

    @BeforeEach
    void startServer() throws Exception {
        server = new S3WireServer(tls.serverSocketFactory());
    }

    @AfterEach
    void stopServer() throws Exception {
        connections.forEach(executor::datasourceDestroy);
        server.close();
    }

    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_putPlainBodyWithUnsignedPayload_when_uploadingOverTls(String provider) {
        // Given
        server.respond(S3WireServer::putOk);

        // When
        ActionExecutionResult result = execute(
                provider,
                Map.of(
                        COMMAND, "UPLOAD_FILE_FROM_BODY",
                        BUCKET, BUCKET_NAME,
                        PATH, "dir/hello.txt",
                        CREATE_DATATYPE, "NO",
                        BODY, "{\"type\": \"text/plain\", \"data\": \"hello over tls\"}"));

        // Then
        List<Request> requests = server.requests();
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(requests).hasSize(1);
        assertPlainUnsignedPut(requests.get(0), utf8("hello over tls"));
        assertThat(requests.get(0).header("Content-Type")).isEqualTo("text/plain");
    }

    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_putEmptyPlainBody_when_uploadingEmptyDataOverTls(String provider) {
        // Given
        server.respond(S3WireServer::putOk);

        // When
        ActionExecutionResult result = execute(
                provider,
                Map.of(
                        COMMAND, "UPLOAD_FILE_FROM_BODY",
                        BUCKET, BUCKET_NAME,
                        PATH, "empty.txt",
                        CREATE_DATATYPE, "NO",
                        BODY, "{\"data\": \"\"}"));

        // Then
        List<Request> requests = server.requests();
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(requests).hasSize(1);
        assertPlainUnsignedPut(requests.get(0), new byte[0]);
    }

    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_getObjectOverTls_when_readingFile(String provider) {
        // Given
        byte[] content = utf8("over tls");
        server.respond(request -> S3WireServer.object(content, md5Hex(content)));

        // When
        ActionExecutionResult result = execute(
                provider, Map.of(COMMAND, "READ_FILE", BUCKET, BUCKET_NAME, PATH, "read.txt", READ_DATATYPE, "NO"));

        // Then
        List<Request> requests = server.requests();
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(((Map<?, ?>) result.getBody()).get("fileData")).isEqualTo("over tls");
        assertThat(requests).hasSize(1);
        assertThat(requests.get(0).method()).isEqualTo("GET");
        assertNoFlexibleChecksumHeaders(requests.get(0));
    }

    @ParameterizedTest
    @ValueSource(strings = {MINIO, OTHER})
    void should_sendBulkDeleteWithContentMd5AndCrc32Header_when_deletingMultipleFilesOverTls(String provider) {
        // Given
        server.respond(request -> S3WireServer.deleteResult(S3WireServer.deleteKeys(request), List.of()));

        // When
        ActionExecutionResult result = execute(
                provider,
                Map.of(COMMAND, "DELETE_MULTIPLE_FILES", BUCKET, BUCKET_NAME, PATH, "[\"a.txt\", \"b.txt\"]"));

        // Then
        List<Request> requests = server.requests();
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(requests).hasSize(1);
        Request delete = requests.get(0);
        assertThat(delete.method()).isEqualTo("POST");
        assertThat(delete.query()).containsOnlyKeys("delete");
        assertBulkDeleteChecksums(delete);
    }

    @Test
    void should_sendOneDeletePerKey_when_deletingMultipleFilesOnGoogleCloudStorageOverTls() {
        // Given
        server.respond(request -> S3WireServer.noContent());

        // When
        ActionExecutionResult result = execute(
                GCS, Map.of(COMMAND, "DELETE_MULTIPLE_FILES", BUCKET, BUCKET_NAME, PATH, "[\"a.txt\", \"b.txt\"]"));

        // Then
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(server.requests()).extracting(Request::method).containsExactly("DELETE", "DELETE");
    }

    private void assertPlainUnsignedPut(Request put, byte[] payload) {
        assertThat(put.method()).isEqualTo("PUT");
        assertThat(put.rawBody()).isEqualTo(payload);
        assertThat(put.header("x-amz-content-sha256")).isEqualTo("UNSIGNED-PAYLOAD");
        assertThat(put.header("Content-Encoding")).isNull();
        assertThat(put.header("Content-Length")).isEqualTo(String.valueOf(payload.length));
        assertThat(put.httpChunkSizes()).isEmpty();
        assertThat(put.header("Content-MD5")).isEqualTo(md5Base64(payload));
        assertNoFlexibleChecksumHeaders(put);
    }

    private static void assertNoFlexibleChecksumHeaders(Request request) {
        assertThat(request.headers().keySet())
                .noneMatch(name -> name.startsWith("x-amz-checksum-"))
                .doesNotContain("x-amz-sdk-checksum-algorithm", "x-amz-trailer", "x-amz-decoded-content-length");
    }

    private DatasourceConfiguration datasource(String provider) {
        String region = provider.equals(OTHER) ? "eu-west-3" : "";
        return S3TestFixtures.datasource(provider, server.endpoint(), region, BUCKET_NAME);
    }

    private ActionExecutionResult execute(String provider, Map<String, Object> fields) {
        S3Connection connection = awaitValue(executor.datasourceCreate(datasource(provider)));
        connections.add(connection);
        return awaitValue(executor.executeParameterized(connection, noParams(), datasource(provider), action(fields)));
    }
}

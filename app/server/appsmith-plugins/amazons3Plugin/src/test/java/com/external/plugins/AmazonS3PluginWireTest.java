package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.exceptions.pluginExceptions.StaleConnectionException;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.external.plugins.S3WireServer.Request;
import com.external.utils.S3Connection;
import com.fasterxml.jackson.databind.JsonNode;
import mockwebserver3.MockResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static com.external.plugins.S3TestFixtures.BUCKET_NAME;
import static com.external.plugins.S3TestFixtures.GCS;
import static com.external.plugins.S3TestFixtures.MAPPER;
import static com.external.plugins.S3TestFixtures.MINIO;
import static com.external.plugins.S3TestFixtures.OTHER;
import static com.external.plugins.S3TestFixtures.action;
import static com.external.plugins.S3TestFixtures.allByteValues;
import static com.external.plugins.S3TestFixtures.assertBulkDeleteChecksums;
import static com.external.plugins.S3TestFixtures.awaitValue;
import static com.external.plugins.S3TestFixtures.md5Base64;
import static com.external.plugins.S3TestFixtures.md5Hex;
import static com.external.plugins.S3TestFixtures.noParams;
import static com.external.plugins.S3TestFixtures.queryParameters;
import static com.external.plugins.S3TestFixtures.utf8;
import static com.external.plugins.constants.FieldName.BODY;
import static com.external.plugins.constants.FieldName.BUCKET;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.CREATE_DATATYPE;
import static com.external.plugins.constants.FieldName.CREATE_EXPIRY;
import static com.external.plugins.constants.FieldName.LIST_EXPIRY;
import static com.external.plugins.constants.FieldName.LIST_PREFIX;
import static com.external.plugins.constants.FieldName.LIST_SIGNED_URL;
import static com.external.plugins.constants.FieldName.LIST_UNSIGNED_URL;
import static com.external.plugins.constants.FieldName.PATH;
import static com.external.plugins.constants.FieldName.READ_DATATYPE;
import static com.external.plugins.exceptions.S3ErrorMessages.FILE_CANNOT_BE_DELETED_ERROR_MSG;
import static com.external.plugins.exceptions.S3ErrorMessages.INCORRECT_S3_ENDPOINT_URL_ERROR_MSG;
import static com.external.plugins.exceptions.S3ErrorMessages.INVALID_REGION_ERROR_MSG;
import static com.external.plugins.exceptions.S3ErrorMessages.LIST_OF_BUCKET_FETCHING_ERROR_MSG;
import static com.external.plugins.exceptions.S3ErrorMessages.NON_EXITED_BUCKET_ERROR_MSG;
import static com.external.plugins.exceptions.S3ErrorMessages.QUERY_EXECUTION_FAILED_ERROR_MSG;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Drives every plugin command with a real client against a local server that answers like S3, for the providers whose
 * endpoint is free-form (MinIO, Google Cloud Storage, other). Pins what goes on the wire (method, addressing, path,
 * query, the headers that S3-compatible servers are sensitive to, the payload) and the plugin-level result, including
 * the user-visible error text. Virtual-hosted requests for {@code <bucket>.localhost} reach the server through {@link
 * LoopbackSubdomainResolverProvider}.
 */
class AmazonS3PluginWireTest {

    private static final String DOTTED_BUCKET_NAME = "my.dotted.bucket";

    private static final Map<String, String> REGIONS = Map.of(MINIO, "", GCS, "", OTHER, "eu-west-3");
    private static final Map<String, String> SIGNING_REGIONS =
            Map.of(MINIO, "us-east-1", GCS, "auto", OTHER, "eu-west-3");

    private static final DateTimeFormatter AMZ_DATE =
            DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'").withZone(ZoneOffset.UTC);

    private final AmazonS3Plugin.S3PluginExecutor executor = new AmazonS3Plugin.S3PluginExecutor();
    private final List<S3Connection> connections = new ArrayList<>();
    private S3WireServer server;

    @BeforeEach
    void startServer() throws IOException {
        server = new S3WireServer();
    }

    @AfterEach
    void stopServer() throws IOException {
        connections.forEach(executor::datasourceDestroy);
        server.close();
    }

    // ----- LIST -----

    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_requestNextPageWithLastKeyAsMarker_when_listResponseIsTruncatedWithoutNextMarker(String provider) {
        // Given
        server.respond(request -> request.query().containsKey("marker")
                ? S3WireServer.listPage(request, BUCKET_NAME, List.of("z.txt"), false)
                : S3WireServer.listPage(request, BUCKET_NAME, List.of("a.txt", "dir/b c.txt"), true));

        // When
        ActionExecutionResult result = execute(
                provider,
                Map.of(
                        COMMAND,
                        "LIST",
                        BUCKET,
                        BUCKET_NAME,
                        LIST_PREFIX,
                        "",
                        LIST_SIGNED_URL,
                        "NO",
                        LIST_UNSIGNED_URL,
                        "YES"));

        // Then
        List<Request> requests = server.requests();
        assertThat(requests).hasSize(2);
        assertThat(requests).allSatisfy(request -> {
            assertThat(request.method()).isEqualTo("GET");
            assertAddressedToBucket(provider, request);
            assertThat(bucketPath(request)).isEqualTo(provider.equals(MINIO) ? "/" + BUCKET_NAME : "/");
            assertThat(request.query()).containsEntry("encoding-type", "url").doesNotContainKey("list-type");
        });
        assertThat(requests.get(0).query())
                .containsOnlyKeys("encoding-type", "prefix")
                .containsEntry("prefix", "");
        assertThat(requests.get(1).query()).containsOnlyKeys("encoding-type", "marker", "max-keys");
        assertThat(decodedQueryValue(requests.get(1), "marker")).isEqualTo("dir/b c.txt");
        assertThat(requests.get(1).query()).containsEntry("max-keys", "1000");
        assertThat(result.getIsExecutionSuccess()).isTrue();
        JsonNode body = MAPPER.valueToTree(result.getBody());
        assertThat(body.findValuesAsText("fileName")).containsExactly("a.txt", "dir/b c.txt", "z.txt");
        assertThat(body.findValuesAsText("url"))
                .containsExactly(
                        unsignedUrl(provider, "a.txt"),
                        unsignedUrl(provider, "dir/b%20c.txt"),
                        unsignedUrl(provider, "z.txt"));
    }

    /** The marker of the next page is the listing's NextMarker when the service sends one, not the last key. */
    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_requestNextPageWithNextMarker_when_truncatedListResponseHasNextMarker(String provider) {
        // Given
        server.respond(request -> request.query().containsKey("marker")
                ? S3WireServer.listPage(request, BUCKET_NAME, List.of("z.txt"), false)
                : S3WireServer.listPage(request, BUCKET_NAME, List.of("a.txt", "b.txt"), true, "custom marker+1"));

        // When
        ActionExecutionResult result = execute(provider, Map.of(COMMAND, "LIST", BUCKET, BUCKET_NAME));

        // Then
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(MAPPER.valueToTree(result.getBody()).findValuesAsText("fileName"))
                .containsExactly("a.txt", "b.txt", "z.txt");
        List<Request> requests = server.requests();
        assertThat(requests).hasSize(2);
        assertThat(decodedQueryValue(requests.get(1), "marker")).isEqualTo("custom marker+1");
    }

    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_requestEveryPageWithThePrefix_when_listingWithPrefixSpansSeveralPages(String provider) {
        // Given
        server.respond(request -> request.query().containsKey("marker")
                ? S3WireServer.listPage(request, BUCKET_NAME, List.of("dir one/z.txt"), false)
                : S3WireServer.listPage(request, BUCKET_NAME, List.of("dir one/a.txt"), true));

        // When
        ActionExecutionResult result = execute(
                provider, Map.of(COMMAND, "LIST", BUCKET, BUCKET_NAME, LIST_PREFIX, "dir one/", LIST_SIGNED_URL, "NO"));

        // Then
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(MAPPER.valueToTree(result.getBody()).findValuesAsText("fileName"))
                .containsExactly("dir one/a.txt", "dir one/z.txt");
        List<Request> requests = server.requests();
        assertThat(requests).hasSize(2);
        assertThat(requests).allSatisfy(request -> assertThat(decodedQueryValue(request, "prefix"))
                .isEqualTo("dir one/"));
        assertThat(decodedQueryValue(requests.get(1), "marker")).isEqualTo("dir one/a.txt");
    }

    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_returnPresignedUrlForEachKey_when_listAsksForSignedUrls(String provider) {
        // Given
        server.respond(request -> S3WireServer.listPage(request, BUCKET_NAME, List.of("dir/a b.txt"), false));

        // When
        ActionExecutionResult result = execute(
                provider,
                Map.of(
                        COMMAND,
                        "LIST",
                        BUCKET,
                        BUCKET_NAME,
                        LIST_SIGNED_URL,
                        "YES",
                        LIST_EXPIRY,
                        "10",
                        LIST_UNSIGNED_URL,
                        "YES"));

        // Then
        assertThat(result.getIsExecutionSuccess()).isTrue();
        JsonNode file = MAPPER.valueToTree(result.getBody()).get(0);
        URI signed = URI.create(file.get("signedUrl").asText());
        URI unsigned = URI.create(file.get("url").asText());
        assertThat(signed.getScheme() + "://" + signed.getRawAuthority() + signed.getRawPath())
                .isEqualTo(unsigned.toString())
                .isEqualTo(unsignedUrl(provider, "dir/a%20b.txt"));
        Map<String, String> query = queryParameters(signed);
        assertThat(query.get("X-Amz-Credential")).contains("/" + SIGNING_REGIONS.get(provider) + "/s3/aws4_request");
        assertThat(query).containsEntry("X-Amz-SignedHeaders", "host");
        assertConsistentExpiry(query, file.get("urlExpiryDate").asText(), Duration.ofMinutes(10));
    }

    /** The URL's validity (X-Amz-Date + X-Amz-Expires) ends at the returned urlExpiryDate. */
    @ParameterizedTest
    @ValueSource(strings = {"0", "5", "10080"})
    void should_returnUrlValidUntilUrlExpiryDate_when_listAsksForSignedUrlsWithExpiryMinutes(String minutes) {
        // Given
        server.respond(request -> S3WireServer.listPage(request, BUCKET_NAME, List.of("a.txt"), false));

        // When
        ActionExecutionResult result = execute(
                OTHER, Map.of(COMMAND, "LIST", BUCKET, BUCKET_NAME, LIST_SIGNED_URL, "YES", LIST_EXPIRY, minutes));

        // Then
        assertThat(result.getIsExecutionSuccess()).isTrue();
        JsonNode file = MAPPER.valueToTree(result.getBody()).get(0);
        Map<String, String> query =
                queryParameters(URI.create(file.get("signedUrl").asText()));
        assertConsistentExpiry(query, file.get("urlExpiryDate").asText(), Duration.ofMinutes(Long.parseLong(minutes)));
    }

    /**
     * A negative duration still yields a URL, valid for the shortest time a URL can be signed for (one second); the
     * returned urlExpiryDate lies in the past.
     */
    @Test
    void should_returnUrlValidForOneSecond_when_listAsksForSignedUrlsWithNegativeExpiryMinutes() {
        // Given
        server.respond(request -> S3WireServer.listPage(request, BUCKET_NAME, List.of("a.txt"), false));

        // When
        ActionExecutionResult result =
                execute(OTHER, Map.of(COMMAND, "LIST", BUCKET, BUCKET_NAME, LIST_SIGNED_URL, "YES", LIST_EXPIRY, "-5"));

        // Then
        assertThat(result.getIsExecutionSuccess()).isTrue();
        JsonNode file = MAPPER.valueToTree(result.getBody()).get(0);
        Map<String, String> query =
                queryParameters(URI.create(file.get("signedUrl").asText()));
        assertThat(query).containsEntry("X-Amz-Expires", "1");
        Instant signedAt = Instant.from(AMZ_DATE.parse(query.get("X-Amz-Date")));
        assertThat(parseUrlExpiryDate(file.get("urlExpiryDate").asText()))
                .isBetween(signedAt.minus(Duration.ofMinutes(5).plusSeconds(2)), signedAt.minus(Duration.ofMinutes(4)));
    }

    @Test
    void should_failWithQueryExecutionError_when_listAsksForSignedUrlsValidForMoreThanSevenDays() {
        // Given
        server.respond(request -> S3WireServer.listPage(request, BUCKET_NAME, List.of("a.txt"), false));

        // When
        ActionExecutionResult result = execute(
                OTHER, Map.of(COMMAND, "LIST", BUCKET, BUCKET_NAME, LIST_SIGNED_URL, "YES", LIST_EXPIRY, "10081"));

        // Then
        assertGenericQueryExecutionError(result);
    }

    // ----- UPLOAD_FILE_FROM_BODY -----

    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_putTextWithContentTypeAndContentMd5_when_uploadingTextWithType(String provider) {
        // Given
        server.respond(S3WireServer::putOk);

        // When
        ActionExecutionResult result = execute(
                provider,
                Map.of(
                        COMMAND, "UPLOAD_FILE_FROM_BODY",
                        BUCKET, BUCKET_NAME,
                        PATH, "dir/hello world.txt",
                        CREATE_DATATYPE, "NO",
                        CREATE_EXPIRY, "5",
                        BODY, "{\"type\": \"text/plain\", \"data\": \"hello ünï\"}"));

        // Then
        List<Request> requests = server.requests();
        assertThat(requests).hasSize(1);
        Request put = requests.get(0);
        assertSinglePutWithoutChecksums(provider, put, "dir/hello world.txt", utf8("hello ünï"));
        assertThat(put.header("Content-Type")).isEqualTo("text/plain");
        assertThat(result.getIsExecutionSuccess()).isTrue();
        Map<?, ?> body = (Map<?, ?>) result.getBody();
        assertThat(body.get("url")).isEqualTo(unsignedUrl(provider, "dir/hello%20world.txt"));
        URI signed = URI.create((String) body.get("signedUrl"));
        assertThat(signed.getScheme() + "://" + signed.getRawAuthority() + signed.getRawPath())
                .isEqualTo(body.get("url"));
        assertConsistentExpiry(queryParameters(signed), (String) body.get("urlExpiryDate"), Duration.ofMinutes(5));
    }

    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_putOctetStream_when_uploadingTextWithoutType(String provider) {
        // Given
        server.respond(S3WireServer::putOk);

        // When
        ActionExecutionResult result = execute(
                provider,
                Map.of(
                        COMMAND, "UPLOAD_FILE_FROM_BODY",
                        BUCKET, BUCKET_NAME,
                        PATH, "plain.txt",
                        CREATE_DATATYPE, "NO",
                        BODY, "{\"data\": \"no type\"}"));

        // Then
        List<Request> requests = server.requests();
        assertThat(requests).hasSize(1);
        assertSinglePutWithoutChecksums(provider, requests.get(0), "plain.txt", utf8("no type"));
        assertThat(requests.get(0).header("Content-Type")).isEqualTo("application/octet-stream");
        assertThat(result.getIsExecutionSuccess()).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_putDecodedBytes_when_uploadingBase64FromFilePicker(String provider) {
        // Given
        server.respond(S3WireServer::putOk);
        byte[] bytes = allByteValues();
        String dataUrl =
                "data:application/octet-stream;base64," + Base64.getEncoder().encodeToString(bytes);

        // When
        ActionExecutionResult result = execute(
                provider,
                Map.of(
                        COMMAND, "UPLOAD_FILE_FROM_BODY",
                        BUCKET, BUCKET_NAME,
                        PATH, "bin/all-bytes.bin",
                        CREATE_DATATYPE, "YES",
                        BODY, "{\"type\": \"application/x-test\", \"data\": \"" + dataUrl + "\"}"));

        // Then
        List<Request> requests = server.requests();
        assertThat(requests).hasSize(1);
        assertSinglePutWithoutChecksums(provider, requests.get(0), "bin/all-bytes.bin", bytes);
        assertThat(requests.get(0).header("Content-Type")).isEqualTo("application/x-test");
        assertThat(result.getIsExecutionSuccess()).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_putEmptyObject_when_uploadingEmptyData(String provider) {
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
        assertThat(requests).hasSize(1);
        assertSinglePutWithoutChecksums(provider, requests.get(0), "empty.txt", new byte[0]);
        assertThat(result.getIsExecutionSuccess()).isTrue();
    }

    /**
     * The service verifies the upload against the Content-MD5 the plugin sends; the ETag in the response is not
     * compared with it, since several S3-compatible services return ETags that are not MD5 digests.
     */
    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_succeed_when_putResponseEtagIsNotTheMd5OfThePayload(String provider) {
        // Given
        server.respond(request -> new MockResponse()
                .setResponseCode(200)
                .addHeader("ETag", "\"0123456789abcdef0123456789abcdef\"")
                .addHeader("Content-Length", "0"));

        // When
        ActionExecutionResult result = execute(
                provider,
                Map.of(
                        COMMAND, "UPLOAD_FILE_FROM_BODY",
                        BUCKET, BUCKET_NAME,
                        PATH, "etag.txt",
                        CREATE_DATATYPE, "NO",
                        BODY, "{\"data\": \"payload\"}"));

        // Then
        assertThat(server.requests()).hasSize(1);
        assertThat(server.requests().get(0).header("Content-MD5")).isEqualTo(md5Base64(utf8("payload")));
        assertThat(result.getIsExecutionSuccess()).isTrue();
    }

    // ----- UPLOAD_MULTIPLE_FILES_FROM_BODY -----

    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_putEachFileUnderPath_when_uploadingMultipleFiles(String provider) {
        // Given
        server.respond(S3WireServer::putOk);

        // When
        ActionExecutionResult result = execute(
                provider,
                Map.of(
                        COMMAND, "UPLOAD_MULTIPLE_FILES_FROM_BODY",
                        BUCKET, BUCKET_NAME,
                        PATH, "multi/",
                        CREATE_DATATYPE, "NO",
                        CREATE_EXPIRY, "5",
                        BODY,
                                "[{\"name\": \"one.txt\", \"type\": \"text/plain\", \"data\": \"one\"},"
                                        + " {\"name\": \"two words.bin\", \"data\": \"two\"}]"));

        // Then
        List<Request> requests = server.requests();
        assertThat(requests).hasSize(2);
        assertSinglePutWithoutChecksums(provider, requests.get(0), "multi/one.txt", utf8("one"));
        assertThat(requests.get(0).header("Content-Type")).isEqualTo("text/plain");
        assertSinglePutWithoutChecksums(provider, requests.get(1), "multi/two words.bin", utf8("two"));
        assertThat(result.getIsExecutionSuccess()).isTrue();
        Map<?, ?> body = (Map<?, ?>) result.getBody();
        assertThat((List<Object>) body.get("urls"))
                .containsExactly(
                        unsignedUrl(provider, "multi/one.txt"), unsignedUrl(provider, "multi/two%20words.bin"));
        assertThat((List<?>) body.get("signedUrls")).hasSize(2);
    }

    // ----- READ_FILE -----

    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_returnObjectText_when_readingWithoutBase64(String provider) {
        // Given
        byte[] content = utf8("Hello ünï\n");
        server.respond(request -> S3WireServer.object(content, md5Hex(content)));

        // When
        ActionExecutionResult result = execute(
                provider,
                Map.of(COMMAND, "READ_FILE", BUCKET, BUCKET_NAME, PATH, "dir/read me.txt", READ_DATATYPE, "NO"));

        // Then
        List<Request> requests = server.requests();
        assertThat(requests).hasSize(1);
        assertThat(requests.get(0).method()).isEqualTo("GET");
        assertAddressedToBucket(provider, requests.get(0));
        assertThat(requests.get(0).key(BUCKET_NAME)).isEqualTo("dir/read me.txt");
        assertThat(requests.get(0).query()).isEmpty();
        assertNoFlexibleChecksumHeaders(requests.get(0));
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(((Map<?, ?>) result.getBody()).get("fileData")).isEqualTo("Hello ünï\n");
    }

    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_returnBase64OfObjectBytes_when_readingWithBase64(String provider) {
        // Given
        byte[] content = allByteValues();
        server.respond(request -> S3WireServer.object(content, md5Hex(content)));

        // When
        ActionExecutionResult result = execute(
                provider,
                Map.of(COMMAND, "READ_FILE", BUCKET, BUCKET_NAME, PATH, "all-bytes.bin", READ_DATATYPE, "YES"));

        // Then
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(((Map<?, ?>) result.getBody()).get("fileData"))
                .isEqualTo(Base64.getEncoder().encodeToString(content));
    }

    /** Downloads are not checked against the ETag, which is not an MD5 digest on several S3-compatible services. */
    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_returnContent_when_readResponseEtagIsNotTheMd5OfTheContent(String provider) {
        // Given
        byte[] content = utf8("content");
        server.respond(request -> S3WireServer.object(content, "0123456789abcdef0123456789abcdef"));

        // When
        ActionExecutionResult result = execute(
                provider, Map.of(COMMAND, "READ_FILE", BUCKET, BUCKET_NAME, PATH, "etag.txt", READ_DATATYPE, "NO"));

        // Then
        assertThat(server.requests()).hasSize(1);
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(((Map<?, ?>) result.getBody()).get("fileData")).isEqualTo("content");
    }

    /** Downloads are not validated against CRC checksum headers, which S3-compatible services may compute differently. */
    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_returnContent_when_readResponseCarriesAChecksumThatDoesNotMatch(String provider) {
        // Given
        byte[] content = utf8("content");
        server.respond(request -> S3WireServer.object(content, md5Hex(content))
                .addHeader("x-amz-checksum-crc32", "AAAAAA==")
                .addHeader("x-amz-checksum-type", "FULL_OBJECT"));

        // When
        ActionExecutionResult result = execute(
                provider, Map.of(COMMAND, "READ_FILE", BUCKET, BUCKET_NAME, PATH, "crc.txt", READ_DATATYPE, "NO"));

        // Then
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(((Map<?, ?>) result.getBody()).get("fileData")).isEqualTo("content");
    }

    // ----- IP address endpoints -----

    /** A bucket name cannot be prefixed to an IP address, so the bucket goes in the path, dotted names included. */
    @ParameterizedTest
    @ValueSource(strings = {GCS, OTHER})
    void should_sendBucketInPath_when_endpointIsAnIpAddress(String provider) {
        // Given
        byte[] content = utf8("content");
        server.respond(request -> S3WireServer.object(content, md5Hex(content)));
        DatasourceConfiguration configuration = S3TestFixtures.datasource(
                provider, "http://" + server.ipAndPort(), REGIONS.get(provider), DOTTED_BUCKET_NAME);

        // When
        ActionExecutionResult result = execute(
                configuration,
                Map.of(COMMAND, "READ_FILE", BUCKET, DOTTED_BUCKET_NAME, PATH, "dir/a.txt", READ_DATATYPE, "NO"));

        // Then
        assertThat(result.getIsExecutionSuccess())
                .as(String.valueOf(result.getBody()))
                .isTrue();
        List<Request> requests = server.requests();
        assertThat(requests).hasSize(1);
        assertThat(requests.get(0).host()).isEqualTo(server.ipAndPort());
        assertThat(requests.get(0).path()).isEqualTo("/" + DOTTED_BUCKET_NAME + "/dir/a.txt");
    }

    @ParameterizedTest
    @ValueSource(strings = {GCS, OTHER})
    void should_returnPathStyleUrls_when_endpointIsAnIpAddress(String provider) {
        // Given
        S3Connection connection = connect(S3TestFixtures.datasource(
                provider, "http://" + server.ipAndPort(), REGIONS.get(provider), DOTTED_BUCKET_NAME));

        // When
        String unsigned = executor.createFileUrl(connection, DOTTED_BUCKET_NAME, "dir/a.txt");
        String signed = executor.getSignedUrls(
                        connection,
                        DOTTED_BUCKET_NAME,
                        new ArrayList<>(List.of("dir/a.txt")),
                        Date.from(Instant.now().plus(Duration.ofMinutes(5))))
                .get(0);

        // Then
        String expected = "http://" + server.ipAndPort() + "/" + DOTTED_BUCKET_NAME + "/dir/a.txt";
        assertThat(unsigned).isEqualTo(expected);
        assertThat(signed).startsWith(expected + "?");
    }

    // ----- endpoint forms -----

    /**
     * Requests, unsigned URLs and presigned URLs are addressed to the endpoint's scheme, host and port. When the bucket
     * goes in the path, the endpoint's path is a prefix of every path, with one slash before the bucket however many
     * the endpoint ends with; when the bucket goes in the host name, the endpoint's path is not used. The endpoint's
     * query, fragment and user info appear in no request and no URL.
     */
    @ParameterizedTest(name = "{0} {1}")
    @MethodSource("endpointForms")
    void should_addressRequestsAndUrlsToEndpointHostAndPathStylePrefix_when_endpointHasPathQueryFragmentOrUserInfo(
            String provider, String endpointForm, String expectedBucketUrlForm) {
        // Given
        byte[] content = utf8("content");
        server.respond(request -> request.query().containsKey("encoding-type")
                ? S3WireServer.listPage(request, BUCKET_NAME, List.of("dir/a b.txt"), false)
                : S3WireServer.object(content, md5Hex(content)));
        DatasourceConfiguration configuration = S3TestFixtures.datasource(
                provider, withServerAddress(endpointForm), REGIONS.get(provider), BUCKET_NAME);
        String expectedBucketUrl = withServerAddress(expectedBucketUrlForm);
        String expectedObjectUrl = expectedBucketUrl + "/dir/a%20b.txt";

        // When
        ActionExecutionResult list = execute(
                configuration,
                Map.of(COMMAND, "LIST", BUCKET, BUCKET_NAME, LIST_SIGNED_URL, "YES", LIST_UNSIGNED_URL, "YES"));
        ActionExecutionResult read = execute(
                configuration,
                Map.of(COMMAND, "READ_FILE", BUCKET, BUCKET_NAME, PATH, "dir/a b.txt", READ_DATATYPE, "NO"));

        // Then
        assertThat(list.getIsExecutionSuccess())
                .as(String.valueOf(list.getBody()))
                .isTrue();
        assertThat(read.getIsExecutionSuccess())
                .as(String.valueOf(read.getBody()))
                .isTrue();
        List<Request> requests = server.requests();
        assertThat(requests).hasSize(2);
        assertThat("http://" + requests.get(0).host() + requests.get(0).path())
                .isIn(expectedBucketUrl, expectedBucketUrl + "/");
        assertThat(requests.get(0).query()).containsOnlyKeys("encoding-type", "prefix");
        assertThat("http://" + requests.get(1).host() + requests.get(1).path()).isEqualTo(expectedObjectUrl);
        assertThat(requests.get(1).query()).isEmpty();
        assertThat(requests).allSatisfy(request -> {
            assertThat(request.header("Authorization")).startsWith("AWS4-HMAC-SHA256 ");
            assertThat(request.headers().toString()).doesNotContain("endpoint-user", "endpoint-pass");
        });
        JsonNode file = MAPPER.valueToTree(list.getBody()).get(0);
        assertThat(file.get("url").asText()).isEqualTo(expectedObjectUrl);
        URI signed = URI.create(file.get("signedUrl").asText());
        assertThat(signed.getScheme() + "://" + signed.getRawAuthority() + signed.getRawPath())
                .isEqualTo(expectedObjectUrl);
        assertThat(queryParameters(signed).keySet()).allMatch(name -> name.startsWith("X-Amz-"));
    }

    /**
     * Endpoint forms: {@code {host}} is the server's {@code localhost:<port>}, {@code {ip}} its {@code 127.0.0.1:<port>}.
     */
    static Stream<Arguments> endpointForms() {
        return Stream.of(
                Arguments.of(MINIO, "http://{host}/base/path", "http://{host}/base/path/my-bucket"),
                Arguments.of(MINIO, "http://{host}/base/path/", "http://{host}/base/path/my-bucket"),
                Arguments.of(MINIO, "http://{host}/base/path//", "http://{host}/base/path/my-bucket"),
                Arguments.of(MINIO, "http://{host}/", "http://{host}/my-bucket"),
                Arguments.of(MINIO, "http://{ip}/base/path", "http://{ip}/base/path/my-bucket"),
                Arguments.of(MINIO, "http://{ip}/base/path/", "http://{ip}/base/path/my-bucket"),
                Arguments.of(OTHER, "http://{ip}/base/path/", "http://{ip}/base/path/my-bucket"),
                Arguments.of(OTHER, "http://{host}/base/path", "http://my-bucket.{host}"),
                Arguments.of(OTHER, "http://{host}/base/path/", "http://my-bucket.{host}"),
                Arguments.of(GCS, "http://{host}/base/path", "http://my-bucket.{host}"),
                Arguments.of(MINIO, "http://{host}?x=1", "http://{host}/my-bucket"),
                Arguments.of(MINIO, "http://{host}/base/path?x=1", "http://{host}/base/path/my-bucket"),
                Arguments.of(OTHER, "http://{host}?x=1", "http://my-bucket.{host}"),
                Arguments.of(OTHER, "http://{host}/base/path?x=1", "http://my-bucket.{host}"),
                Arguments.of(MINIO, "http://{host}#frag", "http://{host}/my-bucket"),
                Arguments.of(OTHER, "http://{host}#frag", "http://my-bucket.{host}"),
                Arguments.of(MINIO, "http://endpoint-user:endpoint-pass@{host}", "http://{host}/my-bucket"),
                Arguments.of(OTHER, "http://endpoint-user:endpoint-pass@{host}", "http://my-bucket.{host}"),
                Arguments.of(
                        MINIO, "http://endpoint-user:endpoint-pass@{ip}/base/?x=1#frag", "http://{ip}/base/my-bucket"));
    }

    /**
     * An endpoint that is not a URI, or whose host cannot be determined, is rejected when the datasource is created,
     * with a message that does not repeat it.
     */
    @ParameterizedTest(name = "{0} {1}")
    @MethodSource("endpointsWithoutHost")
    void should_rejectDatasourceWithEndpointError_when_endpointHasNoHost(String provider, String endpointForm) {
        // Given
        String endpoint = withServerAddress(endpointForm);
        DatasourceConfiguration configuration =
                S3TestFixtures.datasource(provider, endpoint, REGIONS.get(provider), BUCKET_NAME);

        // When
        Mono<S3Connection> connection = executor.datasourceCreate(configuration);

        // Then
        StepVerifier.create(connection)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithPluginException.class);
                    AppsmithPluginException pluginException = (AppsmithPluginException) error;
                    assertThat(pluginException.getError())
                            .isEqualTo(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR);
                    assertThat(pluginException.getMessage()).isEqualTo(INCORRECT_S3_ENDPOINT_URL_ERROR_MSG);
                    assertThat(pluginException.getDownstreamErrorMessage()).isNull();
                })
                .verify(Duration.ofSeconds(30));
        assertThat(server.requests()).isEmpty();
    }

    static Stream<Arguments> endpointsWithoutHost() {
        List<String> endpoints = List.of(
                "//{host}",
                "http:////{host}",
                "http://localhost:not-a-port",
                "http://bad host:1",
                "http://under_score:1");
        return Stream.of(MINIO, OTHER)
                .flatMap(provider -> endpoints.stream().map(endpoint -> Arguments.of(provider, endpoint)));
    }

    // ----- DELETE_FILE / DELETE_MULTIPLE_FILES -----

    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_sendDelete_when_deletingFile(String provider) {
        // Given
        server.respond(request -> S3WireServer.noContent());

        // When
        ActionExecutionResult result =
                execute(provider, Map.of(COMMAND, "DELETE_FILE", BUCKET, BUCKET_NAME, PATH, "dir/gone.txt"));

        // Then
        List<Request> requests = server.requests();
        assertThat(requests).hasSize(1);
        assertThat(requests.get(0).method()).isEqualTo("DELETE");
        assertAddressedToBucket(provider, requests.get(0));
        assertThat(requests.get(0).key(BUCKET_NAME)).isEqualTo("dir/gone.txt");
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(((Map<?, ?>) result.getBody()).get("status")).isEqualTo("File deleted successfully");
    }

    @ParameterizedTest
    @ValueSource(strings = {MINIO, OTHER})
    void should_sendOneBulkDeleteWithContentMd5AndCrc32Header_when_deletingMultipleFiles(String provider) {
        // Given
        server.respond(request -> S3WireServer.deleteResult(S3WireServer.deleteKeys(request), List.of()));

        // When
        ActionExecutionResult result = execute(
                provider,
                Map.of(COMMAND, "DELETE_MULTIPLE_FILES", BUCKET, BUCKET_NAME, PATH, "[\"a.txt\", \"dir/b c.txt\"]"));

        // Then
        List<Request> requests = server.requests();
        assertThat(requests).hasSize(1);
        Request delete = requests.get(0);
        assertThat(delete.method()).isEqualTo("POST");
        assertAddressedToBucket(provider, delete);
        assertThat(delete.query()).containsOnlyKeys("delete");
        assertThat(S3WireServer.deleteKeys(delete)).containsExactly("a.txt", "dir/b c.txt");
        assertBulkDeleteChecksums(delete);
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(((Map<?, ?>) result.getBody()).get("status")).isEqualTo("All files deleted successfully");
    }

    @Test
    void should_sendOneDeletePerKey_when_deletingMultipleFilesOnGoogleCloudStorage() {
        // Given
        server.respond(request -> S3WireServer.noContent());

        // When
        ActionExecutionResult result = execute(
                GCS,
                Map.of(COMMAND, "DELETE_MULTIPLE_FILES", BUCKET, BUCKET_NAME, PATH, "[\"a.txt\", \"dir/b c.txt\"]"));

        // Then
        List<Request> requests = server.requests();
        assertThat(requests).extracting(Request::method).containsExactly("DELETE", "DELETE");
        assertThat(requests).extracting(request -> request.key(BUCKET_NAME)).containsExactly("a.txt", "dir/b c.txt");
        assertThat(result.getIsExecutionSuccess()).isTrue();
    }

    /** The error detail names every object that was not deleted, with the code and message S3 gave for it. */
    @ParameterizedTest
    @ValueSource(strings = {MINIO, OTHER})
    void should_failWithEachUndeletedKey_when_bulkDeleteReportsPerKeyErrors(String provider) {
        // Given
        server.respond(request -> S3WireServer.deleteResult(List.of("a.txt"), List.of("locked.txt", "dir/held.txt")));

        // When
        ActionExecutionResult result = execute(
                provider,
                Map.of(
                        COMMAND,
                        "DELETE_MULTIPLE_FILES",
                        BUCKET,
                        BUCKET_NAME,
                        PATH,
                        "[\"a.txt\", \"locked.txt\", \"dir/held.txt\"]"));

        // Then
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(result.getPluginErrorDetails().getAppsmithErrorMessage())
                .isEqualTo(FILE_CANNOT_BE_DELETED_ERROR_MSG);
        assertThat(result.getPluginErrorDetails().getAppsmithErrorCode()).isEqualTo("PE-AS3-5000");
        assertThat(result.getPluginErrorDetails().getDownstreamErrorMessage())
                .isEqualTo("One or more objects could not be deleted: locked.txt (AccessDenied: Access Denied),"
                        + " dir/held.txt (AccessDenied: Access Denied)");
    }

    /** The error detail names at most ten undeleted objects and counts the others. */
    @ParameterizedTest
    @ValueSource(ints = {10, 15})
    void should_nameAtMostTenUndeletedKeys_when_bulkDeleteReportsManyPerKeyErrors(int failures) {
        // Given
        List<String> failed = IntStream.range(0, failures)
                .mapToObj(index -> "locked-" + index + ".txt")
                .toList();
        server.respond(request -> S3WireServer.deleteResult(List.of(), failed));
        String paths = failed.stream().map(key -> "\"" + key + "\"").collect(Collectors.joining(", ", "[", "]"));

        // When
        ActionExecutionResult result =
                execute(OTHER, Map.of(COMMAND, "DELETE_MULTIPLE_FILES", BUCKET, BUCKET_NAME, PATH, paths));

        // Then
        String firstTen = failed.subList(0, 10).stream()
                .map(key -> key + " (AccessDenied: Access Denied)")
                .collect(Collectors.joining(", "));
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(result.getPluginErrorDetails().getDownstreamErrorMessage())
                .isEqualTo("One or more objects could not be deleted: " + firstTen
                        + (failures == 15 ? ", and 5 more" : ""));
    }

    /** The error detail repeats at most 200 characters of the message the service gives for an object. */
    @Test
    void should_cutLongServiceMessage_when_bulkDeleteReportsPerKeyErrorWithLongMessage() {
        // Given
        String message = "m".repeat(200) + "TAIL-NOT-REPEATED";
        server.respond(request -> S3WireServer.deleteResult(List.of(), List.of("locked.txt"), message));

        // When
        ActionExecutionResult result =
                execute(OTHER, Map.of(COMMAND, "DELETE_MULTIPLE_FILES", BUCKET, BUCKET_NAME, PATH, "[\"locked.txt\"]"));

        // Then
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(result.getPluginErrorDetails().getDownstreamErrorMessage())
                .isEqualTo("One or more objects could not be deleted: locked.txt (AccessDenied: " + "m".repeat(200)
                        + "...)");
    }

    @Test
    void should_failWithCannotDeleteError_when_oneGoogleCloudStorageDeleteFails() {
        // Given
        server.respond(request -> request.path().endsWith("locked.txt")
                ? S3WireServer.error(403, "AccessDenied", "Access denied.")
                : S3WireServer.noContent());

        // When
        ActionExecutionResult result = execute(
                GCS,
                Map.of(COMMAND, "DELETE_MULTIPLE_FILES", BUCKET, BUCKET_NAME, PATH, "[\"a.txt\", \"locked.txt\"]"));

        // Then
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(result.getPluginErrorDetails().getAppsmithErrorMessage())
                .isEqualTo(FILE_CANNOT_BE_DELETED_ERROR_MSG);
    }

    // ----- getStructure / testDatasource -----

    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_listBucketsAsTables_when_structureIsFetched(String provider) {
        // Given
        server.respond(request -> S3WireServer.listBuckets(List.of("alpha", "beta")));
        S3Connection connection = connect(datasource(provider));

        // When
        Mono<DatasourceStructure> structure = executor.getStructure(connection, datasource(provider));

        // Then
        StepVerifier.create(structure)
                .assertNext(actual -> assertThat(actual.getTables())
                        .extracting(DatasourceStructure.Table::getName)
                        .containsExactly("alpha", "beta"))
                .verifyComplete();
        List<Request> requests = server.requests();
        assertThat(requests).hasSize(1);
        assertThat(requests.get(0).method()).isEqualTo("GET");
        assertThat(requests.get(0).path()).isEqualTo("/");
        assertThat(requests.get(0).host()).isEqualTo(server.hostAndPort());
        assertThat(S3WireServer.authorizationSummary(requests.get(0).header("Authorization")))
                .startsWith("AWS4-HMAC-SHA256 region=" + SIGNING_REGIONS.get(provider) + " service=s3 ");
    }

    @ParameterizedTest
    @ValueSource(strings = {MINIO, GCS, OTHER})
    void should_failWithStructureError_when_listBucketsIsDenied(String provider) {
        // Given
        server.respond(request -> S3WireServer.error(403, "AccessDenied", "Access Denied"));
        S3Connection connection = connect(datasource(provider));

        // When
        Mono<DatasourceStructure> structure = executor.getStructure(connection, datasource(provider));

        // Then
        StepVerifier.create(structure)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithPluginException.class);
                    AppsmithPluginException pluginException = (AppsmithPluginException) error;
                    assertThat(pluginException.getError()).isEqualTo(AppsmithPluginError.PLUGIN_GET_STRUCTURE_ERROR);
                    assertThat(pluginException.getMessage()).isEqualTo(LIST_OF_BUCKET_FETCHING_ERROR_MSG);
                    assertThat(pluginException.getDownstreamErrorMessage()).contains("Access Denied");
                })
                .verify(Duration.ofSeconds(30));
    }

    /** A blank region is signed as us-east-1, the region S3-compatible services accept when none is configured. */
    @Test
    void should_signForUsEast1_when_otherProviderHasBlankRegion() {
        // Given
        server.respond(request -> S3WireServer.listBuckets(List.of("alpha")));
        DatasourceConfiguration configuration = S3TestFixtures.datasource(OTHER, server.endpoint(), "", BUCKET_NAME);
        S3Connection connection = connect(configuration);

        // When
        Mono<DatasourceStructure> structure = executor.getStructure(connection, configuration);

        // Then
        StepVerifier.create(structure).expectNextCount(1).verifyComplete();
        assertThat(S3WireServer.authorizationSummary(server.requests().get(0).header("Authorization")))
                .startsWith("AWS4-HMAC-SHA256 region=us-east-1 service=s3 ");
    }

    @ParameterizedTest
    @ValueSource(strings = {MINIO, OTHER})
    void should_passDatasourceTest_when_listBucketsSucceeds(String provider) {
        // Given
        server.respond(request -> S3WireServer.listBuckets(List.of("alpha")));

        // When
        Mono<DatasourceTestResult> result = executor.testDatasource(datasource(provider));

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> assertThat(actual.getInvalids()).isEmpty())
                .verifyComplete();
        assertThat(server.requests()).extracting(Request::path).containsExactly("/");
    }

    /** Credentials that may not list buckets are still valid credentials. */
    @ParameterizedTest
    @ValueSource(strings = {MINIO, OTHER})
    void should_passDatasourceTest_when_listBucketsIsDenied(String provider) {
        // Given
        server.respond(request -> S3WireServer.error(403, "AccessDenied", "Access Denied"));

        // When
        Mono<DatasourceTestResult> result = executor.testDatasource(datasource(provider));

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> assertThat(actual.getInvalids()).isEmpty())
                .verifyComplete();
        assertThat(server.requests()).extracting(Request::path).containsExactly("/");
    }

    @ParameterizedTest
    @ValueSource(strings = {MINIO, OTHER})
    void should_reportReadableError_when_listBucketsFailsOtherwise(String provider) {
        // Given
        server.respond(request -> S3WireServer.error(
                403, "InvalidAccessKeyId", "The AWS Access Key Id you provided does not exist in our records."));

        // When
        Mono<DatasourceTestResult> result = executor.testDatasource(datasource(provider));

        // Then
        StepVerifier.create(result)
                .assertNext(
                        actual -> assertThat(actual.getInvalids())
                                .containsExactly(
                                        "InvalidAccessKeyId: The AWS Access Key Id you provided does not exist in our records."))
                .verifyComplete();
    }

    @Test
    void should_listDefaultBucket_when_googleCloudStorageDatasourceIsTested() {
        // Given
        server.respond(request -> S3WireServer.listPage(request, BUCKET_NAME, List.of("a.txt"), false));

        // When
        Mono<DatasourceTestResult> result = executor.testDatasource(datasource(GCS));

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> assertThat(actual.getInvalids()).isEmpty())
                .verifyComplete();
        List<Request> requests = server.requests();
        assertThat(requests).hasSize(1);
        assertThat(requests.get(0).method()).isEqualTo("GET");
        assertAddressedToBucket(GCS, requests.get(0));
        assertThat(requests.get(0).query()).containsEntry("encoding-type", "url");
    }

    @Test
    void should_reportMissingBucket_when_googleCloudStorageDefaultBucketIsNotFound() {
        // Given
        server.respond(request -> S3WireServer.error(404, "NoSuchBucket", "The specified bucket does not exist."));

        // When
        Mono<DatasourceTestResult> result = executor.testDatasource(datasource(GCS));

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> assertThat(actual.getInvalids()).containsExactly(NON_EXITED_BUCKET_ERROR_MSG))
                .verifyComplete();
    }

    @Test
    void should_reportReadableError_when_googleCloudStorageDefaultBucketIsDenied() {
        // Given
        server.respond(request -> S3WireServer.error(403, "AccessDenied", "Access denied."));

        // When
        Mono<DatasourceTestResult> result = executor.testDatasource(datasource(GCS));

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> assertThat(actual.getInvalids()).containsExactly("AccessDenied: Access denied."))
                .verifyComplete();
    }

    // ----- region -----

    /** The datasource error repeats neither the region nor any part of it. */
    @ParameterizedTest
    @MethodSource("regionsThatAreNotRegionNames")
    void should_rejectDatasourceWithoutRepeatingRegion_when_regionIsNotARegionName(String provider, String region) {
        // Given
        DatasourceConfiguration configuration =
                S3TestFixtures.datasource(provider, server.endpoint(), region, BUCKET_NAME);

        // When
        Mono<S3Connection> connection = executor.datasourceCreate(configuration);

        // Then
        StepVerifier.create(connection)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithPluginException.class);
                    AppsmithPluginException pluginException = (AppsmithPluginException) error;
                    assertThat(pluginException.getError())
                            .isEqualTo(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR);
                    assertThat(pluginException.getMessage()).isEqualTo(INVALID_REGION_ERROR_MSG);
                    assertThat(String.valueOf(pluginException.getDownstreamErrorMessage()))
                            .doesNotContain(region.trim());
                })
                .verify(Duration.ofSeconds(30));
        assertThat(server.requests()).isEmpty();
    }

    @ParameterizedTest
    @MethodSource("regionsThatAreNotRegionNames")
    void should_reportInvalidRegion_when_datasourceWithRegionThatIsNotARegionNameIsTested(
            String provider, String region) {
        // Given
        DatasourceConfiguration configuration =
                S3TestFixtures.datasource(provider, server.endpoint(), region, BUCKET_NAME);

        // When
        Mono<DatasourceTestResult> result = executor.testDatasource(configuration);

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> assertThat(actual.getInvalids()).containsExactly(INVALID_REGION_ERROR_MSG))
                .verifyComplete();
        assertThat(server.requests()).isEmpty();
    }

    static Stream<Arguments> regionsThatAreNotRegionNames() {
        List<String> regions = List.of(
                "my_region",
                "my.region",
                "eu.west.1",
                "eu-west-3/extra",
                "region with space",
                "ünï",
                "a".repeat(64),
                "eu-west-3".repeat(10_000));
        return Stream.of(MINIO, OTHER)
                .flatMap(provider -> regions.stream().map(region -> Arguments.of(provider, region)));
    }

    /** The message tells the user which region names are accepted and what to do about a MinIO server's region. */
    @Test
    void should_explainAcceptedRegionNames_when_regionIsRejected() {
        // Given
        DatasourceConfiguration configuration =
                S3TestFixtures.datasource(MINIO, server.endpoint(), "my_region", BUCKET_NAME);

        // When
        Mono<DatasourceTestResult> result = executor.testDatasource(configuration);

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> assertThat(actual.getInvalids())
                        .containsExactly("The region must contain only letters, digits and hyphens, at most 63"
                                + " characters, for example 'us-east-1'. If your MinIO server is configured with a"
                                + " region name in another form, configure it with a region name in this form and"
                                + " enter that name in the 'Region' field."))
                .verifyComplete();
    }

    /** The region a provider's endpoint names is held to the same rule as a region entered in the datasource. */
    @ParameterizedTest(name = "{0} {1}")
    @MethodSource("endpointsNamingRegionsThatAreNotRegionNames")
    void should_rejectDatasourceWithInvalidRegion_when_endpointNamesRegionThatIsNotARegionName(
            String provider, String endpoint) {
        // Given
        DatasourceConfiguration configuration = S3TestFixtures.datasource(provider, endpoint, "", BUCKET_NAME);

        // When
        Mono<S3Connection> connection = executor.datasourceCreate(configuration);

        // Then
        StepVerifier.create(connection)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithPluginException.class);
                    AppsmithPluginException pluginException = (AppsmithPluginException) error;
                    assertThat(pluginException.getError())
                            .isEqualTo(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR);
                    assertThat(pluginException.getMessage()).isEqualTo(INVALID_REGION_ERROR_MSG);
                })
                .verify(Duration.ofSeconds(30));
    }

    static Stream<Arguments> endpointsNamingRegionsThatAreNotRegionNames() {
        return Stream.of(
                Arguments.of("upcloud", "appsmith.de_fra1.upcloudobjects.com"),
                Arguments.of("wasabi", "s3.eu_central_1.wasabisys.com"),
                Arguments.of("digital-ocean-spaces", "fra_1.digitaloceanspaces.com"),
                Arguments.of("dream-objects", "objects-us_east_1.dream.io"));
    }

    @Test
    void should_signForRegion_when_regionIsSixtyThreeLettersDigitsAndHyphens() {
        // Given
        String region = "Region-1" + "a".repeat(55);
        server.respond(request -> S3WireServer.listBuckets(List.of("alpha")));
        DatasourceConfiguration configuration =
                S3TestFixtures.datasource(OTHER, server.endpoint(), region, BUCKET_NAME);
        S3Connection connection = connect(configuration);

        // When
        Mono<DatasourceStructure> structure = executor.getStructure(connection, configuration);

        // Then
        StepVerifier.create(structure).expectNextCount(1).verifyComplete();
        assertThat(S3WireServer.authorizationSummary(server.requests().get(0).header("Authorization")))
                .startsWith("AWS4-HMAC-SHA256 region=" + region + " service=s3 ");
    }

    // ----- service errors -----

    @ParameterizedTest
    @ValueSource(strings = {"403 AccessDenied Access Denied", "404 NoSuchKey The specified key does not exist."})
    void should_returnCodeAndMessageAsReadableError_when_readFailsWithServiceError(String error) {
        // Given
        String[] parts = error.split(" ", 3);
        server.respond(request -> S3WireServer.error(Integer.parseInt(parts[0]), parts[1], parts[2]));

        // When
        ActionExecutionResult result = execute(
                OTHER, Map.of(COMMAND, "READ_FILE", BUCKET, BUCKET_NAME, PATH, "missing.txt", READ_DATATYPE, "NO"));

        // Then
        assertThat(server.requests()).hasSize(1);
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(result.getTitle()).isEqualTo("Query execution error");
        assertThat(result.getReadableError()).isEqualTo(parts[1] + ": " + parts[2]);
        assertThat(result.getBody()).isEqualTo(parts[1] + ": " + parts[2]);
    }

    @Test
    void should_retryAndReturnReadableError_when_readFailsWithServerError() {
        // Given
        server.respond(request -> S3WireServer.error(500, "InternalError", "We encountered an internal error."));

        // When
        ActionExecutionResult result = execute(
                OTHER, Map.of(COMMAND, "READ_FILE", BUCKET, BUCKET_NAME, PATH, "flaky.txt", READ_DATATYPE, "NO"));

        // Then
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(result.getReadableError()).isEqualTo("InternalError: We encountered an internal error.");
        assertThat(server.requests()).hasSize(4);
    }

    /**
     * A response that is not an S3 error document, such as one from a proxy or firewall in front of the service, is
     * reported by its HTTP status.
     */
    @ParameterizedTest
    @MethodSource("commandsFailingWithResponsesThatAreNotS3Errors")
    void should_reportHttpStatusAsReadableError_when_commandFailsWithResponseThatIsNotAnS3Error(
            String command, String response, String expectedReadableError) {
        // Given
        server.respond(request -> nonS3Error(response));

        // When
        ActionExecutionResult result = execute(OTHER, commandFields(command));

        // Then
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(result.getReadableError()).isEqualTo(expectedReadableError);
        assertThat(result.getBody()).isEqualTo(expectedReadableError);
    }

    static Stream<Arguments> commandsFailingWithResponsesThatAreNotS3Errors() {
        return Stream.of("LIST", "READ_FILE", "UPLOAD_FILE_FROM_BODY", "DELETE_FILE")
                .flatMap(command -> Stream.of(
                        Arguments.of(command, "html-403", "403 Forbidden: Forbidden"),
                        Arguments.of(command, "empty-403", "403 Forbidden: Forbidden"),
                        Arguments.of(command, "text-502", "502 Bad Gateway: Bad Gateway")));
    }

    @ParameterizedTest
    @MethodSource("datasourceTestsFailingWithResponsesThatAreNotS3Errors")
    void should_reportHttpStatus_when_datasourceTestFailsWithResponseThatIsNotAnS3Error(
            String provider, String response, String expectedInvalid) {
        // Given
        server.respond(request -> nonS3Error(response));

        // When
        Mono<DatasourceTestResult> result = executor.testDatasource(datasource(provider));

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> assertThat(actual.getInvalids()).containsExactly(expectedInvalid))
                .verifyComplete();
    }

    static Stream<Arguments> datasourceTestsFailingWithResponsesThatAreNotS3Errors() {
        return Stream.of(OTHER, GCS)
                .flatMap(provider -> Stream.of(
                        Arguments.of(provider, "html-403", "403 Forbidden: Forbidden"),
                        Arguments.of(provider, "empty-403", "403 Forbidden: Forbidden"),
                        Arguments.of(provider, "text-502", "502 Bad Gateway: Bad Gateway")));
    }

    // ----- stale connection -----

    @ParameterizedTest
    @ValueSource(strings = {MINIO, OTHER})
    void should_signalStaleConnection_when_commandRunsAfterDatasourceDestroy(String provider) {
        // Given
        server.respond(request -> S3WireServer.listPage(request, BUCKET_NAME, List.of("a.txt"), false));
        S3Connection connection = awaitValue(executor.datasourceCreate(datasource(provider)));
        executor.datasourceDestroy(connection);

        // When
        // datasourceDestroy closes the connection asynchronously: repeat the command, one attempt at a time, until it
        // stops succeeding.
        Mono<ActionExecutionResult> firstFailure = Mono.defer(() -> executor.executeParameterized(
                        connection,
                        noParams(),
                        datasource(provider),
                        action(Map.of(COMMAND, "LIST", BUCKET, BUCKET_NAME))))
                .filter(result -> !Boolean.TRUE.equals(result.getIsExecutionSuccess()))
                .repeatWhenEmpty(100, attempts -> attempts.delayElements(Duration.ofMillis(50)));

        // Then
        StepVerifier.create(firstFailure)
                .expectError(StaleConnectionException.class)
                .verify(Duration.ofSeconds(10));
    }

    // ----- helpers -----

    private DatasourceConfiguration datasource(String provider) {
        return S3TestFixtures.datasource(provider, server.endpoint(), REGIONS.get(provider), BUCKET_NAME);
    }

    private S3Connection connect(DatasourceConfiguration configuration) {
        S3Connection connection = awaitValue(executor.datasourceCreate(configuration));
        connections.add(connection);
        return connection;
    }

    private ActionExecutionResult execute(String provider, Map<String, Object> fields) {
        return execute(datasource(provider), fields);
    }

    private ActionExecutionResult execute(DatasourceConfiguration configuration, Map<String, Object> fields) {
        S3Connection connection = connect(configuration);
        return awaitValue(executor.executeParameterized(connection, noParams(), configuration, action(fields)));
    }

    /** The form with {@code {host}} replaced by the server's host and port, and {@code {ip}} by its IP and port. */
    private String withServerAddress(String form) {
        return form.replace("{host}", server.hostAndPort()).replace("{ip}", server.ipAndPort());
    }

    private String unsignedUrl(String provider, String encodedKey) {
        return provider.equals(MINIO)
                ? "http://" + server.hostAndPort() + "/" + BUCKET_NAME + "/" + encodedKey
                : "http://" + BUCKET_NAME + "." + server.hostAndPort() + "/" + encodedKey;
    }

    private static Map<String, Object> commandFields(String command) {
        Map<String, Supplier<Map<String, Object>>> fields = Map.of(
                "LIST", () -> Map.of(COMMAND, "LIST", BUCKET, BUCKET_NAME),
                "READ_FILE",
                        () -> Map.of(COMMAND, "READ_FILE", BUCKET, BUCKET_NAME, PATH, "a.txt", READ_DATATYPE, "NO"),
                "UPLOAD_FILE_FROM_BODY",
                        () -> Map.of(
                                COMMAND,
                                "UPLOAD_FILE_FROM_BODY",
                                BUCKET,
                                BUCKET_NAME,
                                PATH,
                                "a.txt",
                                CREATE_DATATYPE,
                                "NO",
                                BODY,
                                "{\"data\": \"x\"}"),
                "DELETE_FILE", () -> Map.of(COMMAND, "DELETE_FILE", BUCKET, BUCKET_NAME, PATH, "a.txt"));
        return fields.get(command).get();
    }

    private static MockResponse nonS3Error(String response) {
        return switch (response) {
            case "html-403" ->
                S3WireServer.nonS3Error("HTTP/1.1 403 Forbidden", "text/html", "<html><body>Forbidden</body></html>");
            case "empty-403" -> S3WireServer.nonS3Error("HTTP/1.1 403 Forbidden", null, null);
            case "text-502" -> S3WireServer.nonS3Error("HTTP/1.1 502 Bad Gateway", "text/plain", "bad gateway");
            default -> throw new IllegalArgumentException(response);
        };
    }

    /** A client-side failure: the user sees the plugin's generic message, not the SDK's. */
    private static void assertGenericQueryExecutionError(ActionExecutionResult result) {
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(result.getTitle()).isEqualTo("Query execution error");
        assertThat(result.getPluginErrorDetails().getAppsmithErrorCode()).isEqualTo("PE-AS3-5000");
        assertThat(result.getReadableError()).isEqualTo(QUERY_EXECUTION_FAILED_ERROR_MSG);
        assertThat(result.getBody()).isEqualTo(QUERY_EXECUTION_FAILED_ERROR_MSG);
    }

    /** The path of a bucket-level request; a trailing slash after the bucket name addresses the same bucket. */
    private static String bucketPath(Request request) {
        String path = request.path();
        return path.length() > 1 && path.endsWith("/") ? path.substring(0, path.length() - 1) : path;
    }

    /** A query parameter's decoded value; an absent parameter reads as empty, as S3 treats it. */
    private static String decodedQueryValue(Request request, String name) {
        String raw = request.query().get(name);
        return raw == null ? "" : URLDecoder.decode(raw, StandardCharsets.UTF_8);
    }

    private void assertAddressedToBucket(String provider, Request request) {
        if (provider.equals(MINIO)) {
            assertThat(request.host()).isEqualTo(server.hostAndPort());
            assertThat(request.path()).startsWith("/" + BUCKET_NAME);
        } else {
            assertThat(request.host()).isEqualTo(BUCKET_NAME + "." + server.hostAndPort());
        }
    }

    private void assertSinglePutWithoutChecksums(String provider, Request put, String key, byte[] payload) {
        assertThat(put.method()).isEqualTo("PUT");
        assertAddressedToBucket(provider, put);
        assertThat(put.key(BUCKET_NAME)).isEqualTo(key);
        assertThat(put.query()).isEmpty();
        assertThat(put.payload()).isEqualTo(payload);
        assertThat(put.header("Content-MD5")).isEqualTo(md5Base64(payload));
        assertNoFlexibleChecksumHeaders(put);
    }

    private static void assertNoFlexibleChecksumHeaders(Request request) {
        assertThat(request.headers().keySet())
                .noneMatch(name -> name.startsWith("x-amz-checksum-"))
                .doesNotContain("x-amz-sdk-checksum-algorithm", "x-amz-trailer");
    }

    /**
     * The URL stops being valid (signing time + X-Amz-Expires) at the urlExpiryDate the plugin returns, and
     * X-Amz-Expires is the requested duration. Both are compared to within two seconds: the signing time is truncated
     * to the second, and the duration is counted from the moment of signing to the expiry date.
     */
    private static void assertConsistentExpiry(Map<String, String> query, String urlExpiryDate, Duration requested) {
        Instant signedAt = Instant.from(AMZ_DATE.parse(query.get("X-Amz-Date")));
        long expiresSeconds = Long.parseLong(query.get("X-Amz-Expires"));
        Instant validUntil = signedAt.plusSeconds(expiresSeconds);
        Instant reportedExpiry = parseUrlExpiryDate(urlExpiryDate);
        assertThat(Duration.between(validUntil, reportedExpiry).abs()).isLessThanOrEqualTo(Duration.ofSeconds(2));
        assertThat(Math.abs(expiresSeconds - requested.toSeconds())).isLessThanOrEqualTo(2);
    }

    private static Instant parseUrlExpiryDate(String urlExpiryDate) {
        try {
            return new SimpleDateFormat("dd MMM yyyy HH:mm:ss:SSS z")
                    .parse(urlExpiryDate)
                    .toInstant();
        } catch (ParseException e) {
            throw new AssertionError("urlExpiryDate is not in the plugin's format: " + urlExpiryDate, e);
        }
    }
}

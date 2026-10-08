package com.external.plugins;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceTestResult;
import com.external.utils.S3Connection;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Random;

import static com.external.plugins.S3TestFixtures.MAPPER;
import static com.external.plugins.S3TestFixtures.MINIO;
import static com.external.plugins.S3TestFixtures.action;
import static com.external.plugins.S3TestFixtures.allByteValues;
import static com.external.plugins.S3TestFixtures.awaitValue;
import static com.external.plugins.S3TestFixtures.noParams;
import static com.external.plugins.S3TestFixtures.sha256Hex;
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
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Runs every plugin command end to end against a real MinIO server, and fetches each presigned URL the plugin returns
 * with a plain HTTP GET: the only check that the presigned URLs are actually accepted by a server.
 */
@Testcontainers
class AmazonS3PluginMinioIntegrationTest {

    /** MinIO RELEASE.2026-09-22T19-25-18Z. */
    private static final DockerImageName MINIO_IMAGE = DockerImageName.parse(
            "cgr.dev/chainguard/minio@sha256:9dcc028b309030afa86fc1fc8d93907ae373ea3fb75277cca3fc77e4645932b7");

    private static final String ACCESS_KEY = "appsmith-test";
    private static final String SECRET_KEY = "appsmith-test-secret";
    private static final String BUCKET_NAME = "plugin-it";
    private static final String MINIO_REGION = "us-east-1";

    @Container
    private static final GenericContainer<?> MINIO_CONTAINER = new GenericContainer<>(MINIO_IMAGE)
            .withEnv("MINIO_ROOT_USER", ACCESS_KEY)
            .withEnv("MINIO_ROOT_PASSWORD", SECRET_KEY)
            .withCommand("server", "/tmp/data")
            .withExposedPorts(9000)
            .waitingFor(Wait.forHttp("/minio/health/live").forPort(9000).forStatusCode(200));

    private static final HttpClient HTTP = HttpClient.newHttpClient();

    private static final AmazonS3Plugin.S3PluginExecutor EXECUTOR = new AmazonS3Plugin.S3PluginExecutor();
    private static S3Connection connection;

    @BeforeAll
    static void createBucketAndConnect() throws Exception {
        createBucket(BUCKET_NAME);
        connection = awaitValue(EXECUTOR.datasourceCreate(datasource(SECRET_KEY)));
    }

    @AfterAll
    static void disconnect() {
        EXECUTOR.datasourceDestroy(connection);
    }

    @Test
    void should_storeTextAndReturnWorkingPresignedUrl_when_uploadingTextWithType() throws Exception {
        // Given
        Map<String, Object> fields = Map.of(
                COMMAND, "UPLOAD_FILE_FROM_BODY",
                BUCKET, BUCKET_NAME,
                PATH, "single/hello wörld+plus.txt",
                CREATE_DATATYPE, "NO",
                CREATE_EXPIRY, "5",
                BODY, "{\"type\": \"text/plain\", \"data\": \"hello from the plugin\"}");

        // When
        ActionExecutionResult result = execute(fields);

        // Then
        assertThat(result.getIsExecutionSuccess())
                .as(String.valueOf(result.getBody()))
                .isTrue();
        Map<?, ?> body = (Map<?, ?>) result.getBody();
        HttpResponse<byte[]> fetched = get((String) body.get("signedUrl"));
        assertThat(fetched.statusCode()).isEqualTo(200);
        assertThat(new String(fetched.body(), StandardCharsets.UTF_8)).isEqualTo("hello from the plugin");
        assertThat(fetched.headers().firstValue("Content-Type")).contains("text/plain");
        assertThat(body.get("url")).isEqualTo(endpoint() + "/" + BUCKET_NAME + "/single/hello%20w%C3%B6rld%2Bplus.txt");
    }

    @Test
    void should_storeDecodedBytes_when_uploadingBase64FromFilePicker() throws Exception {
        // Given
        byte[] bytes = allByteValues();
        Map<String, Object> fields = base64Upload("single/all-bytes.bin", bytes);

        // When
        ActionExecutionResult result = execute(fields);

        // Then
        assertThat(result.getIsExecutionSuccess())
                .as(String.valueOf(result.getBody()))
                .isTrue();
        HttpResponse<byte[]> fetched = get((String) ((Map<?, ?>) result.getBody()).get("signedUrl"));
        assertThat(fetched.statusCode()).isEqualTo(200);
        assertThat(fetched.body()).isEqualTo(bytes);
    }

    /** An upload of more than 16 MB is stored byte for byte. */
    @Test
    void should_storeEveryByte_when_uploadingMoreThanSixteenMegabytes() throws Exception {
        // Given
        byte[] bytes = new byte[17 * 1024 * 1024 + 7];
        new Random(42).nextBytes(bytes);
        Map<String, Object> fields = base64Upload("large/seventeen-megabytes.bin", bytes);

        // When
        ActionExecutionResult result = execute(fields);

        // Then
        assertThat(result.getIsExecutionSuccess())
                .as(String.valueOf(result.getBody()))
                .isTrue();
        HttpResponse<byte[]> fetched = get((String) ((Map<?, ?>) result.getBody()).get("signedUrl"));
        assertThat(fetched.statusCode()).isEqualTo(200);
        assertThat(fetched.body()).hasSize(bytes.length);
        assertThat(sha256Hex(fetched.body())).isEqualTo(sha256Hex(bytes));
    }

    @Test
    void should_storeEveryFileAndReturnWorkingPresignedUrls_when_uploadingMultipleFiles() throws Exception {
        // Given
        Map<String, Object> fields = Map.of(
                COMMAND, "UPLOAD_MULTIPLE_FILES_FROM_BODY",
                BUCKET, BUCKET_NAME,
                PATH, "multi/",
                CREATE_DATATYPE, "NO",
                CREATE_EXPIRY, "5",
                BODY,
                        "[{\"name\": \"one.txt\", \"type\": \"text/plain\", \"data\": \"one\"},"
                                + " {\"name\": \"zwei ü.txt\", \"data\": \"two\"}]");

        // When
        ActionExecutionResult result = execute(fields);

        // Then
        assertThat(result.getIsExecutionSuccess())
                .as(String.valueOf(result.getBody()))
                .isTrue();
        List<?> signedUrls = (List<?>) ((Map<?, ?>) result.getBody()).get("signedUrls");
        assertThat(signedUrls).hasSize(2);
        assertThat(new String(get((String) signedUrls.get(0)).body(), StandardCharsets.UTF_8))
                .isEqualTo("one");
        assertThat(new String(get((String) signedUrls.get(1)).body(), StandardCharsets.UTF_8))
                .isEqualTo("two");
    }

    @Test
    void should_listKeysUnderPrefixWithWorkingPresignedUrls_when_listingWithSignedUrls() throws Exception {
        // Given
        upload("listed/a.txt", "alpha");
        upload("listed/sub dir/b+c.txt", "bravo");
        upload("not-listed.txt", "charlie");
        Map<String, Object> fields = Map.of(
                COMMAND, "LIST",
                BUCKET, BUCKET_NAME,
                LIST_PREFIX, "listed/",
                LIST_SIGNED_URL, "YES",
                LIST_EXPIRY, "5",
                LIST_UNSIGNED_URL, "YES");

        // When
        ActionExecutionResult result = execute(fields);

        // Then
        assertThat(result.getIsExecutionSuccess())
                .as(String.valueOf(result.getBody()))
                .isTrue();
        JsonNode files = MAPPER.valueToTree(result.getBody());
        assertThat(files.findValuesAsText("fileName")).containsExactly("listed/a.txt", "listed/sub dir/b+c.txt");
        assertThat(files.findValuesAsText("url"))
                .containsExactly(
                        endpoint() + "/" + BUCKET_NAME + "/listed/a.txt",
                        endpoint() + "/" + BUCKET_NAME + "/listed/sub%20dir/b%2Bc.txt");
        assertThat(new String(get(files.get(0).get("signedUrl").asText()).body(), StandardCharsets.UTF_8))
                .isEqualTo("alpha");
        assertThat(new String(get(files.get(1).get("signedUrl").asText()).body(), StandardCharsets.UTF_8))
                .isEqualTo("bravo");
    }

    @Test
    void should_returnText_when_readingFileWithoutBase64() {
        // Given
        upload("read/text.txt", "grüße\n");

        // When
        ActionExecutionResult result =
                execute(Map.of(COMMAND, "READ_FILE", BUCKET, BUCKET_NAME, PATH, "read/text.txt", READ_DATATYPE, "NO"));

        // Then
        assertThat(((Map<?, ?>) result.getBody()).get("fileData")).isEqualTo("grüße\n");
    }

    @Test
    void should_returnBase64_when_readingFileWithBase64() {
        // Given
        upload("read/base64.txt", "grüße\n");

        // When
        ActionExecutionResult result = execute(
                Map.of(COMMAND, "READ_FILE", BUCKET, BUCKET_NAME, PATH, "read/base64.txt", READ_DATATYPE, "YES"));

        // Then
        assertThat(((Map<?, ?>) result.getBody()).get("fileData"))
                .isEqualTo(Base64.getEncoder().encodeToString(utf8("grüße\n")));
    }

    @Test
    void should_removeObject_when_deletingFile() {
        // Given
        upload("delete/one.txt", "x");

        // When
        ActionExecutionResult result =
                execute(Map.of(COMMAND, "DELETE_FILE", BUCKET, BUCKET_NAME, PATH, "delete/one.txt"));

        // Then
        assertThat(result.getIsExecutionSuccess()).isTrue();
        assertThat(listFileNames("delete/")).isEmpty();
    }

    @Test
    void should_removeEveryObject_when_deletingMultipleFiles() {
        // Given
        upload("delete-many/a.txt", "a");
        upload("delete-many/b c.txt", "b");
        upload("delete-many/keep.txt", "k");

        // When
        ActionExecutionResult result = execute(Map.of(
                COMMAND,
                "DELETE_MULTIPLE_FILES",
                BUCKET,
                BUCKET_NAME,
                PATH,
                "[\"delete-many/a.txt\", \"delete-many/b c.txt\"]"));

        // Then
        assertThat(result.getIsExecutionSuccess())
                .as(String.valueOf(result.getBody()))
                .isTrue();
        assertThat(listFileNames("delete-many/")).containsExactly("delete-many/keep.txt");
    }

    @Test
    void should_listBucketAsTable_when_structureIsFetched() {
        // Given
        DatasourceConfiguration configuration = datasource(SECRET_KEY);

        // When
        Mono<DatasourceStructure> structure = EXECUTOR.getStructure(connection, configuration);

        // Then
        StepVerifier.create(structure)
                .assertNext(actual -> assertThat(actual.getTables())
                        .extracting(DatasourceStructure.Table::getName)
                        .contains(BUCKET_NAME))
                .verifyComplete();
    }

    @Test
    void should_passDatasourceTest_when_credentialsAreValid() {
        // Given
        DatasourceConfiguration configuration = datasource(SECRET_KEY);

        // When
        Mono<DatasourceTestResult> result = EXECUTOR.testDatasource(configuration);

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> assertThat(actual.getInvalids()).isEmpty())
                .verifyComplete();
    }

    @Test
    void should_reportSignatureMismatch_when_secretKeyIsWrong() {
        // Given
        DatasourceConfiguration configuration = datasource("not-the-secret");

        // When
        Mono<DatasourceTestResult> result = EXECUTOR.testDatasource(configuration);

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> assertThat(actual.getInvalids())
                        .singleElement()
                        .asString()
                        .startsWith("SignatureDoesNotMatch: "))
                .verifyComplete();
    }

    private static DatasourceConfiguration datasource(String secretKey) {
        return S3TestFixtures.datasource(MINIO, endpoint(), "", BUCKET_NAME, ACCESS_KEY, secretKey);
    }

    private static String endpoint() {
        return "http://" + MINIO_CONTAINER.getHost() + ":" + MINIO_CONTAINER.getMappedPort(9000);
    }

    private static ActionExecutionResult execute(Map<String, Object> fields) {
        return awaitValue(
                EXECUTOR.executeParameterized(connection, noParams(), datasource(SECRET_KEY), action(fields)));
    }

    /** The fields of an upload of the bytes as a base64 data URL, as the file picker sends them. */
    private static Map<String, Object> base64Upload(String key, byte[] bytes) {
        String dataUrl =
                "data:application/octet-stream;base64," + Base64.getEncoder().encodeToString(bytes);
        return Map.of(
                COMMAND,
                "UPLOAD_FILE_FROM_BODY",
                BUCKET,
                BUCKET_NAME,
                PATH,
                key,
                CREATE_DATATYPE,
                "YES",
                BODY,
                "{\"type\": \"application/octet-stream\", \"data\": \"" + dataUrl + "\"}");
    }

    private static void upload(String key, String text) {
        ActionExecutionResult result = execute(Map.of(
                COMMAND,
                "UPLOAD_FILE_FROM_BODY",
                BUCKET,
                BUCKET_NAME,
                PATH,
                key,
                CREATE_DATATYPE,
                "NO",
                BODY,
                "{\"data\": \"" + text.replace("\n", "\\n") + "\"}"));
        assertThat(result.getIsExecutionSuccess())
                .as(String.valueOf(result.getBody()))
                .isTrue();
    }

    private static List<String> listFileNames(String prefix) {
        ActionExecutionResult result =
                execute(Map.of(COMMAND, "LIST", BUCKET, BUCKET_NAME, LIST_PREFIX, prefix, LIST_SIGNED_URL, "NO"));
        assertThat(result.getIsExecutionSuccess())
                .as(String.valueOf(result.getBody()))
                .isTrue();
        return ((JsonNode) MAPPER.valueToTree(result.getBody())).findValuesAsText("fileName");
    }

    private static HttpResponse<byte[]> get(String url) throws Exception {
        return HTTP.send(
                HttpRequest.newBuilder(URI.create(url)).GET().build(), HttpResponse.BodyHandlers.ofByteArray());
    }

    /** Creates a bucket with a SigV4-signed {@code PUT /<bucket>}, independently of the plugin and its SDK. */
    private static void createBucket(String bucket) throws Exception {
        Instant now = Instant.now();
        String amzDate = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'")
                .withZone(ZoneOffset.UTC)
                .format(now);
        String date = amzDate.substring(0, 8);
        String host = MINIO_CONTAINER.getHost() + ":" + MINIO_CONTAINER.getMappedPort(9000);
        String payloadHash = sha256Hex(new byte[0]);
        String canonicalRequest = String.join(
                "\n",
                "PUT",
                "/" + bucket,
                "",
                "host:" + host,
                "x-amz-content-sha256:" + payloadHash,
                "x-amz-date:" + amzDate,
                "",
                "host;x-amz-content-sha256;x-amz-date",
                payloadHash);
        String scope = date + "/" + MINIO_REGION + "/s3/aws4_request";
        String stringToSign = String.join(
                "\n", "AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonicalRequest.getBytes(StandardCharsets.UTF_8)));
        byte[] key = hmac(("AWS4" + SECRET_KEY).getBytes(StandardCharsets.UTF_8), date);
        key = hmac(key, MINIO_REGION);
        key = hmac(key, "s3");
        key = hmac(key, "aws4_request");
        String signature = HexFormat.of().formatHex(hmac(key, stringToSign));
        HttpRequest request = HttpRequest.newBuilder(URI.create(endpoint() + "/" + bucket))
                .PUT(HttpRequest.BodyPublishers.noBody())
                .header("x-amz-content-sha256", payloadHash)
                .header("x-amz-date", amzDate)
                .header(
                        "Authorization",
                        "AWS4-HMAC-SHA256 Credential=" + ACCESS_KEY + "/" + scope
                                + ", SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=" + signature)
                .build();
        HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).as(response.body()).isEqualTo(200);
    }

    private static byte[] hmac(byte[] key, String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
    }
}

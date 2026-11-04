package com.external.plugins;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
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

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;

import static com.external.plugins.S3TestFixtures.AMAZON;
import static com.external.plugins.S3TestFixtures.BUCKET_NAME;
import static com.external.plugins.S3TestFixtures.MAPPER;
import static com.external.plugins.S3TestFixtures.action;
import static com.external.plugins.S3TestFixtures.awaitValue;
import static com.external.plugins.S3TestFixtures.credentialScopeRegion;
import static com.external.plugins.S3TestFixtures.noParams;
import static com.external.plugins.constants.FieldName.BUCKET;
import static com.external.plugins.constants.FieldName.COMMAND;
import static com.external.plugins.constants.FieldName.LIST_EXPIRY;
import static com.external.plugins.constants.FieldName.LIST_SIGNED_URL;
import static com.external.plugins.constants.FieldName.LIST_UNSIGNED_URL;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Presigned URLs for the Amazon S3 provider are signed for the region the bucket is in, which the plugin looks up once
 * per bucket and connection. The SDK's {@code aws.endpointUrlS3} system property points the client and the presigner
 * at a local server for the duration of each test; virtual-hosted requests for {@code <bucket>.localhost} reach it
 * through {@link LoopbackSubdomainResolverProvider}.
 */
class AmazonS3PluginAmazonRegionWireTest {

    private static final String ENDPOINT_PROPERTY = "aws.endpointUrlS3";
    private static final String BUCKET_REGION_HEADER = "x-amz-bucket-region";

    private final AmazonS3Plugin.S3PluginExecutor executor = new AmazonS3Plugin.S3PluginExecutor();
    private S3WireServer server;
    private S3Connection connection;
    private String previousEndpoint;

    @BeforeEach
    void startServer() throws IOException {
        server = new S3WireServer();
        previousEndpoint = System.getProperty(ENDPOINT_PROPERTY);
        System.setProperty(ENDPOINT_PROPERTY, server.endpoint());
        connection = awaitValue(executor.datasourceCreate(datasource()));
    }

    @AfterEach
    void stopServer() throws IOException {
        executor.datasourceDestroy(connection);
        if (previousEndpoint == null) {
            System.clearProperty(ENDPOINT_PROPERTY);
        } else {
            System.setProperty(ENDPOINT_PROPERTY, previousEndpoint);
        }
        server.close();
    }

    @Test
    void should_presignForBucketRegion_when_bucketIsInAnotherRegion() {
        // Given
        server.respond(request -> request.method().equals("HEAD")
                ? new MockResponse().setResponseCode(200).addHeader(BUCKET_REGION_HEADER, "eu-central-1")
                : S3WireServer.listPage(request, BUCKET_NAME, List.of("a.txt"), false));

        // When
        JsonNode file = listWithSignedUrls().get(0);

        // Then
        assertThat(credentialScopeRegion(file.get("signedUrl").asText())).isEqualTo("eu-central-1");
        assertThat(file.get("url").asText()).isEqualTo("http://" + BUCKET_NAME + "." + server.hostAndPort() + "/a.txt");
        assertThat(headRequests()).hasSize(1);
    }

    /** A request the service redirects to the bucket's region is sent again, signed for that region. */
    @Test
    void should_retryInBucketRegion_when_requestIsRedirectedToAnotherRegion() {
        // Given
        server.respond(request -> {
            String authorization = request.header("Authorization");
            if (request.method().equals("GET") && !authorization.contains("/eu-central-1/")) {
                return S3WireServer.error(301, "PermanentRedirect", "Use the bucket's region.")
                        .addHeader(BUCKET_REGION_HEADER, "eu-central-1");
            }
            return S3WireServer.listPage(request, BUCKET_NAME, List.of("a.txt"), false);
        });

        // When
        ActionExecutionResult result = awaitValue(executor.executeParameterized(
                connection, noParams(), datasource(), action(Map.of(COMMAND, "LIST", BUCKET, BUCKET_NAME))));

        // Then
        assertThat(result.getIsExecutionSuccess())
                .as(String.valueOf(result.getBody()))
                .isTrue();
        List<Request> lists = server.requests().stream()
                .filter(request -> request.method().equals("GET"))
                .toList();
        assertThat(lists).hasSize(2);
        assertThat(lists.get(0).header("Authorization")).contains("/us-west-2/s3/aws4_request");
        assertThat(lists.get(1).header("Authorization")).contains("/eu-central-1/s3/aws4_request");
    }

    @Test
    void should_lookUpBucketRegionOnce_when_urlsArePresignedRepeatedly() {
        // Given
        server.respond(request -> request.method().equals("HEAD")
                ? new MockResponse().setResponseCode(200).addHeader(BUCKET_REGION_HEADER, "eu-central-1")
                : S3WireServer.listPage(request, BUCKET_NAME, List.of("a.txt", "b.txt"), false));

        // When
        listWithSignedUrls();
        JsonNode files = listWithSignedUrls();

        // Then
        assertThat(files.findValuesAsText("signedUrl"))
                .extracting(S3TestFixtures::credentialScopeRegion)
                .containsExactly("eu-central-1", "eu-central-1");
        assertThat(headRequests()).hasSize(1);
    }

    @Test
    void should_presignForRegionInErrorResponse_when_bucketRegionLookupIsDenied() {
        // Given
        server.respond(request -> request.method().equals("HEAD")
                ? new MockResponse().setResponseCode(403).addHeader(BUCKET_REGION_HEADER, "ap-south-1")
                : S3WireServer.listPage(request, BUCKET_NAME, List.of("a.txt"), false));

        // When
        JsonNode file = listWithSignedUrls().get(0);

        // Then
        assertThat(credentialScopeRegion(file.get("signedUrl").asText())).isEqualTo("ap-south-1");
    }

    @Test
    void should_presignForDefaultRegionWithOneLookup_when_bucketRegionCannotBeDetermined() {
        // Given
        server.respond(request -> request.method().equals("HEAD")
                ? new MockResponse().setResponseCode(404)
                : S3WireServer.listPage(request, BUCKET_NAME, List.of("a.txt", "b.txt"), false));

        // When
        JsonNode files = listWithSignedUrls();

        // Then
        assertThat(files.findValuesAsText("signedUrl"))
                .extracting(S3TestFixtures::credentialScopeRegion)
                .containsExactly("us-west-2", "us-west-2");
        assertThat(headRequests()).hasSize(1);
    }

    /** A region the service names that is not a region name is not used; URLs are signed for the default region. */
    @ParameterizedTest(name = "{0} {1}")
    @MethodSource("responsesNamingRegionsThatAreNotRegionNames")
    void should_presignForDefaultRegion_when_bucketRegionInResponseIsNotARegionName(int status, String region) {
        // Given
        server.respond(request -> request.method().equals("HEAD")
                ? new MockResponse().setResponseCode(status).addHeader(BUCKET_REGION_HEADER, region)
                : S3WireServer.listPage(request, BUCKET_NAME, List.of("a.txt"), false));

        // When
        JsonNode file = listWithSignedUrls().get(0);

        // Then
        assertThat(credentialScopeRegion(file.get("signedUrl").asText())).isEqualTo("us-west-2");
        assertThat(headRequests()).hasSize(1);
    }

    static Stream<Arguments> responsesNamingRegionsThatAreNotRegionNames() {
        return Stream.of(200, 403).flatMap(status -> Stream.of("eu_central_1", "eu-central-1/extra", "a".repeat(64))
                .map(region -> Arguments.of(status, region)));
    }

    /** A failed lookup is not remembered: the next list looks the region up again and signs for it once found. */
    @Test
    void should_presignForBucketRegion_when_regionLookupSucceedsAfterFailing() {
        // Given
        AtomicInteger lookups = new AtomicInteger();
        server.respond(request -> {
            if (!request.method().equals("HEAD")) {
                return S3WireServer.listPage(request, BUCKET_NAME, List.of("a.txt", "b.txt"), false);
            }
            return lookups.incrementAndGet() == 1
                    ? new MockResponse().setResponseCode(403)
                    : new MockResponse().setResponseCode(200).addHeader(BUCKET_REGION_HEADER, "eu-central-1");
        });
        JsonNode beforeRegionIsFound = listWithSignedUrls();
        int lookupsBeforeRegionIsFound = headRequests().size();

        // When
        JsonNode files = listWithSignedUrls();

        // Then
        assertThat(beforeRegionIsFound.findValuesAsText("signedUrl"))
                .extracting(S3TestFixtures::credentialScopeRegion)
                .containsExactly("us-west-2", "us-west-2");
        assertThat(lookupsBeforeRegionIsFound).isEqualTo(1);
        assertThat(files.findValuesAsText("signedUrl"))
                .extracting(S3TestFixtures::credentialScopeRegion)
                .containsExactly("eu-central-1", "eu-central-1");
        assertThat(headRequests()).hasSize(2);
    }

    /** The files of a LIST with signed and unsigned URLs. */
    private JsonNode listWithSignedUrls() {
        ActionExecutionResult result = awaitValue(executor.executeParameterized(
                connection,
                noParams(),
                datasource(),
                action(Map.of(
                        COMMAND, "LIST",
                        BUCKET, BUCKET_NAME,
                        LIST_SIGNED_URL, "YES",
                        LIST_EXPIRY, "5",
                        LIST_UNSIGNED_URL, "YES"))));
        assertThat(result.getIsExecutionSuccess())
                .as(String.valueOf(result.getBody()))
                .isTrue();
        return MAPPER.valueToTree(result.getBody());
    }

    private List<Request> headRequests() {
        return server.requests().stream()
                .filter(request -> request.method().equals("HEAD"))
                .toList();
    }

    private static DatasourceConfiguration datasource() {
        return S3TestFixtures.datasource(AMAZON, "", "", "");
    }
}

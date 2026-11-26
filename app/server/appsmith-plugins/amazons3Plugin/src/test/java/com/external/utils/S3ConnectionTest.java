package com.external.utils;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.external.plugins.AmazonS3Plugin;
import com.external.utils.DatasourceUtils.S3ConnectionSettings;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentMatchers;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.core.client.config.SdkClientConfiguration;
import software.amazon.awssdk.core.client.config.SdkClientOption;
import software.amazon.awssdk.http.SdkHttpClient;
import software.amazon.awssdk.http.apache.ApacheHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketResponse;

import java.lang.reflect.Field;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;

import static com.external.plugins.constants.S3PluginConstants.S3_DRIVER;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class S3ConnectionTest {

    private static final String ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
    private static final String SECRET_KEY = "test-secret-key";

    private final AmazonS3Plugin.S3PluginExecutor executor = new AmazonS3Plugin.S3PluginExecutor();

    /**
     * Reads and uploads receive no bytes for as long as the service takes to respond, so the read timeout must cover
     * slow services. The SDK exposes no read-back of HTTP settings, so {@link #apacheRequestConfig} reads them from
     * the client's internals.
     */
    @ParameterizedTest
    @ValueSource(strings = {"amazon-s3", "minio"})
    void should_buildClientWithFiftySecondReadAndTenSecondConnectTimeouts_when_datasourceCreated(String provider) {
        // Given
        DatasourceConfiguration configuration = datasourceConfiguration(provider, "http://minio.example.com:9000");

        // When
        Mono<S3Connection> connection = executor.datasourceCreate(configuration);

        // Then
        StepVerifier.create(connection)
                .assertNext(created -> {
                    try (created) {
                        Object requestConfig = apacheRequestConfig(created.client());
                        assertThat(readField(requestConfig, "socketTimeout")).isEqualTo(Duration.ofSeconds(50));
                        assertThat(readField(requestConfig, "connectionTimeout"))
                                .isEqualTo(Duration.ofSeconds(10));
                    }
                })
                .verifyComplete();
    }

    @Test
    void should_loadS3ClientClass_when_driverIsResolved() throws ClassNotFoundException {
        // Given
        ClassLoader pluginClassLoader = AmazonS3Plugin.class.getClassLoader();

        // When
        Class<?> driver = Class.forName(S3_DRIVER, false, pluginClassLoader);

        // Then
        assertThat(driver).isEqualTo(S3Client.class);
    }

    @Test
    void should_closeConnectionOffTheCallerThread_when_datasourceDestroyed() {
        // Given
        S3Connection connection = mock(S3Connection.class);
        AtomicReference<Thread> closingThread = new AtomicReference<>();
        doAnswer(invocation -> {
                    closingThread.set(Thread.currentThread());
                    return null;
                })
                .when(connection)
                .close();

        // When
        executor.datasourceDestroy(connection);

        // Then
        verify(connection, timeout(5000)).close();
        assertThat(closingThread.get()).isNotNull().isNotSameAs(Thread.currentThread());
    }

    @ParameterizedTest
    @ValueSource(strings = {"minio", "google-cloud-storage"})
    void should_closeConnection_when_datasourceTestCompletes(String provider) {
        // Given
        S3Connection connection = mock(S3Connection.class);
        when(connection.client()).thenReturn(mock(S3Client.class));
        AmazonS3Plugin.S3PluginExecutor spiedExecutor = spy(new AmazonS3Plugin.S3PluginExecutor());
        doReturn(Mono.just(connection)).when(spiedExecutor).datasourceCreate(any());

        // When
        Mono<DatasourceTestResult> result =
                spiedExecutor.testDatasource(datasourceConfiguration(provider, "http://minio.example.com:9000"));

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> assertThat(actual.getInvalids()).isEmpty())
                .verifyComplete();
        verify(connection, timeout(5000)).close();
    }

    @Test
    void should_closeEveryPresignerAndTheClient_when_connectionIsClosed() {
        // Given
        CountingCredentialsProvider credentials = new CountingCredentialsProvider();
        S3Client client = mock(S3Client.class);
        when(client.headBucket(ArgumentMatchers.<Consumer<HeadBucketRequest.Builder>>any()))
                .thenReturn(HeadBucketResponse.builder()
                        .bucketRegion("eu-central-1")
                        .build());
        S3Connection connection =
                new S3Connection(new S3ConnectionSettings(credentials, Region.US_WEST_2, null, false, true), client);
        connection.unsignedUrl("my-bucket", "a.txt");
        connection.presignedGetUrls("my-bucket", List.of("a.txt"), () -> Duration.ofMinutes(5));

        // When
        connection.close();

        // Then
        assertThat(credentials.closes()).isEqualTo(2);
        verify(client).close();
    }

    /**
     * A connection keeps the regions of at most {@link S3Connection#MAX_KNOWN_BUCKET_REGIONS} buckets. Once more are
     * found, the least recently used bucket's region is dropped, and looked up again when that bucket is next used:
     * bucket-0, found first but used again before the overflow, is kept, and bucket-1 is dropped.
     */
    @Test
    void should_lookUpLeastRecentlyUsedBucketAgain_when_regionsOfMoreBucketsThanTheConnectionKeepsAreFound() {
        // Given
        S3Client client = mock(S3Client.class);
        List<String> lookedUpBuckets = new CopyOnWriteArrayList<>();
        when(client.headBucket(ArgumentMatchers.<Consumer<HeadBucketRequest.Builder>>any()))
                .thenAnswer(invocation -> {
                    HeadBucketRequest.Builder request = HeadBucketRequest.builder();
                    invocation
                            .<Consumer<HeadBucketRequest.Builder>>getArgument(0)
                            .accept(request);
                    lookedUpBuckets.add(request.build().bucket());
                    return HeadBucketResponse.builder()
                            .bucketRegion("eu-central-1")
                            .build();
                });
        int kept = S3Connection.MAX_KNOWN_BUCKET_REGIONS;
        try (S3Connection connection = new S3Connection(
                new S3ConnectionSettings(new CountingCredentialsProvider(), Region.US_WEST_2, null, false, true),
                client)) {
            for (int index = 0; index < kept; index++) {
                connection.presignedGetUrls("bucket-" + index, List.of("a.txt"), () -> Duration.ofMinutes(5));
            }
            connection.presignedGetUrls("bucket-0", List.of("a.txt"), () -> Duration.ofMinutes(5));
            connection.presignedGetUrls("bucket-" + kept, List.of("a.txt"), () -> Duration.ofMinutes(5));

            // When
            connection.presignedGetUrls("bucket-0", List.of("a.txt"), () -> Duration.ofMinutes(5));
            connection.presignedGetUrls("bucket-1", List.of("a.txt"), () -> Duration.ofMinutes(5));
        }

        // Then
        assertThat(lookedUpBuckets).hasSize(kept + 2);
        assertThat(lookedUpBuckets).filteredOn("bucket-0"::equals).hasSize(1);
        assertThat(lookedUpBuckets).filteredOn("bucket-1"::equals).hasSize(2);
    }

    /**
     * Once the connection is closed, presigned and unsigned URLs fail with an {@link IllegalStateException}, as calls
     * on the closed client do, and no presigner is built.
     */
    @Test
    void should_failWithIllegalStateAndBuildNoPresigner_when_urlIsRequestedAfterClose() {
        // Given
        CountingCredentialsProvider credentials = new CountingCredentialsProvider();
        S3Connection connection = new S3Connection(
                new S3ConnectionSettings(credentials, Region.US_WEST_2, null, false, false), mock(S3Client.class));
        connection.close();

        // When
        Throwable presigned = catchThrowable(
                () -> connection.presignedGetUrls("my-bucket", List.of("a.txt"), () -> Duration.ofMinutes(5)));
        Throwable unsigned = catchThrowable(() -> connection.unsignedUrl("my-bucket", "a.txt"));

        // Then
        assertThat(presigned).isInstanceOf(IllegalStateException.class).hasMessage(S3Connection.CLOSED_MESSAGE);
        assertThat(unsigned).isInstanceOf(IllegalStateException.class).hasMessage(S3Connection.CLOSED_MESSAGE);
        connection.close();
        assertThat(credentials.closes()).isZero();
    }

    @Test
    void should_showNeitherCredentialsNorEndpointUserInfo_when_settingsArePrinted() {
        // Given
        DatasourceConfiguration configuration =
                datasourceConfiguration("minio", "https://endpoint-user:endpoint-pass@minio.example.com:9000");

        // When
        String printed = DatasourceUtils.getS3ConnectionSettings(configuration).toString();

        // Then
        assertThat(printed)
                .doesNotContain(ACCESS_KEY)
                .doesNotContain(SECRET_KEY)
                .doesNotContain("endpoint-user")
                .doesNotContain("endpoint-pass")
                .contains("minio.example.com");
    }

    /**
     * The Apache request config of the HTTP client inside a built {@link S3Client}. This reads private SDK fields: if
     * an SDK upgrade moves them, this helper fails with the class and field it could not find. Re-point it at the new
     * field names; do not delete the timeout test, which is the only check that the client keeps its timeouts.
     */
    private static Object apacheRequestConfig(S3Client client) {
        Object s3Client = client;
        // The cross-region client of the Amazon S3 provider delegates to the client that holds the configuration.
        for (int depth = 0; depth < 5 && !hasField(s3Client, "clientConfiguration"); depth++) {
            s3Client = readField(s3Client, "delegate");
        }
        SdkClientConfiguration clientConfiguration =
                (SdkClientConfiguration) readField(s3Client, "clientConfiguration");
        SdkHttpClient httpClient = clientConfiguration.option(SdkClientOption.SYNC_HTTP_CLIENT);
        // The SDK wraps the HTTP client it builds from a builder; unwrap down to the Apache client.
        for (int depth = 0; depth < 5 && !(httpClient instanceof ApacheHttpClient); depth++) {
            httpClient = (SdkHttpClient) readField(httpClient, "delegate");
        }
        assertThat(httpClient)
                .as("S3 client's HTTP client; re-point apacheRequestConfig if the SDK changed its wrapping")
                .isInstanceOf(ApacheHttpClient.class);
        return readField(httpClient, "requestConfig");
    }

    private static boolean hasField(Object target, String name) {
        for (Class<?> type = target.getClass(); type != null; type = type.getSuperclass()) {
            try {
                type.getDeclaredField(name);
                return true;
            } catch (NoSuchFieldException e) {
                // Look in the superclass.
            }
        }
        return false;
    }

    private static Object readField(Object target, String name) {
        for (Class<?> type = target.getClass(); type != null; type = type.getSuperclass()) {
            try {
                Field field = type.getDeclaredField(name);
                field.setAccessible(true);
                return field.get(target);
            } catch (NoSuchFieldException e) {
                // Look in the superclass.
            } catch (IllegalAccessException e) {
                throw new AssertionError("Cannot read " + type.getName() + "." + name, e);
            }
        }
        throw new AssertionError("AWS SDK internals changed: no field '" + name + "' on "
                + target.getClass().getName()
                + " or its superclasses. Re-point apacheRequestConfig/readField at the new field names;"
                + " do not delete the timeout test.");
    }

    private static DatasourceConfiguration datasourceConfiguration(String provider, String endpoint) {
        DBAuth authentication = new DBAuth();
        authentication.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authentication.setUsername(ACCESS_KEY);
        authentication.setPassword(SECRET_KEY);

        DatasourceConfiguration configuration = new DatasourceConfiguration();
        configuration.setAuthentication(authentication);
        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null); // index 0 is not used.
        properties.add(new Property("s3Provider", provider));
        properties.add(new Property("customRegion", ""));
        properties.add(new Property("default bucket", "my-bucket"));
        configuration.setProperties(properties);
        configuration.setEndpoints(List.of(new Endpoint(endpoint, null)));
        return configuration;
    }

    /** Credentials that count how often they are closed. */
    private static final class CountingCredentialsProvider implements AwsCredentialsProvider, AutoCloseable {

        private final AtomicInteger closes = new AtomicInteger();

        @Override
        public AwsCredentials resolveCredentials() {
            return AwsBasicCredentials.create(ACCESS_KEY, SECRET_KEY);
        }

        @Override
        public void close() {
            closes.incrementAndGet();
        }

        int closes() {
            return closes.get();
        }
    }
}

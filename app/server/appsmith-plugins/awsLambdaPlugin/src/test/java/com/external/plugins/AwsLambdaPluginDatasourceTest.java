package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.test.StepVerifier;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.client.config.SdkClientConfiguration;
import software.amazon.awssdk.core.client.config.SdkClientOption;
import software.amazon.awssdk.http.SdkHttpClient;
import software.amazon.awssdk.http.apache.ApacheHttpClient;
import software.amazon.awssdk.identity.spi.AwsCredentialsIdentity;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.lambda.LambdaClient;

import java.lang.reflect.Field;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

import static com.external.plugins.AwsLambdaPlugin.AwsLambdaPluginExecutor.INVALID_REGION_MESSAGE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

class AwsLambdaPluginDatasourceTest {

    private final AwsLambdaPlugin.AwsLambdaPluginExecutor pluginExecutor =
            new AwsLambdaPlugin.AwsLambdaPluginExecutor();

    @Test
    void should_useConfiguredRegionAndStaticCredentials_when_accessKeyAuthenticationIsUsed() {
        // Given
        DatasourceConfiguration configuration = datasourceConfiguration("accessKey", "eu-central-1");

        // When
        Mono<LambdaClient> client = pluginExecutor.datasourceCreate(configuration);

        // Then
        StepVerifier.create(client)
                .assertNext(created -> {
                    try (created) {
                        AwsCredentialsIdentity credentials = created.serviceClientConfiguration()
                                .credentialsProvider()
                                .resolveIdentity()
                                .join();
                        assertThat(created.serviceClientConfiguration().region())
                                .isEqualTo(Region.EU_CENTRAL_1);
                        assertThat(credentials.accessKeyId()).isEqualTo("test-access-key");
                        assertThat(credentials.secretAccessKey()).isEqualTo("test-secret-key");
                    }
                })
                .verifyComplete();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"  "})
    void should_defaultToUsEast1_when_regionIsBlank(String region) {
        // Given
        DatasourceConfiguration configuration = datasourceConfiguration("accessKey", region);

        // When
        Mono<LambdaClient> client = pluginExecutor.datasourceCreate(configuration);

        // Then
        StepVerifier.create(client)
                .assertNext(created -> {
                    try (created) {
                        assertThat(created.serviceClientConfiguration().region())
                                .isEqualTo(Region.US_EAST_1);
                    }
                })
                .verifyComplete();
    }

    @Test
    void should_useDefaultCredentialChain_when_instanceRoleAuthenticationIsUsed() {
        // Given
        DatasourceConfiguration configuration = datasourceConfiguration("instanceRole", "ap-south-1");

        // When
        Mono<LambdaClient> client = pluginExecutor.datasourceCreate(configuration);

        // Then
        StepVerifier.create(client)
                .assertNext(created -> {
                    try (created) {
                        assertThat(created.serviceClientConfiguration().credentialsProvider())
                                .isInstanceOf(DefaultCredentialsProvider.class);
                    }
                })
                .verifyComplete();
    }

    @ParameterizedTest
    @MethodSource("wellFormedRegions")
    void should_buildClientInRegion_when_regionIsWellFormed(String region) {
        // Given
        DatasourceConfiguration configuration = datasourceConfiguration("accessKey", region);

        // When
        Mono<LambdaClient> client = pluginExecutor.datasourceCreate(configuration);

        // Then
        StepVerifier.create(client)
                .assertNext(created -> {
                    try (created) {
                        assertThat(created.serviceClientConfiguration().region())
                                .isEqualTo(Region.of(region));
                    }
                })
                .verifyComplete();
    }

    /**
     * The region is free text in the datasource form and becomes part of the endpoint host name, so only AWS region
     * codes are accepted, and the check runs before the SDK sees the value.
     */
    @ParameterizedTest
    @MethodSource("malformedRegions")
    void should_rejectDatasourceCreation_when_regionIsMalformed(String region) {
        // Given
        DatasourceConfiguration configuration = datasourceConfiguration("accessKey", region);

        // When
        Mono<LambdaClient> client = pluginExecutor.datasourceCreate(configuration);

        // Then
        StepVerifier.create(client)
                .expectErrorSatisfies(error -> {
                    assertThat(error)
                            .isInstanceOf(AppsmithPluginException.class)
                            .hasMessage(INVALID_REGION_MESSAGE);
                    assertThat(((AppsmithPluginException) error).getError())
                            .isEqualTo(AppsmithPluginError.PLUGIN_DATASOURCE_ARGUMENT_ERROR);
                })
                .verify();
    }

    @ParameterizedTest
    @MethodSource("wellFormedRegions")
    void should_reportNoInvalids_when_regionIsWellFormed(String region) {
        // Given
        DatasourceConfiguration configuration = datasourceConfiguration("accessKey", region);

        // When
        var invalids = pluginExecutor.validateDatasource(configuration);

        // Then
        assertThat(invalids).isEmpty();
    }

    @ParameterizedTest
    @MethodSource("malformedRegions")
    void should_reportInvalidRegion_when_regionIsMalformed(String region) {
        // Given
        DatasourceConfiguration configuration = datasourceConfiguration("accessKey", region);

        // When
        var invalids = pluginExecutor.validateDatasource(configuration);

        // Then
        assertThat(invalids).containsExactly(INVALID_REGION_MESSAGE);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"  "})
    void should_reportNoInvalids_when_regionIsBlank(String region) {
        // Given
        DatasourceConfiguration configuration = datasourceConfiguration("accessKey", region);

        // When
        var invalids = pluginExecutor.validateDatasource(configuration);

        // Then
        assertThat(invalids).isEmpty();
    }

    @ParameterizedTest
    @MethodSource("propertiesWithoutRegion")
    void should_reportNoInvalids_when_regionPropertyIsMissing(List<Property> properties) {
        // Given
        DatasourceConfiguration configuration = datasourceConfiguration("accessKey", "unused");
        configuration.setProperties(properties);

        // When
        var invalids = pluginExecutor.validateDatasource(configuration);

        // Then
        assertThat(invalids).isEmpty();
    }

    @Test
    void should_buildClientOffTheSubscribingThread_when_datasourceCreated() {
        // Given
        DatasourceConfiguration configuration = spy(datasourceConfiguration("accessKey", "ap-south-1"));
        AtomicReference<String> buildingThread = new AtomicReference<>();
        doAnswer(invocation -> {
                    buildingThread.set(Thread.currentThread().getName());
                    return invocation.callRealMethod();
                })
                .when(configuration)
                .getAuthentication();
        Scheduler caller = Schedulers.newSingle("caller-event-loop");

        // When
        Mono<LambdaClient> client =
                Mono.defer(() -> pluginExecutor.datasourceCreate(configuration)).subscribeOn(caller);

        // Then
        try {
            StepVerifier.create(client).assertNext(created -> created.close()).verifyComplete();
        } finally {
            caller.dispose();
        }
        assertThat(buildingThread.get()).isNotNull().doesNotStartWith("caller-event-loop");
    }

    /**
     * A synchronous invoke receives no bytes until the function returns, so a read timeout shorter than the function's
     * run time fails the call. The SDK exposes no read-back of HTTP settings, so {@link #apacheRequestConfig} reads
     * them from the client's internals.
     */
    @Test
    void should_buildClientWithFiftySecondReadAndTenSecondConnectTimeouts_when_datasourceCreated() {
        // Given
        DatasourceConfiguration configuration = datasourceConfiguration("accessKey", "us-east-1");

        // When
        Mono<LambdaClient> client = pluginExecutor.datasourceCreate(configuration);

        // Then
        StepVerifier.create(client)
                .assertNext(created -> {
                    try (created) {
                        Object requestConfig = apacheRequestConfig(created);
                        assertThat(readField(requestConfig, "socketTimeout")).isEqualTo(Duration.ofSeconds(50));
                        assertThat(readField(requestConfig, "connectionTimeout"))
                                .isEqualTo(Duration.ofSeconds(10));
                    }
                })
                .verifyComplete();
    }

    @ParameterizedTest
    @MethodSource("propertiesWithoutRegion")
    void should_buildClientInUsEast1_when_regionPropertyIsMissing(List<Property> properties) {
        // Given
        DatasourceConfiguration configuration = datasourceConfiguration("accessKey", "unused");
        configuration.setProperties(properties);

        // When
        Mono<LambdaClient> client = pluginExecutor.datasourceCreate(configuration);

        // Then
        StepVerifier.create(client)
                .assertNext(created -> {
                    try (created) {
                        assertThat(created.serviceClientConfiguration().region())
                                .isEqualTo(Region.US_EAST_1);
                    }
                })
                .verifyComplete();
    }

    @Test
    void should_closeClientOffTheCallerThread_when_datasourceDestroyed() {
        // Given
        LambdaClient client = mock(LambdaClient.class);
        AtomicReference<Thread> closingThread = new AtomicReference<>();
        doAnswer(invocation -> {
                    closingThread.set(Thread.currentThread());
                    return null;
                })
                .when(client)
                .close();

        // When
        pluginExecutor.datasourceDestroy(client);

        // Then
        verify(client, timeout(5000)).close();
        assertThat(closingThread.get()).isNotNull().isNotSameAs(Thread.currentThread());
    }

    @Test
    void should_ignoreNullConnection_when_datasourceDestroyed() {
        // Given
        LambdaClient client = null;

        // When
        Throwable thrown = catchThrowable(() -> pluginExecutor.datasourceDestroy(client));

        // Then
        assertThat(thrown).isNull();
    }

    /**
     * With instanceRole authentication the default credential chain uses web identity tokens on EKS (IRSA), which the
     * SDK loads reflectively from the sts module. This checks that the module is on the plugin's classpath; under
     * surefire that is the module's test classpath, not pf4j's plugin class loader.
     */
    @Test
    void should_findStsWebIdentityClasses_when_stsModuleIsOnPluginClasspath() {
        // Given
        ClassLoader pluginClassLoader = AwsLambdaPlugin.class.getClassLoader();

        // When
        Throwable thrown = catchThrowable(() -> {
            Class.forName("software.amazon.awssdk.services.sts.StsClient", false, pluginClassLoader);
            Class.forName(
                    "software.amazon.awssdk.services.sts.internal.StsWebIdentityCredentialsProviderFactory",
                    false,
                    pluginClassLoader);
        });

        // Then
        assertThat(thrown).isNull();
    }

    static Stream<String> wellFormedRegions() {
        return Stream.of(
                "us-east-1",
                "ap-southeast-7",
                "mx-central-1",
                "us-gov-west-1",
                "cn-north-1",
                "cn-northwest-1",
                "us-iso-east-1",
                "us-isob-east-1",
                "eu-isoe-west-1",
                "eusc-de-east-1",
                "xx-future-9");
    }

    static Stream<String> malformedRegions() {
        return Stream.of(
                "us-east-1.attacker.example",
                "attacker.example",
                "US-EAST-1",
                "Us-east-1",
                " us-east-1",
                "us-east-1 ",
                "us-east-1\n",
                "us-east-1/attacker.example",
                "attacker.example#",
                "us-east-1@attacker.example",
                "us-east-1:443",
                "-us-east-1",
                "us--east-1",
                "us-east-1-",
                "useast1",
                "us-east",
                "localhost",
                "us-east-1a",
                "aa-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb-1");
    }

    static Stream<Arguments> propertiesWithoutRegion() {
        return Stream.of(
                Arguments.of((List<Property>) null),
                Arguments.of(new ArrayList<Property>()),
                Arguments.of(new ArrayList<>(Arrays.asList((Property) null))),
                Arguments.of(new ArrayList<>(Arrays.asList(null, null))));
    }

    /**
     * The Apache request config of the HTTP client inside a built {@link LambdaClient}. This reads private SDK fields:
     * if an SDK upgrade moves them, this helper fails with the class and field it could not find. Re-point it at the
     * new field names; do not delete the timeout test, which is the only check that the client keeps its timeouts.
     */
    private static Object apacheRequestConfig(LambdaClient client) {
        SdkClientConfiguration clientConfiguration = (SdkClientConfiguration) readField(client, "clientConfiguration");
        SdkHttpClient httpClient = clientConfiguration.option(SdkClientOption.SYNC_HTTP_CLIENT);
        // The SDK wraps the HTTP client it builds from a builder; unwrap down to the Apache client.
        for (int depth = 0; depth < 5 && !(httpClient instanceof ApacheHttpClient); depth++) {
            httpClient = (SdkHttpClient) readField(httpClient, "delegate");
        }
        assertThat(httpClient)
                .as("Lambda client's HTTP client; re-point apacheRequestConfig if the SDK changed its wrapping")
                .isInstanceOf(ApacheHttpClient.class);
        return readField(httpClient, "requestConfig");
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

    private static DatasourceConfiguration datasourceConfiguration(String authenticationType, String region) {
        DBAuth authentication = new DBAuth();
        authentication.setAuthenticationType(authenticationType);
        authentication.setUsername("test-access-key");
        authentication.setPassword("test-secret-key");

        DatasourceConfiguration configuration = new DatasourceConfiguration();
        configuration.setAuthentication(authentication);
        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null); // index 0 is not used.
        properties.add(new Property("region", region));
        configuration.setProperties(properties);
        return configuration;
    }
}

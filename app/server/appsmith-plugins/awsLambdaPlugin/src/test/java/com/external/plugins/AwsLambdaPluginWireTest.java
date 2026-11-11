package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import mockwebserver3.RecordedRequest;
import okio.Buffer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.lambda.LambdaClient;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.plugins.AwsLambdaPlugin.AwsLambdaPluginExecutor.HTTP_CONNECTION_TIMEOUT;
import static com.external.plugins.AwsLambdaPlugin.AwsLambdaPluginExecutor.HTTP_SOCKET_TIMEOUT;
import static com.external.plugins.AwsLambdaPlugin.AwsLambdaPluginExecutor.httpClientBuilder;
import static com.external.plugins.JsonFixtures.expectedJson;
import static com.external.plugins.JsonFixtures.prettyPrint;
import static com.external.plugins.JsonFixtures.resourceBytes;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Drives {@code execute(...)} with a real {@link LambdaClient} against a local HTTP server that answers like the Lambda
 * REST API, so the SDK's own unmarshalling of status codes, headers and bodies is part of what is tested.
 */
class AwsLambdaPluginWireTest {

    private final AwsLambdaPlugin.AwsLambdaPluginExecutor pluginExecutor =
            new AwsLambdaPlugin.AwsLambdaPluginExecutor();

    private MockWebServer server;
    private LambdaClient lambda;

    @BeforeEach
    void startServer() throws IOException {
        server = new MockWebServer();
        server.start();
        lambda = lambdaClient(HTTP_SOCKET_TIMEOUT);
    }

    @AfterEach
    void stopServer() throws IOException {
        lambda.close();
        server.shutdown();
    }

    /**
     * The response carries explicit nulls, fields the mapper does not emit (some unknown to the SDK), enum values the
     * SDK does not know, and a value beyond the double-precision integer range.
     */
    @Test
    void should_returnMappedFunctions_when_lambdaReturnsRealisticListFunctionsJson() {
        // Given
        server.enqueue(jsonResponse(200, resourceBytes("/wire/list-functions-response.json")));

        // When
        Mono<ActionExecutionResult> result = execute("LIST_FUNCTIONS", Map.of());

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> {
                    assertThat(actual.getIsExecutionSuccess()).isTrue();
                    assertThat(prettyPrint(actual.getBody()))
                            .isEqualTo(expectedJson("/wire/list-functions-expected.json"));
                })
                .verifyComplete();
    }

    @Test
    void should_returnNullBody_when_dryRunReturnsNoContent() throws InterruptedException {
        // Given
        server.enqueue(new MockResponse().setResponseCode(204).removeHeader("Content-Length"));

        // When
        Mono<ActionExecutionResult> result = invoke("DryRun");

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> {
                    assertThat(actual.getStatusCode()).isEqualTo("204");
                    assertThat(actual.getIsExecutionSuccess()).isTrue();
                    assertThat(actual.getBody()).isNull();
                })
                .verifyComplete();
        assertThat(takeInvocationType()).isEqualTo("DryRun");
    }

    @Test
    void should_returnEmptyBody_when_eventInvocationIsAcceptedWithEmptyBody() throws InterruptedException {
        // Given
        server.enqueue(new MockResponse().setResponseCode(202).setBody(""));

        // When
        Mono<ActionExecutionResult> result = invoke("Event");

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> {
                    assertThat(actual.getStatusCode()).isEqualTo("202");
                    assertThat(actual.getIsExecutionSuccess()).isTrue();
                    assertThat(actual.getBody()).isEqualTo("");
                })
                .verifyComplete();
        assertThat(takeInvocationType()).isEqualTo("Event");
    }

    @Test
    void should_returnJsonBody_when_requestResponseInvocationSucceeds() throws InterruptedException {
        // Given
        String payload = "{\"ok\":true,\"msg\":\"héllo ✓\"}";
        server.enqueue(jsonResponse(200, payload.getBytes(StandardCharsets.UTF_8)));

        // When
        Mono<ActionExecutionResult> result = invoke("RequestResponse");

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> {
                    assertThat(actual.getStatusCode()).isEqualTo("200");
                    assertThat(actual.getIsExecutionSuccess()).isTrue();
                    assertThat(actual.getBody()).isEqualTo(payload);
                })
                .verifyComplete();
        assertThat(takeInvocationType()).isEqualTo("RequestResponse");
    }

    @Test
    void should_markExecutionFailed_when_functionErrorHeaderIsPresent() {
        // Given
        server.enqueue(jsonResponse(200, "{\"errorMessage\":\"boom\"}".getBytes(StandardCharsets.UTF_8))
                .addHeader("X-Amz-Function-Error", "Unhandled"));

        // When
        Mono<ActionExecutionResult> result = invoke("RequestResponse");

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> {
                    assertThat(actual.getIsExecutionSuccess()).isFalse();
                    assertThat(actual.getBody()).isEqualTo("{\"errorMessage\":\"boom\"}");
                })
                .verifyComplete();
    }

    @Test
    void should_replaceMalformedBytes_when_payloadIsNotValidUtf8() {
        // Given
        // 0xC3 starts a two-byte sequence that '(' does not continue.
        byte[] payload = {'o', 'k', (byte) 0xC3, '('};
        server.enqueue(jsonResponse(200, payload));

        // When
        Mono<ActionExecutionResult> result = invoke("RequestResponse");

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> {
                    assertThat(actual.getIsExecutionSuccess()).isTrue();
                    assertThat(actual.getBody()).isEqualTo("ok�(");
                })
                .verifyComplete();
    }

    @Test
    void should_surfaceServiceMessage_when_functionIsNotFound() {
        // Given
        String message = "Function not found: arn:aws:lambda:us-east-1:123456789012:function:missing";
        server.enqueue(
                errorResponse(404, "ResourceNotFoundException", "{\"Type\":\"User\",\"Message\":\"" + message + "\"}"));

        // When
        Mono<ActionExecutionResult> result = invoke("RequestResponse");

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    assertThat(error)
                            .isInstanceOf(AppsmithPluginException.class)
                            .hasMessage(message);
                    assertThat(((AppsmithPluginException) error).getError())
                            .isEqualTo(AppsmithPluginError.PLUGIN_ERROR);
                })
                .verify();
    }

    @Test
    void should_includeServiceMessage_when_requestIsRejected() {
        // Given
        String message = "Could not parse request body into json: Unexpected end-of-input";
        server.enqueue(errorResponse(
                400, "InvalidRequestContentException", "{\"Type\":\"User\",\"message\":\"" + message + "\"}"));

        // When
        Mono<ActionExecutionResult> result = invoke("RequestResponse");

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithPluginException.class);
                    assertThat(((AppsmithPluginException) error).getError())
                            .isEqualTo(AppsmithPluginError.PLUGIN_ERROR);
                    assertThat(error.getMessage()).contains(message);
                })
                .verify();
    }

    /** {@code httpClientBuilder} applies the socket timeout it is given: a slower response fails the call. */
    @Test
    void should_failInvocation_when_responseTakesLongerThanSocketTimeout() {
        // Given
        lambda.close();
        lambda = lambdaClient(Duration.ofMillis(500));
        server.enqueue(jsonResponse(200, "{}".getBytes(StandardCharsets.UTF_8)).setHeadersDelay(1, TimeUnit.SECONDS));

        // When
        Mono<ActionExecutionResult> result = invoke("RequestResponse");

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> assertThat(error)
                        .isInstanceOf(AppsmithPluginException.class)
                        .hasMessageContaining("Read timed out"))
                .verify(Duration.ofSeconds(10));
    }

    private LambdaClient lambdaClient(Duration socketTimeout) {
        return LambdaClient.builder()
                .region(Region.US_EAST_1)
                .endpointOverride(URI.create("http://" + server.getHostName() + ":" + server.getPort()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create("test-access-key", "test-secret-key")))
                .httpClientBuilder(httpClientBuilder(socketTimeout, HTTP_CONNECTION_TIMEOUT))
                .overrideConfiguration(override -> override.retryStrategy(retry -> retry.maxAttempts(1)))
                .build();
    }

    private Mono<ActionExecutionResult> execute(String command, Map<String, String> formValues) {
        Map<String, Object> formData = new HashMap<>();
        setDataValueSafelyInFormData(formData, "command", command);
        formValues.forEach((key, value) -> setDataValueSafelyInFormData(formData, key, value));
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);
        return pluginExecutor.execute(lambda, new DatasourceConfiguration(), actionConfiguration);
    }

    private Mono<ActionExecutionResult> invoke(String invocationType) {
        return execute("INVOKE_FUNCTION", Map.of("functionName", "fn", "body", "{}", "invocationType", invocationType));
    }

    private String takeInvocationType() throws InterruptedException {
        RecordedRequest request = server.takeRequest(5, TimeUnit.SECONDS);
        assertThat(request).isNotNull();
        assertThat(request.getPath()).isEqualTo("/2015-03-31/functions/fn/invocations");
        return request.getHeader("X-Amz-Invocation-Type");
    }

    private static MockResponse jsonResponse(int status, byte[] body) {
        return new MockResponse()
                .setResponseCode(status)
                .addHeader("Content-Type", "application/json")
                .addHeader("x-amzn-RequestId", "req-wire-1")
                .setBody(new Buffer().write(body));
    }

    private static MockResponse errorResponse(int status, String errorType, String body) {
        return jsonResponse(status, body.getBytes(StandardCharsets.UTF_8)).addHeader("x-amzn-ErrorType", errorType);
    }
}

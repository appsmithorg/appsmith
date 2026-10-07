package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import software.amazon.awssdk.awscore.exception.AwsErrorDetails;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.AliasConfiguration;
import software.amazon.awssdk.services.lambda.model.AliasRoutingConfiguration;
import software.amazon.awssdk.services.lambda.model.DeadLetterConfig;
import software.amazon.awssdk.services.lambda.model.EnvironmentError;
import software.amazon.awssdk.services.lambda.model.EnvironmentResponse;
import software.amazon.awssdk.services.lambda.model.EphemeralStorage;
import software.amazon.awssdk.services.lambda.model.FileSystemConfig;
import software.amazon.awssdk.services.lambda.model.FunctionConfiguration;
import software.amazon.awssdk.services.lambda.model.ImageConfig;
import software.amazon.awssdk.services.lambda.model.ImageConfigError;
import software.amazon.awssdk.services.lambda.model.ImageConfigResponse;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;
import software.amazon.awssdk.services.lambda.model.LambdaException;
import software.amazon.awssdk.services.lambda.model.Layer;
import software.amazon.awssdk.services.lambda.model.ListAliasesRequest;
import software.amazon.awssdk.services.lambda.model.ListAliasesResponse;
import software.amazon.awssdk.services.lambda.model.ListFunctionsResponse;
import software.amazon.awssdk.services.lambda.model.ListVersionsByFunctionRequest;
import software.amazon.awssdk.services.lambda.model.ListVersionsByFunctionResponse;
import software.amazon.awssdk.services.lambda.model.LoggingConfig;
import software.amazon.awssdk.services.lambda.model.ResourceNotFoundException;
import software.amazon.awssdk.services.lambda.model.RuntimeVersionConfig;
import software.amazon.awssdk.services.lambda.model.RuntimeVersionError;
import software.amazon.awssdk.services.lambda.model.SnapStartResponse;
import software.amazon.awssdk.services.lambda.model.TracingConfigResponse;
import software.amazon.awssdk.services.lambda.model.VpcConfigResponse;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static com.external.plugins.JsonFixtures.expectedJson;
import static com.external.plugins.JsonFixtures.prettyPrint;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Pins the JSON shape of the plugin's responses. Users' apps bind to these keys and the trigger() dropdowns read
 * {@code functionName}, {@code version} and {@code name} from them, so the expected files under {@code golden/} are a
 * contract: a change to them is a user-visible change.
 *
 * <p>To add a field to the response: add it to the matching method in {@link AwsLambdaResponseMapper}, set it in the
 * fixture builders below, and add the key to the matching objects in the golden files. Key position matters: the
 * comparison checks key order, so place the key where the mapper emits it.
 */
class AwsLambdaPluginResponseContractTest {

    private final AwsLambdaPlugin.AwsLambdaPluginExecutor pluginExecutor =
            new AwsLambdaPlugin.AwsLambdaPluginExecutor();

    @ParameterizedTest
    @ValueSource(strings = {"LIST_FUNCTIONS", "LIST_FUNCTION_VERSIONS"})
    void should_returnGoldenFunctionConfigurationJson_when_listCommandExecuted(String command) {
        // Given
        LambdaClient lambda = mock(LambdaClient.class);
        List<FunctionConfiguration> functions = List.of(
                richFunctionConfiguration(), minimalFunctionConfiguration(), sparseNestedFunctionConfiguration());
        when(lambda.listFunctions())
                .thenReturn(ListFunctionsResponse.builder().functions(functions).build());
        when(lambda.listVersionsByFunction(any(ListVersionsByFunctionRequest.class)))
                .thenReturn(ListVersionsByFunctionResponse.builder()
                        .versions(functions)
                        .build());

        // When
        Mono<ActionExecutionResult> result = execute(lambda, command, Map.of("functionName", "orders-api"));

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> {
                    assertThat(actual.getIsExecutionSuccess()).isTrue();
                    assertThat(prettyPrint(actual.getBody()))
                            .isEqualTo(expectedJson("/golden/function-configurations.json"));
                })
                .verifyComplete();
    }

    @Test
    void should_redactEnvironmentVariableValues_when_listingFunctions() {
        // Given
        LambdaClient lambda = mock(LambdaClient.class);
        when(lambda.listFunctions())
                .thenReturn(ListFunctionsResponse.builder()
                        .functions(List.of(richFunctionConfiguration()))
                        .build());

        // When
        Mono<ActionExecutionResult> result = execute(lambda, "LIST_FUNCTIONS", Map.of("functionName", "orders-api"));

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> {
                    assertThat(actual.getIsExecutionSuccess()).isTrue();
                    String body = prettyPrint(actual.getBody());
                    // The variable names remain, but their secret values must never be serialized.
                    assertThat(body).contains("STAGE").contains("LOG_LEVEL");
                    assertThat(body).doesNotContain("prod").doesNotContain("debug");
                    assertThat(body).contains("[REDACTED]");
                })
                .verifyComplete();
    }

    @Test
    void should_returnGoldenAliasConfigurationJson_when_listFunctionAliasesExecuted() {
        // Given
        LambdaClient lambda = mock(LambdaClient.class);
        when(lambda.listAliases(any(ListAliasesRequest.class)))
                .thenReturn(ListAliasesResponse.builder()
                        .aliases(List.of(
                                richAliasConfiguration(),
                                minimalAliasConfiguration(),
                                sparseNestedAliasConfiguration()))
                        .build());

        // When
        Mono<ActionExecutionResult> result =
                execute(lambda, "LIST_FUNCTION_ALIASES", Map.of("functionName", "orders-api"));

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> {
                    assertThat(actual.getIsExecutionSuccess()).isTrue();
                    assertThat(prettyPrint(actual.getBody()))
                            .isEqualTo(expectedJson("/golden/alias-configurations.json"));
                })
                .verifyComplete();
    }

    @Test
    void should_offerSortedFunctionNames_when_triggerListsFunctions() {
        // Given
        LambdaClient lambda = mock(LambdaClient.class);
        when(lambda.listFunctions())
                .thenReturn(ListFunctionsResponse.builder()
                        .functions(List.of(minimalFunctionConfiguration(), richFunctionConfiguration()))
                        .build());

        // When
        Mono<TriggerResultDTO> result = trigger(lambda, "FUNCTION_NAMES");

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> assertThat(options(actual))
                        .containsExactly(
                                Map.of("label", "minimal-fn", "value", "minimal-fn"),
                                Map.of("label", "orders-api", "value", "orders-api")))
                .verifyComplete();
    }

    @Test
    void should_offerVersions_when_triggerListsFunctionVersions() {
        // Given
        LambdaClient lambda = mock(LambdaClient.class);
        when(lambda.listVersionsByFunction(any(ListVersionsByFunctionRequest.class)))
                .thenReturn(ListVersionsByFunctionResponse.builder()
                        .versions(List.of(
                                FunctionConfiguration.builder().version("7").build()))
                        .build());

        // When
        Mono<TriggerResultDTO> result = trigger(lambda, "FUNCTION_VERSIONS");

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> assertThat(options(actual)).containsExactly(Map.of("label", "7", "value", "7")))
                .verifyComplete();
    }

    @Test
    void should_offerAliasNames_when_triggerListsFunctionAliases() {
        // Given
        LambdaClient lambda = mock(LambdaClient.class);
        when(lambda.listAliases(any(ListAliasesRequest.class)))
                .thenReturn(ListAliasesResponse.builder()
                        .aliases(List.of(minimalAliasConfiguration()))
                        .build());

        // When
        Mono<TriggerResultDTO> result = trigger(lambda, "FUNCTION_ALIASES");

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> assertThat(options(actual))
                        .containsExactly(Map.of("label", "minimal-alias", "value", "minimal-alias")))
                .verifyComplete();
    }

    @Test
    void should_returnStatusCodeAndUtf8Body_when_invokeSucceeds() {
        // Given
        LambdaClient lambda = mock(LambdaClient.class);
        when(lambda.invoke(any(InvokeRequest.class)))
                .thenReturn(InvokeResponse.builder()
                        .statusCode(200)
                        .payload(SdkBytes.fromUtf8String("{\"ok\":true,\"msg\":\"héllo\"}"))
                        .build());

        // When
        Mono<ActionExecutionResult> result = executeInvoke(lambda, "{\"data\": 1}");

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> {
                    assertThat(actual.getStatusCode()).isEqualTo("200");
                    assertThat(actual.getIsExecutionSuccess()).isTrue();
                    assertThat(actual.getBody()).isEqualTo("{\"ok\":true,\"msg\":\"héllo\"}");
                })
                .verifyComplete();
    }

    @Test
    void should_markExecutionFailed_when_invokeReturnsFunctionError() {
        // Given
        LambdaClient lambda = mock(LambdaClient.class);
        when(lambda.invoke(any(InvokeRequest.class)))
                .thenReturn(InvokeResponse.builder()
                        .statusCode(200)
                        .functionError("Unhandled")
                        .payload(SdkBytes.fromUtf8String("{\"errorMessage\":\"boom\"}"))
                        .build());

        // When
        Mono<ActionExecutionResult> result = executeInvoke(lambda, "{}");

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> {
                    assertThat(actual.getStatusCode()).isEqualTo("200");
                    assertThat(actual.getIsExecutionSuccess()).isFalse();
                    assertThat(actual.getBody()).isEqualTo("{\"errorMessage\":\"boom\"}");
                })
                .verifyComplete();
    }

    @Test
    void should_sendBodyAndRawInvocationType_when_invokeExecuted() {
        // Given
        LambdaClient lambda = mock(LambdaClient.class);
        when(lambda.invoke(any(InvokeRequest.class)))
                .thenReturn(InvokeResponse.builder().statusCode(200).build());
        Map<String, Object> formData = new HashMap<>();
        formData.put("functionName", "orders-api");
        formData.put("body", "{\"data\": \"é\"}");
        formData.put("invocationType", "Event");

        // When
        Mono<ActionExecutionResult> result = execute(lambda, "INVOKE_FUNCTION", formData);

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> assertThat(actual.getStatusCode()).isEqualTo("200"))
                .verifyComplete();
        ArgumentCaptor<InvokeRequest> captor = ArgumentCaptor.forClass(InvokeRequest.class);
        verify(lambda).invoke(captor.capture());
        InvokeRequest request = captor.getValue();
        assertThat(request.functionName()).isEqualTo("orders-api");
        assertThat(request.invocationTypeAsString()).isEqualTo("Event");
        assertThat(request.payload().asUtf8String()).isEqualTo("{\"data\": \"é\"}");
    }

    @Test
    void should_invokeWithoutPayload_when_bodyIsNull() {
        // Given
        LambdaClient lambda = mock(LambdaClient.class);
        when(lambda.invoke(any(InvokeRequest.class)))
                .thenReturn(InvokeResponse.builder()
                        .statusCode(200)
                        .payload(SdkBytes.fromUtf8String("null"))
                        .build());

        // When
        Mono<ActionExecutionResult> result = executeInvoke(lambda, null);

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> {
                    assertThat(actual.getIsExecutionSuccess()).isTrue();
                    assertThat(actual.getBody()).isEqualTo("null");
                })
                .verifyComplete();
        ArgumentCaptor<InvokeRequest> captor = ArgumentCaptor.forClass(InvokeRequest.class);
        verify(lambda).invoke(captor.capture());
        assertThat(captor.getValue().payload()).isNull();
    }

    @Test
    void should_surfaceServiceErrorMessage_when_functionNotFound() {
        // Given
        LambdaClient lambda = mock(LambdaClient.class);
        when(lambda.invoke(any(InvokeRequest.class)))
                .thenThrow(resourceNotFound("Function not found: arn:aws:lambda:x:1:function:nope"));

        // When
        Mono<ActionExecutionResult> result = executeInvoke(lambda, "{}");

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    assertThat(error)
                            .isInstanceOf(AppsmithPluginException.class)
                            .hasMessage("Function not found: arn:aws:lambda:x:1:function:nope");
                    assertThat(((AppsmithPluginException) error).getError())
                            .isEqualTo(AppsmithPluginError.PLUGIN_ERROR);
                })
                .verify();
    }

    @Test
    void should_surfaceServiceMessage_when_serviceCallFails() {
        // Given
        LambdaClient lambda = mock(LambdaClient.class);
        when(lambda.invoke(any(InvokeRequest.class)))
                .thenThrow(serviceException("Rate exceeded", "TooManyRequestsException", 429));

        // When
        Mono<ActionExecutionResult> result = executeInvoke(lambda, "{}");

        // Then
        StepVerifier.create(result)
                .expectErrorSatisfies(error -> {
                    assertThat(error).isInstanceOf(AppsmithPluginException.class);
                    assertThat(((AppsmithPluginException) error).getError())
                            .isEqualTo(AppsmithPluginError.PLUGIN_ERROR);
                    assertThat(error.getMessage()).contains("Rate exceeded");
                })
                .verify();
    }

    @Test
    void should_reportSuccess_when_testDatasourceGetsAccessDenied() {
        // Given
        LambdaClient lambda = mock(LambdaClient.class);
        when(lambda.listFunctions()).thenThrow(serviceException("denied", "AccessDenied", 403));

        // When
        var result = pluginExecutor.testDatasource(lambda);

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> assertThat(actual.isSuccess()).isTrue())
                .verifyComplete();
    }

    @Test
    void should_reportServiceMessage_when_testDatasourceGetsOtherServiceError() {
        // Given
        LambdaClient lambda = mock(LambdaClient.class);
        when(lambda.listFunctions()).thenThrow(serviceException("Rate exceeded", "TooManyRequestsException", 429));

        // When
        var result = pluginExecutor.testDatasource(lambda);

        // Then
        StepVerifier.create(result)
                .assertNext(actual -> {
                    assertThat(actual.isSuccess()).isFalse();
                    assertThat(actual.getInvalids()).singleElement().asString().contains("Rate exceeded");
                })
                .verifyComplete();
    }

    // ---- Fixtures ----

    private static FunctionConfiguration richFunctionConfiguration() {
        Map<String, String> variables = new LinkedHashMap<>();
        variables.put("STAGE", "prod");
        variables.put("LOG_LEVEL", "debug");
        return FunctionConfiguration.builder()
                .functionName("orders-api")
                .functionArn("arn:aws:lambda:ap-south-1:123456789012:function:orders-api")
                .runtime("java17")
                .role("arn:aws:iam::123456789012:role/orders-api-role")
                .handler("com.example.Handler::handleRequest")
                .codeSize(5242880L)
                .description("Orders API")
                .timeout(30)
                .memorySize(512)
                .lastModified("2024-05-01T10:15:30.000+0000")
                .codeSha256("abc123sha=")
                .version("$LATEST")
                .vpcConfig(VpcConfigResponse.builder()
                        .subnetIds("subnet-1", "subnet-2")
                        .securityGroupIds("sg-1")
                        .vpcId("vpc-1")
                        .ipv6AllowedForDualStack(false)
                        .build())
                .deadLetterConfig(DeadLetterConfig.builder()
                        .targetArn("arn:aws:sqs:ap-south-1:123456789012:dlq")
                        .build())
                .environment(EnvironmentResponse.builder()
                        .variables(variables)
                        .error(EnvironmentError.builder()
                                .errorCode("KMSAccessDenied")
                                .message("cannot decrypt")
                                .build())
                        .build())
                .kmsKeyArn("arn:aws:kms:ap-south-1:123456789012:key/k-1")
                .tracingConfig(TracingConfigResponse.builder().mode("Active").build())
                .masterArn("arn:aws:lambda:us-east-1:123456789012:function:edge")
                .revisionId("rev-1")
                .layers(Layer.builder()
                        .arn("arn:aws:lambda:ap-south-1:123456789012:layer:deps:3")
                        .codeSize(1024L)
                        .signingProfileVersionArn("arn:aws:signer:profile/1")
                        .signingJobArn("arn:aws:signer:job/1")
                        .build())
                .state("Active")
                .stateReason("ready")
                .stateReasonCode("Idle")
                .lastUpdateStatus("Successful")
                .lastUpdateStatusReason("done")
                .lastUpdateStatusReasonCode("EniLimitExceeded")
                .fileSystemConfigs(FileSystemConfig.builder()
                        .arn("arn:aws:elasticfilesystem:ap-south-1:123456789012:access-point/fsap-1")
                        .localMountPath("/mnt/efs")
                        .build())
                .packageType("Image")
                .imageConfigResponse(ImageConfigResponse.builder()
                        .imageConfig(ImageConfig.builder()
                                .entryPoint("/entry.sh")
                                .command("app.handler", "--flag")
                                .workingDirectory("/var/task")
                                .build())
                        .error(ImageConfigError.builder()
                                .errorCode("InvalidImage")
                                .message("bad image")
                                .build())
                        .build())
                .signingProfileVersionArn("arn:aws:signer:profile/2")
                .signingJobArn("arn:aws:signer:job/2")
                .architecturesWithStrings("arm64")
                .ephemeralStorage(EphemeralStorage.builder().size(1024).build())
                .snapStart(SnapStartResponse.builder()
                        .applyOn("PublishedVersions")
                        .optimizationStatus("On")
                        .build())
                .runtimeVersionConfig(RuntimeVersionConfig.builder()
                        .runtimeVersionArn("arn:aws:lambda:ap-south-1::runtime:abc")
                        .error(RuntimeVersionError.builder()
                                .errorCode("RuntimeErr")
                                .message("runtime problem")
                                .build())
                        .build())
                .loggingConfig(LoggingConfig.builder()
                        .logFormat("JSON")
                        .applicationLogLevel("INFO")
                        .systemLogLevel("WARN")
                        .logGroup("/aws/lambda/orders-api")
                        .build())
                .build();
    }

    private static FunctionConfiguration minimalFunctionConfiguration() {
        return FunctionConfiguration.builder().functionName("minimal-fn").build();
    }

    /** Nested objects present but with every member unset: pins null-vs-[] inside nested shapes. */
    private static FunctionConfiguration sparseNestedFunctionConfiguration() {
        return FunctionConfiguration.builder()
                .functionName("sparse-fn")
                .vpcConfig(VpcConfigResponse.builder().build())
                .deadLetterConfig(DeadLetterConfig.builder().build())
                .environment(EnvironmentResponse.builder()
                        .error(EnvironmentError.builder().build())
                        .build())
                .tracingConfig(TracingConfigResponse.builder().build())
                .layers(Layer.builder().build())
                .fileSystemConfigs(FileSystemConfig.builder().build())
                .imageConfigResponse(ImageConfigResponse.builder()
                        .imageConfig(ImageConfig.builder().build())
                        .error(ImageConfigError.builder().build())
                        .build())
                .ephemeralStorage(EphemeralStorage.builder().build())
                .snapStart(SnapStartResponse.builder().build())
                .runtimeVersionConfig(RuntimeVersionConfig.builder()
                        .error(RuntimeVersionError.builder().build())
                        .build())
                .loggingConfig(LoggingConfig.builder().build())
                .build();
    }

    private static AliasConfiguration richAliasConfiguration() {
        Map<String, Double> weights = new LinkedHashMap<>();
        weights.put("3", 0.1);
        weights.put("4", 0.25);
        return AliasConfiguration.builder()
                .aliasArn("arn:aws:lambda:ap-south-1:123456789012:function:orders-api:PROD")
                .name("PROD")
                .functionVersion("2")
                .description("production")
                .routingConfig(AliasRoutingConfiguration.builder()
                        .additionalVersionWeights(weights)
                        .build())
                .revisionId("rev-alias-1")
                .build();
    }

    private static AliasConfiguration minimalAliasConfiguration() {
        return AliasConfiguration.builder().name("minimal-alias").build();
    }

    private static AliasConfiguration sparseNestedAliasConfiguration() {
        return AliasConfiguration.builder()
                .name("sparse-alias")
                .routingConfig(AliasRoutingConfiguration.builder().build())
                .build();
    }

    private static RuntimeException resourceNotFound(String message) {
        return ResourceNotFoundException.builder()
                .message(message)
                .statusCode(404)
                .requestId("req-404")
                .awsErrorDetails(AwsErrorDetails.builder()
                        .errorCode("ResourceNotFoundException")
                        .errorMessage(message)
                        .serviceName("Lambda")
                        .build())
                .build();
    }

    private static RuntimeException serviceException(String message, String errorCode, int statusCode) {
        return LambdaException.builder()
                .message(message)
                .statusCode(statusCode)
                .requestId("req-1")
                .awsErrorDetails(AwsErrorDetails.builder()
                        .errorCode(errorCode)
                        .errorMessage(message)
                        .serviceName("Lambda")
                        .build())
                .build();
    }

    // ---- Helpers ----

    private Mono<ActionExecutionResult> execute(LambdaClient lambda, String command, Map<String, ?> formValues) {
        Map<String, Object> formData = new HashMap<>();
        setDataValueSafelyInFormData(formData, "command", command);
        formValues.forEach((key, value) -> setDataValueSafelyInFormData(formData, key, value));
        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(formData);
        return pluginExecutor.execute(lambda, new DatasourceConfiguration(), actionConfiguration);
    }

    private Mono<ActionExecutionResult> executeInvoke(LambdaClient lambda, String body) {
        Map<String, Object> formValues = new HashMap<>();
        formValues.put("functionName", "orders-api");
        formValues.put("body", body);
        return execute(lambda, "INVOKE_FUNCTION", formValues);
    }

    private Mono<TriggerResultDTO> trigger(LambdaClient lambda, String requestType) {
        TriggerRequestDTO request = new TriggerRequestDTO();
        request.setRequestType(requestType);
        request.setParameters(Map.of("functionName", "orders-api"));
        return pluginExecutor.trigger(lambda, new DatasourceConfiguration(), request);
    }

    @SuppressWarnings("unchecked")
    private static List<Object> options(TriggerResultDTO result) {
        return (List<Object>) result.getTrigger();
    }
}

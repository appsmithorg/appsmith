package com.external.plugins;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.TriggerRequestDTO;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;
import reactor.test.StepVerifier;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.AliasConfiguration;
import software.amazon.awssdk.services.lambda.model.FunctionConfiguration;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;
import software.amazon.awssdk.services.lambda.model.ListAliasesRequest;
import software.amazon.awssdk.services.lambda.model.ListAliasesResponse;
import software.amazon.awssdk.services.lambda.model.ListFunctionsResponse;
import software.amazon.awssdk.services.lambda.model.ListVersionsByFunctionRequest;
import software.amazon.awssdk.services.lambda.model.ListVersionsByFunctionResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@Testcontainers
public class AwsLambdaPluginTest {

    private static String accessKey;
    private static String secretKey;
    private static String region;

    AwsLambdaPlugin.AwsLambdaPluginExecutor pluginExecutor = new AwsLambdaPlugin.AwsLambdaPluginExecutor();

    @BeforeAll
    public static void setUp() {
        accessKey = "random_access_key";
        secretKey = "random_secret_key";
        region = "ap-south-1";
    }

    private DatasourceConfiguration createDatasourceConfiguration() {
        DBAuth authDTO = new DBAuth();
        authDTO.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authDTO.setUsername(accessKey);
        authDTO.setPassword(secretKey);

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authDTO);
        ArrayList<Property> properties = new ArrayList<>();
        properties.add(null); // since index 0 is not used anymore.
        properties.add(new Property("region", region));
        dsConfig.setProperties(properties);
        return dsConfig;
    }

    @Test
    public void testExecuteListFunctions() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, "command", "LIST_FUNCTIONS");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        // Mock the Lambda connection
        LambdaClient mockLambda = mock(LambdaClient.class);
        ListFunctionsResponse mockFunctionsResult = ListFunctionsResponse.builder()
                .functions(List.of(FunctionConfiguration.builder()
                        .functionName("test-aws-lambda")
                        .build()))
                .build();
        when(mockLambda.listFunctions()).thenReturn(mockFunctionsResult);

        Mono<ActionExecutionResult> resultMono =
                pluginExecutor.execute(mockLambda, datasourceConfiguration, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertEquals(1, ((ArrayNode) result.getBody()).size());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteInvokeFunction() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, "command", "INVOKE_FUNCTION");
        setDataValueSafelyInFormData(configMap, "body", "{\"data\": \"\"}");
        setDataValueSafelyInFormData(configMap, "functionName", "test-aws-lambda");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        // Mock the Lambda connection
        LambdaClient mockLambda = mock(LambdaClient.class);
        InvokeResponse mockResult = InvokeResponse.builder()
                .payload(SdkBytes.fromByteArray("Hello World".getBytes()))
                .build();
        when(mockLambda.invoke(any(InvokeRequest.class))).thenReturn(mockResult);

        Mono<ActionExecutionResult> resultMono =
                pluginExecutor.execute(mockLambda, datasourceConfiguration, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertEquals("Hello World", result.getBody().toString());
                })
                .verifyComplete();
    }

    @Test
    public void testValidateDatasource_missingDatasourceConfiguration() {
        // Test case: Missing datasource configuration
        Set<String> invalids = pluginExecutor.validateDatasource(null);
        assertEquals(1, invalids.size());
        assertTrue(invalids.contains(
                "Invalid authentication mechanism provided. Please choose valid authentication type."));
    }

    @Test
    public void testValidateDatasource_missingAccessKey() {
        // Test case: Missing AWS access key
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        DBAuth authentication = new DBAuth();
        authentication.setAuthenticationType("accessKey");
        authentication.setPassword("random_secret_key");
        datasourceConfiguration.setAuthentication(authentication);
        Set<String> invalids = pluginExecutor.validateDatasource(datasourceConfiguration);
        assertEquals(1, invalids.size());
        assertTrue(invalids.contains("Unable to find an AWS access key. Please add a valid access key."));
    }

    @Test
    public void testValidateDatasource_missingSecretKey() {
        AwsLambdaPlugin.AwsLambdaPluginExecutor pluginExecutor = new AwsLambdaPlugin.AwsLambdaPluginExecutor();

        // Test case: Missing AWS secret key
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        DBAuth authentication = new DBAuth();
        authentication.setAuthenticationType("accessKey");
        authentication.setUsername("random_access_key");
        authentication.setPassword(null);
        datasourceConfiguration.setAuthentication(authentication);
        Set<String> invalids = pluginExecutor.validateDatasource(datasourceConfiguration);
        assertEquals(1, invalids.size());
        assertTrue(invalids.contains("Unable to find an AWS secret key. Please add a valid secret key."));
    }

    @Test
    public void testValidateDatasource_validConfigurationForAccessKey() {
        AwsLambdaPlugin.AwsLambdaPluginExecutor pluginExecutor = new AwsLambdaPlugin.AwsLambdaPluginExecutor();

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        DBAuth authentication = new DBAuth();
        authentication.setAuthenticationType("accessKey");
        authentication.setUsername("random_access_key");
        authentication.setPassword("random_secret_key");
        datasourceConfiguration.setAuthentication(authentication);
        Set<String> invalids = pluginExecutor.validateDatasource(datasourceConfiguration);
        assertEquals(0, invalids.size());
    }

    @Test
    public void testValidateDatasource_validConfigurationForInstanceRole() {
        AwsLambdaPlugin.AwsLambdaPluginExecutor pluginExecutor = new AwsLambdaPlugin.AwsLambdaPluginExecutor();

        // Test case: Valid datasource configuration
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        DBAuth authentication = new DBAuth();
        authentication.setAuthenticationType("instanceRole");
        datasourceConfiguration.setAuthentication(authentication);
        Set<String> invalids = pluginExecutor.validateDatasource(datasourceConfiguration);
        assertEquals(0, invalids.size());
    }

    @Test
    public void testTrigger_missingRequestType() {
        // Test case: Missing request type
        LambdaClient mockLambda = mock(LambdaClient.class);
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        TriggerRequestDTO request = new TriggerRequestDTO();

        assertThrows(AppsmithPluginException.class, () -> {
            pluginExecutor.trigger(mockLambda, datasourceConfiguration, request).block();
        });
    }

    @Test
    public void testExecuteListFunctionVersions() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, "command", "LIST_FUNCTION_VERSIONS");
        setDataValueSafelyInFormData(configMap, "functionName", "test-aws-lambda");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        // Mock the Lambda connection
        LambdaClient mockLambda = mock(LambdaClient.class);
        ListVersionsByFunctionResponse mockVersionsResult = ListVersionsByFunctionResponse.builder()
                .versions(List.of(
                        FunctionConfiguration.builder().version("$LATEST").build(),
                        FunctionConfiguration.builder().version("1").build(),
                        FunctionConfiguration.builder().version("2").build()))
                .build();
        when(mockLambda.listVersionsByFunction(any(ListVersionsByFunctionRequest.class)))
                .thenReturn(mockVersionsResult);

        Mono<ActionExecutionResult> resultMono =
                pluginExecutor.execute(mockLambda, datasourceConfiguration, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertEquals(3, ((ArrayNode) result.getBody()).size());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteListFunctionAliases() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, "command", "LIST_FUNCTION_ALIASES");
        setDataValueSafelyInFormData(configMap, "functionName", "test-aws-lambda");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        // Mock the Lambda connection
        LambdaClient mockLambda = mock(LambdaClient.class);
        ListAliasesResponse mockAliasesResult = ListAliasesResponse.builder()
                .aliases(List.of(
                        AliasConfiguration.builder().name("PROD").build(),
                        AliasConfiguration.builder().name("STAGING").build()))
                .build();
        when(mockLambda.listAliases(any(ListAliasesRequest.class))).thenReturn(mockAliasesResult);

        Mono<ActionExecutionResult> resultMono =
                pluginExecutor.execute(mockLambda, datasourceConfiguration, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertEquals(2, ((ArrayNode) result.getBody()).size());
                })
                .verifyComplete();
    }

    @Test
    public void testExecuteInvokeFunctionWithVersion() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, "command", "INVOKE_FUNCTION");
        setDataValueSafelyInFormData(configMap, "body", "{\"data\": \"\"}");
        setDataValueSafelyInFormData(configMap, "functionName", "test-aws-lambda");
        setDataValueSafelyInFormData(configMap, "functionVersion", "2");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        // Mock the Lambda connection
        LambdaClient mockLambda = mock(LambdaClient.class);
        InvokeResponse mockResult = InvokeResponse.builder()
                .payload(SdkBytes.fromByteArray("Hello World from version 2".getBytes()))
                .build();
        when(mockLambda.invoke(any(InvokeRequest.class))).thenReturn(mockResult);

        // Capture the InvokeRequest to verify the qualifier is set correctly
        ArgumentCaptor<InvokeRequest> requestCaptor = ArgumentCaptor.forClass(InvokeRequest.class);

        Mono<ActionExecutionResult> resultMono =
                pluginExecutor.execute(mockLambda, datasourceConfiguration, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertEquals("Hello World from version 2", result.getBody().toString());
                })
                .verifyComplete();

        // Verify that the InvokeRequest was called with the correct qualifier
        verify(mockLambda).invoke(requestCaptor.capture());
        InvokeRequest capturedRequest = requestCaptor.getValue();
        assertEquals("test-aws-lambda", capturedRequest.functionName());
        assertEquals("2", capturedRequest.qualifier());
    }

    @Test
    public void testExecuteInvokeFunctionWithAlias() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, "command", "INVOKE_FUNCTION");
        setDataValueSafelyInFormData(configMap, "body", "{\"data\": \"\"}");
        setDataValueSafelyInFormData(configMap, "functionName", "test-aws-lambda");
        setDataValueSafelyInFormData(configMap, "functionAlias", "PROD");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        // Mock the Lambda connection
        LambdaClient mockLambda = mock(LambdaClient.class);
        InvokeResponse mockResult = InvokeResponse.builder()
                .payload(SdkBytes.fromByteArray("Hello World from PROD alias".getBytes()))
                .build();
        when(mockLambda.invoke(any(InvokeRequest.class))).thenReturn(mockResult);

        // Capture the InvokeRequest to verify the qualifier is set correctly
        ArgumentCaptor<InvokeRequest> requestCaptor = ArgumentCaptor.forClass(InvokeRequest.class);

        Mono<ActionExecutionResult> resultMono =
                pluginExecutor.execute(mockLambda, datasourceConfiguration, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertEquals("Hello World from PROD alias", result.getBody().toString());
                })
                .verifyComplete();

        // Verify that the InvokeRequest was called with the correct qualifier
        verify(mockLambda).invoke(requestCaptor.capture());
        InvokeRequest capturedRequest = requestCaptor.getValue();
        assertEquals("test-aws-lambda", capturedRequest.functionName());
        assertEquals("PROD", capturedRequest.qualifier());
    }

    @Test
    public void testExecuteInvokeFunctionWithAliasTakesPrecedenceOverVersion() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, "command", "INVOKE_FUNCTION");
        setDataValueSafelyInFormData(configMap, "body", "{\"data\": \"\"}");
        setDataValueSafelyInFormData(configMap, "functionName", "test-aws-lambda");
        setDataValueSafelyInFormData(configMap, "functionVersion", "2");
        setDataValueSafelyInFormData(configMap, "functionAlias", "PROD");

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        // Mock the Lambda connection
        LambdaClient mockLambda = mock(LambdaClient.class);
        InvokeResponse mockResult = InvokeResponse.builder()
                .payload(SdkBytes.fromByteArray("Hello World from PROD alias (alias takes precedence)".getBytes()))
                .build();
        when(mockLambda.invoke(any(InvokeRequest.class))).thenReturn(mockResult);

        // Capture the InvokeRequest to verify the qualifier is set correctly
        ArgumentCaptor<InvokeRequest> requestCaptor = ArgumentCaptor.forClass(InvokeRequest.class);

        Mono<ActionExecutionResult> resultMono =
                pluginExecutor.execute(mockLambda, datasourceConfiguration, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertEquals(
                            "Hello World from PROD alias (alias takes precedence)",
                            result.getBody().toString());
                })
                .verifyComplete();

        // Verify that the InvokeRequest was called with the alias (not version) as qualifier
        verify(mockLambda).invoke(requestCaptor.capture());
        InvokeRequest capturedRequest = requestCaptor.getValue();
        assertEquals("test-aws-lambda", capturedRequest.functionName());
        assertEquals("PROD", capturedRequest.qualifier()); // Should be alias, not version "2"
    }

    @Test
    public void testExecuteInvokeFunctionWithoutVersionOrAlias() {
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        Map<String, Object> configMap = new HashMap<>();
        setDataValueSafelyInFormData(configMap, "command", "INVOKE_FUNCTION");
        setDataValueSafelyInFormData(configMap, "body", "{\"data\": \"\"}");
        setDataValueSafelyInFormData(configMap, "functionName", "test-aws-lambda");
        // No functionVersion or functionAlias specified

        ActionConfiguration actionConfiguration = new ActionConfiguration();
        actionConfiguration.setFormData(configMap);

        // Mock the Lambda connection
        LambdaClient mockLambda = mock(LambdaClient.class);
        InvokeResponse mockResult = InvokeResponse.builder()
                .payload(SdkBytes.fromByteArray("Hello World from $LATEST".getBytes()))
                .build();
        when(mockLambda.invoke(any(InvokeRequest.class))).thenReturn(mockResult);

        // Capture the InvokeRequest to verify no qualifier is set (defaults to $LATEST)
        ArgumentCaptor<InvokeRequest> requestCaptor = ArgumentCaptor.forClass(InvokeRequest.class);

        Mono<ActionExecutionResult> resultMono =
                pluginExecutor.execute(mockLambda, datasourceConfiguration, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertEquals("Hello World from $LATEST", result.getBody().toString());
                })
                .verifyComplete();

        // Verify that the InvokeRequest was called without a qualifier (defaults to $LATEST)
        verify(mockLambda).invoke(requestCaptor.capture());
        InvokeRequest capturedRequest = requestCaptor.getValue();
        assertEquals("test-aws-lambda", capturedRequest.functionName());
        // When no qualifier is set, it should be null (AWS defaults to $LATEST)
        assertEquals(null, capturedRequest.qualifier());
    }

    @Test
    public void testTriggerFunctionNames() {
        LambdaClient mockLambda = mock(LambdaClient.class);
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ListFunctionsResponse mockFunctionsResult = ListFunctionsResponse.builder()
                .functions(List.of(
                        FunctionConfiguration.builder()
                                .functionName("function1")
                                .build(),
                        FunctionConfiguration.builder()
                                .functionName("function2")
                                .build()))
                .build();
        when(mockLambda.listFunctions()).thenReturn(mockFunctionsResult);

        TriggerRequestDTO request = new TriggerRequestDTO();
        request.setRequestType("FUNCTION_NAMES");

        Mono<com.appsmith.external.models.TriggerResultDTO> resultMono =
                pluginExecutor.trigger(mockLambda, datasourceConfiguration, request);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertEquals(2, ((List<?>) result.getTrigger()).size());
                })
                .verifyComplete();
    }

    @Test
    public void testTriggerFunctionVersions() {
        LambdaClient mockLambda = mock(LambdaClient.class);
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ListVersionsByFunctionResponse mockVersionsResult = ListVersionsByFunctionResponse.builder()
                .versions(List.of(
                        FunctionConfiguration.builder().version("$LATEST").build(),
                        FunctionConfiguration.builder().version("1").build(),
                        FunctionConfiguration.builder().version("2").build()))
                .build();
        when(mockLambda.listVersionsByFunction(any(ListVersionsByFunctionRequest.class)))
                .thenReturn(mockVersionsResult);

        TriggerRequestDTO request = new TriggerRequestDTO();
        request.setRequestType("FUNCTION_VERSIONS");
        Map<String, Object> params = new HashMap<>();
        params.put("functionName", "test-function");
        request.setParameters(params);

        Mono<com.appsmith.external.models.TriggerResultDTO> resultMono =
                pluginExecutor.trigger(mockLambda, datasourceConfiguration, request);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertEquals(3, ((List<?>) result.getTrigger()).size());
                })
                .verifyComplete();
    }

    @Test
    public void testTriggerFunctionAliases() {
        LambdaClient mockLambda = mock(LambdaClient.class);
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ListAliasesResponse mockAliasesResult = ListAliasesResponse.builder()
                .aliases(List.of(
                        AliasConfiguration.builder().name("PROD").build(),
                        AliasConfiguration.builder().name("STAGING").build()))
                .build();
        when(mockLambda.listAliases(any(ListAliasesRequest.class))).thenReturn(mockAliasesResult);

        TriggerRequestDTO request = new TriggerRequestDTO();
        request.setRequestType("FUNCTION_ALIASES");
        Map<String, Object> params = new HashMap<>();
        params.put("functionName", "test-function");
        request.setParameters(params);

        Mono<com.appsmith.external.models.TriggerResultDTO> resultMono =
                pluginExecutor.trigger(mockLambda, datasourceConfiguration, request);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertEquals(2, ((List<?>) result.getTrigger()).size());
                })
                .verifyComplete();
    }

    @Test
    public void testTriggerUnsupportedRequestType() {
        LambdaClient mockLambda = mock(LambdaClient.class);
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        TriggerRequestDTO request = new TriggerRequestDTO();
        request.setRequestType("UNSUPPORTED_TYPE");

        assertThrows(AppsmithPluginException.class, () -> {
            pluginExecutor.trigger(mockLambda, datasourceConfiguration, request).block();
        });
    }

    /**
     * trigger() lists functions/versions/aliases with the blocking SDK client; the server calls it from the
     * continuation of the datasource-context lookup, so the SDK call must never run on the subscribing thread.
     */
    @Test
    public void trigger_doesNotRunOnTheSubscribingThread() {
        LambdaClient mockLambda = mock(LambdaClient.class);
        AtomicReference<String> sdkThread = new AtomicReference<>();
        ListFunctionsResponse functionsResult = ListFunctionsResponse.builder()
                .functions(List.of(FunctionConfiguration.builder()
                        .functionName("function1")
                        .build()))
                .build();
        when(mockLambda.listFunctions()).thenAnswer(invocation -> {
            sdkThread.set(Thread.currentThread().getName());
            return functionsResult;
        });
        TriggerRequestDTO request = new TriggerRequestDTO();
        request.setRequestType("FUNCTION_NAMES");

        Scheduler caller = Schedulers.newSingle("caller-event-loop");
        try {
            StepVerifier.create(Mono.defer(
                                    () -> pluginExecutor.trigger(mockLambda, createDatasourceConfiguration(), request))
                            .subscribeOn(caller))
                    .assertNext(result -> assertEquals(1, ((List<?>) result.getTrigger()).size()))
                    .verifyComplete();
        } finally {
            caller.dispose();
        }
        assertNotNull(sdkThread.get(), "listFunctions was never called");
        assertFalse(
                sdkThread.get().startsWith("caller-event-loop"),
                "listFunctions ran on the subscribing thread: " + sdkThread.get());
    }

    @Test
    public void testDatasource_connection_doesNotRunOnTheSubscribingThread() {
        LambdaClient mockLambda = mock(LambdaClient.class);
        AtomicReference<String> sdkThread = new AtomicReference<>();
        when(mockLambda.listFunctions()).thenAnswer(invocation -> {
            sdkThread.set(Thread.currentThread().getName());
            return ListFunctionsResponse.builder().build();
        });

        Scheduler caller = Schedulers.newSingle("caller-event-loop");
        try {
            StepVerifier.create(pluginExecutor.testDatasource(mockLambda).subscribeOn(caller))
                    .assertNext(result -> assertTrue(result.isSuccess()))
                    .verifyComplete();
        } finally {
            caller.dispose();
        }
        assertNotNull(sdkThread.get(), "listFunctions was never called");
        assertFalse(
                sdkThread.get().startsWith("caller-event-loop"),
                "listFunctions ran on the subscribing thread: " + sdkThread.get());
    }
}

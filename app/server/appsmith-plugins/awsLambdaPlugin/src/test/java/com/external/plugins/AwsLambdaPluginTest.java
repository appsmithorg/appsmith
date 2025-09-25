package com.external.plugins;

import com.amazonaws.services.lambda.AWSLambda;
import com.amazonaws.services.lambda.model.AliasConfiguration;
import com.amazonaws.services.lambda.model.FunctionConfiguration;
import com.amazonaws.services.lambda.model.InvokeResult;
import com.amazonaws.services.lambda.model.ListAliasesRequest;
import com.amazonaws.services.lambda.model.ListAliasesResult;
import com.amazonaws.services.lambda.model.ListFunctionsResult;
import com.amazonaws.services.lambda.model.ListVersionsByFunctionRequest;
import com.amazonaws.services.lambda.model.ListVersionsByFunctionResult;
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
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
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
        AWSLambda mockLambda = mock(AWSLambda.class);
        ListFunctionsResult mockFunctionsResult = new ListFunctionsResult();
        mockFunctionsResult.setFunctions(List.of(new FunctionConfiguration().withFunctionName("test-aws-lambda")));
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
        AWSLambda mockLambda = mock(AWSLambda.class);
        InvokeResult mockResult = new InvokeResult();
        mockResult.setPayload(ByteBuffer.wrap("Hello World".getBytes()));
        when(mockLambda.invoke(any())).thenReturn(mockResult);

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
        AWSLambda mockLambda = mock(AWSLambda.class);
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
        AWSLambda mockLambda = mock(AWSLambda.class);
        ListVersionsByFunctionResult mockVersionsResult = new ListVersionsByFunctionResult();
        mockVersionsResult.setVersions(List.of(
                new FunctionConfiguration().withVersion("$LATEST"),
                new FunctionConfiguration().withVersion("1"),
                new FunctionConfiguration().withVersion("2")));
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
        AWSLambda mockLambda = mock(AWSLambda.class);
        ListAliasesResult mockAliasesResult = new ListAliasesResult();
        mockAliasesResult.setAliases(
                List.of(new AliasConfiguration().withName("PROD"), new AliasConfiguration().withName("STAGING")));
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
        AWSLambda mockLambda = mock(AWSLambda.class);
        InvokeResult mockResult = new InvokeResult();
        mockResult.setPayload(ByteBuffer.wrap("Hello World from version 2".getBytes()));
        when(mockLambda.invoke(any())).thenReturn(mockResult);

        Mono<ActionExecutionResult> resultMono =
                pluginExecutor.execute(mockLambda, datasourceConfiguration, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertEquals("Hello World from version 2", result.getBody().toString());
                })
                .verifyComplete();
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
        AWSLambda mockLambda = mock(AWSLambda.class);
        InvokeResult mockResult = new InvokeResult();
        mockResult.setPayload(ByteBuffer.wrap("Hello World from PROD alias".getBytes()));
        when(mockLambda.invoke(any())).thenReturn(mockResult);

        Mono<ActionExecutionResult> resultMono =
                pluginExecutor.execute(mockLambda, datasourceConfiguration, actionConfiguration);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertEquals("Hello World from PROD alias", result.getBody().toString());
                })
                .verifyComplete();
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
        AWSLambda mockLambda = mock(AWSLambda.class);
        InvokeResult mockResult = new InvokeResult();
        mockResult.setPayload(ByteBuffer.wrap("Hello World from PROD alias (alias takes precedence)".getBytes()));
        when(mockLambda.invoke(any())).thenReturn(mockResult);

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
    }

    @Test
    public void testTriggerFunctionNames() {
        AWSLambda mockLambda = mock(AWSLambda.class);
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ListFunctionsResult mockFunctionsResult = new ListFunctionsResult();
        mockFunctionsResult.setFunctions(List.of(
                new FunctionConfiguration().withFunctionName("function1"),
                new FunctionConfiguration().withFunctionName("function2")));
        when(mockLambda.listFunctions()).thenReturn(mockFunctionsResult);

        TriggerRequestDTO request = new TriggerRequestDTO();
        request.setRequestType("FUNCTION_NAMES");

        Mono<com.appsmith.external.models.TriggerResultDTO> resultMono =
                pluginExecutor.trigger(mockLambda, datasourceConfiguration, request);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertEquals(2, result.getTrigger().size());
                })
                .verifyComplete();
    }

    @Test
    public void testTriggerFunctionVersions() {
        AWSLambda mockLambda = mock(AWSLambda.class);
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ListVersionsByFunctionResult mockVersionsResult = new ListVersionsByFunctionResult();
        mockVersionsResult.setVersions(List.of(
                new FunctionConfiguration().withVersion("$LATEST"),
                new FunctionConfiguration().withVersion("1"),
                new FunctionConfiguration().withVersion("2")));
        when(mockLambda.listVersionsByFunction(any(ListVersionsByFunctionRequest.class)))
                .thenReturn(mockVersionsResult);

        TriggerRequestDTO request = new TriggerRequestDTO();
        request.setRequestType("FUNCTION_VERSIONS");
        Map<String, String> params = new HashMap<>();
        params.put("functionName", "test-function");
        request.setParams(params);

        Mono<com.appsmith.external.models.TriggerResultDTO> resultMono =
                pluginExecutor.trigger(mockLambda, datasourceConfiguration, request);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertEquals(3, result.getTrigger().size());
                })
                .verifyComplete();
    }

    @Test
    public void testTriggerFunctionAliases() {
        AWSLambda mockLambda = mock(AWSLambda.class);
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();

        ListAliasesResult mockAliasesResult = new ListAliasesResult();
        mockAliasesResult.setAliases(
                List.of(new AliasConfiguration().withName("PROD"), new AliasConfiguration().withName("STAGING")));
        when(mockLambda.listAliases(any(ListAliasesRequest.class))).thenReturn(mockAliasesResult);

        TriggerRequestDTO request = new TriggerRequestDTO();
        request.setRequestType("FUNCTION_ALIASES");
        Map<String, String> params = new HashMap<>();
        params.put("functionName", "test-function");
        request.setParams(params);

        Mono<com.appsmith.external.models.TriggerResultDTO> resultMono =
                pluginExecutor.trigger(mockLambda, datasourceConfiguration, request);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertEquals(2, result.getTrigger().size());
                })
                .verifyComplete();
    }

    @Test
    public void testTriggerUnsupportedRequestType() {
        AWSLambda mockLambda = mock(AWSLambda.class);
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        TriggerRequestDTO request = new TriggerRequestDTO();
        request.setRequestType("UNSUPPORTED_TYPE");

        assertThrows(AppsmithPluginException.class, () -> {
            pluginExecutor.trigger(mockLambda, datasourceConfiguration, request).block();
        });
    }
}

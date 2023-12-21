package com.external.plugins;

import com.amazonaws.services.lambda.AWSLambda;
import com.amazonaws.services.lambda.model.FunctionConfiguration;
import com.amazonaws.services.lambda.model.InvokeResult;
import com.amazonaws.services.lambda.model.ListFunctionsResult;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
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

import static com.appsmith.external.helpers.PluginUtils.setDataValueSafelyInFormData;
import static org.junit.jupiter.api.Assertions.assertEquals;
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
                    assertEquals("\"Hello World\"", result.getBody().toString());
                })
                .verifyComplete();
    }
}

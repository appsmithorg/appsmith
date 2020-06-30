package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.Before;
import org.junit.Test;
import org.springframework.http.HttpMethod;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

public class RestApiPluginTest {
    RestApiPlugin.RestApiPluginExecutor pluginExecutor = new RestApiPlugin.RestApiPluginExecutor();

    @Before
    public void setUp() {
    }

    @Test
    public void testValidJsonApiExecution() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("https://postman-echo.com/post");

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHeaders(List.of(new Property("content-type", "application/json")));
        actionConfig.setHttpMethod(HttpMethod.POST);
        String requestBody = "{\"key\":\"value\"}";
        actionConfig.setBody(requestBody);

        Mono<Object> resultMono = pluginExecutor.execute(null, dsConfig, actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(r -> {
                    ActionExecutionResult result = (ActionExecutionResult) r;
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    JsonNode data = ((ObjectNode) result.getBody()).get("data");
                    assertEquals(requestBody, data.toString());
                })
                .verifyComplete();
    }


    @Test
    public void testValidFormApiExecution() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("https://postman-echo.com/post");

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHeaders(List.of(new Property("content-type", "application/x-www-form-urlencoded")));
        actionConfig.setHttpMethod(HttpMethod.POST);
        actionConfig.setBodyFormData(List.of(new Property("key", "value"), new Property("key1", "value1")));
        Mono<Object> resultMono = pluginExecutor.execute(null, dsConfig, actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(r -> {
                    ActionExecutionResult result = (ActionExecutionResult) r;
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    JsonNode data = ((ObjectNode) result.getBody()).get("form");
                    assertEquals("{\"key\":\"value\",\"key1\":\"value1\"}", data.toString());
                })
                .verifyComplete();
    }
}

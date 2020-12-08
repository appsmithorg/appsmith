package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.junit.Before;
import org.junit.Test;
import org.springframework.http.HttpMethod;
import reactor.core.Exceptions;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertThrows;
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

        Mono<ActionExecutionResult> resultMono = pluginExecutor.execute(null, dsConfig, actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    JsonNode data = ((ObjectNode) result.getBody()).get("data");
                    assertEquals(requestBody, data.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testEncodingFunction() throws UnsupportedEncodingException {
        String encoded_value = pluginExecutor.convertPropertyListToReqBody(List.of(new Property("key", "valüe")),
                "application/x-www-form-urlencoded");
        String expected_value = null;
        try {
            expected_value = "key=" + URLEncoder.encode("valüe", StandardCharsets.UTF_8.toString());
        } catch (UnsupportedEncodingException e) {
            throw e;
        }
        assertEquals(expected_value, encoded_value);
    }

    @Test
    public void testValidFormApiExecution() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("https://postman-echo.com/post");

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHeaders(List.of(new Property("content-type", "application/x-www-form-urlencoded")));
        actionConfig.setHttpMethod(HttpMethod.POST);
        actionConfig.setBodyFormData(List.of(new Property("key", "value"), new Property("key1", "value1")));
        Mono<ActionExecutionResult> resultMono = pluginExecutor.execute(null, dsConfig, actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    JsonNode data = ((ObjectNode) result.getBody()).get("form");
                    assertEquals("{\"key\":\"value\",\"key1\":\"value1\"}", data.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testValidRawApiExecution() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("https://postman-echo.com/post");

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHeaders(List.of(new Property("content-type", "text/plain;charset=UTF-8")));
        actionConfig.setHttpMethod(HttpMethod.POST);
        String requestBody = "{\"key\":\"value\"}";
        actionConfig.setBody(requestBody);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.execute(null, dsConfig, actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    JsonNode data = ((ObjectNode) result.getBody()).get("data");
                    assertEquals("\"{\\\"key\\\":\\\"value\\\"}\"", data.toString());
                })
                .verifyComplete();
    }

    public void testValidSignature() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("http://httpbin.org/headers");

        final String secretKey = "a-random-key-that-should-be-32-chars-long-at-least";
        dsConfig.setProperties(List.of(
                new Property("isSendSessionEnabled", "Y"),
                new Property("sessionSignatureKey", secretKey)
        ));

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHttpMethod(HttpMethod.GET);
        Mono<ActionExecutionResult> resultMono = pluginExecutor.execute(null, dsConfig, actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    String token = ((ObjectNode) result.getBody()).get("headers").get("X-Appsmith-Signature").asText();

                    final SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
                    assertEquals("Appsmith", Jwts.parserBuilder()
                            .setSigningKey(key)
                            .build()
                            .parseClaimsJws(token)
                            .getBody()
                            .getIssuer());
                })
                .verifyComplete();
    }

    @Test
    public void testInvalidSignature() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("http://httpbin.org/headers");

        final String secretKey = "a-random-key-that-should-be-32-chars-long-at-least";
        dsConfig.setProperties(List.of(
                new Property("isSendSessionEnabled", "Y"),
                new Property("sessionSignatureKey", secretKey)
        ));

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHttpMethod(HttpMethod.GET);
        Mono<ActionExecutionResult> resultMono = pluginExecutor.execute(null, dsConfig, actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    String token = ((ObjectNode) result.getBody()).get("headers").get("X-Appsmith-Signature").asText();

                    final SecretKey key = Keys.hmacShaKeyFor((secretKey + "-abc").getBytes(StandardCharsets.UTF_8));
                    final JwtParser parser = Jwts.parserBuilder().setSigningKey(key).build();

                    assertThrows(SignatureException.class, () -> parser.parseClaimsJws(token));
                })
                .verifyComplete();
    }
}

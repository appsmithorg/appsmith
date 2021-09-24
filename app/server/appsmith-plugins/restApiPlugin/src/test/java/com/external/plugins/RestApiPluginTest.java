package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionRequest;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.ApiKeyAuth;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.services.SharedConfig;
import com.external.connections.APIConnection;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import net.minidev.json.JSONObject;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;
import org.junit.Before;
import org.junit.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;

public class RestApiPluginTest {

    public class MockSharedConfig implements SharedConfig {

        @Override
        public int getCodecSize() {
            return 10 * 1024 * 1024;
        }

        @Override
        public int getMaxResponseSize() {
            return 10000;
        }

        @Override
        public String getRemoteExecutionUrl() {
            return "";
        }
    }

    RestApiPlugin.RestApiPluginExecutor pluginExecutor = new RestApiPlugin.RestApiPluginExecutor(new MockSharedConfig());

    @Before
    public void setUp() {
    }

    @Test
    public void testValidJsonApiExecution() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("https://postman-echo.com/post");

        ActionConfiguration actionConfig = new ActionConfiguration();
        final List<Property> headers = List.of(new Property("content-type", "application/json"));
        actionConfig.setHeaders(headers);
        actionConfig.setHttpMethod(HttpMethod.POST);
        String requestBody = "{\"key\":\"value\"}";
        actionConfig.setBody(requestBody);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(null, new ExecuteActionDTO(), dsConfig, actionConfig);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    JsonNode data = ((ObjectNode) result.getBody()).get("data");
                    assertEquals(requestBody, data.toString());
                    final ActionExecutionRequest request = result.getRequest();
                    assertEquals("https://postman-echo.com/post", request.getUrl());
                    assertEquals(HttpMethod.POST, request.getHttpMethod());
                    assertEquals(requestBody, request.getBody().toString());
                    final Iterator<Map.Entry<String, JsonNode>> fields = ((ObjectNode) result.getRequest().getHeaders()).fields();
                    fields.forEachRemaining(field -> {
                        if (HttpHeaders.CONTENT_TYPE.equalsIgnoreCase(field.getKey())) {
                            assertEquals("application/json", field.getValue().get(0).asText());
                        }
                    });
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
        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(null, new ExecuteActionDTO(), dsConfig, actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    JsonNode data = ((ObjectNode) result.getBody()).get("form");
                    assertEquals("{\"key\":\"value\",\"key1\":\"value1\"}", data.toString());
                    assertEquals("key=value&key1=value1", result.getRequest().getBody());
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

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(null, new ExecuteActionDTO(), dsConfig, actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    JsonNode data = ((ObjectNode) result.getBody()).get("data");
                    assertEquals("\"{\\\"key\\\":\\\"value\\\"}\"", data.toString());
                })
                .verifyComplete();
    }

    @Test
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
        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(null, new ExecuteActionDTO(), dsConfig, actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    String token = ((ObjectNode) result.getBody()).get("headers").get("X-Appsmith-Signature").asText();

                    final SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
                    final String issuer = Jwts.parserBuilder()
                            .setSigningKey(key)
                            .build()
                            .parseClaimsJws(token)
                            .getBody()
                            .getIssuer();
                    assertEquals("Appsmith", issuer);
                    final Iterator<Map.Entry<String, JsonNode>> fields = ((ObjectNode) result.getRequest().getHeaders()).fields();
                    fields.forEachRemaining(field -> {
                        if ("X-Appsmith-Signature".equalsIgnoreCase(field.getKey())) {
                            assertEquals(token, field.getValue().get(0).asText());
                        }
                    });

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
        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(null, new ExecuteActionDTO(), dsConfig, actionConfig);

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

    @Test
    public void testEncodeParamsToggleOn() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("https://postman-echo.com/post");

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHeaders(List.of(new Property("content-type", "application/json")));
        actionConfig.setHttpMethod(HttpMethod.POST);
        String requestBody = "body";
        actionConfig.setBody(requestBody);

        List<Property> queryParams = new ArrayList<>();
        queryParams.add(new Property("query_key", "query val")); /* encoding changes 'query val' to 'query+val' */
        actionConfig.setQueryParameters(queryParams);
        actionConfig.setEncodeParamsToggle(true);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(null, new ExecuteActionDTO(), dsConfig, actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());

                    String expected_url = "\"https://postman-echo.com/post?query_key=query+val\"";
                    JsonNode url = ((ObjectNode) result.getBody()).get("url");
                    assertEquals(expected_url, url.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testEncodeParamsToggleNull() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("https://postman-echo.com/post");

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHeaders(List.of(new Property("content-type", "application/json")));
        actionConfig.setHttpMethod(HttpMethod.POST);
        String requestBody = "body";
        actionConfig.setBody(requestBody);

        List<Property> queryParams = new ArrayList<>();
        queryParams.add(new Property("query_key", "query val")); /* encoding changes 'query val' to 'query+val' */
        actionConfig.setQueryParameters(queryParams);
        actionConfig.setEncodeParamsToggle(null);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(null, new ExecuteActionDTO(), dsConfig, actionConfig);

        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());

                    String expected_url = "\"https://postman-echo.com/post?query_key=query+val\"";
                    JsonNode url = ((ObjectNode) result.getBody()).get("url");
                    assertEquals(expected_url, url.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testEncodeParamsToggleOff() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("https://postman-echo.com/post");

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHeaders(List.of(new Property("content-type", "application/json")));
        actionConfig.setHttpMethod(HttpMethod.POST);
        String requestBody = "body";
        actionConfig.setBody(requestBody);

        List<Property> queryParams = new ArrayList<>();
        queryParams.add(new Property("query_key", "query val"));
        actionConfig.setQueryParameters(queryParams);
        actionConfig.setEncodeParamsToggle(false);

        Mono<RestApiPlugin.RestApiPluginExecutor> pluginExecutorMono = Mono.just(pluginExecutor);
        Mono<ActionExecutionResult> resultMono = pluginExecutorMono.flatMap(executor -> executor.executeParameterized(null,
                new ExecuteActionDTO(),
                dsConfig,
                actionConfig));
        StepVerifier.create(resultMono)
                .verifyErrorSatisfies(e -> {
                    assertTrue(e instanceof IllegalArgumentException);
                    assertTrue(e.getMessage().contains("Invalid character ' ' for QUERY_PARAM in \"query val\""));
                });
    }

    @Test
    public void testValidateDatasource_invalidAuthentication() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        OAuth2 oAuth2 = new OAuth2();
        oAuth2.setGrantType(OAuth2.Type.CLIENT_CREDENTIALS);
        datasourceConfiguration.setAuthentication(oAuth2);

        Mono<RestApiPlugin.RestApiPluginExecutor> pluginExecutorMono = Mono.just(pluginExecutor);
        Mono<Set<String>> invalidsMono = pluginExecutorMono.map(executor -> executor.validateDatasource(datasourceConfiguration));

        StepVerifier
                .create(invalidsMono)
                .assertNext(invalids -> invalids.containsAll(Set.of("Missing Client ID", "Missing Client Secret", "Missing Access Token URL")));
    }

    @Test
    public void testSmartSubstitutionJSONBody() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("https://postman-echo.com/post");

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHeaders(List.of(new Property("content-type", "application/json")));
        actionConfig.setHttpMethod(HttpMethod.POST);
        String requestBody = "{\n" +
                "\t\"name\" : {{Input1.text}},\n" +
                "\t\"email\" : {{Input2.text}},\n" +
                "\t\"username\" : {{Input3.text}},\n" +
                "\t\"password\" : \"{{Input4.text}}\",\n" +
                "\t\"newField\" : \"{{Input5.text}}\",\n" +
                "\t\"tableRow\" : {{Table1.selectedRow}},\n" +
                "\t\"table\" : \"{{Table1.tableData}}\"\n" +
                "}";
        actionConfig.setBody(requestBody);
        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("jsonSmartSubstitution", "true"));
        actionConfig.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input1.text");
        param1.setValue("this is a string! Yay :D");
        params.add(param1);
        Param param3 = new Param();
        param3.setKey("Input2.text");
        param3.setValue("true");
        params.add(param3);
        Param param4 = new Param();
        param4.setKey("Input3.text");
        param4.setValue("0");
        params.add(param4);
        Param param5 = new Param();
        param5.setKey("Input4.text");
        param5.setValue("12/01/2018");
        params.add(param5);
        Param param6 = new Param();
        param6.setKey("Input5.text");
        param6.setValue("null");
        params.add(param6);
        Param param7 = new Param();
        param7.setKey("Table1.selectedRow");
        param7.setValue("{  \"id\": 2381224,  \"email\": \"michael.lawson@reqres.in\",  \"userName\": \"Michael Lawson\",  \"productName\": \"Chicken Sandwich\",  \"orderAmount\": 4.99}");
        params.add(param7);
        Param param8 = new Param();
        param8.setKey("Table1.tableData");
        param8.setValue("[  {    \"id\": 2381224,    \"email\": \"michael.lawson@reqres.in\",    \"userName\": \"Michael Lawson\",    \"productName\": \"Chicken Sandwich\",    \"orderAmount\": 4.99  },  {    \"id\": 2736212,    \"email\": \"lindsay.ferguson@reqres.in\",    \"userName\": \"Lindsay Ferguson\",    \"productName\": \"Tuna Salad\",    \"orderAmount\": 9.99  },  {    \"id\": 6788734,    \"email\": \"tobias.funke@reqres.in\",    \"userName\": \"Tobias Funke\",    \"productName\": \"Beef steak\",    \"orderAmount\": 19.99  }]");
        params.add(param8);
        executeActionDTO.setParams(params);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(null, executeActionDTO, dsConfig, actionConfig);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    String resultBody = "{\"password\":\"12/01/2018\",\"name\":\"this is a string! Yay :D\",\"newField\":null,\"tableRow\":{\"orderAmount\":4.99,\"id\":2381224,\"userName\":\"Michael Lawson\",\"email\":\"michael.lawson@reqres.in\",\"productName\":\"Chicken Sandwich\"},\"email\":true,\"table\":[{\"orderAmount\":4.99,\"id\":2381224,\"userName\":\"Michael Lawson\",\"email\":\"michael.lawson@reqres.in\",\"productName\":\"Chicken Sandwich\"},{\"orderAmount\":9.99,\"id\":2736212,\"userName\":\"Lindsay Ferguson\",\"email\":\"lindsay.ferguson@reqres.in\",\"productName\":\"Tuna Salad\"},{\"orderAmount\":19.99,\"id\":6788734,\"userName\":\"Tobias Funke\",\"email\":\"tobias.funke@reqres.in\",\"productName\":\"Beef steak\"}],\"username\":0}";
                    JSONParser jsonParser = new JSONParser(JSONParser.MODE_PERMISSIVE);
                    ObjectMapper objectMapper = new ObjectMapper();
                    try {
                        JSONObject resultJson = (JSONObject) jsonParser.parse(String.valueOf(result.getBody()));
                        Object resultData = resultJson.get("json");
                        String parsedJsonAsString = objectMapper.writeValueAsString(resultData);
                        assertEquals(resultBody, parsedJsonAsString);
                    } catch (ParseException | JsonProcessingException e) {
                        e.printStackTrace();
                    }

                    // Assert the debug request parameters are getting set.
                    ActionExecutionRequest request = result.getRequest();
                    List<Map.Entry<String, String>> parameters =
                            (List<Map.Entry<String, String>>) request.getProperties().get("smart-substitution-parameters");
                    assertEquals(parameters.size(), 7);

                    Map.Entry<String, String> parameterEntry = parameters.get(0);
                    assertEquals(parameterEntry.getKey(), "this is a string! Yay :D");
                    assertEquals(parameterEntry.getValue(), "STRING");

                    parameterEntry = parameters.get(1);
                    assertEquals(parameterEntry.getKey(), "true");
                    assertEquals(parameterEntry.getValue(), "BOOLEAN");

                    parameterEntry = parameters.get(2);
                    assertEquals(parameterEntry.getKey(), "0");
                    assertEquals(parameterEntry.getValue(), "INTEGER");

                    parameterEntry = parameters.get(3);
                    assertEquals(parameterEntry.getKey(), "12/01/2018");
                    assertEquals(parameterEntry.getValue(), "STRING");

                    parameterEntry = parameters.get(4);
                    assertEquals(parameterEntry.getKey(), "null");
                    assertEquals(parameterEntry.getValue(), "NULL");
                })
                .verifyComplete();
    }

    @Test
    public void testMultipartFormData() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("http://httpbin.org/post");

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHeaders(List.of(new Property("content-type", "multipart/form-data")));

        actionConfig.setHttpMethod(HttpMethod.POST);
        String requestBody = "{\"key1\":\"onlyValue\"}";
        final Property key1 = new Property("key1", "onlyValue");
        final Property key2 = new Property("key2", "{\"name\":\"fileName\", \"type\":\"application/json\", \"data\":{\"key\":\"value\"}}");
        key2.setType("FILE");
        List<Property> formData = List.of(key1, key2);
        actionConfig.setBodyFormData(formData);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(null, new ExecuteActionDTO(), dsConfig, actionConfig);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(Map.of(
                            "key1", "onlyValue",
                            "key2", "<file>"),
                            result.getRequest().getBody());
                    JsonNode formDataResponse = ((ObjectNode) result.getBody()).get("form");
                    assertEquals(requestBody, formDataResponse.toString());
                    JsonNode fileDataResponse = ((ObjectNode) result.getBody()).get("files");
                    assertEquals("{\"key2\":\"{key=value}\"}", fileDataResponse.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testParsingBodyWithInvalidJSONHeader() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("https://mock-api.appsmith.com/echo/raw");

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHeaders(List.of(new Property("content-type", "application/json")));
        actionConfig.setHttpMethod(HttpMethod.POST);

        String requestBody = "{\n" +
                "    \"headers\": {\n" +
                "        \"Content-Type\": \"application/json\",\n" +
                "        \"X-RANDOM-HEADER\": \"random-value\"\n" +
                "    },\n" +
                "    \"body\": \"invalid json text\"\n" +
                "}";
        actionConfig.setBody(requestBody);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(null, new ExecuteActionDTO(), dsConfig, actionConfig);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals("invalid json text", result.getBody());
                    ArrayNode data = (ArrayNode) result.getHeaders().get("Content-Type");
                    assertEquals("application/json; charset=utf-8", data.get(0).asText());

                    assertEquals(1, result.getMessages().size());
                    String expectedMessage = "The response returned by this API is not a valid JSON. Please " +
                            "be careful when using the API response anywhere a valid JSON is required" +
                            ". You may resolve this issue either by modifying the 'Content-Type' " +
                            "Header to indicate a non-JSON response or by modifying the API response " +
                            "to return a valid JSON.";
                    assertEquals(expectedMessage, result.getMessages().toArray()[0]);
                })
                .verifyComplete();
    }

    @Test
    public void testRequestWithApiKeyHeader() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("https://postman-echo.com/post");
        AuthenticationDTO authenticationDTO = new ApiKeyAuth(ApiKeyAuth.Type.HEADER, "api_key", "Token", "test");
        dsConfig.setAuthentication(authenticationDTO);

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHeaders(List.of(
                new Property("content-type", "application/json"),
                new Property(HttpHeaders.AUTHORIZATION, "auth-value")
        ));
        actionConfig.setHttpMethod(HttpMethod.POST);

        String requestBody = "{\"key\":\"value\"}";
        actionConfig.setBody(requestBody);

        final APIConnection apiConnection = pluginExecutor.datasourceCreate(dsConfig).block();

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(apiConnection, new ExecuteActionDTO(), dsConfig, actionConfig);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getRequest().getBody());
                    final Iterator<Map.Entry<String, JsonNode>> fields = ((ObjectNode) result.getRequest().getHeaders()).fields();
                    fields.forEachRemaining(field -> {
                        if ("api_key".equalsIgnoreCase(field.getKey()) || HttpHeaders.AUTHORIZATION.equalsIgnoreCase(field.getKey())) {
                            assertEquals("****", field.getValue().get(0).asText());
                        }
                    });
                })
                .verifyComplete();
    }

    @Test
    public void testSmartSubstitutionEvaluatedValueContainingQuestionMark() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("https://postman-echo.com/post");

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHeaders(List.of(new Property("content-type", "application/json")));
        actionConfig.setHttpMethod(HttpMethod.POST);
        String requestBody = "{\n" +
                "\t\"name\" : {{Input1.text}},\n" +
                "\t\"email\" : {{Input2.text}},\n" +
                "}";
        actionConfig.setBody(requestBody);
        List<Property> pluginSpecifiedTemplates = new ArrayList<>();
        pluginSpecifiedTemplates.add(new Property("jsonSmartSubstitution", "true"));
        actionConfig.setPluginSpecifiedTemplates(pluginSpecifiedTemplates);

        ExecuteActionDTO executeActionDTO = new ExecuteActionDTO();
        List<Param> params = new ArrayList<>();
        Param param1 = new Param();
        param1.setKey("Input1.text");
        param1.setValue("this is a string with a ? ");
        params.add(param1);
        Param param2 = new Param();
        param2.setKey("Input2.text");
        param2.setValue("email@email.com");
        params.add(param2);
        executeActionDTO.setParams(params);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(null, executeActionDTO, dsConfig, actionConfig);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    String resultBody = "{\"name\":\"this is a string with a ? \",\"email\":\"email@email.com\"}";
                    JSONParser jsonParser = new JSONParser(JSONParser.MODE_PERMISSIVE);
                    ObjectMapper objectMapper = new ObjectMapper();
                    try {
                        JSONObject resultJson = (JSONObject) jsonParser.parse(String.valueOf(result.getBody()));
                        Object resultData = resultJson.get("json");
                        String parsedJsonAsString = objectMapper.writeValueAsString(resultData);
                        assertEquals(resultBody, parsedJsonAsString);
                    } catch (ParseException | JsonProcessingException e) {
                        e.printStackTrace();
                    }
                })
                .verifyComplete();
    }

}

package com.external.plugins;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.helpers.PluginUtils;
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
import reactor.util.function.Tuple2;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.appsmith.external.constants.Authentication.API_KEY;
import static com.appsmith.external.constants.Authentication.OAUTH2;
import static com.external.helpers.HintMessageUtils.DUPLICATE_ATTRIBUTE_LOCATION;
import static com.external.helpers.HintMessageUtils.DUPLICATE_ATTRIBUTE_LOCATION.ACTION_CONFIG_ONLY;
import static com.external.helpers.HintMessageUtils.DUPLICATE_ATTRIBUTE_LOCATION.DATASOURCE_AND_ACTION_CONFIG;
import static com.external.helpers.HintMessageUtils.DUPLICATE_ATTRIBUTE_LOCATION.DATASOURCE_CONFIG_ONLY;
import static com.external.helpers.HintMessageUtils.getAllDuplicateHeaders;
import static com.external.helpers.HintMessageUtils.getAllDuplicateParams;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
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
        actionConfig.setBodyFormData(List.of(
                new Property("key", "value"),
                new Property("key1", "value1"),
                new Property(null, "irrelevantValue")
        ));
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
        final Property key3 = new Property("key3", "[{\"name\":\"fileName2\", \"type\":\"application/json\", \"data\":{\"key2\":\"value2\"}}]");
        final Property key4 = new Property(null, "irrelevantValue");
        key2.setType("FILE");
        key3.setType("FILE");
        List<Property> formData = List.of(key1, key2, key3, key4);
        actionConfig.setBodyFormData(formData);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(null, new ExecuteActionDTO(), dsConfig, actionConfig);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getBody());
                    assertEquals(Map.of(
                                    "key1", "onlyValue",
                                    "key2", "<file>",
                                    "key3", "<file>"),
                            result.getRequest().getBody());
                    JsonNode formDataResponse = ((ObjectNode) result.getBody()).get("form");
                    assertEquals(requestBody, formDataResponse.toString());
                    JsonNode fileDataResponse = ((ObjectNode) result.getBody()).get("files");
                    assertEquals("{\"key2\":\"{key=value}\",\"key3\":\"{key2=value2}\"}", fileDataResponse.toString());
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

    @Test
    public void testGetDuplicateHeadersAndParams() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        List<Property> dsHeaders = new ArrayList<>();
        dsHeaders.add(new Property("myHeader1", "myVal"));
        dsHeaders.add(new Property("myHeader1", "myVal")); // duplicate header
        dsHeaders.add(new Property("myHeader2", "myVal"));
        dsHeaders.add(new Property("myHeader2", "myVal")); // duplicate header
        dsHeaders.add(new Property("myHeader3", "myVal")); // unique header in datasource config
        dsConfig.setHeaders(dsHeaders);

        // This authentication mechanism will add `apiKey` as header.
        AuthenticationDTO authenticationDTO = new ApiKeyAuth(ApiKeyAuth.Type.HEADER, "apiKey", "Token", "test");
        dsConfig.setAuthentication(authenticationDTO);
        dsConfig.getAuthentication().setAuthenticationType(API_KEY);

        List<Property> dsParams = new ArrayList<>();
        dsParams.add(new Property("myParam1", "myVal"));
        dsParams.add(new Property("myParam1", "myVal")); // duplicate param
        dsParams.add(new Property("myParam2", "myVal"));
        dsParams.add(new Property("myParam2", "myVal")); // duplicate param
        dsParams.add(new Property("myParam3", "myVal")); // unique param in datasource
        dsConfig.setQueryParameters(dsParams);

        // Add headers to API query editor page.
        ActionConfiguration actionConfig = new ActionConfiguration();
        ArrayList<Property> actionHeaders = new ArrayList<>();
        actionHeaders.add(new Property("myHeader3", "myVal")); // duplicate - because also inherited from datasource.
        actionHeaders.add(new Property("myHeader4", "myVal"));
        actionHeaders.add(new Property("myHeader4", "myVal")); // duplicate
        actionHeaders.add(new Property("myHeader5", "myVal"));
        actionHeaders.add(new Property("apiKey", "myVal"));  // duplicate - because also inherited from authentication
        actionConfig.setHeaders(actionHeaders);

        // Add params to API query editor page.
        ArrayList<Property> actionParams = new ArrayList<>();
        actionParams.add(new Property("myParam3", "myVal")); // duplicate - because also inherited from datasource.
        actionParams.add(new Property("myParam4", "myVal"));
        actionParams.add(new Property("myParam4", "myVal")); // duplicate
        actionParams.add(new Property("myParam5", "myVal"));
        actionConfig.setQueryParameters(actionParams);

        /* Test duplicate headers in datasource configuration only */
        Map<DUPLICATE_ATTRIBUTE_LOCATION, Set<String>> duplicateHeadersWithDsConfigOnly = getAllDuplicateHeaders(null, dsConfig);

        // Header duplicates
        Set <String> expectedDuplicateHeaders = new HashSet<>();
        expectedDuplicateHeaders.add("myHeader1");
        expectedDuplicateHeaders.add("myHeader2");
        assertTrue(expectedDuplicateHeaders.equals(duplicateHeadersWithDsConfigOnly.get(DATASOURCE_CONFIG_ONLY)));

        /* Test duplicate query params in datasource configuration only */
        Map<DUPLICATE_ATTRIBUTE_LOCATION, Set<String>> duplicateParamsWithDsConfigOnly = getAllDuplicateParams(null,
                dsConfig);

        // Query param duplicates
        Set <String> expectedDuplicateParams = new HashSet<>();
        expectedDuplicateParams.add("myParam1");
        expectedDuplicateParams.add("myParam2");
        assertTrue(expectedDuplicateParams.equals(duplicateParamsWithDsConfigOnly.get(DATASOURCE_CONFIG_ONLY)));

        /* Test duplicate headers in datasource + action configuration */
        Map<DUPLICATE_ATTRIBUTE_LOCATION, Set<String>> allDuplicateHeaders = getAllDuplicateHeaders(actionConfig, dsConfig);

        // Header duplicates in ds config only
        expectedDuplicateHeaders = new HashSet<>();
        expectedDuplicateHeaders.add("myHeader1");
        expectedDuplicateHeaders.add("myHeader2");
        assertTrue(expectedDuplicateHeaders.equals(allDuplicateHeaders.get(DATASOURCE_CONFIG_ONLY)));

        // Header duplicates in action config only
        expectedDuplicateHeaders = new HashSet<>();
        expectedDuplicateHeaders.add("myHeader4");
        expectedDuplicateHeaders.add("myHeader4");
        assertTrue(expectedDuplicateHeaders.equals(allDuplicateHeaders.get(ACTION_CONFIG_ONLY)));

        // Header duplicates with one instance in action and another in datasource config
        expectedDuplicateHeaders = new HashSet<>();
        expectedDuplicateHeaders.add("myHeader3");
        expectedDuplicateHeaders.add("apiKey");
        assertTrue(expectedDuplicateHeaders.equals(allDuplicateHeaders.get(DATASOURCE_AND_ACTION_CONFIG)));

        /* Test duplicate query params in action + datasource config */
        Map<DUPLICATE_ATTRIBUTE_LOCATION, Set<String>> allDuplicateParams = getAllDuplicateParams(actionConfig,
                dsConfig);

        // Query param duplicates in datasource config only
        expectedDuplicateParams = new HashSet<>();
        expectedDuplicateParams.add("myParam1");
        expectedDuplicateParams.add("myParam2");
        assertTrue(expectedDuplicateParams.equals(allDuplicateParams.get(DATASOURCE_CONFIG_ONLY)));

        // Query param duplicates in action config only
        expectedDuplicateParams = new HashSet<>();
        expectedDuplicateParams.add("myParam4");
        assertTrue(expectedDuplicateParams.equals(allDuplicateParams.get(ACTION_CONFIG_ONLY)));

        // Query param duplicates in action + datasource config
        expectedDuplicateParams = new HashSet<>();
        expectedDuplicateParams.add("myParam3");
        assertTrue(expectedDuplicateParams.equals(allDuplicateParams.get(DATASOURCE_AND_ACTION_CONFIG)));
    }

    @Test
    public void testGetDuplicateHeadersWithOAuth() {
        // This authentication mechanism will add `Authorization` as header.
        OAuth2 authenticationDTO = new OAuth2();
        authenticationDTO.setAuthenticationType(OAUTH2);
        authenticationDTO.setGrantType(OAuth2.Type.AUTHORIZATION_CODE);
        authenticationDTO.setIsTokenHeader(true); // adds header `Authorization`
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authenticationDTO);

        // Add headers to API query editor page.
        ArrayList<Property> actionHeaders = new ArrayList<>();
        actionHeaders.add(new Property("myHeader1", "myVal"));
        actionHeaders.add(new Property("Authorization", "myVal"));  // duplicate - because also inherited from dsConfig
        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHeaders(actionHeaders);

        /* Test duplicate headers in datasource + action configuration */
        Map<DUPLICATE_ATTRIBUTE_LOCATION, Set<String>> allDuplicateHeaders = getAllDuplicateHeaders(actionConfig, dsConfig);

        // Header duplicates in ds config only
        assertTrue(allDuplicateHeaders.get(DATASOURCE_CONFIG_ONLY).isEmpty());

        // Header duplicates in action config only
        assertTrue(allDuplicateHeaders.get(ACTION_CONFIG_ONLY).isEmpty());

        // Header duplicates with one instance in action and another in datasource config
        HashSet<String> expectedDuplicateHeaders = new HashSet<>();
        expectedDuplicateHeaders.add("Authorization");
        assertTrue(expectedDuplicateHeaders.equals(allDuplicateHeaders.get(DATASOURCE_AND_ACTION_CONFIG)));
    }

    @Test
    public void testGetDuplicateParamsWithOAuth() {
        // This authentication mechanism will add `access_token` as query param.
        OAuth2 authenticationDTO = new OAuth2();
        authenticationDTO.setAuthenticationType(OAUTH2);
        authenticationDTO.setGrantType(OAuth2.Type.AUTHORIZATION_CODE);
        authenticationDTO.setIsTokenHeader(false); // adds query param `access_token`
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authenticationDTO);

        // Add headers to API query editor page.
        // Add params to API query editor page.
        ArrayList<Property> actionParams = new ArrayList<>();
        actionParams.add(new Property("myParam1", "myVal")); // duplicate - because also inherited from datasource.
        actionParams.add(new Property("access_token", "myVal"));
        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setQueryParameters(actionParams);

        /* Test duplicate params in datasource + action configuration */
        Map<DUPLICATE_ATTRIBUTE_LOCATION, Set<String>> allDuplicateParams = getAllDuplicateParams(actionConfig,
                dsConfig);

        // Param duplicates in ds config only
        assertTrue(allDuplicateParams.get(DATASOURCE_CONFIG_ONLY).isEmpty());

        // Param duplicates in action config only
        assertTrue(allDuplicateParams.get(ACTION_CONFIG_ONLY).isEmpty());

        // Param duplicates with one instance in action and another in datasource config
        HashSet<String> expectedDuplicateParams = new HashSet<>();
        expectedDuplicateParams.add("access_token");
        assertTrue(expectedDuplicateParams.equals(allDuplicateParams.get(DATASOURCE_AND_ACTION_CONFIG)));
    }

    /**
     * This test case is only meant to test the actual hint statement i.e. how it is worded. It is not meant to test
     * the correctness of duplication finding flow - since it is done as part of the test case named
     * `testGetDuplicateHeadersAndParams`. A separate test is used instead of a single test because the list of
     * duplicates is returned as a set, hence order cannot be ascertained beforehand.
     */
    @Test
    public void testHintMessageForDuplicateHeadersAndParamsWithDatasourceConfigOnly() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        List<Property> headers = new ArrayList<>();
        headers.add(new Property("myHeader1", "myVal"));
        headers.add(new Property("myHeader1", "myVal")); // duplicate
        headers.add(new Property("myHeader2", "myVal"));
        dsConfig.setHeaders(headers);

        List<Property> params = new ArrayList<>();
        params.add(new Property("myParam1", "myVal"));
        params.add(new Property("myParam1", "myVal")); // duplicate
        params.add(new Property("myParam2", "myVal"));
        dsConfig.setQueryParameters(params);

        Mono<Tuple2<Set<String>, Set<String>>> hintMessagesMono = pluginExecutor.getHintMessages(null, dsConfig);
        StepVerifier.create(hintMessagesMono)
                .assertNext(tuple -> {
                    Set<String> datasourceHintMessages = tuple.getT1();
                    Set<String> expectedDatasourceHintMessages = new HashSet<>();
                    expectedDatasourceHintMessages.add("API queries linked to this datasource may not run as expected" +
                            " because this datasource has duplicate definition(s) for param(s): [myParam1]. Please " +
                            "remove the duplicate definition(s) to resolve this warning. Please note that some of the" +
                            " authentication mechanisms also implicitly define a param.");

                    expectedDatasourceHintMessages.add("API queries linked to this datasource may not run as expected" +
                            " because this datasource has duplicate definition(s) for header(s): [myHeader1]. Please " +
                            "remove the duplicate definition(s) to resolve this warning. Please note that some of the" +
                            " authentication mechanisms also implicitly define a header.");
                    assertTrue(expectedDatasourceHintMessages.equals(datasourceHintMessages));

                    Set<String> actionHintMessages = tuple.getT2();
                    Set<String> expectedActionHintMessages = new HashSet<>();
                    expectedActionHintMessages.add("Your API query may not run as expected because its datasource has" +
                            " duplicate definition(s) for param(s): [myParam1]. Please remove the duplicate " +
                            "definition(s) from the datasource to resolve this warning.");

                    expectedActionHintMessages.add("Your API query may not run as expected because its datasource has" +
                            " duplicate definition(s) for header(s): [myHeader1]. Please remove the duplicate " +
                            "definition(s) from the datasource to resolve this warning.");
                    assertTrue(expectedActionHintMessages.equals(actionHintMessages));
                })
                .verifyComplete();
    }

    /**
     * This test case is only meant to test the actual hint statement i.e. how it is worded. It is not meant to test
     * the correctness of duplication finding flow - since it is done as part of the test case named
     * `testGetDuplicateHeadersAndParams`. A separate test is used instead of a single test because the list of
     * duplicates is returned as a set, hence order cannot be ascertained beforehand.
     */
    @Test
    public void testHintMessageForDuplicateHeadersAndParamsWithActionConfigOnly() {
        ActionConfiguration actionConfig = new ActionConfiguration();
        List<Property> headers = new ArrayList<>();
        headers.add(new Property("myHeader1", "myVal"));
        headers.add(new Property("myHeader1", "myVal")); // duplicate
        headers.add(new Property("myHeader2", "myVal"));
        actionConfig.setHeaders(headers);

        List<Property> params = new ArrayList<>();
        params.add(new Property("myParam1", "myVal"));
        params.add(new Property("myParam1", "myVal")); // duplicate
        params.add(new Property("myParam2", "myVal"));
        actionConfig.setQueryParameters(params);

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        Mono<Tuple2<Set<String>, Set<String>>> hintMessagesMono = pluginExecutor.getHintMessages(actionConfig, dsConfig);
        StepVerifier.create(hintMessagesMono)
                .assertNext(tuple -> {
                    Set<String> datasourceHintMessages = tuple.getT1();
                    assertTrue(datasourceHintMessages.isEmpty());

                    Set<String> actionHintMessages = tuple.getT2();
                    Set<String> expectedActionHintMessages = new HashSet<>();
                    expectedActionHintMessages.add("Your API query may not run as expected because it has duplicate " +
                            "definition(s) for header(s): [myHeader1]. Please remove the duplicate definition(s) from" +
                            " the 'Headers' tab to resolve this warning.");

                    expectedActionHintMessages.add("Your API query may not run as expected because it has duplicate " +
                            "definition(s) for param(s): [myParam1]. Please remove the duplicate definition(s) from " +
                            "the 'Params' tab to resolve this warning.");
                    assertTrue(expectedActionHintMessages.equals(actionHintMessages));
                })
                .verifyComplete();
    }

    /**
     * This test case is only meant to test the actual hint statement i.e. how it is worded. It is not meant to test
     * the correctness of duplication finding flow - since it is done as part of the test case named
     * `testGetDuplicateHeadersAndParams`. A separate test is used instead of a single test because the list of
     * duplicates is returned as a set, hence order cannot be ascertained beforehand.
     */
    @Test
    public void testHintMessageForDuplicateHeaderWithOneInstanceEachInActionAndDsConfig() {
        ActionConfiguration actionConfig = new ActionConfiguration();
        List<Property> headers = new ArrayList<>();
        headers.add(new Property("myHeader1", "myVal"));
        actionConfig.setHeaders(headers);


        // This authentication mechanism will add `myHeader1` as header implicitly.
        AuthenticationDTO authenticationDTO = new ApiKeyAuth(ApiKeyAuth.Type.HEADER, "myHeader1", "Token", "test");
        authenticationDTO.setAuthenticationType(API_KEY);
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authenticationDTO);

        Mono<Tuple2<Set<String>, Set<String>>> hintMessagesMono = pluginExecutor.getHintMessages(actionConfig, dsConfig);
        StepVerifier.create(hintMessagesMono)
                .assertNext(tuple -> {
                    Set<String> datasourceHintMessages = tuple.getT1();
                    assertTrue(datasourceHintMessages.isEmpty());

                    Set<String> actionHintMessages = tuple.getT2();
                    Set<String> expectedActionHintMessages = new HashSet<>();
                    expectedActionHintMessages.add("Your API query may not run as expected because it has duplicate " +
                            "definition(s) for header(s): [myHeader1]. Please remove the duplicate definition(s) from" +
                            " the 'Headers' section of either the API query or the datasource. Please note that some " +
                            "of the authentication mechanisms also implicitly define a header.");

                    assertTrue(expectedActionHintMessages.equals(actionHintMessages));
                })
                .verifyComplete();
    }

    /**
     * This test case is only meant to test the actual hint statement i.e. how it is worded. It is not meant to test
     * the correctness of duplication finding flow - since it is done as part of the test case named
     * `testGetDuplicateHeadersAndParams`. A separate test is used instead of a single test because the list of
     * duplicates is returned as a set, hence order cannot be ascertained beforehand.
     */
    @Test
    public void testHintMessageForDuplicateParamWithOneInstanceEachInActionAndDsConfig() {
        ActionConfiguration actionConfig = new ActionConfiguration();
        List<Property> params = new ArrayList<>();
        params.add(new Property("myParam1", "myVal"));
        actionConfig.setQueryParameters(params);


        // This authentication mechanism will add `myHeader1` as query param implicitly.
        AuthenticationDTO authenticationDTO = new ApiKeyAuth(ApiKeyAuth.Type.QUERY_PARAMS, "myParam1", "Token", "test");
        authenticationDTO.setAuthenticationType(API_KEY);
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authenticationDTO);

        Mono<Tuple2<Set<String>, Set<String>>> hintMessagesMono = pluginExecutor.getHintMessages(actionConfig, dsConfig);
        StepVerifier.create(hintMessagesMono)
                .assertNext(tuple -> {
                    Set<String> datasourceHintMessages = tuple.getT1();
                    assertTrue(datasourceHintMessages.isEmpty());

                    Set<String> actionHintMessages = tuple.getT2();
                    Set<String> expectedActionHintMessages = new HashSet<>();
                    expectedActionHintMessages.add("Your API query may not run as expected because it has duplicate " +
                            "definition(s) for param(s): [myParam1]. Please remove the duplicate definition(s) from" +
                            " the 'Params' section of either the API query or the datasource. Please note that some " +
                            "of the authentication mechanisms also implicitly define a param.");

                    assertTrue(expectedActionHintMessages.equals(actionHintMessages));
                })
                .verifyComplete();
    }

    public void testQueryParamsInDatasource() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("https://postman-echo.com/post");

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHeaders(List.of(new Property("content-type", "application/json")));
        actionConfig.setHttpMethod(HttpMethod.POST);
        String requestBody = "body";
        actionConfig.setBody(requestBody);
        actionConfig.setEncodeParamsToggle(true);

        List<Property> queryParams = new ArrayList<>();
        queryParams.add(new Property("query_key", "query val")); /* encoding changes 'query val' to 'query+val' */
        dsConfig.setQueryParameters(queryParams);

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
    public void testDenyInstanceMetadataAws() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("http://169.254.169.254/latest/meta-data");

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHttpMethod(HttpMethod.GET);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(null, new ExecuteActionDTO(), dsConfig, actionConfig);
        StepVerifier.create(resultMono)
                .assertNext(result -> assertFalse(result.getIsExecutionSuccess()))
                .verifyComplete();
    }

    @Test
    public void testDenyInstanceMetadataAwsViaCname() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("http://169.254.169.254.nip.io/latest/meta-data");

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHttpMethod(HttpMethod.GET);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(null, new ExecuteActionDTO(), dsConfig, actionConfig);
        StepVerifier.create(resultMono)
                .assertNext(result -> assertFalse(result.getIsExecutionSuccess()))
                .verifyComplete();
    }

    @Test
    public void testDenyInstanceMetadataGcp() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("http://metadata.google.internal/latest/meta-data");

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHttpMethod(HttpMethod.GET);

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(null, new ExecuteActionDTO(), dsConfig, actionConfig);
        StepVerifier.create(resultMono)
                .assertNext(result -> assertFalse(result.getIsExecutionSuccess()))
                .verifyComplete();
    }

    @Test
    public void testGetApiWithBody() {
        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setUrl("https://postman-echo.com/get");

        ActionConfiguration actionConfig = new ActionConfiguration();
        actionConfig.setHeaders(List.of(
                new Property("content-type", "application/json")
        ));
        actionConfig.setHttpMethod(HttpMethod.GET);
        actionConfig.setFormData(new HashMap<>());
        PluginUtils.setValueSafelyInFormData(actionConfig.getFormData(), "apiContentType", "application/json");

        String requestBody = "{\"key\":\"value\"}";
        actionConfig.setBody(requestBody);

        final APIConnection apiConnection = pluginExecutor.datasourceCreate(dsConfig).block();

        Mono<ActionExecutionResult> resultMono = pluginExecutor.executeParameterized(apiConnection, new ExecuteActionDTO(), dsConfig, actionConfig);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertTrue(result.getIsExecutionSuccess());
                    assertNotNull(result.getRequest().getBody());
                    System.out.println(result.getRequest().getBody());
                })
                .verifyComplete();
    }
}


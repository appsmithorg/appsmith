package com.external.plugins;

import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Param;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import mockwebserver3.RecordedRequest;
import org.apache.http.HttpHost;
import org.elasticsearch.client.RestClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("GHSA-8qvx-93r3-x76f: safe ElasticSearch bindings")
class ElasticSearchPluginSubstitutionTest {
    private final ElasticSearchPlugin.ElasticSearchPluginExecutor executor =
            new ElasticSearchPlugin.ElasticSearchPluginExecutor();
    private final ObjectMapper mapper = new ObjectMapper();
    private MockWebServer server;
    private RestClient client;

    @BeforeEach
    void setUp() throws IOException {
        server = new MockWebServer();
        server.start();
        client = RestClient.builder(new HttpHost(server.getHostName(), server.getPort(), "http"))
                .build();
    }

    @AfterEach
    void tearDown() throws IOException {
        if (client != null) {
            client.close();
        }
        if (server != null) {
            server.shutdown();
        }
    }

    private ExecuteActionDTO params(String key, String value) {
        Param param = new Param();
        param.setKey(key);
        param.setValue(value);
        param.setClientDataType(ClientDataType.STRING);
        ExecuteActionDTO dto = new ExecuteActionDTO();
        dto.setParams(List.of(param));
        return dto;
    }

    private ExecuteActionDTO params(String firstKey, String firstValue, String secondKey, String secondValue) {
        ExecuteActionDTO dto = params(firstKey, firstValue);
        Param second = new Param();
        second.setKey(secondKey);
        second.setValue(secondValue);
        second.setClientDataType(ClientDataType.STRING);
        dto.setParams(List.of(dto.getParams().get(0), second));
        return dto;
    }

    private void assertRejected(ActionExecutionResult result) {
        assertThat(result.getIsExecutionSuccess()).isFalse();
        assertThat(result.getPluginErrorDetails()).isNotNull();
        assertThat(result.getPluginErrorDetails().getAppsmithErrorCode())
                .isEqualTo(AppsmithPluginError.PLUGIN_EXECUTE_ARGUMENT_ERROR.getAppErrorCode());
        assertThat(result.getPluginErrorDetails().getAppsmithErrorMessage())
                .isEqualTo("Elasticsearch action contains an invalid request body or path binding.");
    }

    private ActionConfiguration action(String path, String body) {
        ActionConfiguration action = new ActionConfiguration();
        action.setHttpMethod(body == null ? HttpMethod.GET : HttpMethod.POST);
        action.setPath(path);
        action.setBody(body);
        return action;
    }

    private void enqueueResponse() {
        server.enqueue(new MockResponse().setBody("{}").addHeader("Content-Type", "application/json"));
    }

    @Test
    void should_preserveQuotesInsideJsonValue_when_bindingContainsQuotes() throws Exception {
        // Given
        enqueueResponse();
        ActionConfiguration action = action("/books/_search", "{\"query\":{\"term\":{\"name\":\"{{name}}\"}}}");

        // When
        Mono<ActionExecutionResult> result = executor.executeParameterized(
                client, params("name", "Ada \"quoted\""), new DatasourceConfiguration(), action);

        // Then
        StepVerifier.create(result)
                .assertNext(execution ->
                        assertThat(execution.getIsExecutionSuccess()).isTrue())
                .verifyComplete();
        RecordedRequest request = server.takeRequest(5, TimeUnit.SECONDS);
        assertThat(request).isNotNull();
        JsonNode json = mapper.readTree(request.getBody().readUtf8());
        assertThat(json.path("query").path("term").path("name").asText()).isEqualTo("Ada \"quoted\"");
        assertThat(json.path("query").path("term").size()).isEqualTo(1);
    }

    @Test
    void should_rejectPath_when_bindingAddsSegment() {
        // Given
        enqueueResponse();
        ActionConfiguration action = action("/books/{{id}}/_search", null);

        // When
        Mono<ActionExecutionResult> result = executor.executeParameterized(
                client, params("id", "section/other"), new DatasourceConfiguration(), action);

        // Then
        StepVerifier.create(result).assertNext(this::assertRejected).verifyComplete();
        assertThat(server.getRequestCount()).isZero();
    }

    @Test
    void should_allowDynamicIndex_when_nameIsSafe() throws Exception {
        // Given
        enqueueResponse();
        ActionConfiguration action = action("/{{index}}/_search", null);

        // When
        Mono<ActionExecutionResult> result =
                executor.executeParameterized(client, params("index", "books"), new DatasourceConfiguration(), action);

        // Then
        StepVerifier.create(result)
                .assertNext(execution ->
                        assertThat(execution.getIsExecutionSuccess()).isTrue())
                .verifyComplete();
        RecordedRequest request = server.takeRequest(5, TimeUnit.SECONDS);
        assertThat(request).isNotNull();
        assertThat(request.getPath()).isEqualTo("/books/_search");
    }

    @Test
    void should_rejectDynamicRoot_when_itSelectsReservedApi() {
        // Given
        enqueueResponse();
        ActionConfiguration action = action("/{{root}}", null);

        // When
        Mono<ActionExecutionResult> result = executor.executeParameterized(
                client, params("root", "_cluster"), new DatasourceConfiguration(), action);

        // Then
        StepVerifier.create(result).assertNext(this::assertRejected).verifyComplete();
        assertThat(server.getRequestCount()).isZero();
    }

    @Test
    void should_rejectPath_when_combinedBindingsFormDotSegment() {
        // Given
        enqueueResponse();
        ActionConfiguration action = action("/books/{{first}}{{second}}/_search", null);

        // When
        Mono<ActionExecutionResult> result = executor.executeParameterized(
                client, params("first", ".", "second", "."), new DatasourceConfiguration(), action);

        // Then
        StepVerifier.create(result).assertNext(this::assertRejected).verifyComplete();
        assertThat(server.getRequestCount()).isZero();
    }

    @Test
    void should_rejectPath_when_bindingIsMissing() {
        // Given
        enqueueResponse();
        ActionConfiguration action = action("/{{index}}/_search", null);

        // When
        Mono<ActionExecutionResult> result =
                executor.executeParameterized(client, params("other", "books"), new DatasourceConfiguration(), action);

        // Then
        StepVerifier.create(result).assertNext(this::assertRejected).verifyComplete();
        assertThat(server.getRequestCount()).isZero();
    }

    @Test
    void should_keepBindingSyntaxLiteral_when_valueContainsIt() throws Exception {
        // Given
        enqueueResponse();
        ActionConfiguration action = action("/books/_search", "{\"name\":\"{{name}}\"}");

        // When
        Mono<ActionExecutionResult> result = executor.executeParameterized(
                client, params("name", "{{other}}", "other", "changed"), new DatasourceConfiguration(), action);

        // Then
        StepVerifier.create(result)
                .assertNext(execution ->
                        assertThat(execution.getIsExecutionSuccess()).isTrue())
                .verifyComplete();
        RecordedRequest request = server.takeRequest(5, TimeUnit.SECONDS);
        assertThat(request).isNotNull();
        assertThat(mapper.readTree(request.getBody().readUtf8()).path("name").asText())
                .isEqualTo("{{other}}");
    }

    @Test
    void should_preserveBulkArrayBindings_when_pathHasQueryParameters() throws Exception {
        // Given
        enqueueResponse();
        ActionConfiguration action =
                action("/books/_bulk?refresh=true", "[{\"index\":{\"_id\":\"{{id}}\"}},{\"name\":\"{{name}}\"}]");

        // When
        Mono<ActionExecutionResult> result = executor.executeParameterized(
                client, params("id", "id1", "name", "Ada \"quoted\""), new DatasourceConfiguration(), action);

        // Then
        StepVerifier.create(result)
                .assertNext(execution ->
                        assertThat(execution.getIsExecutionSuccess()).isTrue())
                .verifyComplete();
        RecordedRequest request = server.takeRequest(5, TimeUnit.SECONDS);
        assertThat(request).isNotNull();
        assertThat(request.getPath()).isEqualTo("/books/_bulk?refresh=true");
        assertThat(request.getHeader("Content-Type")).startsWith("application/x-ndjson");
        String[] lines = request.getBody().readUtf8().split("\\R");
        assertThat(lines).hasSize(2);
        assertThat(mapper.readTree(lines[0]).path("index").path("_id").asText()).isEqualTo("id1");
        assertThat(mapper.readTree(lines[1]).path("name").asText()).isEqualTo("Ada \"quoted\"");
    }

    @Test
    void should_preserveNdjsonLineBoundaries_when_bulkBodyHasBindings() throws Exception {
        // Given
        enqueueResponse();
        ActionConfiguration action =
                action("/books/_bulk", "{\"index\":{\"_id\":\"{{id}}\"}}\n{\"name\":\"{{name}}\"}\n");

        // When
        Mono<ActionExecutionResult> result = executor.executeParameterized(
                client, params("id", "id1", "name", "Ada \"quoted\""), new DatasourceConfiguration(), action);

        // Then
        StepVerifier.create(result)
                .assertNext(execution ->
                        assertThat(execution.getIsExecutionSuccess()).isTrue())
                .verifyComplete();
        RecordedRequest request = server.takeRequest(5, TimeUnit.SECONDS);
        assertThat(request).isNotNull();
        String[] lines = request.getBody().readUtf8().split("\\R");
        assertThat(lines).hasSize(2);
        assertThat(mapper.readTree(lines[0]).path("index").path("_id").asText()).isEqualTo("id1");
        assertThat(mapper.readTree(lines[1]).path("name").asText()).isEqualTo("Ada \"quoted\"");
    }
}

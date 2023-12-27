package com.external.plugins;

import com.appsmith.external.models.BearerTokenAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.services.SharedConfig;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.List;
import java.util.Set;

import static com.external.plugins.constants.OpenAIConstants.CHAT_MODELS;
import static com.external.plugins.constants.OpenAIConstants.EMBEDDINGS_MODELS;
import static com.external.plugins.constants.OpenAIErrorMessages.EMPTY_BEARER_TOKEN;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class OpenAIPluginTest {

    private static MockWebServer mockEndpoint;

    public static class MockSharedConfig implements SharedConfig {

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

    OpenAiPlugin.OpenAiPluginExecutor pluginExecutor = new OpenAiPlugin.OpenAiPluginExecutor(new MockSharedConfig());

    @BeforeEach
    public void setUp() throws IOException {
        mockEndpoint = new MockWebServer();
        mockEndpoint.start();
    }

    @AfterEach
    public void tearDown() throws IOException {
        mockEndpoint.shutdown();
    }

    @Test
    public void testValidateDatasourceGivesNoInvalidsWhenConfiguredWithString() {
        BearerTokenAuth bearerTokenAuth = new BearerTokenAuth();
        bearerTokenAuth.setBearerToken("bearerToken");

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(bearerTokenAuth);

        Set<String> invalids = pluginExecutor.validateDatasource(datasourceConfiguration);
        assertEquals(invalids.size(), 0);
    }

    @Test
    public void testValidateDatasourceGivesInvalids() {
        Set<String> invalids = pluginExecutor.validateDatasource(new DatasourceConfiguration());
        assertEquals(invalids.size(), 1);
        assertEquals(invalids, Set.of(EMPTY_BEARER_TOKEN));
    }

    @Test
    public void verifyTestDatasourceReturns() {
        BearerTokenAuth bearerTokenAuth = new BearerTokenAuth();
        bearerTokenAuth.setBearerToken("bearerToken");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(bearerTokenAuth);

        MockResponse mockResponse = new MockResponse();
        mockResponse.setResponseCode(200);
        mockEndpoint.enqueue(mockResponse);

        Mono<DatasourceTestResult> datasourceTestResultMono = pluginExecutor.testDatasource(datasourceConfiguration);

        StepVerifier.create(datasourceTestResultMono).assertNext(datasourceTestResult -> {
            assertEquals(datasourceTestResult.getInvalids().size(), 0);
            assertEquals(datasourceTestResult.getMessages().size(), 0);
            assertTrue(datasourceTestResult.isSuccess());
        });
    }

    @Test
    public void verifyTestDatasourceReturnsFalse() {
        BearerTokenAuth bearerTokenAuth = new BearerTokenAuth();
        bearerTokenAuth.setBearerToken("bearerToken");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(bearerTokenAuth);

        MockResponse mockResponse = new MockResponse();
        mockResponse.setResponseCode(401);
        mockEndpoint.enqueue(mockResponse);

        Mono<DatasourceTestResult> datasourceTestResultMono = pluginExecutor.testDatasource(datasourceConfiguration);

        StepVerifier.create(datasourceTestResultMono).assertNext(datasourceTestResult -> {
            assertEquals(datasourceTestResult.getInvalids().size(), 1);
            assertEquals(datasourceTestResult.getMessages().size(), 0);
            assertFalse(datasourceTestResult.isSuccess());
        });
    }

    @Test
    public void verifyDatasourceTriggerResultsForChatModels() {
        BearerTokenAuth bearerTokenAuth = new BearerTokenAuth();
        bearerTokenAuth.setBearerToken("bearerToken");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(bearerTokenAuth);
        String responseBody =
                "{\n    \"object\": \"list\",\n    \"data\": [\n        {\n          \"id\": \"gpt-3.5\",\n          \"object\": \"model\",\n          \"created\": 1651172509,\n          \"owned_by\": \"openai-dev\",\n          \"root\": \"text-search-babbage-doc-001\",\n          \"parent\": null\n        },\n        {\n          \"id\": \"gpt-3.5-turbo-16k-0613\",\n          \"object\": \"model\",\n          \"created\": 1685474247,\n          \"owned_by\": \"openai\"\n        }\n    ]\n}";
        MockResponse mockResponse = new MockResponse().setBody(responseBody);
        mockResponse.setResponseCode(200);
        mockEndpoint.enqueue(mockResponse);

        TriggerRequestDTO request = new TriggerRequestDTO();
        request.setRequestType(CHAT_MODELS);
        Mono<TriggerResultDTO> datasourceTriggerResultMono =
                pluginExecutor.trigger(null, datasourceConfiguration, request);

        StepVerifier.create(datasourceTriggerResultMono).assertNext(result -> {
            assertTrue(result.getTrigger() instanceof List<?>);
            assertEquals(((List) result.getTrigger()).size(), 1);
            assertEquals(result.getTrigger(), List.of("gpt-3.5", "gpt-3.5-turbo-16k-0613"));
        });
    }

    @Test
    public void verifyDatasourceTriggerResultsForEmbeddingModels() {
        BearerTokenAuth bearerTokenAuth = new BearerTokenAuth();
        bearerTokenAuth.setBearerToken("bearerToken");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(bearerTokenAuth);
        String responseBody =
                "{\n    \"object\": \"list\",\n    \"data\": [\n        {\n          \"id\": \"gpt-3.5\",\n          \"object\": \"model\",\n          \"created\": 1651172509,\n          \"owned_by\": \"openai-dev\",\n          \"root\": \"text-search-babbage-doc-001\",\n          \"parent\": null\n        },\n         {\n            \"id\": \"text-embedding-ada-002\",\n            \"object\": \"model\",\n            \"created\": 1671217299,\n            \"owned_by\": \"openai-internal\"\n           \n         }\n    ]\n}";
        MockResponse mockResponse = new MockResponse().setBody(responseBody);
        mockResponse.setResponseCode(200);
        mockEndpoint.enqueue(mockResponse);

        TriggerRequestDTO request = new TriggerRequestDTO();
        request.setRequestType(EMBEDDINGS_MODELS);
        Mono<TriggerResultDTO> datasourceTriggerResultMono =
                pluginExecutor.trigger(null, datasourceConfiguration, request);

        StepVerifier.create(datasourceTriggerResultMono).assertNext(result -> {
            assertTrue(result.getTrigger() instanceof List<?>);
            assertEquals(((List) result.getTrigger()).size(), 1);
            assertEquals(result.getTrigger(), List.of("text-embedding-ada-002"));
        });
    }
}

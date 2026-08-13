package com.external.plugins;

import com.appsmith.external.models.ApiKeyAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.services.SharedConfig;
import com.external.plugins.constants.GoogleAIConstants;
import com.external.plugins.constants.GoogleAIErrorMessages;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.external.plugins.constants.GoogleAIConstants.LABEL;
import static com.external.plugins.constants.GoogleAIConstants.VALUE;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class GoogleAiPluginTest {
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

    GoogleAiPlugin.GoogleAiPluginExecutor pluginExecutor =
            new GoogleAiPlugin.GoogleAiPluginExecutor(new MockSharedConfig());

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
        ApiKeyAuth apiKeyAuth = new ApiKeyAuth();
        apiKeyAuth.setValue("apiKey");

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(apiKeyAuth);

        Set<String> invalids = pluginExecutor.validateDatasource(datasourceConfiguration);
        assertEquals(invalids.size(), 0);
    }

    @Test
    public void testValidateDatasourceGivesInvalids() {
        Set<String> invalids = pluginExecutor.validateDatasource(new DatasourceConfiguration());
        assertEquals(invalids.size(), 1);
        assertEquals(invalids, Set.of(GoogleAIErrorMessages.EMPTY_API_KEY));
    }

    @Test
    public void verifyTestDatasourceReturnsFalse() {
        ApiKeyAuth apiKeyAuth = new ApiKeyAuth();
        apiKeyAuth.setValue("apiKey");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(apiKeyAuth);

        MockResponse mockResponse = new MockResponse();
        mockResponse.setResponseCode(401);
        mockEndpoint.enqueue(mockResponse);

        Mono<DatasourceTestResult> datasourceTestResultMono = pluginExecutor.testDatasource(datasourceConfiguration);

        StepVerifier.create(datasourceTestResultMono)
                .assertNext(datasourceTestResult -> {
                    assertEquals(datasourceTestResult.getInvalids().size(), 1);
                    assertFalse(datasourceTestResult.isSuccess());
                })
                .verifyComplete();
    }

    // hits the real Google AI API; the fake key makes the live fetch fail, exercising the fallback path
    @Test
    public void verifyDatasourceTriggerResultsForChatModels() {
        ApiKeyAuth apiKeyAuth = new ApiKeyAuth();
        apiKeyAuth.setValue("apiKey");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(apiKeyAuth);

        TriggerRequestDTO request = new TriggerRequestDTO();
        request.setRequestType(GoogleAIConstants.GENERATE_CONTENT_MODEL);
        Mono<TriggerResultDTO> datasourceTriggerResultMono =
                pluginExecutor.trigger(null, datasourceConfiguration, request);

        StepVerifier.create(datasourceTriggerResultMono)
                .assertNext(result -> {
                    assertTrue(result.getTrigger() instanceof List<?>);
                    assertEquals(((List) result.getTrigger()).size(), GoogleAIConstants.GOOGLE_AI_MODELS.size());
                    assertEquals(result.getTrigger(), getDataToMap(GoogleAIConstants.GOOGLE_AI_MODELS));
                })
                .verifyComplete();
    }

    @Test
    public void verifyDatasourceTriggerReturnsFallbackWhenApiKeyIsMissing() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(new ApiKeyAuth());

        TriggerRequestDTO request = new TriggerRequestDTO();
        request.setRequestType(GoogleAIConstants.GENERATE_CONTENT_MODEL);

        StepVerifier.create(pluginExecutor.trigger(null, datasourceConfiguration, request))
                .assertNext(
                        result -> assertEquals(result.getTrigger(), getDataToMap(GoogleAIConstants.GOOGLE_AI_MODELS)))
                .verifyComplete();
    }

    @Test
    public void testExtractGenerateContentModels() {
        String responseBody = "{\"models\":["
                + model("models/gemini-3.6-flash", "generateContent", "countTokens")
                + "," + model("models/gemini-2.5-flash-preview-tts", "generateContent")
                + "," + model("models/gemini-3.1-flash-live-preview", "generateContent")
                + "," + model("models/embedding-001", "embedContent")
                + "," + model("models/imagen-3.0-generate-002", "predict")
                + "," + model("models/gemini-3.1-pro-preview", "generateContent")
                + "," + model("models/gemini-embedding-001", "generateContent")
                + "]}";

        List<String> models = GoogleAiPlugin.GoogleAiPluginExecutor.extractGenerateContentModels(responseBody);

        // tts/live/embedding variants and non-gemini/non-generateContent models are filtered out
        assertEquals(List.of("gemini-3.6-flash", "gemini-3.1-pro-preview"), models);
    }

    @Test
    public void testExtractGenerateContentModels_skipsMalformedEntries() {
        String responseBody = "{\"models\":["
                + "\"not-an-object\","
                + "{\"name\":123,\"supportedGenerationMethods\":[\"generateContent\"]},"
                + "{\"name\":\"models/gemini-3.6-flash\",\"supportedGenerationMethods\":\"generateContent\"},"
                + "{\"name\":\"models/gemini-3.6-flash\"},"
                + model("models/gemini-3.5-flash", "generateContent")
                + "]}";

        // malformed entries are skipped without discarding the valid ones after them
        assertEquals(
                List.of("gemini-3.5-flash"),
                GoogleAiPlugin.GoogleAiPluginExecutor.extractGenerateContentModels(responseBody));
    }

    private static String model(String name, String... methods) {
        String methodList =
                java.util.Arrays.stream(methods).map(m -> "\"" + m + "\"").collect(Collectors.joining(","));
        return "{\"name\":\"" + name + "\",\"supportedGenerationMethods\":[" + methodList + "]}";
    }

    private List<Map<String, String>> getDataToMap(List<String> data) {
        return data.stream().sorted().map(x -> Map.of(LABEL, x, VALUE, x)).collect(Collectors.toList());
    }
}

package com.external.plugins;

import com.appsmith.external.models.ApiKeyAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.services.SharedConfig;
import com.external.plugins.constants.AnthropicConstants;
import com.external.plugins.constants.AnthropicErrorMessages;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import org.json.JSONObject;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class AnthropicPluginTest {
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

    AnthropicPlugin.AnthropicPluginExecutor pluginExecutor =
            new AnthropicPlugin.AnthropicPluginExecutor(new MockSharedConfig());

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
        assertEquals(invalids, Set.of(AnthropicErrorMessages.EMPTY_API_KEY));
    }

    @Test
    @Disabled
    public void verifyTestDatasourceReturns() {
        ApiKeyAuth apiKeyAuth = new ApiKeyAuth();
        apiKeyAuth.setValue("apiKey");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(apiKeyAuth);

        MockResponse mockResponse = new MockResponse();
        mockResponse.setResponseCode(200);
        mockEndpoint.enqueue(mockResponse);

        Mono<DatasourceTestResult> datasourceTestResultMono = pluginExecutor.testDatasource(datasourceConfiguration);

        StepVerifier.create(datasourceTestResultMono)
                .assertNext(datasourceTestResult -> {
                    assertEquals(datasourceTestResult.getInvalids().size(), 0);
                    assertEquals(datasourceTestResult.getMessages().size(), 0);
                    assertTrue(datasourceTestResult.isSuccess());
                })
                .verifyComplete();
    }

    @Test
    public void testFallbackModelsAreKeyedByTriggerRequestType() {
        // trigger() looks up the fallback map by the request type sent from the editor forms
        assertTrue(AnthropicConstants.ANTHROPIC_MODELS.containsKey(AnthropicConstants.CHAT_MODELS));
        assertTrue(AnthropicConstants.ANTHROPIC_MODELS.containsKey(AnthropicConstants.VISION_MODELS));
        assertFalse(AnthropicConstants.ANTHROPIC_MODELS
                .get(AnthropicConstants.CHAT_MODELS)
                .isEmpty());
        assertFalse(AnthropicConstants.ANTHROPIC_MODELS
                .get(AnthropicConstants.VISION_MODELS)
                .isEmpty());
    }

    @Test
    public void testExtractModelIdsFromModelsListResponse() {
        JSONObject modelsResponse = new JSONObject(
                "{\"data\":[{\"type\":\"model\",\"id\":\"claude-opus-5\",\"display_name\":\"Claude Opus 5\"},"
                        + "{\"type\":\"model\",\"id\":\"claude-sonnet-5\",\"display_name\":\"Claude Sonnet 5\"}],"
                        + "\"has_more\":false}");

        assertEquals(
                List.of("claude-opus-5", "claude-sonnet-5"),
                AnthropicPlugin.AnthropicPluginExecutor.extractModelIds(modelsResponse));
    }

    // hits the real Anthropic API; the invalid key must produce a 401 -> invalid result
    @Test
    public void verifyTestDatasourceReturnsFalse() {
        ApiKeyAuth apiKeyAuth = new ApiKeyAuth();
        apiKeyAuth.setValue("apiKey");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(apiKeyAuth);

        Mono<DatasourceTestResult> datasourceTestResultMono = pluginExecutor.testDatasource(datasourceConfiguration);

        StepVerifier.create(datasourceTestResultMono)
                .assertNext(datasourceTestResult -> {
                    assertEquals(datasourceTestResult.getInvalids().size(), 1);
                    assertFalse(datasourceTestResult.isSuccess());
                })
                .verifyComplete();
    }
}

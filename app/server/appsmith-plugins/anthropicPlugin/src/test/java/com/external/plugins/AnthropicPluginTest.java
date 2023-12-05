package com.external.plugins;

import com.appsmith.external.models.ApiKeyAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.models.TriggerRequestDTO;
import com.appsmith.external.models.TriggerResultDTO;
import com.appsmith.external.services.SharedConfig;
import com.external.plugins.constants.AnthropicErrorMessages;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.external.plugins.constants.AnthropicConstants.CHAT_MODELS;
import static com.external.plugins.constants.AnthropicConstants.LABEL;
import static com.external.plugins.constants.AnthropicConstants.VALUE;
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

    @Test
    public void verifyDatasourceTriggerResultsForChatModels() {
        ApiKeyAuth apiKeyAuth = new ApiKeyAuth();
        apiKeyAuth.setValue("apiKey");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(apiKeyAuth);
        String responseBody = "[\"claude-2.1\",\"claude-2\",\"claude-instant-1.2\",\"claude-instant-1\"]";
        MockResponse mockResponse = new MockResponse().setBody(responseBody);
        mockResponse.setResponseCode(200);
        mockEndpoint.enqueue(mockResponse);

        TriggerRequestDTO request = new TriggerRequestDTO();
        request.setRequestType(CHAT_MODELS);
        Mono<TriggerResultDTO> datasourceTriggerResultMono =
                pluginExecutor.trigger(null, datasourceConfiguration, request);

        StepVerifier.create(datasourceTriggerResultMono)
                .assertNext(result -> {
                    assertTrue(result.getTrigger() instanceof List<?>);
                    assertEquals(((List) result.getTrigger()).size(), 4);
                    assertEquals(
                            result.getTrigger(),
                            getDataToMap(List.of("claude-2.1", "claude-2", "claude-instant-1.2", "claude-instant-1")));
                })
                .verifyComplete();
    }

    private List<Map<String, String>> getDataToMap(List<String> data) {
        return data.stream().sorted().map(x -> Map.of(LABEL, x, VALUE, x)).collect(Collectors.toList());
    }
}

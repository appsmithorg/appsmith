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

import static com.external.plugins.constants.DeepseekAIConstants.CHAT_MODELS;
import static com.external.plugins.constants.DeepseekAIErrorMessages.EMPTY_BEARER_TOKEN;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class AIPluginTest {

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

    DeepseekAiPlugin.DeepseekAiPluginExecutor pluginExecutor = new DeepseekAiPlugin.DeepseekAiPluginExecutor(new MockSharedConfig());

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

        // 修复：使用 mockEndpoint 的 URL
        datasourceConfiguration.setUrl(mockEndpoint.url("/").toString());

        MockResponse mockResponse = new MockResponse();
        mockResponse.setResponseCode(200);
        mockEndpoint.enqueue(mockResponse);

        Mono<DatasourceTestResult> datasourceTestResultMono = pluginExecutor.testDatasource(datasourceConfiguration);

        StepVerifier.create(datasourceTestResultMono).assertNext(datasourceTestResult -> {
            assertEquals(datasourceTestResult.getInvalids().size(), 0);
            assertTrue(datasourceTestResult.getMessages() == null || datasourceTestResult.getMessages().size() == 0);
            assertTrue(datasourceTestResult.isSuccess());
        }).verifyComplete();
    }

    @Test
    public void verifyTestDatasourceReturnsFalse() {
        BearerTokenAuth bearerTokenAuth = new BearerTokenAuth();
        bearerTokenAuth.setBearerToken("bearerToken");
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(bearerTokenAuth);

        // 修复：使用 mockEndpoint 的 URL
        datasourceConfiguration.setUrl(mockEndpoint.url("/").toString());
        
        MockResponse mockResponse = new MockResponse();
        mockResponse.setResponseCode(401);
        mockEndpoint.enqueue(mockResponse);

        Mono<DatasourceTestResult> datasourceTestResultMono = pluginExecutor.testDatasource(datasourceConfiguration);

        StepVerifier.create(datasourceTestResultMono).assertNext(datasourceTestResult -> {
            assertEquals(datasourceTestResult.getInvalids().size(), 1);
            assertTrue(datasourceTestResult.getMessages() == null || datasourceTestResult.getMessages().size() == 0);
            assertFalse(datasourceTestResult.isSuccess());
        }).verifyComplete();
    }
}

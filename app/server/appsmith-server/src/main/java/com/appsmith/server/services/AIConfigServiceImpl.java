package com.appsmith.server.services;

import com.appsmith.server.dtos.AIConfigDTO;
import com.appsmith.server.services.ce.AIConfigServiceCEImpl;
import com.appsmith.server.services.ce_compatible.AIConfigServiceCECompatibleImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@Service
public class AIConfigServiceImpl extends AIConfigServiceCECompatibleImpl implements AIConfigService {

    private final AIConfigServiceCEImpl delegate;

    public AIConfigServiceImpl(
            OrganizationService organizationService,
            ObjectMapper objectMapper,
            AnalyticsService analyticsService,
            SessionUserService sessionUserService) {
        this.delegate =
                new AIConfigServiceCEImpl(organizationService, objectMapper, analyticsService, sessionUserService);
    }

    @Override
    public Mono<Map<String, Object>> updateAIConfig(AIConfigDTO aiConfig) {
        return delegate.updateAIConfig(aiConfig);
    }

    @Override
    public Mono<Map<String, Object>> getAIConfig() {
        return delegate.getAIConfig();
    }

    @Override
    public Mono<Map<String, Object>> testLlmConnection(Map<String, String> request) {
        return delegate.testLlmConnection(request);
    }

    @Override
    public Mono<Map<String, Object>> fetchLlmModels(Map<String, String> request) {
        return delegate.fetchLlmModels(request);
    }

    @Override
    public Mono<Map<String, Object>> testApiKey(Map<String, String> request) {
        return delegate.testApiKey(request);
    }
}

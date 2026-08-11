package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.AIConfigDTO;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface AIConfigServiceCE {

    Mono<Map<String, Object>> updateAIConfig(AIConfigDTO aiConfig);

    Mono<Map<String, Object>> getAIConfig();

    Mono<Map<String, Object>> testLlmConnection(Map<String, String> request);

    Mono<Map<String, Object>> fetchLlmModels(Map<String, String> request);

    Mono<Map<String, Object>> testApiKey(Map<String, String> request);
}

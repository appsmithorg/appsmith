package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.dtos.AIConfigDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
public class AIConfigServiceCECompatibleImpl implements AIConfigServiceCECompatible {

    @Override
    public Mono<Map<String, Object>> updateAIConfig(AIConfigDTO aiConfig) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Map<String, Object>> getAIConfig() {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Map<String, Object>> testLlmConnection(Map<String, String> request) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Map<String, Object>> fetchLlmModels(Map<String, String> request) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<Map<String, Object>> testApiKey(Map<String, String> request) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}

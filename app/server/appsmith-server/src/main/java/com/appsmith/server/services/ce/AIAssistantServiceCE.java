package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.AIEditorContextDTO;
import reactor.core.publisher.Mono;

public interface AIAssistantServiceCE {
    Mono<String> getAIResponse(String provider, String prompt, AIEditorContextDTO context);
}

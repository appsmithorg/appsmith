package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.AIEditorContextDTO;
import com.appsmith.server.dtos.AIMessageDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface AIAssistantServiceCE {
    Mono<String> getAIResponse(String provider, String prompt, AIEditorContextDTO context);

    Mono<String> getAIResponse(
            String provider, String prompt, AIEditorContextDTO context, List<AIMessageDTO> conversationHistory);
}

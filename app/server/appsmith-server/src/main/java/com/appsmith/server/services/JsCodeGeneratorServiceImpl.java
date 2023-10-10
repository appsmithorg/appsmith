package com.appsmith.server.services;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.dtos.ChatGenerationDTO;
import com.appsmith.server.dtos.ChatGenerationResponseDTO;
import com.appsmith.server.enums.ChatGenerationType;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.ce_compatible.JsCodeGeneratorServiceCECompatibleImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class JsCodeGeneratorServiceImpl extends JsCodeGeneratorServiceCECompatibleImpl
        implements JsCodeGeneratorService {
    private final ChatService chatService;

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.ask_ai_js)
    @Override
    public Mono<ChatGenerationResponseDTO> generateCode(ChatGenerationDTO chatGenerationDTO, ChatGenerationType type) {
        return chatService.generateCode(chatGenerationDTO, type);
    }
}

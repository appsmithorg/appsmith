package com.appsmith.server.services;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.dtos.ChatGenerationDTO;
import com.appsmith.server.dtos.ChatGenerationResponseDTO;
import com.appsmith.server.enums.ChatGenerationType;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.ce_compatible.SqlGeneratorServiceCECompatibleImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class SqlGeneratorServiceImpl extends SqlGeneratorServiceCECompatibleImpl implements SqlGeneratorService {
    private final ChatService chatService;

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.ask_ai_sql)
    @Override
    public Mono<ChatGenerationResponseDTO> generateCode(ChatGenerationDTO chatGenerationDTO, ChatGenerationType type) {
        return chatService.generateCode(chatGenerationDTO, type);
    }
}

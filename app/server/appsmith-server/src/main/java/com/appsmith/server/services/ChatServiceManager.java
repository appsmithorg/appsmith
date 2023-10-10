package com.appsmith.server.services;

import com.appsmith.server.dtos.ChatGenerationDTO;
import com.appsmith.server.dtos.ChatGenerationResponseDTO;
import com.appsmith.server.enums.ChatGenerationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatServiceManager {
    private final ChatServiceFactory chatServiceFactory;

    public Mono<ChatGenerationResponseDTO> generateResponse(
            ChatGenerationDTO chatGenerationDTO, ChatGenerationType type) {
        return chatServiceFactory.codeGeneratorService(type).generateCode(chatGenerationDTO, type);
    }
}

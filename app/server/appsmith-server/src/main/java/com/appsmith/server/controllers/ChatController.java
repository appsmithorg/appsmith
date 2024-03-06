package com.appsmith.server.controllers;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ChatGenerationDTO;
import com.appsmith.server.dtos.ChatGenerationResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.enums.ChatGenerationType;
import com.appsmith.server.services.ChatServiceManager;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(Url.CHAT_URL)
@RequiredArgsConstructor
public class ChatController {
    private final ChatServiceManager chatServiceManager;

    @JsonView(Views.Public.class)
    @PostMapping("/chat-generation")
    public Mono<ResponseDTO<ChatGenerationResponseDTO>> generateCode(
            @RequestParam ChatGenerationType type, @RequestBody ChatGenerationDTO chatGenerationDTO) {
        return chatServiceManager
                .generateResponse(chatGenerationDTO, type)
                .map(generated -> new ResponseDTO<>(HttpStatus.OK.value(), generated, null));
    }
}

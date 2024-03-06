package com.appsmith.server.services;

import com.appsmith.server.dtos.ChatGenerationResponseDTO;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(SpringExtension.class)
@SpringBootTest
class JsCodeGeneratorServiceImplTest {
    JsCodeGeneratorService jsCodeGeneratorService;

    @SpyBean
    FeatureFlagService featureFlagService;

    @MockBean
    ChatService chatService;

    @BeforeEach
    public void setup() {
        jsCodeGeneratorService = new JsCodeGeneratorServiceImpl(chatService);
        Mockito.when(featureFlagService.check(ArgumentMatchers.eq(FeatureFlagEnum.ask_ai_js)))
                .thenReturn(Mono.just(true));
    }

    @Test
    public void testJsCodeGeneratorService_whenFeatureFlagEnabled() {
        ChatGenerationResponseDTO chatGenerationResponseDTO = new ChatGenerationResponseDTO();
        Mockito.when(chatService.generateCode(ArgumentMatchers.any(), ArgumentMatchers.any()))
                .thenReturn(Mono.just(chatGenerationResponseDTO));
        Mono<ChatGenerationResponseDTO> chatGenerationResponseDTOMono = jsCodeGeneratorService.generateCode(null, null);
        StepVerifier.create(chatGenerationResponseDTOMono)
                .assertNext(chatGenerationResponseDTO1 -> {
                    Assertions.assertEquals(chatGenerationResponseDTO, chatGenerationResponseDTO1);
                })
                .verifyComplete();
    }
}

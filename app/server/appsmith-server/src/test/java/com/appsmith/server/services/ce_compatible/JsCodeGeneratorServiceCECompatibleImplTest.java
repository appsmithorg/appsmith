package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.dtos.ChatGenerationResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.JsCodeGeneratorService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@ExtendWith(SpringExtension.class)
@SpringBootTest
class JsCodeGeneratorServiceCECompatibleImplTest {
    @Autowired
    JsCodeGeneratorService jsCodeGeneratorService;

    @SpyBean
    FeatureFlagService featureFlagService;

    @Test
    public void testJsCodeGeneratorService_whenFeatureFlagDisabled() {
        Mockito.when(featureFlagService.check(ArgumentMatchers.eq(FeatureFlagEnum.ask_ai_js)))
                .thenReturn(Mono.just(false));
        Mono<ChatGenerationResponseDTO> chatGenerationResponseDTOMono = jsCodeGeneratorService.generateCode(null, null);
        StepVerifier.create(chatGenerationResponseDTOMono)
                .expectErrorMatches(error -> error instanceof AppsmithException
                        && ((AppsmithException) error).getError().equals(AppsmithError.UNSUPPORTED_OPERATION))
                .verify();
    }
}

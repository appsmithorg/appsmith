package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.dtos.ChatGenerationDTO;
import com.appsmith.server.dtos.ChatGenerationResponseDTO;
import com.appsmith.server.enums.ChatGenerationType;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class JsFunctionGeneratorServiceCECompatibleImpl implements JsFunctionGeneratorServiceCECompatible {
    @Override
    public Mono<ChatGenerationResponseDTO> generateCode(ChatGenerationDTO chatGenerationDTO, ChatGenerationType type) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}

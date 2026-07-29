package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.AIConfigDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.AIConfigService;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@RequestMapping(Url.ORGANIZATION_URL)
@RequiredArgsConstructor
public class AIConfigControllerCE {

    private final AIConfigService aiConfigService;

    @JsonView(Views.Public.class)
    @PutMapping("/ai-config")
    public Mono<ResponseDTO<Map<String, Object>>> updateAIConfig(@RequestBody @Valid AIConfigDTO aiConfig) {
        return aiConfigService
                .updateAIConfig(aiConfig)
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result))
                .onErrorResume(error -> {
                    String errorMessage = "Failed to update AI configuration";
                    if (error instanceof AppsmithException appsmithError) {
                        if (appsmithError.getError() == AppsmithError.ACL_NO_RESOURCE_FOUND) {
                            errorMessage = "You do not have permission to update this configuration";
                        } else {
                            errorMessage = appsmithError.getError().getMessage();
                        }
                    }
                    return Mono.just(new ResponseDTO<Map<String, Object>>(
                            HttpStatus.BAD_REQUEST.value(), null, errorMessage, false));
                });
    }

    @JsonView(Views.Public.class)
    @GetMapping("/ai-config")
    public Mono<ResponseDTO<Map<String, Object>>> getAIConfig() {
        return aiConfigService.getAIConfig().map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/ai-config/test-connection")
    public Mono<ResponseDTO<Map<String, Object>>> testLlmConnection(@RequestBody Map<String, String> request) {
        return aiConfigService.testLlmConnection(request).map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/ai-config/fetch-models")
    public Mono<ResponseDTO<Map<String, Object>>> fetchLlmModels(@RequestBody Map<String, String> request) {
        return aiConfigService.fetchLlmModels(request).map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/ai-config/test-api-key")
    public Mono<ResponseDTO<Map<String, Object>>> testApiKey(@RequestBody Map<String, String> request) {
        return aiConfigService.testApiKey(request).map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }
}

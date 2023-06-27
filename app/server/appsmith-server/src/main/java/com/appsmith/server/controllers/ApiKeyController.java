package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ApiKeyRequestDto;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ApiKeyService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping(Url.API_KEY_URL)
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    public ApiKeyController(ApiKeyService apiKeyService) {
        this.apiKeyService = apiKeyService;
    }

    @PostMapping("")
    public Mono<ResponseDTO<String>> generateApiKeyToken(@RequestBody ApiKeyRequestDto apiKeyRequestDto) {
        return apiKeyService.generateApiKey(apiKeyRequestDto)
                .map(apiKey -> new ResponseDTO<>(HttpStatus.CREATED.value(), apiKey, null));
    }
}

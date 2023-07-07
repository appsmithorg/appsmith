package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ApiKeyRequestDto;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ApiKeyService;
import com.appsmith.server.services.ProvisionService;
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
    private final ProvisionService provisionService;

    public ApiKeyController(ApiKeyService apiKeyService, ProvisionService provisionService) {
        this.apiKeyService = apiKeyService;
        this.provisionService = provisionService;
    }

    @PostMapping("")
    public Mono<ResponseDTO<String>> generateApiKeyToken(@RequestBody ApiKeyRequestDto apiKeyRequestDto) {
        return apiKeyService
                .generateApiKey(apiKeyRequestDto)
                .map(apiKey -> new ResponseDTO<>(HttpStatus.CREATED.value(), apiKey, null));
    }

    @PostMapping("/provision")
    public Mono<ResponseDTO<String>> generateProvisionToken() {
        log.debug("Generating API key for Provisioning.");
        return provisionService
                .generateProvisionToken()
                .map(apiKey -> new ResponseDTO<>(HttpStatus.CREATED.value(), apiKey, null));
    }
}

package com.appsmith.server.controllers;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ApiKeyRequestDto;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ApiKeyService;
import com.appsmith.server.services.ProvisionService;
import com.appsmith.server.workflows.interact.InteractWorkflowService;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping(Url.API_KEY_URL)
public class ApiKeyController {

    private final ApiKeyService apiKeyService;
    private final ProvisionService provisionService;
    private final InteractWorkflowService interactWorkflowService;

    public ApiKeyController(
            ApiKeyService apiKeyService,
            ProvisionService provisionService,
            InteractWorkflowService interactWorkflowService) {
        this.apiKeyService = apiKeyService;
        this.provisionService = provisionService;
        this.interactWorkflowService = interactWorkflowService;
    }

    @PostMapping("")
    public Mono<ResponseDTO<String>> generateApiKeyToken(@RequestBody ApiKeyRequestDto apiKeyRequestDto) {
        log.debug("Generating API key for email: {}", apiKeyRequestDto.getEmail());
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

    @JsonView(Views.Public.class)
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/workflow/{id}")
    public Mono<ResponseDTO<String>> generateWorkflowToken(@PathVariable String id) {
        log.debug("Generating Bearer Token for Workflow with id: {}", id);
        return interactWorkflowService
                .generateBearerTokenForWebhook(id)
                .map(createdBearerToken -> new ResponseDTO<>(HttpStatus.CREATED.value(), createdBearerToken, null));
    }
}

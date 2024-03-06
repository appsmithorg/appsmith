package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.KnowledgeStoreUpstreamDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.knowledgebase.services.KnowledgeStoreService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@Slf4j
@RequestMapping(Url.KNOWLEDGE_BASE_URL)
public class KnowledgeStoreController {

    private final KnowledgeStoreService knowledgeStoreService;

    @Autowired
    public KnowledgeStoreController(KnowledgeStoreService knowledgeStoreService) {
        this.knowledgeStoreService = knowledgeStoreService;
    }

    @PostMapping("/{applicationId}")
    public Mono<ResponseDTO<KnowledgeStoreUpstreamDTO>> generateDraftKB(@PathVariable String applicationId) {
        log.debug("Starting KnowledgeBase generation for application id: {}", applicationId);

        return knowledgeStoreService
                .generateDraftKB(applicationId, Boolean.TRUE)
                .map(message -> new ResponseDTO<>(HttpStatus.OK.value(), message, null));
    }

    @GetMapping("/{applicationId}")
    public Mono<ResponseDTO<KnowledgeStoreUpstreamDTO>> getKnowledgeStore(@PathVariable String applicationId) {
        log.debug("fetching knowledge base generation for the application id: {}", applicationId);

        return knowledgeStoreService
                .getKnowledgeStore(applicationId, Boolean.TRUE)
                .map(message -> new ResponseDTO<>(HttpStatus.OK.value(), message, null));
    }
}

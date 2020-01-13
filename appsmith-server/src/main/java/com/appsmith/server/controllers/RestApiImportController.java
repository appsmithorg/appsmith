package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.RestApiImporterType;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ApiImporter;
import com.appsmith.server.services.CurlImporterService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import javax.validation.Valid;

@RestController
@RequestMapping(Url.IMPORT_URL)
@Slf4j
public class RestApiImportController {

    private final CurlImporterService curlImporterService;

    public RestApiImportController(CurlImporterService curlImporterService) {
        this.curlImporterService = curlImporterService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Action>> create(@Valid @RequestBody Object input, @RequestParam RestApiImporterType type) throws AppsmithException {
        log.debug("Going to import API");
        ApiImporter service;

        switch (type) {
            case CURL:
                service = curlImporterService;
                break;
            default:
                throw new IllegalStateException("Unexpected value: " + type);
        }

        return Mono.just(service.importAction(input))
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }
}

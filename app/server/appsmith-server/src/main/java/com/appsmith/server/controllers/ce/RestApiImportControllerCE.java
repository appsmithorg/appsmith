package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.RestApiImporterType;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ApiImporter;
import com.appsmith.server.services.CurlImporterService;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import reactor.core.publisher.Mono;

@RequestMapping(Url.IMPORT_URL)
@Slf4j
public class RestApiImportControllerCE {

    private final CurlImporterService curlImporterService;

    public RestApiImportControllerCE(CurlImporterService curlImporterService) {
        this.curlImporterService = curlImporterService;
    }

    @JsonView(Views.Public.class)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<ActionDTO>> create(
            @RequestBody(required = false) Object input,
            @RequestParam RestApiImporterType type,
            @RequestParam String pageId,
            @RequestParam String name,
            @RequestParam String workspaceId,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName,
            @RequestHeader(name = "Origin", required = false) String originHeader) {
        log.debug("Going to import API");
        ApiImporter service;

        switch (type) {
            case CURL:
                service = (ApiImporter) curlImporterService;
                break;
            default:
                throw new IllegalStateException("Unexpected value: " + type);
        }

        return service.importAction(input, pageId, name, workspaceId, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }
}

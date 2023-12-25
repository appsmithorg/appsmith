package com.appsmith.server.controllers;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.dtos.ConsolidatedAPIResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ConsolidatedAPIService;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping(Url.CONSOLIDATED_API_URL)
public class ConsolidatedAPIController {
    private final ConsolidatedAPIService consolidatedAPIService;

    public ConsolidatedAPIController(ConsolidatedAPIService consolidatedAPIService) {
        this.consolidatedAPIService = consolidatedAPIService;
    }

    @JsonView(Views.Public.class)
    @GetMapping
    public Mono<ResponseDTO<ConsolidatedAPIResponseDTO>> getAllPages(
        @RequestParam(required = false) String applicationId,
        @RequestParam(required = false) String pageId,
        @RequestParam(required = true, defaultValue = "EDIT") ApplicationMode mode,
        @RequestParam(required = false, defaultValue = "false") Boolean migrateDsl,
        @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug(
            "Going to fetch consolidatedAPI response for applicationId: {}, pageId: {}, branchName: {}, mode: {}",
            applicationId,
            pageId,
            branchName,
            mode);
        return consolidatedAPIService
            .getConsolidatedInfoForPageLoad(applicationId, pageId, branchName, mode, migrateDsl)
            .map(consolidatedAPIResponseDTO -> new ResponseDTO<>(HttpStatus.OK.value(), consolidatedAPIResponseDTO, null));
    }

}

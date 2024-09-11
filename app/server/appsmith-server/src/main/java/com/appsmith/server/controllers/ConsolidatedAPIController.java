package com.appsmith.server.controllers;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.dtos.ConsolidatedAPIResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ConsolidatedAPIService;
import com.fasterxml.jackson.annotation.JsonView;
import io.micrometer.observation.ObservationRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Mono;

import java.util.Objects;

import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.CONSOLIDATED_API_ROOT_EDIT;
import static com.appsmith.external.constants.spans.ConsolidatedApiSpanNames.CONSOLIDATED_API_ROOT_VIEW;

@Slf4j
@RestController
@RequestMapping(Url.CONSOLIDATED_API_URL)
public class ConsolidatedAPIController {
    private final ConsolidatedAPIService consolidatedAPIService;
    private final ObservationRegistry observationRegistry;

    public ConsolidatedAPIController(
            ConsolidatedAPIService consolidatedAPIService, ObservationRegistry observationRegistry) {
        this.consolidatedAPIService = consolidatedAPIService;
        this.observationRegistry = observationRegistry;
    }

    /**
     * This endpoint is meant to be used by the client application at the time of 1st page load. Client currently makes
     * several API calls to fetch all the required data. This endpoint consolidates all that data and returns them as
     * response hence enabling the client to fetch the required data via a single API call only.
     */
    @JsonView(Views.Public.class)
    @GetMapping("/edit")
    public Mono<ResponseDTO<ConsolidatedAPIResponseDTO>> getAllDataForFirstPageLoadForEditMode(
            @RequestParam(name = FieldName.APPLICATION_ID, required = false) String baseApplicationId,
            @RequestParam(name = "defaultPageId", required = false) String basePageId,
            @RequestHeader(required = false) String branchName) {
        log.debug(
                "Going to fetch consolidatedAPI response for baseApplicationId: {}, basePageId: {}, branchName: {}, "
                        + "mode: {}",
                baseApplicationId,
                basePageId,
                branchName,
                ApplicationMode.EDIT);

        return consolidatedAPIService
                .getConsolidatedInfoForPageLoad(basePageId, baseApplicationId, branchName, ApplicationMode.EDIT)
                .map(consolidatedAPIResponseDTO ->
                        new ResponseDTO<>(HttpStatus.OK.value(), consolidatedAPIResponseDTO, null))
                .tag("pageId", Objects.toString(basePageId))
                .tag("applicationId", Objects.toString(baseApplicationId))
                .tag("branchName", Objects.toString(branchName))
                .name(CONSOLIDATED_API_ROOT_EDIT)
                .tap(Micrometer.observation(observationRegistry));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/view")
    public Mono<ResponseDTO<ConsolidatedAPIResponseDTO>> getAllDataForFirstPageLoadForViewMode(
            @RequestParam(required = false) String applicationId,
            @RequestParam(required = false) String defaultPageId,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug(
                "Going to fetch consolidatedAPI response for applicationId: {}, defaultPageId: {}, branchName: {}, "
                        + "mode: {}",
                applicationId,
                defaultPageId,
                branchName,
                ApplicationMode.PUBLISHED);

        return consolidatedAPIService
                .getConsolidatedInfoForPageLoad(defaultPageId, applicationId, branchName, ApplicationMode.PUBLISHED)
                .map(consolidatedAPIResponseDTO ->
                        new ResponseDTO<>(HttpStatus.OK.value(), consolidatedAPIResponseDTO, null))
                .tag("pageId", Objects.toString(defaultPageId))
                .tag("applicationId", Objects.toString(applicationId))
                .tag("branchName", Objects.toString(branchName))
                .name(CONSOLIDATED_API_ROOT_VIEW)
                .tap(Micrometer.observation(observationRegistry));
    }
}

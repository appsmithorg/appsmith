package com.appsmith.server.controllers;

import com.appsmith.external.git.constants.ce.RefType;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
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
import static org.apache.commons.lang3.StringUtils.isBlank;

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
            @RequestParam(required = false, defaultValue = "branch") RefType refType,
            @RequestParam(required = false) String refName,
            @RequestParam(required = false) String branchName) {

        if (!StringUtils.hasLength(refName)) {
            refName = branchName;
        }
        log.debug(
                "Going to fetch consolidatedAPI response for baseApplicationId: {}, basePageId: {}, {}: {}, "
                        + "mode: {}",
                baseApplicationId,
                basePageId,
                refType,
                refName,
                ApplicationMode.EDIT);

        return consolidatedAPIService
                .getConsolidatedInfoForPageLoad(basePageId, baseApplicationId, refType, refName, ApplicationMode.EDIT)
                .map(consolidatedAPIResponseDTO -> new ResponseDTO<>(HttpStatus.OK, consolidatedAPIResponseDTO))
                .tag("pageId", Objects.toString(basePageId))
                .tag("applicationId", Objects.toString(baseApplicationId))
                .tag("refType", Objects.toString(refType))
                .tag("refName", Objects.toString(refName))
                .name(CONSOLIDATED_API_ROOT_EDIT)
                .tap(Micrometer.observation(observationRegistry));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/view")
    public Mono<ResponseEntity<ResponseDTO<ConsolidatedAPIResponseDTO>>> getAllDataForFirstPageLoadForViewMode(
            @RequestParam(required = false) String applicationId,
            @RequestParam(required = false) String defaultPageId,
            @RequestParam(required = false, defaultValue = "branch") RefType refType,
            @RequestParam(required = false) String refName,
            @RequestParam(required = false) String branchName,
            @RequestHeader(required = false, name = "if-none-match") String ifNoneMatch) {
        if (!StringUtils.hasLength(refName)) {
            refName = branchName;
        }
        log.debug(
                "Going to fetch consolidatedAPI response for applicationId: {}, defaultPageId: {}, {}: {}, "
                        + "mode: {}",
                applicationId,
                defaultPageId,
                refType,
                refName,
                ApplicationMode.PUBLISHED);

        return consolidatedAPIService
                .getConsolidatedInfoForPageLoad(
                        defaultPageId, applicationId, refType, refName, ApplicationMode.PUBLISHED)
                .map(consolidatedAPIResponseDTO -> {
                    long startTime = System.currentTimeMillis();

                    String responseHash = consolidatedAPIService.computeConsolidatedAPIResponseEtag(
                            consolidatedAPIResponseDTO, defaultPageId, applicationId);
                    long endTime = System.currentTimeMillis();
                    long duration = endTime - startTime;
                    log.debug("Time taken to compute ETag: {} ms", duration);

                    // if defaultPageId and applicationId are both null, then don't compute ETag
                    if (isBlank(responseHash)) {
                        ResponseDTO<ConsolidatedAPIResponseDTO> responseDTO =
                                new ResponseDTO<>(HttpStatus.OK, consolidatedAPIResponseDTO);
                        return new ResponseEntity<>(responseDTO, HttpStatus.OK);
                    }

                    HttpHeaders headers = new HttpHeaders();
                    headers.add("ETag", responseHash);
                    headers.add("Cache-Control", "private, must-revalidate");

                    if (ifNoneMatch != null && ifNoneMatch.equals(responseHash)) {
                        ResponseDTO<ConsolidatedAPIResponseDTO> responseDTO =
                                new ResponseDTO<>(HttpStatus.NOT_MODIFIED, null);
                        return new ResponseEntity<>(responseDTO, headers, HttpStatus.NOT_MODIFIED);
                    }

                    ResponseDTO<ConsolidatedAPIResponseDTO> responseDTO =
                            new ResponseDTO<>(HttpStatus.OK, consolidatedAPIResponseDTO);

                    return new ResponseEntity<>(responseDTO, headers, HttpStatus.OK);
                })
                .tag("pageId", Objects.toString(defaultPageId))
                .tag("applicationId", Objects.toString(applicationId))
                .tag("refType", Objects.toString(refType))
                .tag("refName", Objects.toString(refName))
                .name(CONSOLIDATED_API_ROOT_VIEW)
                .tap(Micrometer.observation(observationRegistry));
    }
}

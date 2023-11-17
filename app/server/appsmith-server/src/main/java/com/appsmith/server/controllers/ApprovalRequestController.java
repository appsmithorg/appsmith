package com.appsmith.server.controllers;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.ApprovalRequest;
import com.appsmith.server.dtos.ApprovalRequestCreationDTO;
import com.appsmith.server.dtos.ApprovalRequestResolutionDTO;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.workflows.crud.CrudApprovalRequestService;
import com.appsmith.server.workflows.interact.InteractApprovalRequestService;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Slf4j
@RequestMapping(Url.WORKFLOW_APPROVAL_URL)
@RestController
public class ApprovalRequestController {

    private final CrudApprovalRequestService crudApprovalRequestService;
    private final InteractApprovalRequestService interactApprovalRequestService;

    public ApprovalRequestController(
            CrudApprovalRequestService approvalRequestService,
            InteractApprovalRequestService interactApprovalRequestService) {
        this.crudApprovalRequestService = approvalRequestService;
        this.interactApprovalRequestService = interactApprovalRequestService;
    }

    @JsonView(Views.Public.class)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<ApprovalRequest>> create(
            @RequestBody ApprovalRequestCreationDTO approvalRequestCreationDTO) {
        return crudApprovalRequestService
                .createApprovalRequest(approvalRequestCreationDTO)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public Mono<ResponseDTO<PagedDomain<ApprovalRequest>>> getAll(
            @RequestParam MultiValueMap<String, String> queryParams) {
        return crudApprovalRequestService
                .getPaginatedApprovalRequests(queryParams)
                .map(approvalRequests -> new ResponseDTO<>(HttpStatus.OK.value(), approvalRequests, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public Mono<ResponseDTO<ApprovalRequest>> get(@PathVariable String id) {
        return crudApprovalRequestService
                .getApprovalRequestById(id)
                .map(approvalRequest -> new ResponseDTO<>(HttpStatus.OK.value(), approvalRequest, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/resolve")
    @ResponseStatus(HttpStatus.OK)
    public Mono<ResponseDTO<Boolean>> resolve(@RequestBody ApprovalRequestResolutionDTO approvalRequestResolutionDTO) {
        return interactApprovalRequestService
                .resolveApprovalRequest(approvalRequestResolutionDTO)
                .map(resolved -> new ResponseDTO<>(HttpStatus.OK.value(), resolved, null));
    }
}

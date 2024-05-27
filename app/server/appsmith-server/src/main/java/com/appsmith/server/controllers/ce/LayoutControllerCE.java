package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.*;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.services.LayoutService;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RequestMapping(Url.LAYOUT_URL)
@Slf4j
public class LayoutControllerCE {

    private final LayoutService service;
    private final UpdateLayoutService updateLayoutService;
    private final RefactoringService refactoringService;

    @Autowired
    public LayoutControllerCE(
            LayoutService layoutService,
            UpdateLayoutService updateLayoutService,
            RefactoringService refactoringService) {
        this.service = layoutService;
        this.updateLayoutService = updateLayoutService;
        this.refactoringService = refactoringService;
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{layoutId}/pages/{defaultPageId}")
    public Mono<ResponseDTO<Layout>> getLayout(
            @PathVariable String defaultPageId,
            @PathVariable String layoutId,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return service.getLayout(defaultPageId, layoutId, false, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.OK.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/application/{applicationId}")
    public Mono<ResponseDTO<Integer>> updateMultipleLayouts(
            @PathVariable String applicationId,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName,
            @RequestBody @Valid UpdateMultiplePageLayoutDTO request) {
        log.debug("update multiple layout received for application {} branch {}", applicationId, branchName);
        return updateLayoutService
                .updateMultipleLayouts(applicationId, branchName, request)
                .map(updatedCount -> new ResponseDTO<>(HttpStatus.OK.value(), updatedCount, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/{layoutId}/pages/{pageId}")
    public Mono<ResponseDTO<LayoutDTO>> updateLayout(
            @PathVariable String pageId,
            @RequestParam String applicationId,
            @PathVariable String layoutId,
            @RequestBody Layout layout,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("update layout received for page {}", pageId);
        return updateLayoutService
                .updateLayout(pageId, applicationId, layoutId, layout, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.OK.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{layoutId}/pages/{pageId}/view")
    public Mono<ResponseDTO<Layout>> getLayoutView(
            @PathVariable String pageId,
            @PathVariable String layoutId,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return service.getLayout(pageId, layoutId, true, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.OK.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/refactor")
    public Mono<ResponseDTO<LayoutDTO>> refactorWidgetName(
            @RequestBody RefactorEntityNameDTO refactorEntityNameDTO,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        refactorEntityNameDTO.setEntityType(EntityType.WIDGET);
        return refactoringService
                .refactorEntityName(refactorEntityNameDTO, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.OK.value(), created, null));
    }
}

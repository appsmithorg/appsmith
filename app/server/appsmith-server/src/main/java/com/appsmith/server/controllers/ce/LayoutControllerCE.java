package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.LayoutUpdateDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UpdateMultiplePageLayoutDTO;
import com.appsmith.server.layouts.UpdateLayoutService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.services.LayoutService;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    @GetMapping("/{layoutId}/pages/{branchedPageId}")
    public Mono<ResponseDTO<Layout>> getLayout(@PathVariable String branchedPageId, @PathVariable String layoutId) {
        return service.getLayout(branchedPageId, layoutId, false)
                .map(created -> new ResponseDTO<>(HttpStatus.OK.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/application/{applicationId}")
    public Mono<ResponseDTO<Integer>> updateMultipleLayouts(
            @PathVariable String applicationId, @RequestBody @Valid UpdateMultiplePageLayoutDTO request) {
        log.debug("update multiple layout received for applicationId {}", applicationId);
        return updateLayoutService
                .updateMultipleLayouts(applicationId, request)
                .map(updatedCount -> new ResponseDTO<>(HttpStatus.OK.value(), updatedCount, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/{layoutId}/pages/{branchedPageId}")
    public Mono<ResponseDTO<LayoutDTO>> updateLayout(
            @PathVariable String branchedPageId,
            @RequestParam String applicationId,
            @PathVariable String layoutId,
            @RequestBody LayoutUpdateDTO dto) {
        log.debug("update layout received for page {}", branchedPageId);
        return updateLayoutService
                .updateLayout(branchedPageId, applicationId, layoutId, dto.toLayout())
                .map(created -> new ResponseDTO<>(HttpStatus.OK.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{layoutId}/pages/{branchedPageId}/view")
    public Mono<ResponseDTO<Layout>> getLayoutView(@PathVariable String branchedPageId, @PathVariable String layoutId) {
        return service.getLayout(branchedPageId, layoutId, true)
                .map(created -> new ResponseDTO<>(HttpStatus.OK.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/refactor")
    public Mono<ResponseDTO<LayoutDTO>> refactorWidgetName(@RequestBody RefactorEntityNameDTO refactorEntityNameDTO) {
        refactorEntityNameDTO.setEntityType(EntityType.WIDGET);
        return refactoringService
                .refactorEntityName(refactorEntityNameDTO)
                .map(created -> new ResponseDTO<>(HttpStatus.OK.value(), created, null));
    }
}

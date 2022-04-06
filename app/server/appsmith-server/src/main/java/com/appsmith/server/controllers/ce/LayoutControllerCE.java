package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorNameDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

import javax.validation.Valid;


@RequestMapping(Url.LAYOUT_URL)
@Slf4j
public class LayoutControllerCE {

    private final LayoutService service;
    private final LayoutActionService layoutActionService;

    @Autowired
    public LayoutControllerCE(LayoutService layoutService,
                            LayoutActionService layoutActionService) {
        this.service = layoutService;
        this.layoutActionService = layoutActionService;
    }

    @PostMapping("/pages/{defaultPageId}")
    public Mono<ResponseDTO<Layout>> createLayout(@PathVariable String defaultPageId,
                                                  @Valid @RequestBody Layout layout,
                                                  @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return service.createLayout(defaultPageId, layout, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @GetMapping("/{layoutId}/pages/{defaultPageId}")
    public Mono<ResponseDTO<Layout>> getLayout(@PathVariable String defaultPageId,
                                               @PathVariable String layoutId,
                                               @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return service.getLayout(defaultPageId, layoutId, false, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.OK.value(), created, null));
    }

    @PutMapping("/{layoutId}/pages/{pageId}")
    public Mono<ResponseDTO<LayoutDTO>> updateLayout(@PathVariable String pageId,
                                                     @PathVariable String layoutId,
                                                     @RequestBody Layout layout,
                                                     @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("update layout received for page {}", pageId);
        return layoutActionService.updateLayout(pageId, layoutId, layout, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.OK.value(), created, null));
    }

    @GetMapping("/{layoutId}/pages/{pageId}/view")
    public Mono<ResponseDTO<Layout>> getLayoutView(@PathVariable String pageId,
                                                   @PathVariable String layoutId,
                                                   @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return service.getLayout(pageId, layoutId, true, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.OK.value(), created, null));
    }

    @PutMapping("/refactor")
    public Mono<ResponseDTO<LayoutDTO>> refactorWidgetName(@RequestBody RefactorNameDTO refactorNameDTO,
                                                           @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return layoutActionService.refactorWidgetName(refactorNameDTO, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.OK.value(), created, null));
    }


}

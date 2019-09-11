package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.ResponseDto;
import com.appsmith.server.services.LayoutService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import javax.validation.Valid;

@RestController
@RequestMapping(Url.LAYOUT_URL)
public class LayoutController {

    private final LayoutService service;

    @Autowired
    public LayoutController(LayoutService layoutService) {
        this.service = layoutService;
    }

    @PostMapping("/pages/{pageId}")
    public Mono<ResponseDto<Layout>> createLayout(@PathVariable String pageId, @Valid @RequestBody Layout layout) {
        return service.createLayout(pageId, layout)
                .map(created -> new ResponseDto<>(HttpStatus.CREATED.value(), created, null));
    }

    @GetMapping("/{layoutId}/pages/{pageId}")
    public Mono<ResponseDto<Layout>> getLayout(@PathVariable String pageId, @PathVariable String layoutId) {
        return service.getLayout(pageId, layoutId)
                .map(created -> new ResponseDto<>(HttpStatus.CREATED.value(), created, null));
    }

    @PutMapping("/{layoutId}/pages/{pageId}")
    public Mono<ResponseDto<Layout>> updateLayout(@PathVariable String pageId, @PathVariable String layoutId, @RequestBody Layout layout) {
        return service.updateLayout(pageId, layoutId, layout)
                .map(created -> new ResponseDto<>(HttpStatus.CREATED.value(), created, null));
    }

}

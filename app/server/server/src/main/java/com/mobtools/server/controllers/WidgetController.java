package com.mobtools.server.controllers;

import com.mobtools.server.constants.Url;
import com.mobtools.server.domains.Widget;
import com.mobtools.server.dtos.ResponseDto;
import com.mobtools.server.services.WidgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.validation.Valid;

@RestController
@RequestMapping(Url.WIDGET_URL)
@RequiredArgsConstructor
public class WidgetController extends BaseController {

    private final WidgetService widgetService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDto<Widget>> create(@Valid @RequestBody Widget widget) {
        return widgetService.create(widget)
                .map(createdWidget -> new ResponseDto<>(HttpStatus.CREATED.value(), createdWidget, null));
    }

    @GetMapping("")
    public Flux<ResponseDto<Widget>> getAllWidgets() {
        return widgetService.get()
                .map(widgets -> new ResponseDto<>(HttpStatus.OK.value(), widgets, null));
    }

    @GetMapping("/{name}")
    public Mono<ResponseDto<Widget>> getByName(@PathVariable String name) {
        return widgetService.getByName(name)
                .map(widget -> new ResponseDto<>(HttpStatus.OK.value(), widget, null));
    }

    @PutMapping("/{id}")
    public Mono<ResponseDto<Widget>> update(@PathVariable String id, @RequestBody Widget widget) throws Exception {
        return widgetService.update(id, widget)
                .map(updatedWidget -> new ResponseDto<>(HttpStatus.OK.value(), updatedWidget, null));
    }

}

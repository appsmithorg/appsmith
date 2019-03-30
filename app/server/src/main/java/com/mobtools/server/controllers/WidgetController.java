package com.mobtools.server.controllers;

import com.mobtools.server.constants.Url;
import com.mobtools.server.domains.Widget;
import com.mobtools.server.dtos.ResponseDto;
import com.mobtools.server.services.WidgetService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(Url.WIDGET_URL)
public class WidgetController extends BaseController<WidgetService, Widget, String> {

    private final WidgetService widgetService;

    public WidgetController(WidgetService service) {
        super(service);
        this.widgetService = service;
    }

    @GetMapping("/name/{name}")
    public Mono<ResponseDto<Widget>> getByName(@PathVariable String name) {
        return widgetService.getByName(name)
                .map(widget -> new ResponseDto<>(HttpStatus.OK.value(), widget, null));
    }
}

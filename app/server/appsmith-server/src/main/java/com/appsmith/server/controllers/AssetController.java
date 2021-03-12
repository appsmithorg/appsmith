package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.services.AssetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(Url.ASSET_URL)
@Slf4j
@RequiredArgsConstructor
public class AssetController {

    private final AssetService service;

    @GetMapping("/{id}")
    public Mono<Void> getById(@PathVariable String id, ServerWebExchange exchange) {
        return service.makeImageResponse(exchange, id);
    }

}

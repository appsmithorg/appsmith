package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.services.AssetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DefaultDataBuffer;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
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
        log.debug("Returning asset with ID '{}'.", id);

        final ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.OK);

        final Mono<DefaultDataBuffer> imageBufferMono = service.getById(id)
                .map(asset -> {
                    final String contentType = asset.getContentType();
                    if (contentType != null) {
                        response.getHeaders().set(HttpHeaders.CONTENT_TYPE, contentType);
                    }
                    return new DefaultDataBufferFactory().wrap(asset.getData());
                });

        return response.writeWith(imageBufferMono);
    }

}

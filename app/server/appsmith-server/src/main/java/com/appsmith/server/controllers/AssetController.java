package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.services.AssetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.io.IOException;

@RestController
@RequestMapping(Url.ASSET_URL)
@Slf4j
@RequiredArgsConstructor
public class AssetController {

    private final AssetService service;

    @GetMapping("/{id}")
    public Mono<Void> getById(@PathVariable String id, ServerHttpResponse response) {
        log.debug("Returning asset with ID '{}'.", id);
        return service.getById(id)
                .map(asset -> {
                    try {
                        response.getBody().write(asset.getData());
                    } catch (IOException e) {
                        return Mono.error(e);
                    }
                    return asset;
                })
                .then();
    }

}

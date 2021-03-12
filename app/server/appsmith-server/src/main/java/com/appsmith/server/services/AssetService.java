package com.appsmith.server.services;

import com.appsmith.server.domains.Asset;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

public interface AssetService {

    Mono<Asset> getById(String id);

    Mono<Asset> upload(Part filePart, int i);

    Mono<Void> remove(String assetId);

    Mono<Void> makeImageResponse(ServerWebExchange exchange, String assetId);
}

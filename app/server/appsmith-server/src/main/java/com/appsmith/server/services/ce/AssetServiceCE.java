package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Asset;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

public interface AssetServiceCE {

    Mono<Asset> getById(String id);

    Mono<Asset> upload(List<Part> fileParts, int i, boolean isThumbnail);

    Mono<Void> remove(String assetId);

    Mono<Void> makeImageResponse(ServerWebExchange exchange, String assetId);
}

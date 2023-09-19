package com.appsmith.server.services;

import com.appsmith.server.domains.Asset;
import com.appsmith.server.services.ce.AssetServiceCE;
import reactor.core.publisher.Mono;

public interface AssetService extends AssetServiceCE {
    Mono<Asset> findByName(String name);
}

package com.appsmith.server.services;

import com.appsmith.server.domains.Asset;
import reactor.core.publisher.Mono;

public interface AssetService {

    Mono<Asset> getById(String id);

}

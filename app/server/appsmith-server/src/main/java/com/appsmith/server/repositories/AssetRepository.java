package com.appsmith.server.repositories;

import com.appsmith.server.domains.Asset;
import com.appsmith.server.repositories.ce.AssetRepositoryCE;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface AssetRepository extends AssetRepositoryCE {
    Mono<Asset> findByName(String name);
}

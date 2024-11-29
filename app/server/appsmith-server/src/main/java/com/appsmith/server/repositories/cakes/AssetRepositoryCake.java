package com.appsmith.server.repositories.cakes;

import com.appsmith.external.models.*;
import com.appsmith.server.domains.*;
import com.appsmith.server.newactions.projections.*;
import com.appsmith.server.projections.*;
import com.appsmith.server.repositories.*;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import static com.appsmith.server.helpers.ReactorUtils.asFlux;
import static com.appsmith.server.helpers.ReactorUtils.asMono;

@Component
public class AssetRepositoryCake extends BaseCake<Asset, AssetRepository> {
    private final AssetRepository repository;

    public AssetRepositoryCake(AssetRepository repository) {
        super(repository);
        this.repository = repository;
    }

    // From CrudRepository
    public Flux<Asset> saveAll(Iterable<Asset> entities) {
        return asFlux(() -> repository.saveAll(entities));
    }
    // End from CrudRepository

    /** @see com.appsmith.server.repositories.BaseRepository#findAll() */
    public Flux<Asset> findAll() {
        return asFlux(() -> repository.findAll());
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findById(String) */
    public Mono<Asset> findById(String id) {
        return asMono(() -> repository.findById(id));
    }
}

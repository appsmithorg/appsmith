package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.domains.*;
import com.appsmith.server.projections.*;
import com.appsmith.server.repositories.cakes.BaseCake;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
public class CollectionRepositoryCake extends BaseCake<Collection> {
    private final CollectionRepository repository;

    public CollectionRepositoryCake(CollectionRepository repository) {
        super(repository);
        this.repository = repository;
    }

    // From CrudRepository
    public Flux<Collection> saveAll(Iterable<Collection> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }

    public Mono<Collection> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }
}

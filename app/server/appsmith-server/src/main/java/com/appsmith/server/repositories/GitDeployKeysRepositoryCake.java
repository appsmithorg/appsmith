package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.domains.*;
import com.appsmith.server.dtos.*;
import com.appsmith.server.projections.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;

@Component
@RequiredArgsConstructor
public class GitDeployKeysRepositoryCake {
    private final GitDeployKeysRepository repository;

    // From CrudRepository
    public Mono<GitDeployKeys> save(GitDeployKeys entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }

    public Flux<GitDeployKeys> saveAll(Iterable<GitDeployKeys> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }

    public Mono<GitDeployKeys> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<GitDeployKeys> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Mono<GitDeployKeys> archive(GitDeployKeys entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Mono<GitDeployKeys> findByEmail(String email) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByEmail(email)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }
}

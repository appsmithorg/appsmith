package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.domains.*;
import com.appsmith.server.projections.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;

@Component
@RequiredArgsConstructor
public class PasswordResetTokenRepositoryCake {
    private final PasswordResetTokenRepository repository;

    // From CrudRepository
    public Mono<PasswordResetToken> save(PasswordResetToken entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }

    public Flux<PasswordResetToken> saveAll(Iterable<PasswordResetToken> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }

    public Mono<PasswordResetToken> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Mono<PasswordResetToken> findByEmail(String email) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByEmail(email)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<PasswordResetToken> archive(PasswordResetToken entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Mono<PasswordResetToken> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }
}

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
public class PasswordResetTokenRepositoryCake extends BaseCake<PasswordResetToken> {
    private final PasswordResetTokenRepository repository;

    public PasswordResetTokenRepositoryCake(PasswordResetTokenRepository repository) {
        super(repository);
        this.repository = repository;
    }

    // From CrudRepository
    public Flux<PasswordResetToken> saveAll(Iterable<PasswordResetToken> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }

    public Mono<PasswordResetToken> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<PasswordResetToken> archive(PasswordResetToken entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Mono<PasswordResetToken> findByEmail(String email) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByEmail(email)));
    }

    public Mono<PasswordResetToken> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }
}

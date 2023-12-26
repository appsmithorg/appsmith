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
public class EmailVerificationTokenRepositoryCake extends BaseCake<EmailVerificationToken> {
    private final EmailVerificationTokenRepository repository;

    public EmailVerificationTokenRepositoryCake(EmailVerificationTokenRepository repository) {
        super(repository);
        this.repository = repository;
    }

    // From CrudRepository
    public Flux<EmailVerificationToken> saveAll(Iterable<EmailVerificationToken> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }

    public Mono<EmailVerificationToken> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<EmailVerificationToken> archive(EmailVerificationToken entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Mono<EmailVerificationToken> findByEmail(String email) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByEmail(email)));
    }

    public Mono<EmailVerificationToken> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }
}

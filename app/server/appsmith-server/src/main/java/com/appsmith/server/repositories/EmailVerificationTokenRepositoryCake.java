package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.domains.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;

@Component
@RequiredArgsConstructor
public class EmailVerificationTokenRepositoryCake {
    private final EmailVerificationTokenRepository repository;

    // From CrudRepository
    public Mono<EmailVerificationToken> save(EmailVerificationToken entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }

    public Flux<EmailVerificationToken> saveAll(Iterable<EmailVerificationToken> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }

    public Mono<EmailVerificationToken> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Mono<EmailVerificationToken> archive(EmailVerificationToken entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

    public Mono<EmailVerificationToken> findByEmail(String email) {
        return Mono.justOrEmpty(repository.findByEmail(email));
    }

    public Mono<EmailVerificationToken> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }
}

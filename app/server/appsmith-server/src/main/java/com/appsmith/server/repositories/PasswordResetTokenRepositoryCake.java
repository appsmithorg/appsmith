package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.external.models.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import org.springframework.data.mongodb.core.query.*;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.result.InsertManyResult;
import com.querydsl.core.types.dsl.StringPath;


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

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

    public Mono<PasswordResetToken> findByEmail(String email) {
        return Mono.justOrEmpty(repository.findByEmail(email));
    }

    public Mono<PasswordResetToken> archive(PasswordResetToken entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public Mono<PasswordResetToken> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

}

package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.domains.*;
import com.mongodb.client.result.UpdateResult;
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

    public Mono<PasswordResetToken> findByIdAndFieldNames(String id, List<String> fieldNames) {
        return Mono.justOrEmpty(repository.findByIdAndFieldNames(id, fieldNames));
    }

    public Mono<UpdateResult> updateByIdAndFieldNames(String id, Map<String, Object> fieldNameValueMap) {
        return Mono.justOrEmpty(repository.updateByIdAndFieldNames(id, fieldNameValueMap));
    }

    public Mono<Boolean> archiveById(String id) {
        return Mono.justOrEmpty(repository.archiveById(id));
    }

    public Mono<PasswordResetToken> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

    public Mono<PasswordResetToken> archive(PasswordResetToken entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public Mono<PasswordResetToken> findByIdAndBranchName(String id, String branchName) {
        return Mono.justOrEmpty(repository.findByIdAndBranchName(id, branchName));
    }

    public Mono<PasswordResetToken> findByEmail(String email) {
        return Mono.justOrEmpty(repository.findByEmail(email));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }
}

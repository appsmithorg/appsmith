package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.server.dtos.*;
import com.appsmith.server.projections.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;

@Component
@RequiredArgsConstructor
public class ConfigRepositoryCake {
    private final ConfigRepository repository;

    // From CrudRepository
    public Mono<Config> save(Config entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }

    public Flux<Config> saveAll(Iterable<Config> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }

    public Mono<Config> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Mono<Config> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Flux<Config> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort)));
    }

    public Flux<Config> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission)));
    }

    public Flux<Config> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission, sort)));
    }

    public Mono<Config> findByNameAsUser(String name, User user, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByNameAsUser(name, user, permission)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<Config> findByName(String name) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByName(name)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

    public Mono<Config> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission)));
    }

    public Mono<Config> findByName(String name, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByName(name, permission)));
    }

    public Mono<Config> setUserPermissionsInObject(Config obj, Set<String> permissionGroups) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Mono<Config> setUserPermissionsInObject(Config obj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj)));
    }

    public Mono<Config> findById(String id, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id, permission)));
    }

    public Mono<Config> archive(Config entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }
}

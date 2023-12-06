package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
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

    public Flux<Config> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public Mono<Config> findByName(String name) {
        return Mono.justOrEmpty(repository.findByName(name));
    }

    public Mono<Config> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

    public Config setUserPermissionsInObject(Config obj, Set<String> permissionGroups) {
        return repository.setUserPermissionsInObject(obj, permissionGroups);
    }

    public Flux<Config> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public Mono<Config> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public Mono<Config> findByName(String name, AclPermission permission) {
        return Mono.justOrEmpty(repository.findByName(name, permission));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

    public Mono<Config> findByNameAsUser(String name, User user, AclPermission permission) {
        return Mono.justOrEmpty(repository.findByNameAsUser(name, user, permission));
    }

    public Config setUserPermissionsInObject(Config obj) {
        return repository.setUserPermissionsInObject(obj);
    }

    public Config updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return repository.updateAndReturn(id, updateObj, permission);
    }

    public Mono<Config> archive(Config entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public Flux<Config> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }
}

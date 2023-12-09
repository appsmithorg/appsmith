package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.querydsl.core.types.dsl.StringPath;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;

@Component
@RequiredArgsConstructor
public class UserRepositoryCake {
    private final UserRepository repository;

    // From CrudRepository
    public Mono<User> save(User entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }

    public Flux<User> saveAll(Iterable<User> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }

    public Mono<User> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Mono<Long> countByDeletedAtNull() {
        return Mono.justOrEmpty(repository.countByDeletedAtNull());
    }

    public Flux<User> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public Mono<Boolean> isUsersEmpty() {
        return Mono.justOrEmpty(repository.isUsersEmpty());
    }

    public Mono<User> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public Flux<User> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }

    public Mono<User> archive(User entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public Mono<User> findByEmailIgnoreCase(String email) {
        return Mono.justOrEmpty(repository.findByEmailIgnoreCase(email));
    }

    public Mono<User> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

    public Flux<User> findAllByEmails(Set<String> emails) {
        return Flux.fromIterable(repository.findAllByEmails(emails));
    }

    public Mono<User> setUserPermissionsInObject(User obj, Set<String> permissionGroups) {
        return Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups));
    }

    public Mono<User> findByEmail(String email) {
        return Mono.justOrEmpty(repository.findByEmail(email));
    }

    public Mono<User> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission));
    }

    public Mono<User> findByEmail(String email, AclPermission aclPermission) {
        return Mono.justOrEmpty(repository.findByEmail(email, aclPermission));
    }

    public Mono<User> setUserPermissionsInObject(User obj) {
        return Mono.justOrEmpty(repository.setUserPermissionsInObject(obj));
    }

    public Flux<User> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

    public Flux<User> getAllByEmails(
            Set<String> emails,
            Optional<AclPermission> aclPermission,
            int limit,
            int skip,
            StringPath sortKey,
            Sort.Direction sortDirection) {
        return Flux.fromIterable(repository.getAllByEmails(emails, aclPermission, limit, skip, sortKey, sortDirection));
    }

    public Mono<User> findByEmailAndTenantId(String email, String tenantId) {
        return Mono.justOrEmpty(repository.findByEmailAndTenantId(email, tenantId));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }
}

package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.server.dtos.*;
import com.appsmith.server.projections.*;
import com.appsmith.server.repositories.cakes.BaseCake;
import com.appsmith.external.models.*;
import org.springframework.stereotype.Component;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import org.springframework.data.mongodb.core.query.*;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.result.InsertManyResult;
import com.querydsl.core.types.dsl.StringPath;


import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Component
public class UserRepositoryCake extends BaseCake<User> {
    private final UserRepository repository;

    public UserRepositoryCake(UserRepository repository) {
        super(repository);
        this.repository = repository;
    }

    // From CrudRepository
    public Flux<User> saveAll(Iterable<User> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }
    public Mono<User> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public Flux<User> findAllByEmails(Set<String> emails) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllByEmails(emails)));
    }

    public Flux<User> getAllByEmails(Set<String> emails, Optional<AclPermission> aclPermission, int limit, int skip, StringPath sortKey, Sort.Direction sortDirection) {
        return Flux.defer(() -> Flux.fromIterable(repository.getAllByEmails(emails, aclPermission, limit, skip, sortKey, sortDirection)));
    }

    public Flux<User> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission)));
    }

    public Flux<User> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission, sort)));
    }

    public Flux<User> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<Boolean> isUsersEmpty() {
        return Mono.defer(() -> Mono.justOrEmpty(repository.isUsersEmpty()));
    }

    public Mono<Long> countByDeletedAtIsNullAndIsSystemGeneratedIsNot(Boolean excludeSystemGenerated) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.countByDeletedAtIsNullAndIsSystemGeneratedIsNot(excludeSystemGenerated)));
    }

    public Mono<Long> countByDeletedAtNull() {
        return Mono.defer(() -> Mono.justOrEmpty(repository.countByDeletedAtNull()));
    }

    public Mono<User> archive(User entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Mono<User> findByEmail(String email) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByEmail(email)));
    }

    public Mono<User> findByEmail(String email, AclPermission aclPermission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByEmail(email, aclPermission)));
    }

    public Mono<User> findByEmailAndTenantId(String email, String tenantId) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByEmailAndTenantId(email, tenantId)));
    }

    public Mono<User> findByEmailIgnoreCase(String email) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByEmailIgnoreCase(email)));
    }

    public Mono<User> findById(String id, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id, permission)));
    }

    public Mono<User> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Mono<User> setUserPermissionsInObject(User obj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj)));
    }

    public Mono<User> setUserPermissionsInObject(User obj, Set<String> permissionGroups) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Mono<User> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

}

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
public class TenantRepositoryCake {
    private final TenantRepository repository;

    // From CrudRepository
    public Mono<Tenant> save(Tenant entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }
    public Flux<Tenant> saveAll(Iterable<Tenant> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }
    public Mono<Tenant> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

    public Mono<Tenant> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public Tenant setUserPermissionsInObject(Tenant obj, Set<String> permissionGroups) {
        return repository.setUserPermissionsInObject(obj, permissionGroups);
    }

    public Tenant updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return repository.updateAndReturn(id, updateObj, permission);
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

    public Tenant setUserPermissionsInObject(Tenant obj) {
        return repository.setUserPermissionsInObject(obj);
    }

    public Flux<Tenant> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }

    public Flux<Tenant> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public Flux<Tenant> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public Mono<Tenant> findBySlug(String slug) {
        return Mono.justOrEmpty(repository.findBySlug(slug));
    }

    public Mono<Tenant> archive(Tenant entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public Mono<Tenant> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

}

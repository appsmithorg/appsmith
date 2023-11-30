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
public class PageRepositoryCake {
    private final PageRepository repository;

    // From CrudRepository
    public Mono<Page> save(Page entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }
    public Flux<Page> saveAll(Iterable<Page> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }
    public Mono<Page> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Mono<Page> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public Mono<Boolean> archiveById(String id) {
        return Mono.justOrEmpty(repository.archiveById(id));
    }

    public Mono<Page> findByIdAndFieldNames(String id, List<String> fieldNames) {
        return Mono.justOrEmpty(repository.findByIdAndFieldNames(id, fieldNames));
    }

    public Mono<Page> archive(Page entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public Mono<Page> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

    public Flux<Page> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }

    public Flux<Page> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public Page setUserPermissionsInObject(Page obj, Set<String> permissionGroups) {
        return repository.setUserPermissionsInObject(obj, permissionGroups);
    }

    public Flux<Page> findByApplicationId(String applicationId) {
        return Flux.fromIterable(repository.findByApplicationId(applicationId));
    }

    public Page updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return repository.updateAndReturn(id, updateObj, permission);
    }

    public Page setUserPermissionsInObject(Page obj) {
        return repository.setUserPermissionsInObject(obj);
    }

    public Mono<Page> findByName(String name, AclPermission aclPermission) {
        return Mono.justOrEmpty(repository.findByName(name, aclPermission));
    }

    public Mono<Page> findByIdAndBranchName(String id, String branchName) {
        return Mono.justOrEmpty(repository.findByIdAndBranchName(id, branchName));
    }

    public Flux<Page> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public Mono<Page> findByIdAndLayoutsId(String id, String layoutId, AclPermission aclPermission) {
        return Mono.justOrEmpty(repository.findByIdAndLayoutsId(id, layoutId, aclPermission));
    }

    public Mono<Page> findByNameAndApplicationId(String name, String applicationId, AclPermission aclPermission) {
        return Mono.justOrEmpty(repository.findByNameAndApplicationId(name, applicationId, aclPermission));
    }

    public Flux<Page> findByApplicationId(String applicationId, AclPermission aclPermission) {
        return Flux.fromIterable(repository.findByApplicationId(applicationId, aclPermission));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

}
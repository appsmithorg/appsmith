package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.server.dtos.*;
import com.appsmith.server.projections.*;
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
public class DatasourceRepositoryCake {
    private final DatasourceRepository repository;

    // From CrudRepository
    public Mono<Datasource> save(Datasource entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.save(entity)));
    }
    public Flux<Datasource> saveAll(Iterable<Datasource> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }
    public Mono<Datasource> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

    public Flux<Datasource> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission)));
    }

    public Mono<Datasource> findById(String id, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id, permission)));
    }

    public Flux<Datasource> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort)));
    }

    public Flux<Datasource> findAllByWorkspaceId(Long workspaceId) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllByWorkspaceId(workspaceId)));
    }

    public Mono<Datasource> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission)));
    }

    public Flux<Datasource> findByIdIn(List<String> ids) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByIdIn(ids)));
    }

    public Mono<Datasource> archive(Datasource entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Mono<Datasource> setUserPermissionsInObject(Datasource obj, Set<String> permissionGroups) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Flux<Datasource> findAllByIds(Set<String> ids, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllByIds(ids, permission)));
    }

    public Mono<Long> countByDeletedAtNull() {
        return Mono.defer(() -> Mono.justOrEmpty(repository.countByDeletedAtNull()));
    }

    public Mono<Datasource> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Flux<Datasource> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllByIdsWithoutPermission(ids, includeFields)));
    }

    public Mono<Datasource> setUserPermissionsInObject(Datasource obj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission aclPermission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByNameAndWorkspaceId(name, workspaceId, aclPermission)));
    }

    public Flux<Datasource> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission, sort)));
    }

    public Flux<Datasource> findAllByWorkspaceId(String workspaceId) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllByWorkspaceId(workspaceId)));
    }

    public Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByNameAndWorkspaceId(name, workspaceId, permission)));
    }

}

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
public class DatasourceRepositoryCake {
    private final DatasourceRepository repository;

    // From CrudRepository
    public Mono<Datasource> save(Datasource entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }

    public Flux<Datasource> saveAll(Iterable<Datasource> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }

    public Mono<Datasource> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Mono<Long> countByDeletedAtNull() {
        return Mono.justOrEmpty(repository.countByDeletedAtNull());
    }

    public Datasource findByNameAndWorkspaceId(String name, String workspaceId, AclPermission aclPermission) {
        return repository.findByNameAndWorkspaceId(name, workspaceId, aclPermission);
    }

    public Flux<Datasource> findAllByWorkspaceId(Long workspaceId) {
        return Flux.fromIterable(repository.findAllByWorkspaceId(workspaceId));
    }

    public Flux<Datasource> findByIdIn(List<String> ids) {
        return Flux.fromIterable(repository.findByIdIn(ids));
    }

    public Mono<Datasource> archive(Datasource entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

    public Mono<Datasource> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public Datasource setUserPermissionsInObject(Datasource obj) {
        return repository.setUserPermissionsInObject(obj);
    }

    public Flux<Datasource> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

    public Datasource findByNameAndWorkspaceId(String name, String workspaceId, Optional<AclPermission> permission) {
        return repository.findByNameAndWorkspaceId(name, workspaceId, permission);
    }

    public Flux<Datasource> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public Mono<Datasource> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

    public Flux<Datasource> findAllByIds(Set<String> ids, AclPermission permission) {
        return Flux.fromIterable(repository.findAllByIds(ids, permission));
    }

    public Datasource updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return repository.updateAndReturn(id, updateObj, permission);
    }

    public Flux<Datasource> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }

    public Flux<Datasource> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields) {
        return Flux.fromIterable(repository.findAllByIdsWithoutPermission(ids, includeFields));
    }

    public Flux<Datasource> findAllByWorkspaceId(String workspaceId) {
        return Flux.fromIterable(repository.findAllByWorkspaceId(workspaceId));
    }

    public Datasource setUserPermissionsInObject(Datasource obj, Set<String> permissionGroups) {
        return repository.setUserPermissionsInObject(obj, permissionGroups);
    }
}

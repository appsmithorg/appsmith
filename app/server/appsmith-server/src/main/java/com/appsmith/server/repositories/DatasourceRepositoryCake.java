package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.server.dtos.*;
import com.appsmith.server.projections.*;
import com.appsmith.server.repositories.cakes.BaseCake;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Component
public class DatasourceRepositoryCake extends BaseCake<Datasource> {
    private final DatasourceRepository repository;

    public DatasourceRepositoryCake(DatasourceRepository repository) {
        super(repository);
        this.repository = repository;
    }

    // From CrudRepository
    public Flux<Datasource> saveAll(Iterable<Datasource> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }

    public Mono<Datasource> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public Mono<Datasource> findByNameAndWorkspaceId(String name, String workspaceId, AclPermission aclPermission) {
        return Mono.defer(
                () -> Mono.justOrEmpty(repository.findByNameAndWorkspaceId(name, workspaceId, aclPermission)));
    }

    public Mono<Datasource> findByNameAndWorkspaceId(
            String name, String workspaceId, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByNameAndWorkspaceId(name, workspaceId, permission)));
    }

    public Mono<Datasource> setUserPermissionsInObject(Datasource obj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj)));
    }

    public Mono<Datasource> setUserPermissionsInObject(Datasource obj, Set<String> permissionGroups) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Mono<Datasource> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission)));
    }

    public Flux<Datasource> findAllByIds(Set<String> ids, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllByIds(ids, permission)));
    }

    public Flux<Datasource> findAllByIdsWithoutPermission(Set<String> ids, List<String> includeFields) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllByIdsWithoutPermission(ids, includeFields)));
    }

    public Flux<Datasource> findAllByWorkspaceId(Long workspaceId) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllByWorkspaceId(workspaceId)));
    }

    public Flux<Datasource> findAllByWorkspaceId(String workspaceId) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllByWorkspaceId(workspaceId)));
    }

    public Flux<Datasource> findByIdIn(List<String> ids) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByIdIn(ids)));
    }

    public Flux<Datasource> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission)));
    }

    public Flux<Datasource> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission, sort)));
    }

    public Flux<Datasource> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<Datasource> archive(Datasource entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Mono<Datasource> findById(String id, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id, permission)));
    }

    public Mono<Datasource> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Mono<Long> countByDeletedAtNull() {
        return Mono.defer(() -> Mono.justOrEmpty(repository.countByDeletedAtNull()));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }
}

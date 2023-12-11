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
public class WorkspaceRepositoryCake {
    private final WorkspaceRepository repository;

    // From CrudRepository
    public Mono<Workspace> save(Workspace entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.save(entity)));
    }

    public Flux<Workspace> saveAll(Iterable<Workspace> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }

    public Mono<Workspace> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public Flux<Workspace> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission, sort)));
    }

    public Flux<Workspace> findByIdsIn(
            Set<String> workspaceIds, String tenantId, AclPermission aclPermission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByIdsIn(workspaceIds, tenantId, aclPermission, sort)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<Workspace> findByName(String name, AclPermission aclPermission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByName(name, aclPermission)));
    }

    public Flux<Workspace> findAll(AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAll(permission)));
    }

    public Mono<Workspace> findBySlug(String slug) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findBySlug(slug)));
    }

    public Flux<Workspace> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission)));
    }

    public Mono<Workspace> setUserPermissionsInObject(Workspace obj, Set<String> permissionGroups) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Flux<Workspace> findAllWorkspaces() {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllWorkspaces()));
    }

    public Flux<Workspace> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort)));
    }

    public Mono<Workspace> findByName(String name) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByName(name)));
    }

    public Mono<Workspace> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Mono<Workspace> archive(Workspace entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Mono<Workspace> findById(String id, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id, permission)));
    }

    public Mono<Workspace> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission)));
    }

    public Mono<Workspace> setUserPermissionsInObject(Workspace obj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj)));
    }

    public Mono<Workspace> findByIdAndPluginsPluginId(String workspaceId, String pluginId) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByIdAndPluginsPluginId(workspaceId, pluginId)));
    }

    public Mono<Long> countByDeletedAtNull() {
        return Mono.defer(() -> Mono.justOrEmpty(repository.countByDeletedAtNull()));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }
}

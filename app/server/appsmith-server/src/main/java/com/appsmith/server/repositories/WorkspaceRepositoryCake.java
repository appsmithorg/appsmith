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
public class WorkspaceRepositoryCake extends BaseCake<Workspace> {
    private final WorkspaceRepository repository;

    public WorkspaceRepositoryCake(WorkspaceRepository repository) {
        super(repository);
        this.repository = repository;
    }

    // From CrudRepository
    public Flux<Workspace> saveAll(Iterable<Workspace> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }

    public Mono<Workspace> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public Flux<Workspace> findAll(AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAll(permission)));
    }

    public Flux<Workspace> findAllWorkspaces() {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllWorkspaces()));
    }

    public Flux<Workspace> findByIdsIn(
            Set<String> workspaceIds, String tenantId, AclPermission aclPermission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByIdsIn(workspaceIds, tenantId, aclPermission, sort)));
    }

    public Flux<Workspace> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission)));
    }

    public Flux<Workspace> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission, sort)));
    }

    public Flux<Workspace> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<Long> countByDeletedAtNull() {
        return Mono.defer(() -> Mono.justOrEmpty(repository.countByDeletedAtNull()));
    }

    public Mono<Workspace> archive(Workspace entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Mono<Workspace> findById(String id, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id, permission)));
    }

    public Mono<Workspace> findByIdAndPluginsPluginId(String workspaceId, String pluginId) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByIdAndPluginsPluginId(workspaceId, pluginId)));
    }

    public Mono<Workspace> findByName(String name) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByName(name)));
    }

    public Mono<Workspace> findByName(String name, AclPermission aclPermission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByName(name, aclPermission)));
    }

    public Mono<Workspace> findBySlug(String slug) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findBySlug(slug)));
    }

    public Mono<Workspace> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Mono<Workspace> setUserPermissionsInObject(Workspace obj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj)));
    }

    public Mono<Workspace> setUserPermissionsInObject(Workspace obj, Set<String> permissionGroups) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Mono<Workspace> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }
}

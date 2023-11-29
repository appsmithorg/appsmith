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
import com.mongodb.client.result.UpdateResult;

import java.util.*;

@Component
@RequiredArgsConstructor
public class WorkspaceRepositoryCake {
    private final WorkspaceRepository repository;

    // From CrudRepository
    public Mono<Workspace> save(Workspace entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }
    public Flux<Workspace> saveAll(Iterable<Workspace> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }
    public Mono<Workspace> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Mono<Workspace> findBySlug(String slug) {
        return Mono.justOrEmpty(repository.findBySlug(slug));
    }

    public Flux<Workspace> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public Workspace updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return repository.updateAndReturn(id, updateObj, permission);
    }

    public Flux<Workspace> findAllWorkspaces() {
        return Flux.fromIterable(repository.findAllWorkspaces());
    }

    public Mono<Workspace> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public Flux<Workspace> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }

    public Workspace setUserPermissionsInObject(Workspace obj, Set<String> permissionGroups) {
        return repository.setUserPermissionsInObject(obj, permissionGroups);
    }

    public Flux<Workspace> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public Mono<Void> updateUserRoleNames(String userId, String userName) {
        return Mono.justOrEmpty(repository.updateUserRoleNames(userId, userName));
    }

    public Mono<Workspace> findByName(String name, AclPermission aclPermission) {
        return Mono.justOrEmpty(repository.findByName(name, aclPermission));
    }

    public Mono<Workspace> findByIdAndPluginsPluginId(String workspaceId, String pluginId) {
        return Mono.justOrEmpty(repository.findByIdAndPluginsPluginId(workspaceId, pluginId));
    }

    public Mono<Workspace> findByIdAndBranchName(String id, String branchName) {
        return Mono.justOrEmpty(repository.findByIdAndBranchName(id, branchName));
    }

    public Mono<Workspace> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

    public Workspace setUserPermissionsInObject(Workspace obj) {
        return repository.setUserPermissionsInObject(obj);
    }

    public Mono<Void> updateUserRoleNames(Long userId, String userName) {
        return Mono.justOrEmpty(repository.updateUserRoleNames(userId, userName));
    }

    public Flux<Workspace> findAll(AclPermission permission) {
        return Flux.fromIterable(repository.findAll(permission));
    }

    public Mono<UpdateResult> updateByIdAndFieldNames(String id, Map<String, Object> fieldNameValueMap) {
        return Mono.justOrEmpty(repository.updateByIdAndFieldNames(id, fieldNameValueMap));
    }

    public Flux<Workspace> findByIdsIn(Set<String> workspaceIds, String tenantId, AclPermission aclPermission, Sort sort) {
        return Flux.fromIterable(repository.findByIdsIn(workspaceIds, tenantId, aclPermission, sort));
    }

    public Mono<Long> countByDeletedAtNull() {
        return Mono.justOrEmpty(repository.countByDeletedAtNull());
    }

    public Mono<Workspace> findByName(String name) {
        return Mono.justOrEmpty(repository.findByName(name));
    }

    public Mono<Workspace> findByIdAndFieldNames(String id, List<String> fieldNames) {
        return Mono.justOrEmpty(repository.findByIdAndFieldNames(id, fieldNames));
    }

    public Mono<Boolean> archiveById(String id) {
        return Mono.justOrEmpty(repository.archiveById(id));
    }

    public Mono<Workspace> archive(Workspace entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

}
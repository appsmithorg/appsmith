package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.mongodb.client.result.UpdateResult;
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
        return Mono.justOrEmpty(repository.save(entity));
    }

    public Flux<Workspace> saveAll(Iterable<Workspace> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }

    public Mono<Workspace> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Mono<UpdateResult> updateByIdAndFieldNames(String id, Map<String, Object> fieldNameValueMap) {
        return Mono.justOrEmpty(repository.updateByIdAndFieldNames(id, fieldNameValueMap));
    }

    public Mono<Workspace> findByIdAndFieldNames(String id, List<String> fieldNames) {
        return Mono.justOrEmpty(repository.findByIdAndFieldNames(id, fieldNames));
    }

    public Mono<Workspace> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public Mono<Workspace> findByIdAndPluginsPluginId(String workspaceId, String pluginId) {
        return Mono.justOrEmpty(repository.findByIdAndPluginsPluginId(workspaceId, pluginId));
    }

    public Flux<Workspace> findByIdsIn(
            Set<String> workspaceIds, String tenantId, AclPermission aclPermission, Sort sort) {
        return Flux.fromIterable(repository.findByIdsIn(workspaceIds, tenantId, aclPermission, sort));
    }

    public Flux<Workspace> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public Mono<Workspace> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

    public Mono<Workspace> findByIdAndBranchName(String id, String branchName) {
        return Mono.justOrEmpty(repository.findByIdAndBranchName(id, branchName));
    }

    public Flux<Workspace> findAllWorkspaces() {
        return Flux.fromIterable(repository.findAllWorkspaces());
    }

    public Mono<Workspace> findByName(String name) {
        return Mono.justOrEmpty(repository.findByName(name));
    }

    public Mono<Long> countByDeletedAtNull() {
        return Mono.justOrEmpty(repository.countByDeletedAtNull());
    }

    public Flux<Workspace> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public Workspace setUserPermissionsInObject(Workspace obj, Set<String> permissionGroups) {
        return repository.setUserPermissionsInObject(obj, permissionGroups);
    }

    public Mono<Workspace> findBySlug(String slug) {
        return Mono.justOrEmpty(repository.findBySlug(slug));
    }

    public Mono<Void> updateUserRoleNames(Long userId, String userName) {
        return Mono.justOrEmpty(repository.updateUserRoleNames(userId, userName));
    }

    public Mono<Boolean> archiveById(String id) {
        return Mono.justOrEmpty(repository.archiveById(id));
    }

    public Workspace setUserPermissionsInObject(Workspace obj) {
        return repository.setUserPermissionsInObject(obj);
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

    public Mono<Workspace> findByName(String name, AclPermission aclPermission) {
        return Mono.justOrEmpty(repository.findByName(name, aclPermission));
    }

    public Mono<Void> updateUserRoleNames(String userId, String userName) {
        return Mono.justOrEmpty(repository.updateUserRoleNames(userId, userName));
    }

    public Flux<Workspace> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }

    public Workspace updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return repository.updateAndReturn(id, updateObj, permission);
    }

    public Mono<Workspace> archive(Workspace entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public Flux<Workspace> findAll(AclPermission permission) {
        return Flux.fromIterable(repository.findAll(permission));
    }
}

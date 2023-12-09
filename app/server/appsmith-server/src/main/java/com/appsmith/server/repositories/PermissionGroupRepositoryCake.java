package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.server.projections.*;
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
public class PermissionGroupRepositoryCake {
    private final PermissionGroupRepository repository;

    // From CrudRepository
    public Mono<PermissionGroup> save(PermissionGroup entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }

    public Flux<PermissionGroup> saveAll(Iterable<PermissionGroup> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }

    public Mono<PermissionGroup> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Mono<PermissionGroup> archive(PermissionGroup entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Flux<PermissionGroup> findByDefaultWorkspaceIds(Set<String> workspaceIds, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByDefaultWorkspaceIds(workspaceIds, permission)));
    }

    public Flux<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(
            String userId, String workspaceId, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(
                repository.findAllByAssignedToUserIdAndDefaultWorkspaceId(userId, workspaceId, permission)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

    public Mono<PermissionGroup> setUserPermissionsInObject(PermissionGroup obj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj)));
    }

    public Flux<PermissionGroup> findByDefaultDomainIdAndDefaultDomainType(String defaultDomainId, String domainType) {
        return Flux.defer(() ->
                Flux.fromIterable(repository.findByDefaultDomainIdAndDefaultDomainType(defaultDomainId, domainType)));
    }

    public Mono<PermissionGroup> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Flux<PermissionGroup> findByDefaultWorkspaceId(String defaultWorkspaceId) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByDefaultWorkspaceId(defaultWorkspaceId)));
    }

    public Mono<Set<String>> getCurrentUserPermissionGroups() {
        return Mono.defer(() -> Mono.justOrEmpty(repository.getCurrentUserPermissionGroups()));
    }

    public Mono<UpdateResult> updateById(String id, Update updateObj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateById(id, updateObj)));
    }

    public Flux<PermissionGroup> findAllByIdIn(Set<String> ids) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllByIdIn(ids)));
    }

    public Flux<PermissionGroup> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission, sort)));
    }

    public Flux<PermissionGroup> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Flux<PermissionGroup> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission)));
    }

    public Flux<PermissionGroup> findByDefaultWorkspaceId(String workspaceId, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByDefaultWorkspaceId(workspaceId, permission)));
    }

    public Mono<PermissionGroup> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission)));
    }

    public Mono<Set<String>> getAllPermissionGroupsIdsForUser(User user) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.getAllPermissionGroupsIdsForUser(user)));
    }

    public Mono<Void> evictAllPermissionGroupCachesForUser(String email, String tenantId) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.evictAllPermissionGroupCachesForUser(email, tenantId)));
    }

    public Flux<PermissionGroup> findAllByAssignedToUserIn(
            Set<String> userIds, Optional<List<String>> includeFields, Optional<AclPermission> permission) {
        return Flux.defer(
                () -> Flux.fromIterable(repository.findAllByAssignedToUserIn(userIds, includeFields, permission)));
    }

    public Mono<PermissionGroup> setUserPermissionsInObject(PermissionGroup obj, Set<String> permissionGroups) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Mono<PermissionGroup> findById(String id, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id, permission)));
    }

    public Mono<Void> evictPermissionGroupsUser(String email, String tenantId) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.evictPermissionGroupsUser(email, tenantId)));
    }
}

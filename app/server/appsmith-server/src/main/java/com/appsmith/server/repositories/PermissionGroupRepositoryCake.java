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

    public Mono<PermissionGroup> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

    public Set<String> getCurrentUserPermissionGroups() {
        return repository.getCurrentUserPermissionGroups();
    }

    public PermissionGroup updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return repository.updateAndReturn(id, updateObj, permission);
    }

    public Flux<PermissionGroup> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

    public Set<String> getAllPermissionGroupsIdsForUser(User user) {
        return repository.getAllPermissionGroupsIdsForUser(user);
    }

    public Flux<PermissionGroup> findByDefaultWorkspaceId(String workspaceId, AclPermission permission) {
        return Flux.fromIterable(repository.findByDefaultWorkspaceId(workspaceId, permission));
    }

    public Flux<PermissionGroup> findByDefaultWorkspaceIds(Set<String> workspaceIds, AclPermission permission) {
        return Flux.fromIterable(repository.findByDefaultWorkspaceIds(workspaceIds, permission));
    }

    public Flux<PermissionGroup> findAllByIdIn(Set<String> ids) {
        return Flux.fromIterable(repository.findAllByIdIn(ids));
    }

    public Flux<PermissionGroup> findAllByAssignedToUserIn(Set<String> userIds, Optional<List<String>> includeFields, Optional<AclPermission> permission) {
        return Flux.fromIterable(repository.findAllByAssignedToUserIn(userIds, includeFields, permission));
    }

    public PermissionGroup setUserPermissionsInObject(PermissionGroup obj, Set<String> permissionGroups) {
        return repository.setUserPermissionsInObject(obj, permissionGroups);
    }

    public Mono<PermissionGroup> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public PermissionGroup setUserPermissionsInObject(PermissionGroup obj) {
        return repository.setUserPermissionsInObject(obj);
    }

    public Mono<Void> evictAllPermissionGroupCachesForUser(String email, String tenantId) {
        return Mono.justOrEmpty(repository.evictAllPermissionGroupCachesForUser(email, tenantId));
    }

    public Mono<Void> evictPermissionGroupsUser(String email, String tenantId) {
        return Mono.justOrEmpty(repository.evictPermissionGroupsUser(email, tenantId));
    }

    public Mono<UpdateResult> updateById(String id, Update updateObj) {
        return Mono.justOrEmpty(repository.updateById(id, updateObj));
    }

    public Flux<PermissionGroup> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public Flux<PermissionGroup> findByDefaultDomainIdAndDefaultDomainType(String defaultDomainId, String domainType) {
        return Flux.fromIterable(repository.findByDefaultDomainIdAndDefaultDomainType(defaultDomainId, domainType));
    }

    public Flux<PermissionGroup> findAllByAssignedToUserIdAndDefaultWorkspaceId(String userId, String workspaceId, AclPermission permission) {
        return Flux.fromIterable(repository.findAllByAssignedToUserIdAndDefaultWorkspaceId(userId, workspaceId, permission));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

    public Flux<PermissionGroup> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }

    public Mono<PermissionGroup> archive(PermissionGroup entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public Flux<PermissionGroup> findByDefaultWorkspaceId(String defaultWorkspaceId) {
        return Flux.fromIterable(repository.findByDefaultWorkspaceId(defaultWorkspaceId));
    }

}

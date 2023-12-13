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
import com.mongodb.client.result.UpdateResult;

import java.util.*;

@Component
@RequiredArgsConstructor
public class UserDataRepositoryCake {
    private final UserDataRepository repository;

    // From CrudRepository
    public Mono<UserData> save(UserData entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.save(entity)));
    }
    public Flux<UserData> saveAll(Iterable<UserData> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }
    public Mono<UserData> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

    public Mono<UserData> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Mono<UserData> setUserPermissionsInObject(UserData obj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj)));
    }

    public Flux<UserData> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission)));
    }

    public Mono<UpdateResult> saveReleaseNotesViewedVersion(String userId, String version) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.saveReleaseNotesViewedVersion(userId, version)));
    }

    public Mono<UserData> findById(String id, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id, permission)));
    }

    public Mono<UserData> setUserPermissionsInObject(UserData obj, Set<String> permissionGroups) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Mono<UserData> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Flux<UserData> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission, sort)));
    }

    public Flux<UserData> findPhotoAssetsByUserIds(Iterable<String> userId) {
        return Flux.defer(() -> Flux.fromIterable(repository.findPhotoAssetsByUserIds(userId)));
    }

    public Mono<String> fetchMostRecentlyUsedWorkspaceId(String userId) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.fetchMostRecentlyUsedWorkspaceId(userId)));
    }

    public Mono<UpdateResult> removeIdFromRecentlyUsedList(String userId, String workspaceId, List<String> applicationIds) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.removeIdFromRecentlyUsedList(userId, workspaceId, applicationIds)));
    }

    public Mono<UserData> archive(UserData entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Flux<UserData> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort)));
    }

    public Mono<UserData> findByUserId(String userId) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByUserId(userId)));
    }

}

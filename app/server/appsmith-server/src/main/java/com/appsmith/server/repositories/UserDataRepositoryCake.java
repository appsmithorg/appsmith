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
public class UserDataRepositoryCake {
    private final UserDataRepository repository;

    // From CrudRepository
    public Mono<UserData> save(UserData entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }
    public Flux<UserData> saveAll(Iterable<UserData> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }
    public Mono<UserData> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Mono<UserData> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public Mono<UserData> findByUserId(String userId) {
        return Mono.justOrEmpty(repository.findByUserId(userId));
    }

    public Flux<UserData> findPhotoAssetsByUserIds(Iterable<String> userId) {
        return Flux.fromIterable(repository.findPhotoAssetsByUserIds(userId));
    }

    public UserData setUserPermissionsInObject(UserData obj, Set<String> permissionGroups) {
        return repository.setUserPermissionsInObject(obj, permissionGroups);
    }

    public Flux<UserData> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public Mono<UserData> archive(UserData entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

    public Mono<UserData> findByIdAndFieldNames(String id, List<String> fieldNames) {
        return Mono.justOrEmpty(repository.findByIdAndFieldNames(id, fieldNames));
    }

    public Mono<UpdateResult> saveReleaseNotesViewedVersion(String userId, String version) {
        return Mono.justOrEmpty(repository.saveReleaseNotesViewedVersion(userId, version));
    }

    public Flux<UserData> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public UserData updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return repository.updateAndReturn(id, updateObj, permission);
    }

    public Mono<UpdateResult> removeIdFromRecentlyUsedList(String userId, String workspaceId, List<String> applicationIds) {
        return Mono.justOrEmpty(repository.removeIdFromRecentlyUsedList(userId, workspaceId, applicationIds));
    }

    public Flux<UserData> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }

    public Mono<UpdateResult> updateByIdAndFieldNames(String id, Map<String, Object> fieldNameValueMap) {
        return Mono.justOrEmpty(repository.updateByIdAndFieldNames(id, fieldNameValueMap));
    }

    public Mono<UserData> findByIdAndBranchName(String id, String branchName) {
        return Mono.justOrEmpty(repository.findByIdAndBranchName(id, branchName));
    }

    public Mono<String> fetchMostRecentlyUsedWorkspaceId(String userId) {
        return Mono.justOrEmpty(repository.fetchMostRecentlyUsedWorkspaceId(userId));
    }

    public UserData setUserPermissionsInObject(UserData obj) {
        return repository.setUserPermissionsInObject(obj);
    }

    public Mono<Boolean> archiveById(String id) {
        return Mono.justOrEmpty(repository.archiveById(id));
    }

    public Mono<UserData> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

}
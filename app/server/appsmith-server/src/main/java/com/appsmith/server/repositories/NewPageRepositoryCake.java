package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.mongodb.bulk.BulkWriteResult;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;

@Component
@RequiredArgsConstructor
public class NewPageRepositoryCake {
    private final NewPageRepository repository;

    // From CrudRepository
    public Mono<NewPage> save(NewPage entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }

    public Flux<NewPage> saveAll(Iterable<NewPage> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }

    public Mono<NewPage> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Mono<List<BulkWriteResult>> bulkUpdate(List<NewPage> newPages) {
        return Mono.justOrEmpty(repository.bulkUpdate(newPages));
    }

    public Flux<NewPage> findByApplicationId(String applicationId, Optional<AclPermission> permission) {
        return Flux.fromIterable(repository.findByApplicationId(applicationId, permission));
    }

    public Flux<NewPage> findByApplicationId(String applicationId) {
        return Flux.fromIterable(repository.findByApplicationId(applicationId));
    }

    public Mono<NewPage> findByNameAndViewMode(String name, AclPermission aclPermission, Boolean viewMode) {
        return Mono.justOrEmpty(repository.findByNameAndViewMode(name, aclPermission, viewMode));
    }

    public NewPage setUserPermissionsInObject(NewPage obj, Set<String> permissionGroups) {
        return repository.setUserPermissionsInObject(obj, permissionGroups);
    }

    public Flux<NewPage> findAllByApplicationIdsWithoutPermission(
            List<String> applicationIds, List<String> includeFields) {
        return Flux.fromIterable(repository.findAllByApplicationIdsWithoutPermission(applicationIds, includeFields));
    }

    public Mono<Long> countByDeletedAtNull() {
        return Mono.justOrEmpty(repository.countByDeletedAtNull());
    }

    public Mono<NewPage> findByIdAndLayoutsIdAndViewMode(
            String id, String layoutId, AclPermission aclPermission, Boolean viewMode) {
        return Mono.justOrEmpty(repository.findByIdAndLayoutsIdAndViewMode(id, layoutId, aclPermission, viewMode));
    }

    public Mono<String> getNameByPageId(String pageId, boolean isPublishedName) {
        return Mono.justOrEmpty(repository.getNameByPageId(pageId, isPublishedName));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

    public Flux<NewPage> findByApplicationId(String applicationId, AclPermission aclPermission) {
        return Flux.fromIterable(repository.findByApplicationId(applicationId, aclPermission));
    }

    public Mono<NewPage> findByNameAndApplicationIdAndViewMode(
            String name, String applicationId, AclPermission aclPermission, Boolean viewMode) {
        return Mono.justOrEmpty(
                repository.findByNameAndApplicationIdAndViewMode(name, applicationId, aclPermission, viewMode));
    }

    public Flux<NewPage> findByApplicationIdAndNonDeletedEditMode(String applicationId, AclPermission aclPermission) {
        return Flux.fromIterable(repository.findByApplicationIdAndNonDeletedEditMode(applicationId, aclPermission));
    }

    public Mono<List<BulkWriteResult>> publishPages(java.util.Collection<String> pageIds, AclPermission permission) {
        return Mono.justOrEmpty(repository.publishPages(pageIds, permission));
    }

    public NewPage updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return repository.updateAndReturn(id, updateObj, permission);
    }

    public NewPage setUserPermissionsInObject(NewPage obj) {
        return repository.setUserPermissionsInObject(obj);
    }

    public Flux<NewPage> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

    public Mono<NewPage> archive(NewPage entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public Mono<NewPage> findPageByBranchNameAndDefaultPageId(
            String branchName, String defaultPageId, AclPermission permission) {
        return Mono.justOrEmpty(repository.findPageByBranchNameAndDefaultPageId(branchName, defaultPageId, permission));
    }

    public Mono<NewPage> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, AclPermission permission) {
        return Mono.justOrEmpty(
                repository.findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, permission));
    }

    public Mono<NewPage> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

    public Mono<NewPage> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission) {
        return Mono.justOrEmpty(
                repository.findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, permission));
    }

    public Flux<NewPage> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public Mono<NewPage> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public Flux<NewPage> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public Flux<NewPage> findAllPageDTOsByIds(List<String> ids, AclPermission aclPermission) {
        return Flux.fromIterable(repository.findAllPageDTOsByIds(ids, aclPermission));
    }

    public Flux<NewPage> findSlugsByApplicationIds(List<String> applicationIds, AclPermission aclPermission) {
        return Flux.fromIterable(repository.findSlugsByApplicationIds(applicationIds, aclPermission));
    }
}

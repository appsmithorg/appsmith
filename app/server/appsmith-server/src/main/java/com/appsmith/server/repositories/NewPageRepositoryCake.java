package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.server.projections.*;
import com.appsmith.server.repositories.cakes.BaseCake;
import com.mongodb.bulk.BulkWriteResult;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Component
public class NewPageRepositoryCake extends BaseCake<NewPage> {
    private final NewPageRepository repository;

    public NewPageRepositoryCake(NewPageRepository repository) {
        super(repository);
        this.repository = repository;
    }

    // From CrudRepository
    public Flux<NewPage> saveAll(Iterable<NewPage> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }

    public Mono<NewPage> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public Flux<NewPage> findAllByApplicationIdsWithoutPermission(
            List<String> applicationIds, List<String> includeFields) {
        return Flux.defer(() ->
                Flux.fromIterable(repository.findAllByApplicationIdsWithoutPermission(applicationIds, includeFields)));
    }

    public Flux<NewPage> findAllPageDTOsByIds(List<String> ids, AclPermission aclPermission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllPageDTOsByIds(ids, aclPermission)));
    }

    public Flux<NewPage> findByApplicationId(String applicationId) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByApplicationId(applicationId)));
    }

    public Flux<NewPage> findByApplicationId(String applicationId, AclPermission aclPermission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByApplicationId(applicationId, aclPermission)));
    }

    public Flux<NewPage> findByApplicationId(String applicationId, Optional<AclPermission> permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByApplicationId(applicationId, permission)));
    }

    public Flux<NewPage> findByApplicationIdAndNonDeletedEditMode(String applicationId, AclPermission aclPermission) {
        return Flux.defer(() ->
                Flux.fromIterable(repository.findByApplicationIdAndNonDeletedEditMode(applicationId, aclPermission)));
    }

    public Flux<NewPage> findSlugsByApplicationIds(List<String> applicationIds, AclPermission aclPermission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findSlugsByApplicationIds(applicationIds, aclPermission)));
    }

    public Flux<NewPage> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission)));
    }

    public Flux<NewPage> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission, sort)));
    }

    public Flux<NewPage> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort)));
    }

    public Mono<NewPage> setUserPermissionsInObject(NewPage obj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj)));
    }

    public Mono<NewPage> setUserPermissionsInObject(NewPage obj, Set<String> permissionGroups) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Mono<NewPage> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<List<BulkWriteResult>> bulkUpdate(List<NewPage> newPages) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.bulkUpdate(newPages)));
    }

    public Mono<List<BulkWriteResult>> publishPages(java.util.Collection<String> pageIds, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.publishPages(pageIds, permission)));
    }

    public Mono<Long> countByDeletedAtNull() {
        return Mono.defer(() -> Mono.justOrEmpty(repository.countByDeletedAtNull()));
    }

    public Mono<NewPage> archive(NewPage entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Mono<NewPage> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(
                repository.findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, permission)));
    }

    public Mono<NewPage> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(
                repository.findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, permission)));
    }

    public Mono<NewPage> findById(String id, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id, permission)));
    }

    public Mono<NewPage> findByIdAndLayoutsIdAndViewMode(
            String id, String layoutId, AclPermission aclPermission, Boolean viewMode) {
        return Mono.defer(() ->
                Mono.justOrEmpty(repository.findByIdAndLayoutsIdAndViewMode(id, layoutId, aclPermission, viewMode)));
    }

    public Mono<NewPage> findByNameAndApplicationIdAndViewMode(
            String name, String applicationId, AclPermission aclPermission, Boolean viewMode) {
        return Mono.defer(() -> Mono.justOrEmpty(
                repository.findByNameAndApplicationIdAndViewMode(name, applicationId, aclPermission, viewMode)));
    }

    public Mono<NewPage> findByNameAndViewMode(String name, AclPermission aclPermission, Boolean viewMode) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByNameAndViewMode(name, aclPermission, viewMode)));
    }

    public Mono<NewPage> findPageByBranchNameAndDefaultPageId(
            String branchName, String defaultPageId, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(
                repository.findPageByBranchNameAndDefaultPageId(branchName, defaultPageId, permission)));
    }

    public Mono<NewPage> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Mono<String> getNameByPageId(String pageId, boolean isPublishedName) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.getNameByPageId(pageId, isPublishedName)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }
}

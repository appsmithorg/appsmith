package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.server.dtos.*;
import com.appsmith.server.projections.*;
import com.appsmith.server.repositories.cakes.BaseCake;
import com.appsmith.external.models.*;
import org.springframework.stereotype.Component;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import org.springframework.data.mongodb.core.query.*;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.result.InsertManyResult;
import com.querydsl.core.types.dsl.StringPath;


import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Component
public class ActionCollectionRepositoryCake extends BaseCake<ActionCollection> {
    private final ActionCollectionRepository repository;

    public ActionCollectionRepositoryCake(ActionCollectionRepository repository) {
        super(repository);
        this.repository = repository;
    }

    // From CrudRepository
    public Flux<ActionCollection> saveAll(Iterable<ActionCollection> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }
    public Mono<ActionCollection> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public Mono<ActionCollection> setUserPermissionsInObject(ActionCollection obj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj)));
    }

    public Mono<ActionCollection> setUserPermissionsInObject(ActionCollection obj, Set<String> permissionGroups) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Mono<ActionCollection> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission)));
    }

    public Flux<ActionCollection> findAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(String name, List<String> pageIds, boolean viewMode, String branchName, AclPermission aclPermission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(name, pageIds, viewMode, branchName, aclPermission, sort)));
    }

    public Flux<ActionCollection> findAllByApplicationIds(List<String> applicationIds, List<String> includeFields) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllByApplicationIds(applicationIds, includeFields)));
    }

    public Flux<ActionCollection> findAllPublishedActionCollectionsByContextIdAndContextType(String contextId, CreatorContextType contextType, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllPublishedActionCollectionsByContextIdAndContextType(contextId, contextType, permission)));
    }

    public Flux<ActionCollection> findAllUnpublishedActionCollectionsByContextIdAndContextType(String contextId, CreatorContextType contextType, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllUnpublishedActionCollectionsByContextIdAndContextType(contextId, contextType, permission)));
    }

    public Flux<ActionCollection> findByApplicationId(String applicationId) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByApplicationId(applicationId)));
    }

    public Flux<ActionCollection> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByApplicationId(applicationId, aclPermission, sort)));
    }

    public Flux<ActionCollection> findByApplicationId(String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByApplicationId(applicationId, aclPermission, sort)));
    }

    public Flux<ActionCollection> findByApplicationIdAndViewMode(String applicationId, boolean viewMode, AclPermission aclPermission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByApplicationIdAndViewMode(applicationId, viewMode, aclPermission)));
    }

    public Flux<ActionCollection> findByDefaultApplicationId(String defaultApplicationId, Optional<AclPermission> permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByDefaultApplicationId(defaultApplicationId, permission)));
    }

    public Flux<ActionCollection> findByPageId(String pageId) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByPageId(pageId)));
    }

    public Flux<ActionCollection> findByPageId(String pageId, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByPageId(pageId, permission)));
    }

    public Flux<ActionCollection> findByPageIds(List<String> pageIds, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByPageIds(pageIds, permission)));
    }

    public Flux<ActionCollection> findByPageIds(List<String> pageIds, Optional<AclPermission> permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByPageIds(pageIds, permission)));
    }

    public Flux<ActionCollection> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission)));
    }

    public Flux<ActionCollection> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission, sort)));
    }

    public Flux<ActionCollection> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort)));
    }

    public Mono<ActionCollection> archive(ActionCollection entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Mono<ActionCollection> findByBranchNameAndDefaultCollectionId(String branchName, String defaultCollectionId, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByBranchNameAndDefaultCollectionId(branchName, defaultCollectionId, permission)));
    }

    public Mono<ActionCollection> findByGitSyncIdAndDefaultApplicationId(String defaultApplicationId, String gitSyncId, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, permission)));
    }

    public Mono<ActionCollection> findByGitSyncIdAndDefaultApplicationId(String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, permission)));
    }

    public Mono<ActionCollection> findById(String id, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id, permission)));
    }

    public Mono<ActionCollection> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<List<BulkWriteResult>> bulkUpdate(List<ActionCollection> actionCollections) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.bulkUpdate(actionCollections)));
    }

    public Mono<List<InsertManyResult>> bulkInsert(List<ActionCollection> newActions) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.bulkInsert(newActions)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

}

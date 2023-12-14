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
    import com.appsmith.server.dtos.PluginTypeAndCountDTO;
import com.mongodb.client.result.UpdateResult;

    import java.util.*;

    @Component
    @RequiredArgsConstructor
    public class NewActionRepositoryCake {
        private final NewActionRepository repository;

        // From CrudRepository
        public Mono<NewAction> save(NewAction entity) {
            return Mono.defer(() -> Mono.justOrEmpty(repository.save(entity)));
        }
        public Flux<NewAction> saveAll(Iterable<NewAction> entities) {
            return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
        }
        public Mono<NewAction> findById(String id) {
            return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
        }
        // End from CrudRepository

    public Mono<List<BulkWriteResult>> bulkUpdate(List<NewAction> newActions) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.bulkUpdate(newActions)));
    }

    public Flux<NewAction> findAllByApplicationIdsWithoutPermission(List<String> applicationIds, List<String> includeFields) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllByApplicationIdsWithoutPermission(applicationIds, includeFields)));
    }

    public Flux<NewAction> findAllNonJsActionsByNameAndPageIdsAndViewMode(String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllNonJsActionsByNameAndPageIdsAndViewMode(name, pageIds, viewMode, aclPermission, sort)));
    }

    public Mono<NewAction> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission)));
    }

    public Mono<List<BulkWriteResult>> publishActions(String applicationId, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.publishActions(applicationId, permission)));
    }

    public Mono<Long> countByDeletedAtNull() {
        return Mono.defer(() -> Mono.justOrEmpty(repository.countByDeletedAtNull()));
    }

    public Flux<NewAction> findByPageId(String pageId, AclPermission aclPermission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByPageId(pageId, aclPermission)));
    }

    public Mono<Long> countByDatasourceId(String datasourceId) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.countByDatasourceId(datasourceId)));
    }

    public Flux<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByApplicationId(applicationId, aclPermission)));
    }

    public Flux<NewAction> findByApplicationIdAndViewMode(String applicationId, Boolean viewMode, AclPermission aclPermission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByApplicationIdAndViewMode(applicationId, viewMode, aclPermission)));
    }

    public Flux<NewAction> findAllByIdIn(Iterable<String> ids) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllByIdIn(ids)));
    }

    public Flux<NewAction> findByPageId(String pageId) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByPageId(pageId)));
    }

    public Mono<NewAction> archive(NewAction entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Flux<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByApplicationId(applicationId, aclPermission, sort)));
    }

    public Mono<List<InsertManyResult>> bulkInsert(List<NewAction> newActions) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.bulkInsert(newActions)));
    }

    public Flux<NewAction> findByPageId(String pageId, Optional<AclPermission> aclPermission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByPageId(pageId, aclPermission)));
    }

    public Mono<NewAction> findByGitSyncIdAndDefaultApplicationId(String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, permission)));
    }

    public Flux<NewAction> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort)));
    }

    public Flux<NewAction> findByPageIds(List<String> pageIds, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByPageIds(pageIds, permission)));
    }

    public Flux<PluginTypeAndCountDTO> countActionsByPluginType(String applicationId) {
        return Flux.defer(() -> Flux.fromIterable(repository.countActionsByPluginType(applicationId)));
    }

    public Flux<NewAction> findByPageIds(List<String> pageIds, Optional<AclPermission> permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByPageIds(pageIds, permission)));
    }

    public Flux<NewAction> findAllUnpublishedActionsByContextIdAndContextType(String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllUnpublishedActionsByContextIdAndContextType(contextId, contextType, permission, includeJs)));
    }

    public Flux<NewAction> findNonJsActionsByApplicationIdAndViewMode(String applicationId, Boolean viewMode, AclPermission aclPermission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findNonJsActionsByApplicationIdAndViewMode(applicationId, viewMode, aclPermission)));
    }

    public Flux<NewAction> findByDefaultApplicationId(String defaultApplicationId, Optional<AclPermission> permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByDefaultApplicationId(defaultApplicationId, permission)));
    }

    public Flux<NewAction> findByApplicationId(String applicationId) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByApplicationId(applicationId)));
    }

    public Flux<NewAction> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission)));
    }

    public Flux<NewAction> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(String pageId, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(pageId, permission)));
    }

    public Flux<NewAction> findAllPublishedActionsByContextIdAndContextType(String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllPublishedActionsByContextIdAndContextType(contextId, contextType, permission, includeJs)));
    }

    public Mono<NewAction> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Mono<NewAction> setUserPermissionsInObject(NewAction obj, Set<String> permissionGroups) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Flux<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission aclPermission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByPageIdAndViewMode(pageId, viewMode, aclPermission)));
    }

    public Mono<NewAction> findByBranchNameAndDefaultActionId(String branchName, String defaultActionId, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByBranchNameAndDefaultActionId(branchName, defaultActionId, permission)));
    }

    public Flux<NewAction> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission, sort)));
    }

    public Flux<NewAction> findAllActionsByNameAndPageIdsAndViewMode(String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.findAllActionsByNameAndPageIdsAndViewMode(name, pageIds, viewMode, aclPermission, sort)));
    }

    public Flux<NewAction> findUnpublishedActionsForRestApiOnLoad(Set<String> names, String pageId, String httpMethod, Boolean userSetOnLoad, AclPermission aclPermission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findUnpublishedActionsForRestApiOnLoad(names, pageId, httpMethod, userSetOnLoad, aclPermission)));
    }

    public Flux<NewAction> findByApplicationId(String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.findByApplicationId(applicationId, aclPermission, sort)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

    public Mono<NewAction> findById(String id, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id, permission)));
    }

    public Flux<NewAction> findUnpublishedActionsByNameInAndPageIdAndExecuteOnLoadTrue(Set<String> names, String pageId, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findUnpublishedActionsByNameInAndPageIdAndExecuteOnLoadTrue(names, pageId, permission)));
    }

    public Mono<NewAction> findByGitSyncIdAndDefaultApplicationId(String defaultApplicationId, String gitSyncId, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, permission)));
    }

    public Flux<NewAction> findUnpublishedActionsByNameInAndPageId(Set<String> names, String pageId, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.findUnpublishedActionsByNameInAndPageId(names, pageId, permission)));
    }

    public Mono<UpdateResult> archiveDeletedUnpublishedActions(String applicationId, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveDeletedUnpublishedActions(applicationId, permission)));
    }

    public Mono<NewAction> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission aclPermission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findByUnpublishedNameAndPageId(name, pageId, aclPermission)));
    }

    public Mono<NewAction> setUserPermissionsInObject(NewAction obj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj)));
    }

}

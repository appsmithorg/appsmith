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
import com.appsmith.server.dtos.PluginTypeAndCountDTO;

    import java.util.*;

    @Component
    @RequiredArgsConstructor
    public class NewActionRepositoryCake {
        private final NewActionRepository repository;

        // From CrudRepository
        public Mono<NewAction> save(NewAction entity) {
            return Mono.justOrEmpty(repository.save(entity));
        }
        public Flux<NewAction> saveAll(Iterable<NewAction> entities) {
            return Flux.fromIterable(repository.saveAll(entities));
        }
        public Mono<NewAction> findById(String id) {
            return Mono.justOrEmpty(repository.findById(id));
        }
        // End from CrudRepository

    public Mono<Long> countByDatasourceId(String datasourceId) {
        return Mono.justOrEmpty(repository.countByDatasourceId(datasourceId));
    }

    public Mono<NewAction> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

    public Mono<List<InsertManyResult>> bulkInsert(List<NewAction> newActions) {
        return Mono.justOrEmpty(repository.bulkInsert(newActions));
    }

    public NewAction setUserPermissionsInObject(NewAction obj) {
        return repository.setUserPermissionsInObject(obj);
    }

    public Mono<NewAction> archive(NewAction entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }

    public Flux<NewAction> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }

    public Mono<NewAction> findByGitSyncIdAndDefaultApplicationId(String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission) {
        return Mono.justOrEmpty(repository.findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, permission));
    }

    public NewAction setUserPermissionsInObject(NewAction obj, Set<String> permissionGroups) {
        return repository.setUserPermissionsInObject(obj, permissionGroups);
    }

    public Flux<NewAction> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(String pageId, AclPermission permission) {
        return Flux.fromIterable(repository.findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(pageId, permission));
    }

    public Mono<NewAction> findByIdAndFieldNames(String id, List<String> fieldNames) {
        return Mono.justOrEmpty(repository.findByIdAndFieldNames(id, fieldNames));
    }

    public Flux<NewAction> findAllPublishedActionsByContextIdAndContextType(String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        return Flux.fromIterable(repository.findAllPublishedActionsByContextIdAndContextType(contextId, contextType, permission, includeJs));
    }

    public Mono<NewAction> findByBranchNameAndDefaultActionId(String branchName, String defaultActionId, AclPermission permission) {
        return Mono.justOrEmpty(repository.findByBranchNameAndDefaultActionId(branchName, defaultActionId, permission));
    }

    public Mono<List<BulkWriteResult>> publishActions(String applicationId, AclPermission permission) {
        return Mono.justOrEmpty(repository.publishActions(applicationId, permission));
    }

    public Flux<NewAction> findByListOfPageIds(List<String> pageIds, AclPermission permission) {
        return Flux.fromIterable(repository.findByListOfPageIds(pageIds, permission));
    }

    public Flux<NewAction> findUnpublishedActionsByNameInAndPageIdAndExecuteOnLoadTrue(Set<String> names, String pageId, AclPermission permission) {
        return Flux.fromIterable(repository.findUnpublishedActionsByNameInAndPageIdAndExecuteOnLoadTrue(names, pageId, permission));
    }

    public Flux<NewAction> findByListOfPageIds(List<String> pageIds, Optional<AclPermission> permission) {
        return Flux.fromIterable(repository.findByListOfPageIds(pageIds, permission));
    }

    public Mono<List<BulkWriteResult>> bulkUpdate(List<NewAction> newActions) {
        return Mono.justOrEmpty(repository.bulkUpdate(newActions));
    }

    public Flux<NewAction> findByDefaultApplicationId(String defaultApplicationId, Optional<AclPermission> permission) {
        return Flux.fromIterable(repository.findByDefaultApplicationId(defaultApplicationId, permission));
    }

    public Mono<UpdateResult> archiveDeletedUnpublishedActions(String applicationId, AclPermission permission) {
        return Mono.justOrEmpty(repository.archiveDeletedUnpublishedActions(applicationId, permission));
    }

    public Flux<NewAction> findAllByApplicationIdsWithoutPermission(List<String> applicationIds, List<String> includeFields) {
        return Flux.fromIterable(repository.findAllByApplicationIdsWithoutPermission(applicationIds, includeFields));
    }

    public Flux<NewAction> findAllUnpublishedActionsByContextIdAndContextType(String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        return Flux.fromIterable(repository.findAllUnpublishedActionsByContextIdAndContextType(contextId, contextType, permission, includeJs));
    }

    public NewAction updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return repository.updateAndReturn(id, updateObj, permission);
    }

    public Flux<NewAction> findByApplicationId(String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort) {
        return Flux.fromIterable(repository.findByApplicationId(applicationId, aclPermission, sort));
    }

    public Flux<NewAction> findByPageId(String pageId) {
        return Flux.fromIterable(repository.findByPageId(pageId));
    }

    public Flux<NewAction> findByPageId(String pageId, Optional<AclPermission> aclPermission) {
        return Flux.fromIterable(repository.findByPageId(pageId, aclPermission));
    }

    public Mono<Long> countByDeletedAtNull() {
        return Mono.justOrEmpty(repository.countByDeletedAtNull());
    }

    public Flux<NewAction> findByApplicationId(String applicationId) {
        return Flux.fromIterable(repository.findByApplicationId(applicationId));
    }

    public Flux<NewAction> findByPageId(String pageId, AclPermission aclPermission) {
        return Flux.fromIterable(repository.findByPageId(pageId, aclPermission));
    }

    public Mono<Boolean> archiveById(String id) {
        return Mono.justOrEmpty(repository.archiveById(id));
    }

    public Flux<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission) {
        return Flux.fromIterable(repository.findByApplicationId(applicationId, aclPermission));
    }

    public Mono<NewAction> findByIdAndBranchName(String id, String branchName) {
        return Mono.justOrEmpty(repository.findByIdAndBranchName(id, branchName));
    }

    public Flux<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission aclPermission) {
        return Flux.fromIterable(repository.findByPageIdAndViewMode(pageId, viewMode, aclPermission));
    }

    public Flux<NewAction> findAllByIdIn(Iterable<String> ids) {
        return Flux.fromIterable(repository.findAllByIdIn(ids));
    }

    public Flux<NewAction> findUnpublishedActionsForRestApiOnLoad(Set<String> names, String pageId, String httpMethod, Boolean userSetOnLoad, AclPermission aclPermission) {
        return Flux.fromIterable(repository.findUnpublishedActionsForRestApiOnLoad(names, pageId, httpMethod, userSetOnLoad, aclPermission));
    }

    public Flux<NewAction> findAllNonJsActionsByNameAndPageIdsAndViewMode(String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort) {
        return Flux.fromIterable(repository.findAllNonJsActionsByNameAndPageIdsAndViewMode(name, pageIds, viewMode, aclPermission, sort));
    }

    public Flux<PluginTypeAndCountDTO> countActionsByPluginType(String applicationId) {
        return Flux.fromIterable(repository.countActionsByPluginType(applicationId));
    }

    public Mono<NewAction> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public Flux<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort) {
        return Flux.fromIterable(repository.findByApplicationId(applicationId, aclPermission, sort));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

    public Flux<NewAction> findAllActionsByNameAndPageIdsAndViewMode(String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort) {
        return Flux.fromIterable(repository.findAllActionsByNameAndPageIdsAndViewMode(name, pageIds, viewMode, aclPermission, sort));
    }

    public Mono<NewAction> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission aclPermission) {
        return Mono.justOrEmpty(repository.findByUnpublishedNameAndPageId(name, pageId, aclPermission));
    }

    public Mono<NewAction> findByGitSyncIdAndDefaultApplicationId(String defaultApplicationId, String gitSyncId, AclPermission permission) {
        return Mono.justOrEmpty(repository.findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, permission));
    }

    public Flux<NewAction> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public Flux<NewAction> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public Flux<NewAction> findNonJsActionsByApplicationIdAndViewMode(String applicationId, Boolean viewMode, AclPermission aclPermission) {
        return Flux.fromIterable(repository.findNonJsActionsByApplicationIdAndViewMode(applicationId, viewMode, aclPermission));
    }

    public Flux<NewAction> findByApplicationIdAndViewMode(String applicationId, Boolean viewMode, AclPermission aclPermission) {
        return Flux.fromIterable(repository.findByApplicationIdAndViewMode(applicationId, viewMode, aclPermission));
    }

    public Flux<NewAction> findUnpublishedActionsByNameInAndPageId(Set<String> names, String pageId, AclPermission permission) {
        return Flux.fromIterable(repository.findUnpublishedActionsByNameInAndPageId(names, pageId, permission));
    }

}
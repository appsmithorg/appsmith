package com.appsmith.server.repositories.cakes;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.PluginTypeAndCountDTO;
import com.appsmith.server.helpers.ReactiveContextUtils;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.newactions.projections.*;
import com.appsmith.server.projections.*;
import com.appsmith.server.repositories.*;
import com.appsmith.server.repositories.ce.params.QueryAllParams;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.helpers.ReactorUtils.asFlux;
import static com.appsmith.server.helpers.ReactorUtils.asMono;

@Component
public class NewActionRepositoryCake extends BaseCake<NewAction, NewActionRepository> {
    private final NewActionRepository repository;

    public NewActionRepositoryCake(NewActionRepository repository) {
        super(repository);
        this.repository = repository;
    }

    public QueryAllParams<NewAction> queryBuilder() {
        return repository.queryBuilder();
    }

    // From CrudRepository
    public Flux<NewAction> saveAll(Iterable<NewAction> entities) {
        return asFlux(() -> repository.saveAll(entities));
    }
    // End from CrudRepository

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#archiveDeletedUnpublishedActions(String, AclPermission, User) */
    public Mono<Integer> archiveDeletedUnpublishedActions(String applicationId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(
                        () -> repository.archiveDeletedUnpublishedActions(applicationId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkInsert(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkInsert(NewActionRepositoryCake baseRepository, List<NewAction> domainList) {
        return asMono(() -> repository.bulkInsert(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkUpdate(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkUpdate(NewActionRepositoryCake baseRepository, List<NewAction> domainList) {
        return asMono(() -> repository.bulkUpdate(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.ce.NewActionRepositoryCE#countActionsByPluginType(String) */
    public Flux<PluginTypeAndCountDTO> countActionsByPluginType(String applicationId) {
        return asFlux(() -> repository.countActionsByPluginType(applicationId));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#countByDatasourceId(String) */
    public Mono<Long> countByDatasourceId(String datasourceId) {
        return asMono(() -> repository.countByDatasourceId(datasourceId));
    }

    /** @see com.appsmith.server.repositories.ce.NewActionRepositoryCE#countByDeletedAtNull() */
    public Mono<Long> countByDeletedAtNull() {
        return asMono(() -> repository.countByDeletedAtNull());
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findAll() */
    public Flux<NewAction> findAll() {
        return asFlux(() -> repository.findAll());
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findAllActionsByNameAndPageIdsAndViewMode(String, List<String>, Boolean, AclPermission, User, Sort) */
    public Flux<NewAction> findAllActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission permission, Sort sort) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() -> repository.findAllActionsByNameAndPageIdsAndViewMode(
                        name, pageIds, viewMode, permission, currentUser, sort)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findAllByApplicationIds(List<String>, List<String>) */
    public Flux<NewAction> findAllByApplicationIds(List<String> branchedArtifactIds, List<String> includedFields) {
        return asFlux(() -> repository.findAllByApplicationIds(branchedArtifactIds, includedFields));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findAllByApplicationIdsWithoutPermission(List<String>, List<String>) */
    public Flux<NewAction> findAllByApplicationIdsWithoutPermission(
            List<String> applicationIds, List<String> includeFields) {
        return asFlux(() -> repository.findAllByApplicationIdsWithoutPermission(applicationIds, includeFields));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findAllByCollectionIds(List<String>, boolean, AclPermission, User) */
    public Flux<NewAction> findAllByCollectionIds(
            List<String> collectionIds, boolean viewMode, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(
                        () -> repository.findAllByCollectionIds(collectionIds, viewMode, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.NewActionRepositoryCE#findAllByIdIn(java.util.Collection<String>) */
    public Flux<NewAction> findAllByIdIn(java.util.Collection<String> ids) {
        return asFlux(() -> repository.findAllByIdIn(ids));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findAllNonJsActionsByNameAndPageIdsAndViewMode(String, List<String>, Boolean, AclPermission, User, Sort) */
    public Flux<NewAction> findAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission permission, Sort sort) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() -> repository.findAllNonJsActionsByNameAndPageIdsAndViewMode(
                        name, pageIds, viewMode, permission, currentUser, sort)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findAllPublishedActionsByContextIdAndContextType(String, CreatorContextType, AclPermission, User, boolean) */
    public Flux<NewAction> findAllPublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() -> repository.findAllPublishedActionsByContextIdAndContextType(
                        contextId, contextType, permission, currentUser, includeJs)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findAllUnpublishedActionsByContextIdAndContextType(String, CreatorContextType, AclPermission, User, boolean) */
    public Flux<NewAction> findAllUnpublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() -> repository.findAllUnpublishedActionsByContextIdAndContextType(
                        contextId, contextType, permission, currentUser, includeJs)));
    }

    /** @see com.appsmith.server.repositories.ce.NewActionRepositoryCE#findByApplicationId(String) */
    public Flux<NewAction> findByApplicationId(String applicationId) {
        return asFlux(() -> repository.findByApplicationId(applicationId));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findByApplicationId(String, AclPermission, User) */
    public Flux<NewAction> findByApplicationId(String applicationId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.findByApplicationId(applicationId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findByApplicationId(String, AclPermission, User, Sort) */
    public Flux<NewAction> findByApplicationId(String applicationId, AclPermission permission, Sort sort) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.findByApplicationId(applicationId, permission, currentUser, sort)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findByApplicationId(String, Optional<AclPermission>, User, Optional<Sort>) */
    public Flux<NewAction> findByApplicationId(
            String applicationId, Optional<AclPermission> permission, Optional<Sort> sort) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.findByApplicationId(applicationId, permission, currentUser, sort)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findByApplicationIdAndViewMode(String, Boolean, AclPermission, User) */
    public Flux<NewAction> findByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() ->
                        repository.findByApplicationIdAndViewMode(applicationId, viewMode, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findByBranchNameAndBaseActionId(String, String, Boolean, AclPermission, User) */
    public Mono<NewAction> findByBranchNameAndBaseActionId(
            String branchName, String baseActionId, Boolean viewMode, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findByBranchNameAndBaseActionId(
                        branchName, baseActionId, viewMode, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findById(String) */
    public Mono<NewAction> findById(String id) {
        return asMono(() -> repository.findById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#findById(String, AclPermission, User) */
    public Mono<NewAction> findById(String id, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findById(id, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findByPageId(String) */
    public Flux<NewAction> findByPageId(String pageId) {
        return asFlux(() -> repository.findByPageId(pageId));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findByPageId(String, AclPermission, User) */
    public Flux<NewAction> findByPageId(String pageId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() -> repository.findByPageId(pageId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findByPageId(String, Optional<AclPermission>, User) */
    public Flux<NewAction> findByPageId(String pageId, Optional<AclPermission> permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() -> repository.findByPageId(pageId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findByPageIdAndViewMode(String, Boolean, AclPermission, User) */
    public Flux<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.findByPageIdAndViewMode(pageId, viewMode, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findByPageIds(List<String>, AclPermission, User) */
    public Flux<NewAction> findByPageIds(List<String> pageIds, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() -> repository.findByPageIds(pageIds, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findByPageIds(List<String>, Optional<AclPermission>, User) */
    public Flux<NewAction> findByPageIds(List<String> pageIds, Optional<AclPermission> permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() -> repository.findByPageIds(pageIds, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findByUnpublishedNameAndPageId(String, String, AclPermission, User) */
    public Mono<NewAction> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser ->
                        asMono(() -> repository.findByUnpublishedNameAndPageId(name, pageId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.NewActionRepositoryCE#findIdAndDatasourceIdByApplicationIdIn(List<String>) */
    public Flux<IdAndDatasourceIdNewActionView> findIdAndDatasourceIdByApplicationIdIn(List<String> applicationIds) {
        return asFlux(() -> repository.findIdAndDatasourceIdByApplicationIdIn(applicationIds));
    }

    /** @see com.appsmith.server.repositories.ce.NewActionRepositoryCE#findIdsAndPolicyMapByApplicationIdIn(List<String>) */
    public Flux<IdPoliciesOnly> findIdsAndPolicyMapByApplicationIdIn(List<String> applicationIds) {
        return asFlux(() -> repository.findIdsAndPolicyMapByApplicationIdIn(applicationIds));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findNonJsActionsByApplicationIdAndViewMode(String, Boolean, AclPermission, User) */
    public Flux<NewAction> findNonJsActionsByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() -> repository.findNonJsActionsByApplicationIdAndViewMode(
                        applicationId, viewMode, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findPublishedActionsByAppIdAndExcludedPluginType(String, List<String>, AclPermission, User, Sort) */
    public Flux<NewAction> findPublishedActionsByAppIdAndExcludedPluginType(
            String appId, List<String> pluginTypes, AclPermission permission, Sort sort) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() -> repository.findPublishedActionsByAppIdAndExcludedPluginType(
                        appId, pluginTypes, permission, currentUser, sort)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findPublishedActionsByPageIdAndExcludedPluginType(String, List<String>, AclPermission, User, Sort) */
    public Flux<NewAction> findPublishedActionsByPageIdAndExcludedPluginType(
            String pageId, List<String> pluginTypes, AclPermission permission, Sort sort) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() -> repository.findPublishedActionsByPageIdAndExcludedPluginType(
                        pageId, pluginTypes, permission, currentUser, sort)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findUnpublishedActionsByNameInAndPageId(Set<String>, String, AclPermission, User) */
    public Flux<NewAction> findUnpublishedActionsByNameInAndPageId(
            Set<String> names, String pageId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() ->
                        repository.findUnpublishedActionsByNameInAndPageId(names, pageId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(String, AclPermission, User) */
    public Flux<NewAction> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(
            String pageId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(
                                pageId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#getById(String) */
    public Mono<NewAction> getById(String id) {
        return asMono(() -> repository.getById(id));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewActionRepositoryCE#publishActions(String, AclPermission, User) */
    public Mono<Void> publishActions(String applicationId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(
                        currentUser -> asMono(() -> repository.publishActions(applicationId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, User) */
    public Mono<NewAction> setUserPermissionsInObject(NewAction obj, User user) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, user))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, java.util.Collection<String>) */
    public Mono<NewAction> setUserPermissionsInObject(NewAction obj, java.util.Collection<String> permissionGroups) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, permissionGroups))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateAndReturn(String, BridgeUpdate, AclPermission, User) */
    public Mono<NewAction> updateAndReturn(String id, BridgeUpdate updateObj, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser().flatMap(currentUser -> Mono.fromSupplier(
                        () -> repository.updateAndReturn(id, updateObj, permission, currentUser))
                .subscribeOn(Schedulers.boundedElastic()));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateById(String, BaseDomain, AclPermission, User) */
    public Mono<NewAction> updateById(String id, NewAction resource, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.updateById(id, resource, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateByIdWithoutPermissionCheck(String, BridgeUpdate) */
    public Mono<Integer> updateByIdWithoutPermissionCheck(String id, BridgeUpdate update) {
        return Mono.fromSupplier(() -> repository.updateByIdWithoutPermissionCheck(id, update))
                .subscribeOn(Schedulers.boundedElastic());
    }
}

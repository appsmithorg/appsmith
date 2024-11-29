package com.appsmith.server.repositories.cakes;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.server.domains.User;
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

import static com.appsmith.server.helpers.ReactorUtils.asFlux;
import static com.appsmith.server.helpers.ReactorUtils.asMono;

@Component
public class ActionCollectionRepositoryCake extends BaseCake<ActionCollection, ActionCollectionRepository> {
    private final ActionCollectionRepository repository;

    public ActionCollectionRepositoryCake(ActionCollectionRepository repository) {
        super(repository);
        this.repository = repository;
    }

    public QueryAllParams<ActionCollection> queryBuilder() {
        return repository.queryBuilder();
    }

    // From CrudRepository
    public Flux<ActionCollection> saveAll(Iterable<ActionCollection> entities) {
        return asFlux(() -> repository.saveAll(entities));
    }
    // End from CrudRepository

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkInsert(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkInsert(ActionCollectionRepositoryCake baseRepository, List<ActionCollection> domainList) {
        return asMono(() -> repository.bulkInsert(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkUpdate(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkUpdate(ActionCollectionRepositoryCake baseRepository, List<ActionCollection> domainList) {
        return asMono(() -> repository.bulkUpdate(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findAll() */
    public Flux<ActionCollection> findAll() {
        return asFlux(() -> repository.findAll());
    }

    /** @see com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCE#findAllByApplicationIds(List<String>, List<String>) */
    public Flux<ActionCollection> findAllByApplicationIds(List<String> applicationIds, List<String> includeFields) {
        return asFlux(() -> repository.findAllByApplicationIds(applicationIds, includeFields));
    }

    /** @see com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCE#findAllNonComposedByPageIdAndViewMode(String, boolean, AclPermission, User) */
    public Flux<ActionCollection> findAllNonComposedByPageIdAndViewMode(
            String pageId, boolean viewMode, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() ->
                        repository.findAllNonComposedByPageIdAndViewMode(pageId, viewMode, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCE#findAllPublishedActionCollectionsByContextIdAndContextType(String, CreatorContextType, AclPermission, User) */
    public Flux<ActionCollection> findAllPublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.findAllPublishedActionCollectionsByContextIdAndContextType(
                                contextId, contextType, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCE#findAllUnpublishedActionCollectionsByContextIdAndContextType(String, CreatorContextType, AclPermission, User) */
    public Flux<ActionCollection> findAllUnpublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.findAllUnpublishedActionCollectionsByContextIdAndContextType(
                                contextId, contextType, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.ActionCollectionRepositoryCE#findByApplicationId(String) */
    public Flux<ActionCollection> findByApplicationId(String applicationId) {
        return asFlux(() -> repository.findByApplicationId(applicationId));
    }

    /** @see com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCE#findByApplicationId(String, AclPermission, User, Sort) */
    public Flux<ActionCollection> findByApplicationId(String applicationId, AclPermission permission, Sort sort) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.findByApplicationId(applicationId, permission, currentUser, sort)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCE#findByApplicationId(String, Optional<AclPermission>, User, Optional<Sort>) */
    public Flux<ActionCollection> findByApplicationId(
            String applicationId, Optional<AclPermission> permission, Optional<Sort> sort) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.findByApplicationId(applicationId, permission, currentUser, sort)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCE#findByBranchNameAndBaseCollectionId(String, String, AclPermission, User) */
    public Mono<ActionCollection> findByBranchNameAndBaseCollectionId(
            String branchName, String baseCollectionId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findByBranchNameAndBaseCollectionId(
                        branchName, baseCollectionId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findById(String) */
    public Mono<ActionCollection> findById(String id) {
        return asMono(() -> repository.findById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#findById(String, AclPermission, User) */
    public Mono<ActionCollection> findById(String id, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findById(id, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCE#findByPageId(String) */
    public Flux<ActionCollection> findByPageId(String pageId) {
        return asFlux(() -> repository.findByPageId(pageId));
    }

    /** @see com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCE#findByPageId(String, AclPermission, User) */
    public Flux<ActionCollection> findByPageId(String pageId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() -> repository.findByPageId(pageId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCE#findByPageIdAndViewMode(String, boolean, AclPermission, User) */
    public Flux<ActionCollection> findByPageIdAndViewMode(String pageId, boolean viewMode, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.findByPageIdAndViewMode(pageId, viewMode, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCE#findByPageIds(List<String>, AclPermission, User) */
    public Flux<ActionCollection> findByPageIds(List<String> pageIds, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() -> repository.findByPageIds(pageIds, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.ActionCollectionRepositoryCE#findIdsAndPolicyMapByApplicationIdIn(List<String>) */
    public Flux<IdPoliciesOnly> findIdsAndPolicyMapByApplicationIdIn(List<String> applicationIds) {
        return asFlux(() -> repository.findIdsAndPolicyMapByApplicationIdIn(applicationIds));
    }

    /** @see com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCE#findNonComposedByApplicationIdAndViewMode(String, boolean, AclPermission, User) */
    public Flux<ActionCollection> findNonComposedByApplicationIdAndViewMode(
            String applicationId, boolean viewMode, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() -> repository.findNonComposedByApplicationIdAndViewMode(
                        applicationId, viewMode, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#getById(String) */
    public Mono<ActionCollection> getById(String id) {
        return asMono(() -> repository.getById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, User) */
    public Mono<ActionCollection> setUserPermissionsInObject(ActionCollection obj, User user) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, user))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, java.util.Collection<String>) */
    public Mono<ActionCollection> setUserPermissionsInObject(
            ActionCollection obj, java.util.Collection<String> permissionGroups) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, permissionGroups))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateAndReturn(String, BridgeUpdate, AclPermission, User) */
    public Mono<ActionCollection> updateAndReturn(String id, BridgeUpdate updateObj, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser().flatMap(currentUser -> Mono.fromSupplier(
                        () -> repository.updateAndReturn(id, updateObj, permission, currentUser))
                .subscribeOn(Schedulers.boundedElastic()));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateById(String, BaseDomain, AclPermission, User) */
    public Mono<ActionCollection> updateById(String id, ActionCollection resource, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.updateById(id, resource, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateByIdWithoutPermissionCheck(String, BridgeUpdate) */
    public Mono<Integer> updateByIdWithoutPermissionCheck(String id, BridgeUpdate update) {
        return Mono.fromSupplier(() -> repository.updateByIdWithoutPermissionCheck(id, update))
                .subscribeOn(Schedulers.boundedElastic());
    }
}

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
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.List;
import java.util.Map;

import static com.appsmith.server.helpers.ReactorUtils.asFlux;
import static com.appsmith.server.helpers.ReactorUtils.asMono;

@Component
public class NewPageRepositoryCake extends BaseCake<NewPage, NewPageRepository> {
    private final NewPageRepository repository;

    public NewPageRepositoryCake(NewPageRepository repository) {
        super(repository);
        this.repository = repository;
    }

    public QueryAllParams<NewPage> queryBuilder() {
        return repository.queryBuilder();
    }

    // From CrudRepository
    public Flux<NewPage> saveAll(Iterable<NewPage> entities) {
        return asFlux(() -> repository.saveAll(entities));
    }
    // End from CrudRepository

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkInsert(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkInsert(NewPageRepositoryCake baseRepository, List<NewPage> domainList) {
        return asMono(() -> repository.bulkInsert(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkUpdate(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkUpdate(NewPageRepositoryCake baseRepository, List<NewPage> domainList) {
        return asMono(() -> repository.bulkUpdate(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.ce.NewPageRepositoryCE#countByDeletedAtNull() */
    public Mono<Long> countByDeletedAtNull() {
        return asMono(() -> repository.countByDeletedAtNull());
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findAll() */
    public Flux<NewPage> findAll() {
        return asFlux(() -> repository.findAll());
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewPageRepositoryCE#findAllByApplicationIds(List<String>, List<String>) */
    public Flux<NewPage> findAllByApplicationIds(List<String> branchedArtifactIds, List<String> includedFields) {
        return asFlux(() -> repository.findAllByApplicationIds(branchedArtifactIds, includedFields));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewPageRepositoryCE#findAllByApplicationIdsWithoutPermission(List<String>, List<String>) */
    public Flux<NewPage> findAllByApplicationIdsWithoutPermission(
            List<String> applicationIds, List<String> includeFields) {
        return asFlux(() -> repository.findAllByApplicationIdsWithoutPermission(applicationIds, includeFields));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewPageRepositoryCE#findAllPageDTOsByIds(List<String>, AclPermission, User) */
    public Flux<NewPage> findAllPageDTOsByIds(List<String> ids, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(
                        currentUser -> asFlux(() -> repository.findAllPageDTOsByIds(ids, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.NewPageRepositoryCE#findByApplicationId(String) */
    public Flux<NewPage> findByApplicationId(String applicationId) {
        return asFlux(() -> repository.findByApplicationId(applicationId));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewPageRepositoryCE#findByApplicationId(String, AclPermission, User) */
    public Flux<NewPage> findByApplicationId(String applicationId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.findByApplicationId(applicationId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewPageRepositoryCE#findByApplicationId(String, AclPermission, User, List<String>) */
    public Flux<NewPage> findByApplicationId(
            String applicationId, AclPermission permission, List<String> includeFields) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(
                        () -> repository.findByApplicationId(applicationId, permission, currentUser, includeFields)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewPageRepositoryCE#findByApplicationIdAndNonDeletedEditMode(String, AclPermission, User) */
    public Flux<NewPage> findByApplicationIdAndNonDeletedEditMode(String applicationId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() ->
                        repository.findByApplicationIdAndNonDeletedEditMode(applicationId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findById(String) */
    public Mono<NewPage> findById(String id) {
        return asMono(() -> repository.findById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#findById(String, AclPermission, User) */
    public Mono<NewPage> findById(String id, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findById(id, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewPageRepositoryCE#findById(String, AclPermission, User, List<String>) */
    public Mono<NewPage> findById(String id, AclPermission permission, List<String> projectedFields) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(
                        currentUser -> asMono(() -> repository.findById(id, permission, currentUser, projectedFields)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewPageRepositoryCE#findByIdAndLayoutsIdAndViewMode(String, String, AclPermission, User, Boolean) */
    public Mono<NewPage> findByIdAndLayoutsIdAndViewMode(
            String id, String layoutId, AclPermission permission, Boolean viewMode) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() ->
                        repository.findByIdAndLayoutsIdAndViewMode(id, layoutId, permission, currentUser, viewMode)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewPageRepositoryCE#findByNameAndApplicationIdAndViewMode(String, String, Boolean, AclPermission, User) */
    public Mono<NewPage> findByNameAndApplicationIdAndViewMode(
            String name, String applicationId, Boolean viewMode, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findByNameAndApplicationIdAndViewMode(
                        name, applicationId, viewMode, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewPageRepositoryCE#findByNameAndViewMode(String, AclPermission, User, Boolean) */
    public Mono<NewPage> findByNameAndViewMode(String name, AclPermission permission, Boolean viewMode) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser ->
                        asMono(() -> repository.findByNameAndViewMode(name, permission, currentUser, viewMode)));
    }

    /** @see com.appsmith.server.repositories.ce.NewPageRepositoryCE#findIdsAndPolicyMapByApplicationIdIn(List<String>) */
    public Flux<IdPoliciesOnly> findIdsAndPolicyMapByApplicationIdIn(List<String> applicationIds) {
        return asFlux(() -> repository.findIdsAndPolicyMapByApplicationIdIn(applicationIds));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewPageRepositoryCE#findPageByBranchNameAndBasePageId(String, String, AclPermission, User, List<String>) */
    public Mono<NewPage> findPageByBranchNameAndBasePageId(
            String branchName, String basePageId, AclPermission permission, List<String> projectedFieldNames) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findPageByBranchNameAndBasePageId(
                        branchName, basePageId, permission, currentUser, projectedFieldNames)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#getById(String) */
    public Mono<NewPage> getById(String id) {
        return asMono(() -> repository.getById(id));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewPageRepositoryCE#getNameByPageId(String, boolean) */
    public Mono<String> getNameByPageId(String pageId, boolean isPublishedName) {
        return asMono(() -> repository.getNameByPageId(pageId, isPublishedName));
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewPageRepositoryCE#publishPages(java.util.Collection<String>, AclPermission, User) */
    public Mono<Void> publishPages(java.util.Collection<String> pageIds, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.publishPages(pageIds, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, User) */
    public Mono<NewPage> setUserPermissionsInObject(NewPage obj, User user) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, user))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, java.util.Collection<String>) */
    public Mono<NewPage> setUserPermissionsInObject(NewPage obj, java.util.Collection<String> permissionGroups) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, permissionGroups))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateAndReturn(String, BridgeUpdate, AclPermission, User) */
    public Mono<NewPage> updateAndReturn(String id, BridgeUpdate updateObj, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser().flatMap(currentUser -> Mono.fromSupplier(
                        () -> repository.updateAndReturn(id, updateObj, permission, currentUser))
                .subscribeOn(Schedulers.boundedElastic()));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateById(String, BaseDomain, AclPermission, User) */
    public Mono<NewPage> updateById(String id, NewPage resource, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.updateById(id, resource, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateByIdWithoutPermissionCheck(String, BridgeUpdate) */
    public Mono<Integer> updateByIdWithoutPermissionCheck(String id, BridgeUpdate update) {
        return Mono.fromSupplier(() -> repository.updateByIdWithoutPermissionCheck(id, update))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.ce.CustomNewPageRepositoryCE#updateDependencyMap(String, Map<String, List<String>>) */
    public Mono<Integer> updateDependencyMap(String pageId, Map<String, List<String>> dependencyMap) {
        return asMono(() -> repository.updateDependencyMap(pageId, dependencyMap));
    }
}

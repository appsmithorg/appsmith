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
import java.util.Set;

import static com.appsmith.server.helpers.ReactorUtils.asFlux;
import static com.appsmith.server.helpers.ReactorUtils.asMono;

@Component
public class ApplicationRepositoryCake extends BaseCake<Application, ApplicationRepository> {
    private final ApplicationRepository repository;

    public ApplicationRepositoryCake(ApplicationRepository repository) {
        super(repository);
        this.repository = repository;
    }

    public QueryAllParams<Application> queryBuilder() {
        return repository.queryBuilder();
    }

    // From CrudRepository
    public Flux<Application> saveAll(Iterable<Application> entities) {
        return asFlux(() -> repository.saveAll(entities));
    }
    // End from CrudRepository

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#addPageToApplication(String, String, boolean, String) */
    public Mono<Integer> addPageToApplication(
            String applicationId, String pageId, boolean isDefault, String basePageId) {
        return asMono(() -> repository.addPageToApplication(applicationId, pageId, isDefault, basePageId));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkInsert(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkInsert(ApplicationRepositoryCake baseRepository, List<Application> domainList) {
        return asMono(() -> repository.bulkInsert(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkUpdate(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkUpdate(ApplicationRepositoryCake baseRepository, List<Application> domainList) {
        return asMono(() -> repository.bulkUpdate(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.ce.ApplicationRepositoryCE#countByDeletedAtNull() */
    public Mono<Long> countByDeletedAtNull() {
        return asMono(() -> repository.countByDeletedAtNull());
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#countByNameAndWorkspaceId(String, String, AclPermission, User) */
    public Mono<Long> countByNameAndWorkspaceId(String applicationName, String workspaceId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() ->
                        repository.countByNameAndWorkspaceId(applicationName, workspaceId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.ApplicationRepositoryCE#countByWorkspaceId(String) */
    public Mono<Long> countByWorkspaceId(String workspaceId) {
        return asMono(() -> repository.countByWorkspaceId(workspaceId));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findAll() */
    public Flux<Application> findAll() {
        return asFlux(() -> repository.findAll());
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#findAllBranchedApplicationIdsByBranchedApplicationId(String, AclPermission, User) */
    public Flux<String> findAllBranchedApplicationIdsByBranchedApplicationId(
            String branchedApplicationId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(
                        currentUser -> asFlux(() -> repository.findAllBranchedApplicationIdsByBranchedApplicationId(
                                branchedApplicationId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#findAllUserApps(AclPermission, User) */
    public Flux<Application> findAllUserApps(AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() -> repository.findAllUserApps(permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#findBranchedApplicationIdsByBaseApplicationId(String) */
    public Flux<String> findBranchedApplicationIdsByBaseApplicationId(String baseApplicationId) {
        return asFlux(() -> repository.findBranchedApplicationIdsByBaseApplicationId(baseApplicationId));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#findByClonedFromApplicationId(String, AclPermission, User) */
    public Flux<Application> findByClonedFromApplicationId(String applicationId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.findByClonedFromApplicationId(applicationId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.ApplicationRepositoryCE#findByClonedFromApplicationId(String) */
    public Flux<Application> findByClonedFromApplicationId(String clonedFromApplicationId) {
        return asFlux(() -> repository.findByClonedFromApplicationId(clonedFromApplicationId));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findById(String) */
    public Mono<Application> findById(String id) {
        return asMono(() -> repository.findById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#findById(String, AclPermission, User) */
    public Mono<Application> findById(String id, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findById(id, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.ApplicationRepositoryCE#findByIdAndExportWithConfiguration(String, boolean) */
    public Mono<Application> findByIdAndExportWithConfiguration(String id, boolean exportWithConfiguration) {
        return asMono(() -> repository.findByIdAndExportWithConfiguration(id, exportWithConfiguration));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#findByIdAndWorkspaceId(String, String, AclPermission, User) */
    public Mono<Application> findByIdAndWorkspaceId(String id, String workspaceId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser ->
                        asMono(() -> repository.findByIdAndWorkspaceId(id, workspaceId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.ApplicationRepositoryCE#findByIdIn(List<String>) */
    public Flux<Application> findByIdIn(List<String> ids) {
        return asFlux(() -> repository.findByIdIn(ids));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#findByMultipleWorkspaceIds(Set<String>, AclPermission, User) */
    public Flux<Application> findByMultipleWorkspaceIds(Set<String> workspaceIds, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.findByMultipleWorkspaceIds(workspaceIds, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.ApplicationRepositoryCE#findByName(String) */
    public Mono<Application> findByName(String name) {
        return asMono(() -> repository.findByName(name));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#findByName(String, AclPermission, User) */
    public Mono<Application> findByName(String name, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findByName(name, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.ApplicationRepositoryCE#findByWorkspaceId(String) */
    public Flux<Application> findByWorkspaceId(String workspaceId) {
        return asFlux(() -> repository.findByWorkspaceId(workspaceId));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#findByWorkspaceId(String, AclPermission, User) */
    public Flux<Application> findByWorkspaceId(String workspaceId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.findByWorkspaceId(workspaceId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.ApplicationRepositoryCE#findIdsByWorkspaceId(String) */
    public Flux<IdOnly> findIdsByWorkspaceId(String workspaceId) {
        return asFlux(() -> repository.findIdsByWorkspaceId(workspaceId));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#getAllApplicationIdsInWorkspaceAccessibleToARoleWithPermission(String, AclPermission, User, String) */
    public Flux<String> getAllApplicationIdsInWorkspaceAccessibleToARoleWithPermission(
            String workspaceId, AclPermission permission, String permissionGroupId) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.getAllApplicationIdsInWorkspaceAccessibleToARoleWithPermission(
                                workspaceId, permission, currentUser, permissionGroupId)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#getAllApplicationsCountAccessibleToARoleWithPermission(AclPermission, User, String) */
    public Mono<Long> getAllApplicationsCountAccessibleToARoleWithPermission(
            AclPermission permission, String permissionGroupId) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.getAllApplicationsCountAccessibleToARoleWithPermission(
                        permission, currentUser, permissionGroupId)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#getApplicationByBaseApplicationIdAndDefaultBranch(String) */
    public Mono<Application> getApplicationByBaseApplicationIdAndDefaultBranch(String baseApplicationId) {
        return asMono(() -> repository.getApplicationByBaseApplicationIdAndDefaultBranch(baseApplicationId));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#getApplicationByGitBaseApplicationId(String, AclPermission, User) */
    public Flux<Application> getApplicationByGitBaseApplicationId(String baseApplicationId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() ->
                        repository.getApplicationByGitBaseApplicationId(baseApplicationId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#getApplicationByGitBranchAndBaseApplicationId(String, List<String>, String, AclPermission, User) */
    public Mono<Application> getApplicationByGitBranchAndBaseApplicationId(
            String baseApplicationId, List<String> projectionFieldNames, String branchName, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.getApplicationByGitBranchAndBaseApplicationId(
                        baseApplicationId, projectionFieldNames, branchName, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#getApplicationByGitBranchAndBaseApplicationId(String, String, AclPermission, User) */
    public Mono<Application> getApplicationByGitBranchAndBaseApplicationId(
            String baseApplicationId, String branchName, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.getApplicationByGitBranchAndBaseApplicationId(
                        baseApplicationId, branchName, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#getById(String) */
    public Mono<Application> getById(String id) {
        return asMono(() -> repository.getById(id));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#getGitConnectedApplicationByWorkspaceId(String, AclPermission, User) */
    public Flux<Application> getGitConnectedApplicationByWorkspaceId(String workspaceId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() ->
                        repository.getGitConnectedApplicationByWorkspaceId(workspaceId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#getGitConnectedApplicationWithPrivateRepoCount(String) */
    public Mono<Long> getGitConnectedApplicationWithPrivateRepoCount(String workspaceId) {
        return asMono(() -> repository.getGitConnectedApplicationWithPrivateRepoCount(workspaceId));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#protectBranchedApplications(String, List<String>, AclPermission, User) */
    public Mono<Integer> protectBranchedApplications(
            String applicationId, List<String> branchNames, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser().flatMap(currentUser -> Mono.fromSupplier(() ->
                        repository.protectBranchedApplications(applicationId, branchNames, permission, currentUser))
                .subscribeOn(Schedulers.boundedElastic()));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#setAppTheme(String, String, String, AclPermission, User) */
    public Mono<Integer> setAppTheme(
            String applicationId, String editModeThemeId, String publishedModeThemeId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> Mono.fromSupplier(() -> repository.setAppTheme(
                                applicationId, editModeThemeId, publishedModeThemeId, permission, currentUser))
                        .subscribeOn(Schedulers.boundedElastic()));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#setDefaultPage(String, String) */
    public Mono<Void> setDefaultPage(String applicationId, String pageId) {
        return asMono(() -> repository.setDefaultPage(applicationId, pageId));
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#setPages(String, List<ApplicationPage>) */
    public Mono<Integer> setPages(String applicationId, List<ApplicationPage> pages) {
        return Mono.fromSupplier(() -> repository.setPages(applicationId, pages))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, User) */
    public Mono<Application> setUserPermissionsInObject(Application obj, User user) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, user))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, java.util.Collection<String>) */
    public Mono<Application> setUserPermissionsInObject(
            Application obj, java.util.Collection<String> permissionGroups) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, permissionGroups))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#unprotectAllBranches(String, AclPermission, User) */
    public Mono<Integer> unprotectAllBranches(String applicationId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser().flatMap(currentUser -> Mono.fromSupplier(
                        () -> repository.unprotectAllBranches(applicationId, permission, currentUser))
                .subscribeOn(Schedulers.boundedElastic()));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateAndReturn(String, BridgeUpdate, AclPermission, User) */
    public Mono<Application> updateAndReturn(String id, BridgeUpdate updateObj, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser().flatMap(currentUser -> Mono.fromSupplier(
                        () -> repository.updateAndReturn(id, updateObj, permission, currentUser))
                .subscribeOn(Schedulers.boundedElastic()));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateById(String, BaseDomain, AclPermission, User) */
    public Mono<Application> updateById(String id, Application resource, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.updateById(id, resource, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateByIdWithoutPermissionCheck(String, BridgeUpdate) */
    public Mono<Integer> updateByIdWithoutPermissionCheck(String id, BridgeUpdate update) {
        return Mono.fromSupplier(() -> repository.updateByIdWithoutPermissionCheck(id, update))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.ce.CustomApplicationRepositoryCE#updateFieldById(String, String, Map<String, Object>, AclPermission, User) */
    public Mono<Integer> updateFieldById(
            String id, String idPath, Map<String, Object> fieldNameValueMap, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(
                        () -> repository.updateFieldById(id, idPath, fieldNameValueMap, permission, currentUser)));
    }
}

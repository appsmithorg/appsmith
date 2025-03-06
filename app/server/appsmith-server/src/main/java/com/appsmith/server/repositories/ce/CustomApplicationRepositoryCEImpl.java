package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.projections.IdOnly;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Slf4j
@RequiredArgsConstructor
public class CustomApplicationRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Application>
        implements CustomApplicationRepositoryCE {

    private final CacheableRepositoryHelper cacheableRepositoryHelper;
    private final ApplicationPermission applicationPermission;

    @Override
    public Mono<Application> findByIdAndWorkspaceId(String id, String workspaceId, AclPermission permission) {
        return queryBuilder()
                .byId(id)
                .criteria(Bridge.equal(Application.Fields.workspaceId, workspaceId))
                .permission(permission)
                .one();
    }

    @Override
    public Mono<Application> findByName(String name, AclPermission permission) {
        return queryBuilder()
                .criteria(Bridge.equal(Application.Fields.name, name))
                .permission(permission)
                .one();
    }

    @Override
    public Flux<Application> findByWorkspaceId(String workspaceId, AclPermission permission) {
        return queryBuilder()
                .criteria(Bridge.equal(Application.Fields.workspaceId, workspaceId))
                .permission(permission)
                .all();
    }

    @Override
    public Flux<Application> findByMultipleWorkspaceIds(Set<String> workspaceIds, AclPermission permission) {
        return queryBuilder()
                .criteria(Bridge.in(Application.Fields.workspaceId, workspaceIds))
                .permission(permission)
                .all();
    }

    @Override
    public Flux<Application> findAllUserApps(AclPermission permission) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> (User) ctx.getAuthentication().getPrincipal())
                .flatMap(cacheableRepositoryHelper::getPermissionGroupsOfUser)
                .flatMapMany(permissionGroups -> queryBuilder()
                        .permission(permission)
                        .permissionGroups(permissionGroups)
                        .all());
    }

    @Override
    public Flux<Application> findByClonedFromApplicationId(String applicationId, AclPermission permission) {
        return queryBuilder()
                .criteria(Bridge.equal(Application.Fields.clonedFromApplicationId, applicationId))
                .permission(permission)
                .all();
    }

    @Override
    public Mono<Integer> addPageToApplication(
            String applicationId, String pageId, boolean isDefault, String basePageId) {
        final ApplicationPage applicationPage = new ApplicationPage();
        applicationPage.setIsDefault(isDefault);
        applicationPage.setDefaultPageId(basePageId);
        applicationPage.setId(pageId);
        return queryBuilder()
                .byId(applicationId)
                .updateFirst(Bridge.update().push(Application.Fields.pages, applicationPage));
    }

    @Override
    public Mono<Integer> setPages(String applicationId, List<ApplicationPage> pages) {
        return queryBuilder().byId(applicationId).updateFirst(Bridge.update().set(Application.Fields.pages, pages));
    }

    @Override
    public Mono<Void> setDefaultPage(String applicationId, String pageId) {
        // Since this can only happen during edit, the page in question is unpublished page. Hence the update should
        // be to pages and not publishedPages

        final Mono<Integer> setAllAsNonDefaultMono = queryBuilder()
                .byId(applicationId)
                .criteria(Bridge.isTrue("pages.isDefault"))
                .updateFirst(Bridge.update().set("pages.$.isDefault", false));

        final Mono<Integer> setDefaultMono = queryBuilder()
                .byId(applicationId)
                .criteria(Bridge.equal("pages._id", new ObjectId(pageId)))
                .updateFirst(Bridge.update().set("pages.$.isDefault", true));

        return setAllAsNonDefaultMono.then(setDefaultMono).then();
    }

    @Override
    @Deprecated
    public Mono<Application> getApplicationByGitBranchAndBaseApplicationId(
            String baseApplicationId, String branchName, AclPermission aclPermission) {
        return getApplicationByGitBranchAndBaseApplicationId(baseApplicationId, null, branchName, aclPermission);
    }

    @Override
    public Mono<Application> getApplicationByGitBranchAndBaseApplicationId(
            String baseApplicationId,
            List<String> projectionFieldNames,
            String branchName,
            AclPermission aclPermission) {

        return queryBuilder()
                .criteria(Bridge.or(
                                Bridge.equal(
                                        Application.Fields.gitApplicationMetadata_defaultApplicationId,
                                        baseApplicationId),
                                Bridge.equal(
                                        Application.Fields.gitApplicationMetadata_defaultArtifactId, baseApplicationId))
                        .equal(Application.Fields.gitApplicationMetadata_branchName, branchName))
                .fields(projectionFieldNames)
                .permission(aclPermission)
                .one();
    }

    @Override
    public Mono<Application> getApplicationByGitBranchAndBaseApplicationId(
            String baseApplicationId, String branchName, Optional<AclPermission> aclPermission) {

        return queryBuilder()
                .criteria(
                        Bridge.equal(Application.Fields.gitApplicationMetadata_defaultApplicationId, baseApplicationId)
                                .equal(Application.Fields.gitApplicationMetadata_branchName, branchName))
                .permission(aclPermission.orElse(null))
                .one();
    }

    @Override
    public Flux<Application> getApplicationByGitBaseApplicationId(String baseApplicationId, AclPermission permission) {

        return queryBuilder()
                .criteria(Bridge.or(
                        Bridge.equal(Application.Fields.gitApplicationMetadata_defaultApplicationId, baseApplicationId),
                        Bridge.equal(Application.Fields.gitApplicationMetadata_defaultArtifactId, baseApplicationId)))
                .permission(permission)
                .all();
    }

    @Override
    public Mono<Long> getGitConnectedApplicationWithPrivateRepoCount(String workspaceId) {
        return queryBuilder()
                .criteria(Bridge.equal(Application.Fields.workspaceId, workspaceId)
                        .isTrue(Application.Fields.gitApplicationMetadata_isRepoPrivate))
                .count();
    }

    @Override
    public Flux<Application> getGitConnectedApplicationByWorkspaceId(String workspaceId) {
        AclPermission aclPermission = applicationPermission.getEditPermission();
        return queryBuilder()
                .criteria(Bridge
                        // isRepoPrivate and gitAuth will be stored only with default application which ensures we will
                        // have only single application per repo
                        .exists(Application.Fields.gitApplicationMetadata_isRepoPrivate)
                        .exists(Application.Fields.gitApplicationMetadata_gitAuth)
                        .equal(Application.Fields.workspaceId, workspaceId))
                .permission(aclPermission)
                .all();
    }

    @Override
    public Mono<Application> getApplicationByBaseApplicationIdAndDefaultBranch(String baseApplicationId) {

        return queryBuilder()
                .criteria(
                        Bridge.equal(Application.Fields.gitApplicationMetadata_defaultApplicationId, baseApplicationId))
                .one();
    }

    @Override
    public Mono<Integer> setAppTheme(
            String applicationId, String editModeThemeId, String publishedModeThemeId, AclPermission aclPermission) {
        BridgeUpdate updateObj = Bridge.update();
        if (StringUtils.hasLength(editModeThemeId)) {
            updateObj = updateObj.set(Application.Fields.editModeThemeId, editModeThemeId);
        }
        if (StringUtils.hasLength(publishedModeThemeId)) {
            updateObj = updateObj.set(Application.Fields.publishedModeThemeId, publishedModeThemeId);
        }

        return queryBuilder().byId(applicationId).permission(aclPermission).updateFirst(updateObj);
    }

    @Override
    public Mono<Long> countByNameAndWorkspaceId(String applicationName, String workspaceId, AclPermission permission) {
        return queryBuilder()
                .criteria(Bridge.equal(Application.Fields.workspaceId, workspaceId)
                        .equal(Application.Fields.name, applicationName))
                .permission(permission)
                .count();
    }

    @Override
    public Flux<String> getAllApplicationIdsInWorkspaceAccessibleToARoleWithPermission(
            String workspaceId, AclPermission permission, String permissionGroupId) {
        return queryBuilder()
                .criteria(Bridge.equal(Application.Fields.workspaceId, workspaceId))
                // Check if the permission is being provided by the given permission group
                .permission(permission)
                .permissionGroups(Set.of(permissionGroupId))
                .all(IdOnly.class)
                .map(IdOnly::id);
    }

    @Override
    public Mono<Long> getAllApplicationsCountAccessibleToARoleWithPermission(
            AclPermission permission, String permissionGroupId) {
        return queryBuilder()
                .permission(permission)
                .permissionGroups(Set.of(permissionGroupId))
                .count();
    }

    @Override
    public Mono<Integer> unprotectAllBranches(String applicationId, AclPermission permission) {
        String isProtectedFieldPath = Application.Fields.gitApplicationMetadata_isProtectedBranch;

        BridgeUpdate unsetProtected = Bridge.update().set(isProtectedFieldPath, false);

        return queryBuilder()
                .criteria(Bridge.equal(Application.Fields.gitApplicationMetadata_defaultApplicationId, applicationId))
                .permission(permission)
                .updateAll(unsetProtected);
    }

    /**
     * This method sets protected=true to the Applications whose branch names are present in the given branchNames list.
     *
     * @param applicationId default Application id which is stored in git Application Meta data
     * @param branchNames   list of branches to be protected
     * @return Mono<Void>
     */
    @Override
    public Mono<Integer> protectBranchedApplications(
            String applicationId, List<String> branchNames, AclPermission permission) {
        final BridgeQuery<Application> q = Bridge.<Application>equal(
                        Application.Fields.gitApplicationMetadata_defaultApplicationId, applicationId)
                .in(Application.Fields.gitApplicationMetadata_branchName, branchNames);

        BridgeUpdate setProtected =
                Bridge.update().set(Application.Fields.gitApplicationMetadata_isProtectedBranch, true);

        return queryBuilder().criteria(q).permission(permission).updateAll(setProtected);
    }

    @Override
    public Flux<String> findBranchedApplicationIdsByBaseApplicationId(String baseApplicationId) {

        final BridgeQuery<Application> q =
                Bridge.equal(Application.Fields.gitApplicationMetadata_defaultApplicationId, baseApplicationId);

        return queryBuilder().criteria(q).fields(Application.Fields.id).all().map(application -> application.getId());
    }

    @Override
    public Flux<String> findAllBranchedApplicationIdsByBranchedApplicationId(
            String branchedApplicationId, AclPermission permission) {
        Mono<Application> branchedApplicationMono = this.findById(branchedApplicationId, permission);

        return branchedApplicationMono.flatMapMany(application -> {
            if (application.getGitArtifactMetadata() != null
                    && application.getGitArtifactMetadata().getDefaultArtifactId() != null) {
                return this.findBranchedApplicationIdsByBaseApplicationId(
                        application.getGitArtifactMetadata().getDefaultArtifactId());
            } else {
                return Flux.just(application.getId());
            }
        });
    }

    @Override
    public Flux<Application> findByIdIn(List<String> ids) {
        final BridgeQuery<Application> q = Bridge.in(Application.Fields.id, ids);
        return queryBuilder().criteria(q).all();
    }

    @Override
    public Flux<Application> findByWorkspaceId(String workspaceId) {
        final BridgeQuery<Application> q = Bridge.equal(Application.Fields.workspaceId, workspaceId);
        return queryBuilder().criteria(q).all();
    }

    @Override
    public Mono<Long> countByWorkspaceId(String workspaceId) {
        final BridgeQuery<Application> q = Bridge.equal(Application.Fields.workspaceId, workspaceId);
        return queryBuilder().criteria(q).count();
    }

    @Override
    public Flux<Application> findByClonedFromApplicationId(String clonedFromApplicationId) {
        final BridgeQuery<Application> q =
                Bridge.equal(Application.Fields.clonedFromApplicationId, clonedFromApplicationId);
        return queryBuilder().criteria(q).all();
    }

    @Override
    public Mono<Long> countByDeletedAtNull() {
        final BridgeQuery<Application> q = Bridge.isNull(Application.Fields.deletedAt);
        return queryBuilder().criteria(q).count();
    }

    @Override
    public Mono<Application> findByIdAndExportWithConfiguration(String id, boolean exportWithConfiguration) {
        final BridgeQuery<Application> q = Bridge.<Application>equal(Application.Fields.id, id)
                .equal(Application.Fields.exportWithConfiguration, exportWithConfiguration);
        return queryBuilder().criteria(q).one();
    }
}

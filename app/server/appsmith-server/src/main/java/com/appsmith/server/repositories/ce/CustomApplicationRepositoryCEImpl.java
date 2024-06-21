package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.projections.IdOnly;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.solutions.ApplicationPermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaUpdate;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Root;
import jakarta.transaction.Transactional;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.helpers.ReactorUtils.asFlux;
import static java.lang.Boolean.TRUE;

@Slf4j
@RequiredArgsConstructor
public class CustomApplicationRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Application>
        implements CustomApplicationRepositoryCE {

    private final CacheableRepositoryHelper cacheableRepositoryHelper;
    private final ApplicationPermission applicationPermission;

    @Override
    public Optional<Application> findByIdAndWorkspaceId(
            String id, String workspaceId, AclPermission permission, User currentUser) {
        return queryBuilder()
                .byId(id)
                .criteria(Bridge.equal(Application.Fields.workspaceId, workspaceId))
                .permission(permission, currentUser)
                .one();
    }

    @Override
    public Optional<Application> findByName(String name, AclPermission permission, User currentUser) {
        return queryBuilder()
                .criteria(Bridge.equal(Application.Fields.name, name))
                .permission(permission, currentUser)
                .one();
    }

    @Override
    public List<Application> findByWorkspaceId(String workspaceId, AclPermission permission, User currentUser) {
        return queryBuilder()
                .criteria(Bridge.equal(Application.Fields.workspaceId, workspaceId))
                .permission(permission, currentUser)
                .all();
    }

    @Override
    public List<Application> findByMultipleWorkspaceIds(
            Set<String> workspaceIds, AclPermission permission, User currentUser) {
        return queryBuilder()
                .criteria(Bridge.in(Application.Fields.workspaceId, workspaceIds))
                .permission(permission, currentUser)
                .all();
    }

    @Override
    public List<Application> findAllUserApps(AclPermission permission, User currentUser) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> (User) ctx.getAuthentication().getPrincipal())
                .flatMap(cacheableRepositoryHelper::getPermissionGroupsOfUser)
                .flatMapMany(permissionGroups -> asFlux(() -> queryBuilder()
                        .permission(permission, currentUser)
                        .permissionGroups(permissionGroups)
                        .all()))
                .collectList()
                .block();
    }

    @Override
    public List<Application> findByClonedFromApplicationId(
            String applicationId, AclPermission permission, User currentUser) {
        return queryBuilder()
                .criteria(Bridge.equal(Application.Fields.clonedFromApplicationId, applicationId))
                .permission(permission, currentUser)
                .all();
    }

    @SneakyThrows
    @Transactional
    @Modifying
    @Override
    public Optional<Integer> addPageToApplication(
            String applicationId, String pageId, boolean isDefault, String defaultPageId) {
        final ApplicationPage applicationPage = new ApplicationPage();
        applicationPage.setIsDefault(isDefault);
        applicationPage.setDefaultPageId(defaultPageId);
        applicationPage.setId(pageId);

        // * Original PG implementation
        final CriteriaBuilder cb = getEntityManager().getCriteriaBuilder();
        final CriteriaUpdate<Application> cu = cb.createCriteriaUpdate(genericDomain);
        final Root<Application> root = cu.getRoot();
        final Path<Expression<?>> pagesField = root.get("pages");
        cu.set(
                pagesField,
                cb.function(
                        "jsonb_insert",
                        Object.class,
                        cb.function("coalesce", List.class, pagesField, cb.literal("[]")),
                        cb.literal("{-1}"), // at end of array
                        cb.literal(new ObjectMapper().writeValueAsString(applicationPage)),
                        cb.literal(true)));
        cu.where(cb.equal(root.get("id"), applicationId));

        return Optional.of(getEntityManager().createQuery(cu).executeUpdate());
        // */

        /*return queryBuilder()
        .byId(applicationId)
        .updateFirst(Bridge.update().push(Application.Fields.pages, applicationPage));//*/
    }

    @Override
    @Transactional
    public int setPages(String applicationId, List<ApplicationPage> pages) {
        return queryBuilder().byId(applicationId).updateFirst(Bridge.update().set(Application.Fields.pages, pages));
    }

    @Override
    @Transactional
    @Modifying
    public Optional<Void> setDefaultPage(String applicationId, @NonNull String pageId) {
        // Since this can only happen during edit, the page in question is unpublished page. Hence the update should
        // be to pages and not publishedPages

        queryBuilder().byId(applicationId).one().ifPresent(application -> {
            for (ApplicationPage page : application.getPages()) {
                page.setIsDefault(pageId.equals(page.getId()));
            }
            queryBuilder()
                    .byId(applicationId)
                    .updateFirst(Bridge.update().set(Application.Fields.pages, application.getPages()));
        });

        return Optional.empty();
    }

    @Override
    @Deprecated
    public Optional<Application> getApplicationByGitBranchAndDefaultApplicationId(
            String defaultApplicationId, String branchName, AclPermission permission, User currentUser) {
        return getApplicationByGitBranchAndDefaultApplicationId(
                defaultApplicationId, null, branchName, permission, currentUser);
    }

    @Override
    public Optional<Application> getApplicationByGitBranchAndDefaultApplicationId(
            String defaultApplicationId,
            List<String> projectionFieldNames,
            String branchName,
            AclPermission permission,
            User currentUser) {

        return queryBuilder()
                .criteria(Bridge.or(
                                Bridge.equal(
                                        Application.Fields.gitApplicationMetadata_defaultApplicationId,
                                        defaultApplicationId),
                                Bridge.equal(
                                        Application.Fields.gitApplicationMetadata_defaultArtifactId,
                                        defaultApplicationId))
                        .equal(Application.Fields.gitApplicationMetadata_branchName, branchName))
                .fields(projectionFieldNames)
                .permission(permission, currentUser)
                .one();
    }

    @Override
    public Optional<Application> getApplicationByGitBranchAndDefaultApplicationId(
            String defaultApplicationId, String branchName, Optional<AclPermission> permission, User currentUser) {

        return queryBuilder()
                .criteria(Bridge.equal(
                                Application.Fields.gitApplicationMetadata_defaultApplicationId, defaultApplicationId)
                        .equal(Application.Fields.gitApplicationMetadata_branchName, branchName))
                .permission(permission.orElse(null), currentUser)
                .one();
    }

    @Override
    public List<Application> getApplicationByGitDefaultApplicationId(
            String defaultApplicationId, AclPermission permission, User currentUser) {

        return queryBuilder()
                .criteria(Bridge.equal(
                        Application.Fields.gitApplicationMetadata_defaultApplicationId, defaultApplicationId))
                .permission(permission, currentUser)
                .all();
    }

    @Override
    public Optional<Long> getGitConnectedApplicationWithPrivateRepoCount(String workspaceId) {
        return queryBuilder()
                .criteria(Bridge.equal(Application.Fields.workspaceId, workspaceId)
                        .isTrue(Application.Fields.gitApplicationMetadata_isRepoPrivate))
                .count();
    }

    @Override
    public List<Application> getGitConnectedApplicationByWorkspaceId(
            String workspaceId, AclPermission permission, User currentUser) {
        return queryBuilder()
                .criteria(Bridge
                        // isRepoPrivate and gitAuth will be stored only with default application which ensures we will
                        // have only single application per repo
                        .exists(Application.Fields.gitApplicationMetadata_isRepoPrivate)
                        .exists(Application.Fields.gitApplicationMetadata_gitAuth)
                        .equal(Application.Fields.workspaceId, workspaceId))
                .permission(permission, currentUser)
                .all();
    }

    @Override
    public Optional<Application> getApplicationByDefaultApplicationIdAndDefaultBranch(String defaultApplicationId) {

        return queryBuilder()
                .criteria(Bridge.equal(
                        Application.Fields.gitApplicationMetadata_defaultApplicationId, defaultApplicationId))
                .one();
    }

    @Override
    @Transactional
    public int setAppTheme(
            String applicationId,
            String editModeThemeId,
            String publishedModeThemeId,
            AclPermission permission,
            User currentUser) {
        BridgeUpdate updateObj = Bridge.update();
        if (StringUtils.hasLength(editModeThemeId)) {
            updateObj.set(Application.Fields.editModeThemeId, editModeThemeId);
        }
        if (StringUtils.hasLength(publishedModeThemeId)) {
            updateObj.set(Application.Fields.publishedModeThemeId, publishedModeThemeId);
        }

        return queryBuilder()
                .byId(applicationId)
                .permission(permission, currentUser)
                .updateFirst(updateObj);
    }

    @Override
    public Optional<Long> countByNameAndWorkspaceId(
            String applicationName, String workspaceId, AclPermission permission, User currentUser) {
        return queryBuilder()
                .criteria(Bridge.equal(Application.Fields.workspaceId, workspaceId)
                        .equal(Application.Fields.name, applicationName))
                .permission(permission, currentUser)
                .count();
    }

    @Override
    public List<String> getAllApplicationIdsInWorkspaceAccessibleToARoleWithPermission(
            String workspaceId, AclPermission permission, User currentUser, String permissionGroupId) {
        return queryBuilder()
                .criteria(Bridge.equal(Application.Fields.workspaceId, workspaceId))
                // Check if the permission is being provided by the given permission group
                .permission(permission, currentUser)
                .permissionGroups(Set.of(permissionGroupId))
                .all(IdOnly.class)
                .stream()
                .map(IdOnly::id)
                .toList();
    }

    @Override
    public Optional<Long> getAllApplicationsCountAccessibleToARoleWithPermission(
            AclPermission permission, User currentUser, String permissionGroupId) {
        return queryBuilder()
                .permission(permission, currentUser)
                .permissionGroups(Set.of(permissionGroupId))
                .count();
    }

    @Override
    @Transactional
    public int unprotectAllBranches(String applicationId, AclPermission permission, User currentUser) {

        // TODO : This is a temporary solution to unprotect all branches. Replace with a better solution once the field
        //  level updates are possible for jsonb column.
        List<Application> applicationList = queryBuilder()
                .criteria(Bridge.equal(Application.Fields.gitApplicationMetadata_defaultApplicationId, applicationId)
                        .isTrue(Application.Fields.gitApplicationMetadata_isProtectedBranch))
                .permission(permission, currentUser)
                .all();
        applicationList.forEach(application -> {
            GitArtifactMetadata metadata = application.getGitApplicationMetadata();
            if (metadata != null) {
                metadata.setIsProtectedBranch(false);
                queryBuilder()
                        .criteria(Bridge.equal(Application.Fields.id, application.getId()))
                        .updateFirst(Bridge.update().set(Application.Fields.gitApplicationMetadata, metadata));
            }
        });
        return applicationList.size();
    }

    /**
     * This method sets protected=true to the Applications whose branch names are present in the given branchNames list.
     *
     * @param applicationId default Application id which is stored in git Application Meta data
     * @param branchNames   list of branches to be protected
     * @return Mono<Void>
     */
    @Override
    @Transactional
    public int protectBranchedApplications(
            String applicationId, List<String> branchNames, AclPermission permission, User currentUser) {
        final BridgeQuery<Application> q = Bridge.<Application>equal(
                        Application.Fields.gitApplicationMetadata_defaultApplicationId, applicationId)
                .in(Application.Fields.gitApplicationMetadata_branchName, branchNames);

        // TODO : This is a temporary solution to unprotect all branches. Replace with a better solution once the field
        //  level updates are possible for jsonb column.
        List<Application> applicationList =
                queryBuilder().criteria(q).permission(permission, currentUser).all();
        int count = 0;
        for (Application application : applicationList) {
            GitArtifactMetadata metadata = application.getGitApplicationMetadata();
            if (metadata != null && !TRUE.equals(metadata.getIsProtectedBranch())) {
                metadata.setIsProtectedBranch(true);
                queryBuilder()
                        .criteria(Bridge.equal(Application.Fields.id, application.getId()))
                        .updateFirst(Bridge.update().set(Application.Fields.gitApplicationMetadata, metadata));
                count++;
            }
        }
        return count;
    }
}

package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.QBaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.solutions.ApplicationPermission;
import com.mongodb.client.result.UpdateResult;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.helpers.ce.bridge.Bridge.bridge;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public class CustomApplicationRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Application>
        implements CustomApplicationRepositoryCE {

    private final CacheableRepositoryHelper cacheableRepositoryHelper;
    private final ApplicationPermission applicationPermission;

    @Autowired
    public CustomApplicationRepositoryCEImpl(
            @NonNull ReactiveMongoOperations mongoOperations,
            @NonNull MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            ApplicationPermission applicationPermission) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
        this.cacheableRepositoryHelper = cacheableRepositoryHelper;
        this.applicationPermission = applicationPermission;
    }

    @Override
    protected Criteria getIdCriteria(Object id) {
        return where(fieldName(QApplication.application.id)).is(id);
    }

    @Override
    public Mono<Application> findByIdAndWorkspaceId(String id, String workspaceId, AclPermission permission) {
        return queryBuilder()
                .byId(id)
                .criteria(bridge().equal(fieldName(QApplication.application.workspaceId), workspaceId))
                .permission(permission)
                .one();
    }

    @Override
    public Mono<Application> findByName(String name, AclPermission permission) {
        return queryBuilder()
                .criteria(bridge().equal(fieldName(QApplication.application.name), name))
                .permission(permission)
                .one();
    }

    @Override
    public Flux<Application> findByWorkspaceId(String workspaceId, AclPermission permission) {
        return queryBuilder()
                .criteria(bridge().equal(fieldName(QApplication.application.workspaceId), workspaceId))
                .permission(permission)
                .all();
    }

    @Override
    public Flux<Application> findByMultipleWorkspaceIds(Set<String> workspaceIds, AclPermission permission) {
        Criteria workspaceIdCriteria =
                where(fieldName(QApplication.application.workspaceId)).in(workspaceIds);
        return queryBuilder()
                .criteria(workspaceIdCriteria)
                .permission(permission)
                .all();
    }

    @Override
    public Flux<Application> findAllUserApps(AclPermission permission) {
        Mono<User> currentUserWithTenantMono = ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> (User) auth.getPrincipal())
                .flatMap(user -> {
                    if (user.getTenantId() == null) {
                        return cacheableRepositoryHelper.getDefaultTenantId().map(tenantId -> {
                            user.setTenantId(tenantId);
                            return user;
                        });
                    }
                    return Mono.just(user);
                });

        return currentUserWithTenantMono
                .flatMap(cacheableRepositoryHelper::getPermissionGroupsOfUser)
                .flatMapMany(permissionGroups -> queryBuilder()
                        .permission(permission)
                        .permissionGroups(permissionGroups)
                        .all());
    }

    @Override
    public Flux<Application> findByClonedFromApplicationId(String applicationId, AclPermission permission) {
        return queryBuilder()
                .criteria(bridge().equal(fieldName(QApplication.application.clonedFromApplicationId), applicationId))
                .permission(permission)
                .all();
    }

    @Override
    public Mono<UpdateResult> addPageToApplication(
            String applicationId, String pageId, boolean isDefault, String defaultPageId) {
        final ApplicationPage applicationPage = new ApplicationPage();
        applicationPage.setIsDefault(isDefault);
        applicationPage.setDefaultPageId(defaultPageId);
        applicationPage.setId(pageId);
        return queryBuilder()
                .byId(applicationId)
                .updateFirst(new Update().push(fieldName(QApplication.application.pages), applicationPage));
    }

    @Override
    public Mono<UpdateResult> setPages(String applicationId, List<ApplicationPage> pages) {
        return queryBuilder()
                .byId(applicationId)
                .updateFirst(new Update().set(fieldName(QApplication.application.pages), pages));
    }

    @Override
    public Mono<UpdateResult> setDefaultPage(String applicationId, String pageId) {
        // Since this can only happen during edit, the page in question is unpublished page. Hence the update should
        // be to pages and not publishedPages

        final Mono<UpdateResult> setAllAsNonDefaultMono = queryBuilder()
                .byId(applicationId)
                .criteria(bridge().isTrue("pages.isDefault"))
                .updateFirst(new Update().set("pages.$.isDefault", false));

        final Mono<UpdateResult> setDefaultMono = queryBuilder()
                .byId(applicationId)
                .criteria(bridge().equal("pages._id", new ObjectId(pageId)))
                .updateFirst(new Update().set("pages.$.isDefault", true));

        return setAllAsNonDefaultMono.then(setDefaultMono);
    }

    @Override
    public Mono<UpdateResult> setGitAuth(String applicationId, GitAuth gitAuth, AclPermission aclPermission) {
        Update updateObj = new Update();
        gitAuth.setGeneratedAt(Instant.now());
        String path = String.format(
                "%s.%s",
                fieldName(QApplication.application.gitApplicationMetadata),
                fieldName(QApplication.application.gitApplicationMetadata.gitAuth));

        updateObj.set(path, gitAuth);
        return queryBuilder().byId(applicationId).permission(aclPermission).updateFirst(updateObj);
    }

    @Override
    @Deprecated
    public Mono<Application> getApplicationByGitBranchAndDefaultApplicationId(
            String defaultApplicationId, String branchName, AclPermission aclPermission) {
        return getApplicationByGitBranchAndDefaultApplicationId(defaultApplicationId, null, branchName, aclPermission);
    }

    @Override
    public Mono<Application> getApplicationByGitBranchAndDefaultApplicationId(
            String defaultApplicationId,
            List<String> projectionFieldNames,
            String branchName,
            AclPermission aclPermission) {

        String gitApplicationMetadata = fieldName(QApplication.application.gitApplicationMetadata);

        return queryBuilder()
                .criteria(bridge().equal(
                                gitApplicationMetadata + "."
                                        + fieldName(
                                                QApplication.application.gitApplicationMetadata.defaultApplicationId),
                                defaultApplicationId)
                        .equal(
                                gitApplicationMetadata + "."
                                        + fieldName(QApplication.application.gitApplicationMetadata.branchName),
                                branchName))
                .fields(projectionFieldNames)
                .permission(aclPermission)
                .one();
    }

    @Override
    public Mono<Application> getApplicationByGitBranchAndDefaultApplicationId(
            String defaultApplicationId, String branchName, Optional<AclPermission> aclPermission) {

        String gitApplicationMetadata = fieldName(QApplication.application.gitApplicationMetadata);

        return queryBuilder()
                .criteria(bridge().equal(
                                gitApplicationMetadata + "."
                                        + fieldName(
                                                QApplication.application.gitApplicationMetadata.defaultApplicationId),
                                defaultApplicationId)
                        .equal(
                                gitApplicationMetadata + "."
                                        + fieldName(QApplication.application.gitApplicationMetadata.branchName),
                                branchName))
                .permission(aclPermission.orElse(null))
                .one();
    }

    @Override
    public Flux<Application> getApplicationByGitDefaultApplicationId(
            String defaultApplicationId, AclPermission permission) {
        String gitApplicationMetadata = fieldName(QApplication.application.gitApplicationMetadata);

        return queryBuilder()
                .criteria(bridge().equal(
                                gitApplicationMetadata + "."
                                        + fieldName(
                                                QApplication.application.gitApplicationMetadata.defaultApplicationId),
                                defaultApplicationId))
                .permission(permission)
                .all();
    }

    @Override
    public Mono<Long> countByWorkspaceId(String workspaceId) {
        return queryBuilder()
                .criteria(bridge().equal(fieldName(QApplication.application.workspaceId), workspaceId))
                .count();
    }

    @Override
    public Mono<Long> getGitConnectedApplicationWithPrivateRepoCount(String workspaceId) {
        String gitApplicationMetadata = fieldName(QApplication.application.gitApplicationMetadata);
        return queryBuilder()
                .criteria(bridge().equal(fieldName(QApplication.application.workspaceId), workspaceId)
                        .isTrue(gitApplicationMetadata + "."
                                + fieldName(QApplication.application.gitApplicationMetadata.isRepoPrivate)))
                .count();
    }

    @Override
    public Flux<Application> getGitConnectedApplicationByWorkspaceId(String workspaceId) {
        String gitApplicationMetadata = fieldName(QApplication.application.gitApplicationMetadata);
        // isRepoPrivate and gitAuth will be stored only with default application which ensures we will have only single
        // application per repo
        Criteria repoCriteria = where(gitApplicationMetadata + "."
                        + fieldName(QApplication.application.gitApplicationMetadata.isRepoPrivate))
                .exists(Boolean.TRUE);
        Criteria gitAuthCriteria = where(gitApplicationMetadata + "."
                        + fieldName(QApplication.application.gitApplicationMetadata.gitAuth))
                .exists(Boolean.TRUE);
        Criteria workspaceIdCriteria =
                where(fieldName(QApplication.application.workspaceId)).is(workspaceId);
        AclPermission aclPermission = applicationPermission.getEditPermission();
        return queryBuilder()
                .criteria(workspaceIdCriteria, repoCriteria, gitAuthCriteria)
                .permission(aclPermission)
                .all();
    }

    @Override
    public Mono<Application> getApplicationByDefaultApplicationIdAndDefaultBranch(String defaultApplicationId) {
        String gitApplicationMetadata = fieldName(QApplication.application.gitApplicationMetadata);

        return queryBuilder()
                .criteria(bridge().equal(
                                gitApplicationMetadata + "."
                                        + fieldName(
                                                QApplication.application.gitApplicationMetadata.defaultApplicationId),
                                defaultApplicationId))
                .one();
    }

    @Override
    public Mono<UpdateResult> setAppTheme(
            String applicationId, String editModeThemeId, String publishedModeThemeId, AclPermission aclPermission) {
        Update updateObj = new Update();
        if (StringUtils.hasLength(editModeThemeId)) {
            updateObj = updateObj.set(fieldName(QApplication.application.editModeThemeId), editModeThemeId);
        }
        if (StringUtils.hasLength(publishedModeThemeId)) {
            updateObj = updateObj.set(fieldName(QApplication.application.publishedModeThemeId), publishedModeThemeId);
        }

        return queryBuilder().byId(applicationId).permission(aclPermission).updateFirst(updateObj);
    }

    @Override
    public Mono<Long> countByNameAndWorkspaceId(String applicationName, String workspaceId, AclPermission permission) {
        return queryBuilder()
                .criteria(bridge().equal(fieldName(QApplication.application.workspaceId), workspaceId)
                        .equal(fieldName(QApplication.application.name), applicationName))
                .permission(permission)
                .count();
    }

    @Override
    public Flux<String> getAllApplicationIdsInWorkspaceAccessibleToARoleWithPermission(
            String workspaceId, AclPermission permission, String permissionGroupId) {
        Criteria workspaceIdCriteria =
                Criteria.where(fieldName(QApplication.application.workspaceId)).is(workspaceId);

        // Check if the permission is being provided by the given permission group
        Criteria permissionGroupCriteria = Criteria.where(fieldName(QBaseDomain.baseDomain.policies))
                .elemMatch(Criteria.where("permissionGroups")
                        .in(permissionGroupId)
                        .and("permission")
                        .is(permission.getValue()));

        ArrayList<Criteria> criteria =
                new ArrayList<>(List.of(workspaceIdCriteria, permissionGroupCriteria, notDeleted()));
        return queryAllWithoutPermissions(criteria, List.of(fieldName(QApplication.application.id)))
                .map(application -> application.getId());
    }

    @Override
    public Mono<Long> getAllApplicationsCountAccessibleToARoleWithPermission(
            AclPermission permission, String permissionGroupId) {

        Criteria permissionGroupCriteria = Criteria.where(fieldName(QBaseDomain.baseDomain.policies))
                .elemMatch(Criteria.where("permissionGroups")
                        .in(permissionGroupId)
                        .and("permission")
                        .is(permission.getValue()));

        return queryBuilder().criteria(permissionGroupCriteria).count();
    }

    @Override
    public Mono<UpdateResult> unprotectAllBranches(String applicationId, AclPermission permission) {
        String isProtectedFieldPath = fieldName(QApplication.application.gitApplicationMetadata) + "."
                + fieldName(QApplication.application.gitApplicationMetadata.isProtectedBranch);

        Update unsetProtected = new Update().set(isProtectedFieldPath, false);

        return queryBuilder()
                .criteria(bridge().equal(
                                fieldName(QApplication.application.gitApplicationMetadata) + "."
                                        + fieldName(
                                                QApplication.application.gitApplicationMetadata.defaultApplicationId),
                                applicationId))
                .permission(permission)
                .updateAll(unsetProtected);
    }

    /**
     * This method sets protected=true to the Applications whose branch names are present in the given branchNames list.
     * @param applicationId default Application id which is stored in git Application Meta data
     * @param branchNames list of branches to be protected
     * @return Mono<Void>
     */
    @Override
    public Mono<UpdateResult> protectBranchedApplications(
            String applicationId, List<String> branchNames, AclPermission permission) {
        String isProtectedFieldPath = fieldName(QApplication.application.gitApplicationMetadata) + "."
                + fieldName(QApplication.application.gitApplicationMetadata.isProtectedBranch);

        String branchNameFieldPath = fieldName(QApplication.application.gitApplicationMetadata) + "."
                + fieldName(QApplication.application.gitApplicationMetadata.branchName);

        Criteria defaultApplicationIdCriteria = Criteria.where(
                        fieldName(QApplication.application.gitApplicationMetadata) + "."
                                + fieldName(QApplication.application.gitApplicationMetadata.defaultApplicationId))
                .is(applicationId);
        Criteria branchMatchCriteria = Criteria.where(branchNameFieldPath).in(branchNames);
        Update setProtected = new Update().set(isProtectedFieldPath, true);

        return queryBuilder()
                .criteria(defaultApplicationIdCriteria, branchMatchCriteria)
                .permission(permission)
                .updateAll(setProtected);
    }
}

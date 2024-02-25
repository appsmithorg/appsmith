package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.GitAuth;
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
import org.springframework.data.mongodb.core.query.Query;
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
        return where(Application.Fields.id).is(id);
    }

    @Override
    public Mono<Application> findByIdAndWorkspaceId(String id, String workspaceId, AclPermission permission) {
        Criteria workspaceIdCriteria = where(Application.Fields.workspaceId).is(workspaceId);
        Criteria idCriteria = getIdCriteria(id);

        return queryBuilder()
                .criteria(idCriteria, workspaceIdCriteria)
                .permission(permission)
                .one();
    }

    @Override
    public Mono<Application> findByName(String name, AclPermission permission) {
        return queryBuilder()
                .criteria(bridge().equal(Application.Fields.name, name))
                .permission(permission)
                .one();
    }

    @Override
    public Flux<Application> findByWorkspaceId(String workspaceId, AclPermission permission) {
        Criteria workspaceIdCriteria = where(Application.Fields.workspaceId).is(workspaceId);
        return queryBuilder()
                .criteria(workspaceIdCriteria)
                .permission(permission)
                .all();
    }

    @Override
    public Flux<Application> findByMultipleWorkspaceIds(Set<String> workspaceIds, AclPermission permission) {
        Criteria workspaceIdCriteria = where(Application.Fields.workspaceId).in(workspaceIds);
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
        Criteria clonedFromCriteria =
                where(Application.Fields.clonedFromApplicationId).is(applicationId);
        return queryBuilder()
                .criteria(clonedFromCriteria)
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
        return mongoOperations.updateFirst(
                Query.query(getIdCriteria(applicationId)),
                new Update().push(Application.Fields.pages, applicationPage),
                Application.class);
    }

    @Override
    public Mono<UpdateResult> setPages(String applicationId, List<ApplicationPage> pages) {
        return mongoOperations.updateFirst(
                Query.query(getIdCriteria(applicationId)),
                new Update().set(Application.Fields.pages, pages),
                Application.class);
    }

    @Override
    public Mono<UpdateResult> setDefaultPage(String applicationId, String pageId) {
        // Since this can only happen during edit, the page in question is unpublished page. Hence the update should
        // be to pages and not publishedPages

        final Mono<UpdateResult> setAllAsNonDefaultMono = mongoOperations.updateFirst(
                Query.query(getIdCriteria(applicationId))
                        .addCriteria(Criteria.where("pages.isDefault").is(true)),
                new Update().set("pages.$.isDefault", false),
                Application.class);

        final Mono<UpdateResult> setDefaultMono = mongoOperations.updateFirst(
                Query.query(getIdCriteria(applicationId))
                        .addCriteria(Criteria.where("pages._id").is(new ObjectId(pageId))),
                new Update().set("pages.$.isDefault", true),
                Application.class);

        return setAllAsNonDefaultMono.then(setDefaultMono);
    }

    @Override
    public Mono<UpdateResult> setGitAuth(String applicationId, GitAuth gitAuth, AclPermission aclPermission) {
        Update updateObj = new Update();
        gitAuth.setGeneratedAt(Instant.now());
        String path = Application.Fields.gitApplicationMetadata_gitAuth;

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

        Criteria defaultAppCriteria = where(Application.Fields.gitApplicationMetadata_defaultApplicationId)
                .is(defaultApplicationId);
        Criteria branchNameCriteria =
                where(Application.Fields.gitApplicationMetadata_branchName).is(branchName);
        return queryBuilder()
                .criteria(defaultAppCriteria, branchNameCriteria)
                .fields(projectionFieldNames)
                .permission(aclPermission)
                .one();
    }

    @Override
    public Mono<Application> getApplicationByGitBranchAndDefaultApplicationId(
            String defaultApplicationId, String branchName, Optional<AclPermission> aclPermission) {

        Criteria defaultAppCriteria = where(Application.Fields.gitApplicationMetadata_defaultApplicationId)
                .is(defaultApplicationId);
        Criteria branchNameCriteria =
                where(Application.Fields.gitApplicationMetadata_branchName).is(branchName);
        return queryBuilder()
                .criteria(defaultAppCriteria, branchNameCriteria)
                .permission(aclPermission.orElse(null))
                .one();
    }

    @Override
    public Flux<Application> getApplicationByGitDefaultApplicationId(
            String defaultApplicationId, AclPermission permission) {

        Criteria applicationIdCriteria = where(Application.Fields.gitApplicationMetadata_defaultApplicationId)
                .is(defaultApplicationId);
        return queryBuilder()
                .criteria(applicationIdCriteria)
                .permission(permission)
                .all();
    }

    @Override
    public Mono<Long> countByWorkspaceId(String workspaceId) {
        Criteria workspaceIdCriteria = where(Application.Fields.workspaceId).is(workspaceId);
        return queryBuilder().criteria(workspaceIdCriteria).count();
    }

    @Override
    public Mono<Long> getGitConnectedApplicationWithPrivateRepoCount(String workspaceId) {
        Query query = new Query();
        query.addCriteria(where(Application.Fields.workspaceId).is(workspaceId));
        query.addCriteria(
                where(Application.Fields.gitApplicationMetadata_isRepoPrivate).is(Boolean.TRUE));
        query.addCriteria(notDeleted());
        return mongoOperations.count(query, Application.class);
    }

    @Override
    public Flux<Application> getGitConnectedApplicationByWorkspaceId(String workspaceId) {
        // isRepoPrivate and gitAuth will be stored only with default application which ensures we will have only single
        // application per repo
        Criteria repoCriteria =
                where(Application.Fields.gitApplicationMetadata_isRepoPrivate).exists(Boolean.TRUE);
        Criteria gitAuthCriteria =
                where(Application.Fields.gitApplicationMetadata_gitAuth).exists(Boolean.TRUE);
        Criteria workspaceIdCriteria = where(Application.Fields.workspaceId).is(workspaceId);
        AclPermission aclPermission = applicationPermission.getEditPermission();
        return queryBuilder()
                .criteria(workspaceIdCriteria, repoCriteria, gitAuthCriteria)
                .permission(aclPermission)
                .all();
    }

    @Override
    public Mono<Application> getApplicationByDefaultApplicationIdAndDefaultBranch(String defaultApplicationId) {

        Query query = new Query();
        query.addCriteria(where(Application.Fields.gitApplicationMetadata_defaultApplicationId)
                .is(defaultApplicationId));
        query.addCriteria(notDeleted());
        return mongoOperations.findOne(query, Application.class);
    }

    @Override
    public Mono<UpdateResult> setAppTheme(
            String applicationId, String editModeThemeId, String publishedModeThemeId, AclPermission aclPermission) {
        Update updateObj = new Update();
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
        Criteria workspaceIdCriteria = where(Application.Fields.workspaceId).is(workspaceId);
        Criteria applicationNameCriteria = where(Application.Fields.name).is(applicationName);

        return queryBuilder()
                .criteria(workspaceIdCriteria, applicationNameCriteria)
                .permission(permission)
                .count();
    }

    @Override
    public Flux<String> getAllApplicationIdsInWorkspaceAccessibleToARoleWithPermission(
            String workspaceId, AclPermission permission, String permissionGroupId) {
        Criteria workspaceIdCriteria =
                Criteria.where(Application.Fields.workspaceId).is(workspaceId);

        // Check if the permission is being provided by the given permission group
        Criteria permissionGroupCriteria = Criteria.where(BaseDomain.Fields.policies)
                .elemMatch(Criteria.where("permissionGroups")
                        .in(permissionGroupId)
                        .and("permission")
                        .is(permission.getValue()));

        ArrayList<Criteria> criteria =
                new ArrayList<>(List.of(workspaceIdCriteria, permissionGroupCriteria, notDeleted()));
        return queryAllWithoutPermissions(criteria, List.of(Application.Fields.id))
                .map(application -> application.getId());
    }

    @Override
    public Mono<Long> getAllApplicationsCountAccessibleToARoleWithPermission(
            AclPermission permission, String permissionGroupId) {

        Query query = new Query();
        Criteria permissionGroupCriteria = Criteria.where(BaseDomain.Fields.policies)
                .elemMatch(Criteria.where("permissionGroups")
                        .in(permissionGroupId)
                        .and("permission")
                        .is(permission.getValue()));

        query.addCriteria(permissionGroupCriteria);
        query.addCriteria(notDeleted());
        return mongoOperations.count(query, Application.class);
    }

    @Override
    public Mono<UpdateResult> unprotectAllBranches(String applicationId, AclPermission permission) {
        String isProtectedFieldPath = Application.Fields.gitApplicationMetadata_isProtectedBranch;

        Criteria defaultApplicationIdCriteria = Criteria.where(
                        Application.Fields.gitApplicationMetadata_defaultApplicationId)
                .is(applicationId);

        Update unsetProtected = new Update().set(isProtectedFieldPath, false);

        return queryBuilder()
                .criteria(defaultApplicationIdCriteria)
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
        String isProtectedFieldPath = Application.Fields.gitApplicationMetadata_isProtectedBranch;

        String branchNameFieldPath = Application.Fields.gitApplicationMetadata_branchName;

        Criteria defaultApplicationIdCriteria = Criteria.where(
                        Application.Fields.gitApplicationMetadata_defaultApplicationId)
                .is(applicationId);
        Criteria branchMatchCriteria = Criteria.where(branchNameFieldPath).in(branchNames);
        Update setProtected = new Update().set(isProtectedFieldPath, true);

        return queryBuilder()
                .criteria(defaultApplicationIdCriteria, branchMatchCriteria)
                .permission(permission)
                .updateAll(setProtected);
    }
}

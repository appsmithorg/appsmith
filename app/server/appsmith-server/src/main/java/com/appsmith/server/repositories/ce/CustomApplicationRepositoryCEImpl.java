package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.helpers.ce.bridge.BUpdate;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.solutions.ApplicationPermission;
import jakarta.transaction.Transactional;
import lombok.NonNull;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static com.appsmith.server.helpers.ce.bridge.Bridge.bridge;
import static com.appsmith.server.helpers.ce.bridge.Bridge.update;
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
    public Optional<Application> findByIdAndWorkspaceId(String id, String workspaceId, AclPermission permission) {
        return queryBuilder()
                .byId(id)
                .criteria(bridge().equal(Application.Fields.workspaceId, workspaceId))
                .permission(permission)
                .one();
    }

    @Override
    public Optional<Application> findByName(String name, AclPermission permission) {
        return queryBuilder()
                .criteria(bridge().equal(Application.Fields.name, name))
                .permission(permission)
                .one();
    }

    @Override
    public List<Application> findByWorkspaceId(String workspaceId, AclPermission permission) {
        return queryBuilder()
                .criteria(bridge().equal(Application.Fields.workspaceId, workspaceId))
                .permission(permission)
                .all();
    }

    @Override
    public List<Application> findByMultipleWorkspaceIds(Set<String> workspaceIds, AclPermission permission) {
        Criteria workspaceIdCriteria = where(Application.Fields.workspaceId).in(workspaceIds);
        return queryBuilder()
                .criteria(workspaceIdCriteria)
                .permission(permission)
                .all();
    }

    @Override
    public List<Application> findAllUserApps(AclPermission permission) {
        throw new ex.Marker("findAllUserApps"); /*
        Optional<User> currentUserWithTenantMono = ReactiveSecurityContextHolder.getContext()
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
                })
            .blockOptional();

        return currentUserWithTenantMono
                .flatMap(cacheableRepositoryHelper::getPermissionGroupsOfUser)
                .flatMapMany(permissionGroups -> queryBuilder()
                        .permission(permission)
                        .permissionGroups(permissionGroups)
                        .all()); //*/
    }

    @Override
    public List<Application> findByClonedFromApplicationId(String applicationId, AclPermission permission) {
        return queryBuilder()
                .criteria(bridge().equal(Application.Fields.clonedFromApplicationId, applicationId))
                .permission(permission)
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

        /* Original PG implementation
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
        */

        return queryBuilder()
            .byId(applicationId)
            .updateFirst(update().push(Application.Fields.pages, applicationPage));
    }

    @Override
    public int setPages(String applicationId, List<ApplicationPage> pages) {
        return queryBuilder().byId(applicationId).updateFirst(new BUpdate().set(Application.Fields.pages, pages));
    }

    @Override
    public Optional<Void> setDefaultPage(String applicationId, String pageId) {
        throw new ex.Marker("setDefaultPage"); /*
        // Since this can only happen during edit, the page in question is unpublished page. Hence the update should
        // be to pages and not publishedPages

        final Mono<Integer> setAllAsNonDefaultMono = queryBuilder()
                .byId(applicationId)
                .criteria(bridge().isTrue("pages.isDefault"))
                .updateFirst(new Update().set("pages.$.isDefault", false));

        final Mono<Integer> setDefaultMono = queryBuilder()
                .byId(applicationId)
                .criteria(bridge().equal("pages._id", new ObjectId(pageId)))
                .updateFirst(new Update().set("pages.$.isDefault", true));

        return setAllAsNonDefaultMono.then(setDefaultMono).then(); //*/
    }

    @Override
    @Deprecated
    public Optional<Application> getApplicationByGitBranchAndDefaultApplicationId(
            String defaultApplicationId, String branchName, AclPermission aclPermission) {
        return getApplicationByGitBranchAndDefaultApplicationId(defaultApplicationId, null, branchName, aclPermission);
    }

    @Override
    public Optional<Application> getApplicationByGitBranchAndDefaultApplicationId(
            String defaultApplicationId,
            List<String> projectionFieldNames,
            String branchName,
            AclPermission aclPermission) {

        return queryBuilder()
                .criteria(bridge().equal(
                                Application.Fields.gitApplicationMetadata_defaultApplicationId, defaultApplicationId)
                        .equal(Application.Fields.gitApplicationMetadata_branchName, branchName))
                .fields(projectionFieldNames)
                .permission(aclPermission)
                .one();
    }

    @Override
    public Optional<Application> getApplicationByGitBranchAndDefaultApplicationId(
            String defaultApplicationId, String branchName, Optional<AclPermission> aclPermission) {

        return queryBuilder()
                .criteria(bridge().equal(
                                Application.Fields.gitApplicationMetadata_defaultApplicationId, defaultApplicationId)
                        .equal(Application.Fields.gitApplicationMetadata_branchName, branchName))
                .permission(aclPermission.orElse(null))
                .one();
    }

    @Override
    public List<Application> getApplicationByGitDefaultApplicationId(
            String defaultApplicationId, AclPermission permission) {

        return queryBuilder()
                .criteria(bridge().equal(
                                Application.Fields.gitApplicationMetadata_defaultApplicationId, defaultApplicationId))
                .permission(permission)
                .all();
    }

    @Override
    public Optional<Long> getGitConnectedApplicationWithPrivateRepoCount(String workspaceId) {
        return queryBuilder()
            .criteria(bridge().equal(Application.Fields.workspaceId, workspaceId)
                .isTrue(Application.Fields.gitApplicationMetadata_isRepoPrivate))
            .count();
    }

    @Override
    public List<Application> getGitConnectedApplicationByWorkspaceId(String workspaceId) {
        AclPermission aclPermission = applicationPermission.getEditPermission();
        return queryBuilder()
                .criteria(bridge()
                        // isRepoPrivate and gitAuth will be stored only with default application which ensures we will
                        // have only single application per repo
                        .exists(Application.Fields.gitApplicationMetadata_isRepoPrivate)
                        .exists(Application.Fields.gitApplicationMetadata_gitAuth)
                        .equal(Application.Fields.workspaceId, workspaceId))
                .permission(aclPermission)
                .all();
    }

    @Override
    public Optional<Application> getApplicationByDefaultApplicationIdAndDefaultBranch(String defaultApplicationId) {

        return queryBuilder()
                .criteria(bridge().equal(
                                Application.Fields.gitApplicationMetadata_defaultApplicationId, defaultApplicationId))
                .one();
    }

    @Override
    @Modifying
    @Transactional
    public int setAppTheme(
            String applicationId, String editModeThemeId, String publishedModeThemeId, AclPermission aclPermission) {
        final BUpdate updateObj = Bridge.update();

        if (StringUtils.hasLength(editModeThemeId)) {
            updateObj.set(Application.Fields.editModeThemeId, editModeThemeId);
        }
        if (StringUtils.hasLength(publishedModeThemeId)) {
            updateObj.set(Application.Fields.publishedModeThemeId, publishedModeThemeId);
        }

        return queryBuilder().byId(applicationId).permission(aclPermission).updateFirst(updateObj);
    }

    @Override
    public Optional<Long> countByNameAndWorkspaceId(String applicationName, String workspaceId, AclPermission permission) {
        return queryBuilder()
                .criteria(bridge().equal(Application.Fields.workspaceId, workspaceId)
                        .equal(Application.Fields.name, applicationName))
                .permission(permission)
                .count();
    }

    @Override
    public List<String> getAllApplicationIdsInWorkspaceAccessibleToARoleWithPermission(
            String workspaceId, AclPermission permission, String permissionGroupId) {
        throw new ex.Marker("getAllApplicationIdsInWorkspaceAccessibleToARoleWithPermission"); /*
        Criteria workspaceIdCriteria =
                Criteria.where(Application.Fields.workspaceId).is(workspaceId);

        // Check if the permission is being provided by the given permission group
        Criteria permissionGroupCriteria = Criteria.where(BaseDomain.Fields.policies)
                .elemMatch(Criteria.where("permissionGroups")
                        .in(permissionGroupId)
                        .and("permission")
                        .is(permission.getValue()));

        return queryBuilder()
                .criteria(workspaceIdCriteria, permissionGroupCriteria)
                .fields(Application.Fields.id)
                .all()
                .map(application -> application.getId()); //*/
    }

    @Override
    public Optional<Long> getAllApplicationsCountAccessibleToARoleWithPermission(
            AclPermission permission, String permissionGroupId) {
        throw new ex.Marker("getAllApplicationsCountAccessibleToARoleWithPermission"); /*

        Criteria permissionGroupCriteria = Criteria.where(BaseDomain.Fields.policies)
                .elemMatch(Criteria.where("permissionGroups")
                        .in(permissionGroupId)
                        .and("permission")
                        .is(permission.getValue()));

        return queryBuilder().criteria(permissionGroupCriteria).count(); //*/
    }

    @Override
    public int unprotectAllBranches(String applicationId, AclPermission permission) {
        String isProtectedFieldPath = Application.Fields.gitApplicationMetadata_isProtectedBranch;

        BUpdate unsetProtected = new BUpdate().set(isProtectedFieldPath, false);

        return queryBuilder()
                .criteria(bridge().equal(Application.Fields.gitApplicationMetadata_defaultApplicationId, applicationId))
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
    public Optional<Integer> protectBranchedApplications(
            String applicationId, List<String> branchNames, AclPermission permission) {
        throw new ex.Marker("protectBranchedApplications"); /*
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
                .updateAll(setProtected); //*/
    }
}

package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.helpers.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.solutions.ApplicationPermission;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.client.result.UpdateResult;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaUpdate;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Root;
import jakarta.transaction.Transactional;
import lombok.NonNull;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public class CustomApplicationRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Application>
        implements CustomApplicationRepositoryCE {

    private final EntityManager entityManager;
    private final CacheableRepositoryHelper cacheableRepositoryHelper;
    private final ApplicationPermission applicationPermission;

    @Autowired
    public CustomApplicationRepositoryCEImpl(
            EntityManager entityManager,
            @NonNull ReactiveMongoOperations mongoOperations,
            @NonNull MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            ApplicationPermission applicationPermission) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
        this.entityManager = entityManager;
        this.cacheableRepositoryHelper = cacheableRepositoryHelper;
        this.applicationPermission = applicationPermission;
    }

    @Override
    protected Criteria getIdCriteria(Object id) {
        return where("id").is(id);
    }

    @Override
    public Optional<Application> findByIdAndWorkspaceId(String id, String workspaceId, AclPermission permission) {
        Criteria workspaceIdCriteria = where("workspaceId").is(workspaceId);
        Criteria idCriteria = getIdCriteria(id);

        return queryBuilder()
                .criteria(idCriteria, workspaceIdCriteria)
                .permission(permission)
                .one();
    }

    @Override
    public Optional<Application> findByName(String name, AclPermission permission) {
        Criteria nameCriteria = where("name").is(name);
        return queryBuilder().criteria(nameCriteria).permission(permission).one();
    }

    @Override
    public List<Application> findByWorkspaceId(String workspaceId, AclPermission permission) {
        return queryBuilder()
                .spec(Bridge.<Application>conditioner()
                        .eq(fieldName(QApplication.application.workspaceId), workspaceId))
                .permission(permission)
                .all();
    }

    @Override
    public List<Application> findByMultipleWorkspaceIds(Set<String> workspaceIds, AclPermission permission) {
        Criteria workspaceIdCriteria =
                where(fieldName(QApplication.application.workspaceId)).in(workspaceIds);
        return queryBuilder()
                .criteria(workspaceIdCriteria)
                .permission(permission)
                .all();
    }

    @Override
    public List<Application> findAllUserApps(AclPermission permission) {
        return Collections.emptyList(); /*
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
                        .all());*/
    }

    @Override
    public List<Application> findByClonedFromApplicationId(String applicationId, AclPermission permission) {
        Criteria clonedFromCriteria = where("clonedFromApplicationId").is(applicationId);
        return queryBuilder()
                .criteria(clonedFromCriteria)
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

        final CriteriaBuilder cb = entityManager.getCriteriaBuilder();
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

        return Optional.of(entityManager.createQuery(cu).executeUpdate());

        /* TODO: Imagined bridge update API:
        return bridgeOperations.updateFirst(
            Query.query(getIdCriteria(applicationId)),
            new Update().push("pages", applicationPage),
            Application.class);*/
    }

    @Override
    public Optional<UpdateResult> setPages(String applicationId, List<ApplicationPage> pages) {
        return Optional.empty(); /*
        return mongoOperations.updateFirst(
            Query.query(getIdCriteria(applicationId)),
            new Update().set("pages", pages),
            Application.class);*/
    }

    @Override
    public Optional<UpdateResult> setDefaultPage(String applicationId, String pageId) {
        return Optional.empty(); /*
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

        return setAllAsNonDefaultMono.then(setDefaultMono);*/
    }

    @Override
    public Optional<UpdateResult> setGitAuth(String applicationId, GitAuth gitAuth, AclPermission aclPermission) {
        return Optional.empty(); /*
        Update updateObj = new Update();
        gitAuth.setGeneratedAt(Instant.now());
        String path = String.format(
                "%s.%s",
                "gitApplicationMetadata",
                "gitAuth");

        updateObj.set(path, gitAuth);
        return this.updateById(applicationId, updateObj, aclPermission);*/
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
        return Optional.empty(); /*
        String gitApplicationMetadata = fieldName(QApplication.application.gitApplicationMetadata);
        Bridge<Application> defaultAppCriteria = Bridge.<Application>where(
                        gitApplicationMetadata + "." + "defaultApplicationId")
                .is(defaultApplicationId);
        Bridge<Application> branchNameCriteria = Bridge.<Application>where(gitApplicationMetadata + "." + "branchName")
                .is(branchName);
        return queryBuilder()
                .criteria(defaultAppCriteria, branchNameCriteria)
                .fields(projectionFieldNames)
                .permission(aclPermission)
                .one()
                .blockOptional();*/
    }

    @Override
    public Optional<Application> getApplicationByGitBranchAndDefaultApplicationId(
            String defaultApplicationId, String branchName, Optional<AclPermission> aclPermission) {

        String gitApplicationMetadata = "gitApplicationMetadata";

        Criteria defaultAppCriteria =
                where(gitApplicationMetadata + ".defaultApplicationId").is(defaultApplicationId);
        Criteria branchNameCriteria =
                where(gitApplicationMetadata + ".branchName").is(branchName);
        return queryBuilder()
                .criteria(defaultAppCriteria, branchNameCriteria)
                .permission(aclPermission.orElse(null))
                .one();
    }

    @Override
    public List<Application> getApplicationByGitDefaultApplicationId(
            String defaultApplicationId, AclPermission permission) {
        String gitApplicationMetadata = "gitApplicationMetadata";

        Criteria applicationIdCriteria =
                where(gitApplicationMetadata + "." + "defaultApplicationId").is(defaultApplicationId);
        return queryBuilder()
                .criteria(applicationIdCriteria)
                .permission(permission)
                .all();
    }

    @Override
    public Optional<Long> getGitConnectedApplicationWithPrivateRepoCount(String workspaceId) {
        return Optional.empty(); /*
        String gitApplicationMetadata = "gitApplicationMetadata";
        Query query = new Query();
        query.addCriteria(where("workspaceId").is(workspaceId));
        query.addCriteria(where(gitApplicationMetadata + "." + "isRepoPrivate").is(Boolean.TRUE));
        query.addCriteria(notDeleted());
        return mongoOperations.count(query, Application.class);*/
    }

    @Override
    public List<Application> getGitConnectedApplicationByWorkspaceId(String workspaceId) {
        String gitApplicationMetadata = "gitApplicationMetadata";
        // isRepoPrivate and gitAuth will be stored only with default application which ensures we will have only single
        // application per repo
        Criteria repoCriteria =
                where(gitApplicationMetadata + "." + "isRepoPrivate").exists(Boolean.TRUE);
        Criteria gitAuthCriteria =
                where(gitApplicationMetadata + "." + "gitAuth").exists(Boolean.TRUE);
        Criteria workspaceIdCriteria = where("workspaceId").is(workspaceId);
        AclPermission aclPermission = applicationPermission.getEditPermission();
        return queryBuilder()
                .criteria(workspaceIdCriteria, repoCriteria, gitAuthCriteria)
                .permission(aclPermission)
                .all();
    }

    @Override
    public Optional<Application> getApplicationByDefaultApplicationIdAndDefaultBranch(String defaultApplicationId) {
        return Optional.empty(); /*
        String gitApplicationMetadata = "gitApplicationMetadata";

        Query query = new Query();
        query.addCriteria(where(gitApplicationMetadata + "."
                        + fieldName(QApplication.application.gitApplicationMetadata.defaultApplicationId))
                .is(defaultApplicationId));
        query.addCriteria(notDeleted());
        return mongoOperations.findOne(query, Application.class);*/
    }

    @Override
    public Optional<UpdateResult> setAppTheme(
            String applicationId, String editModeThemeId, String publishedModeThemeId, AclPermission aclPermission) {
        return Optional.empty(); /*
        Update updateObj = new Update();
        if (StringUtils.hasLength(editModeThemeId)) {
            updateObj = updateObj.set("editModeThemeId", editModeThemeId);
        }
        if (StringUtils.hasLength(publishedModeThemeId)) {
            updateObj = updateObj.set("publishedModeThemeId", publishedModeThemeId);
        }

        return this.updateById(applicationId, updateObj, aclPermission);*/
    }

    @Override
    public Optional<UpdateResult> updateFieldByDefaultIdAndBranchName(
            String defaultId,
            String defaultIdPath,
            Map<String, Object> fieldValueMap,
            String branchName,
            String branchNamePath,
            AclPermission permission) {
        return Optional.empty(); /*
        return super.updateFieldByDefaultIdAndBranchName(
                defaultId, defaultIdPath, fieldValueMap, branchName, branchNamePath, permission);*/
    }

    @Override
    public Optional<Long> countByNameAndWorkspaceId(
            String applicationName, String workspaceId, AclPermission permission) {
        return Optional.empty(); /*
        Criteria workspaceIdCriteria = where("workspaceId").is(workspaceId);
        Criteria applicationNameCriteria = where("name").is(applicationName);

        return queryBuilder()
                .criteria(workspaceIdCriteria, applicationNameCriteria)
                .permission(permission)
                .count();*/
    }

    @Override
    public List<Object> getAllApplicationIdsInWorkspaceAccessibleToARoleWithPermission(
            String workspaceId, AclPermission permission, String permissionGroupId) {
        return Collections.emptyList(); /*
        Criteria workspaceIdCriteria =
                Criteria.where("workspaceId").is(workspaceId);

        // Check if the permission is being provided by the given permission group
        Criteria permissionGroupCriteria = Criteria.where("policies")
                .elemMatch(Criteria.where("permissionGroups")
                        .in(permissionGroupId)
                        .and("permission")
                        .is(permission.getValue()));

        ArrayList<Criteria> criteria =
                new ArrayList<>(List.of(workspaceIdCriteria, permissionGroupCriteria, notDeleted()));
        return queryAllWithoutPermissions(criteria, List.of("id"), null, -1)
                .map(application -> application.getId());*/
    }

    @Override
    public Optional<Long> getAllApplicationsCountAccessibleToARoleWithPermission(
            AclPermission permission, String permissionGroupId) {
        return Optional.empty(); /*

        Query query = new Query();
        Criteria permissionGroupCriteria = Criteria.where("policies")
                .elemMatch(Criteria.where("permissionGroups")
                        .in(permissionGroupId)
                        .and("permission")
                        .is(permission.getValue()));

        query.addCriteria(permissionGroupCriteria);
        query.addCriteria(notDeleted());
        return mongoOperations.count(query, Application.class);*/
    }

    @Override
    public Optional<UpdateResult> unprotectAllBranches(String applicationId, AclPermission permission) {
        return Optional.empty(); /*
        String isProtectedFieldPath = "gitApplicationMetadata" + "." + "isProtectedBranch";

        Criteria defaultApplicationIdCriteria = Criteria.where("gitApplicationMetadata" + "." + "defaultApplicationId")
                .is(applicationId);

        Update unsetProtected = new Update().set(isProtectedFieldPath, false);

        return updateByCriteria(List.of(defaultApplicationIdCriteria), unsetProtected, permission);*/
    }

    /**
     * This method sets protected=true to the Applications whose branch names are present in the given branchNames list.
     *
     * @param applicationId default Application id which is stored in git Application Meta data
     * @param branchNames   list of branches to be protected
     * @return Mono<Void>
     */
    @Override
    public Optional<UpdateResult> protectBranchedApplications(
            String applicationId, List<String> branchNames, AclPermission permission) {
        return Optional.empty(); /*
        String isProtectedFieldPath = "gitApplicationMetadata" + "." + "isProtectedBranch";

        String branchNameFieldPath = "gitApplicationMetadata" + "." + "branchName";

        Criteria defaultApplicationIdCriteria = Criteria.where("gitApplicationMetadata" + "." + "defaultApplicationId")
                .is(applicationId);
        Criteria branchMatchCriteria = Criteria.where(branchNameFieldPath).in(branchNames);
        Update setProtected = new Update().set(isProtectedFieldPath, true);

        return updateByCriteria(List.of(defaultApplicationIdCriteria, branchMatchCriteria), setProtected, permission);*/
    }
}

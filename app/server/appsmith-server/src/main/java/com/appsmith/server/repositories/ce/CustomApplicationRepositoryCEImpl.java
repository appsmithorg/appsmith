package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
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
import java.util.List;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public class CustomApplicationRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Application>
        implements CustomApplicationRepositoryCE {

    private final CacheableRepositoryHelper cacheableRepositoryHelper;
    @Autowired
    public CustomApplicationRepositoryCEImpl(@NonNull ReactiveMongoOperations mongoOperations,
                                             @NonNull MongoConverter mongoConverter,
                                             CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
        this.cacheableRepositoryHelper = cacheableRepositoryHelper;
    }

    @Override
    protected Criteria getIdCriteria(Object id) {
        return where(fieldName(QApplication.application.id)).is(id);
    }

    @Override
    public Mono<Application> findByIdAndWorkspaceId(String id, String workspaceId, AclPermission permission) {
        Criteria workspaceIdCriteria = where(fieldName(QApplication.application.workspaceId)).is(workspaceId);
        Criteria idCriteria = getIdCriteria(id);

        return queryOne(List.of(idCriteria, workspaceIdCriteria), permission);
    }

    @Override
    public Mono<Application> findByName(String name, AclPermission permission) {
        Criteria nameCriteria = where(fieldName(QApplication.application.name)).is(name);
        return queryOne(List.of(nameCriteria), permission);
    }

    @Override
    public Flux<Application> findByWorkspaceId(String workspaceId, AclPermission permission) {
        Criteria workspaceIdCriteria = where(fieldName(QApplication.application.workspaceId)).is(workspaceId);
        return queryAll(List.of(workspaceIdCriteria), permission);
    }

    @Override
    public Flux<Application> findByMultipleWorkspaceIds(Set<String> workspaceIds, AclPermission permission) {
        Criteria workspaceIdCriteria = where(fieldName(QApplication.application.workspaceId)).in(workspaceIds);
        return queryAll(List.of(workspaceIdCriteria), permission);
    }

    @Override
    public Flux<Application> findAllUserApps(AclPermission permission) {
        Mono<User> currentUserWithTenantMono = ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> (User) auth.getPrincipal())
                .flatMap(user -> {
                    if (user.getTenantId() == null) {
                        return cacheableRepositoryHelper.getDefaultTenantId()
                                .map(tenantId -> {
                                    user.setTenantId(tenantId);
                                    return user;
                                });
                    }
                    return Mono.just(user);
                });

        return currentUserWithTenantMono
                .flatMap(cacheableRepositoryHelper::getPermissionGroupsOfUser)
                .flatMapMany(permissionGroups -> queryAllWithPermissionGroups(
                        List.of(), null, permission, null, permissionGroups)
                );
    }

    @Override
    public Flux<Application> findByClonedFromApplicationId(String applicationId, AclPermission permission) {
        Criteria clonedFromCriteria = where(fieldName(QApplication.application.clonedFromApplicationId)).is(applicationId);
        return queryAll(List.of(clonedFromCriteria), permission);
    }

    @Override
    public Mono<UpdateResult> addPageToApplication(String applicationId, String pageId, boolean isDefault, String defaultPageId) {
        final ApplicationPage applicationPage = new ApplicationPage();
        applicationPage.setIsDefault(isDefault);
        applicationPage.setDefaultPageId(defaultPageId);
        applicationPage.setId(pageId);
        return mongoOperations.updateFirst(
                Query.query(getIdCriteria(applicationId)),
                new Update().push(fieldName(QApplication.application.pages), applicationPage),
                Application.class
        );
    }

    @Override
    public Mono<UpdateResult> setPages(String applicationId, List<ApplicationPage> pages) {
        return mongoOperations.updateFirst(
                Query.query(getIdCriteria(applicationId)),
                new Update().set(fieldName(QApplication.application.pages), pages),
                Application.class
        );
    }

    @Override
    public Mono<UpdateResult> setDefaultPage(String applicationId, String pageId) {
        // Since this can only happen during edit, the page in question is unpublished page. Hence the update should
        // be to pages and not publishedPages

        final Mono<UpdateResult> setAllAsNonDefaultMono = mongoOperations.updateFirst(
                Query.query(getIdCriteria(applicationId)).addCriteria(Criteria.where("pages.isDefault").is(true)),
                new Update().set("pages.$.isDefault", false),
                Application.class
        );

        final Mono<UpdateResult> setDefaultMono = mongoOperations.updateFirst(
                Query.query(getIdCriteria(applicationId)).addCriteria(Criteria.where("pages._id").is(new ObjectId(pageId))),
                new Update().set("pages.$.isDefault", true),
                Application.class
        );

        return setAllAsNonDefaultMono.then(setDefaultMono);
    }

    @Override
    public Mono<UpdateResult> setGitAuth(String applicationId, GitAuth gitAuth, AclPermission aclPermission) {
        Update updateObj = new Update();
        gitAuth.setGeneratedAt(Instant.now());
        String path = String.format("%s.%s", fieldName(QApplication.application.gitApplicationMetadata),
                fieldName(QApplication.application.gitApplicationMetadata.gitAuth)
        );

        updateObj.set(path, gitAuth);
        return this.updateById(applicationId, updateObj, aclPermission);
    }

    @Override
    public Mono<Application> getApplicationByGitBranchAndDefaultApplicationId(String defaultApplicationId, String branchName, AclPermission aclPermission) {

        String gitApplicationMetadata = fieldName(QApplication.application.gitApplicationMetadata);

        Criteria defaultAppCriteria = where(gitApplicationMetadata + "." + fieldName(QApplication.application.gitApplicationMetadata.defaultApplicationId)).is(defaultApplicationId);
        Criteria branchNameCriteria = where(gitApplicationMetadata + "." + fieldName(QApplication.application.gitApplicationMetadata.branchName)).is(branchName);
        return queryOne(List.of(defaultAppCriteria, branchNameCriteria), aclPermission);
    }

    @Override
    public Flux<Application> getApplicationByGitDefaultApplicationId(String defaultApplicationId, AclPermission permission) {
        String gitApplicationMetadata = fieldName(QApplication.application.gitApplicationMetadata);

        Criteria applicationIdCriteria = where(gitApplicationMetadata + "." + fieldName(QApplication.application.gitApplicationMetadata.defaultApplicationId)).is(defaultApplicationId);
        Criteria deletionCriteria = where(fieldName(QApplication.application.deleted)).ne(true);
        return queryAll(List.of(applicationIdCriteria, deletionCriteria), permission);
    }

    /**
     * Returns a list of application ids which are under the workspace with provided workspaceId
     *
     * @param workspaceId workspace id
     * @return list of String
     */
    @Override
    public Mono<List<String>> getAllApplicationId(String workspaceId) {
        Query query = new Query();
        query.addCriteria(where(fieldName(QApplication.application.workspaceId)).is(workspaceId));
        query.fields().include(fieldName(QApplication.application.id));
        return mongoOperations.find(query, Application.class)
                .map(BaseDomain::getId)
                .collectList();
    }

    @Override
    public Mono<Long> countByWorkspaceId(String workspaceId) {
        Criteria workspaceIdCriteria = where(fieldName(QApplication.application.workspaceId)).is(workspaceId);
        return this.count(List.of(workspaceIdCriteria));
    }

    @Override
    public Mono<Long> getGitConnectedApplicationWithPrivateRepoCount(String workspaceId) {
        String gitApplicationMetadata = fieldName(QApplication.application.gitApplicationMetadata);
        Query query = new Query();
        query.addCriteria(where(fieldName(QApplication.application.workspaceId)).is(workspaceId));
        query.addCriteria(where(gitApplicationMetadata + "." + fieldName(QApplication.application.gitApplicationMetadata.isRepoPrivate)).is(Boolean.TRUE));
        query.addCriteria(notDeleted());
        return mongoOperations.count(query, Application.class);
    }

    @Override
    public Flux<Application> getGitConnectedApplicationByWorkspaceId(String workspaceId) {
        String gitApplicationMetadata = fieldName(QApplication.application.gitApplicationMetadata);
        // isRepoPrivate and gitAuth will be stored only with default application which ensures we will have only single
        // application per repo
        Criteria repoCriteria = where(gitApplicationMetadata + "." + fieldName(QApplication.application.gitApplicationMetadata.isRepoPrivate)).exists(Boolean.TRUE);
        Criteria gitAuthCriteria = where(gitApplicationMetadata + "." + fieldName(QApplication.application.gitApplicationMetadata.gitAuth)).exists(Boolean.TRUE);
        Criteria workspaceIdCriteria = where(fieldName(QApplication.application.workspaceId)).is(workspaceId);
        return queryAll(List.of(workspaceIdCriteria, repoCriteria, gitAuthCriteria), AclPermission.MANAGE_APPLICATIONS);
    }

    @Override
    public Mono<Application> getApplicationByDefaultApplicationIdAndDefaultBranch(String defaultApplicationId) {
        String gitApplicationMetadata = fieldName(QApplication.application.gitApplicationMetadata);

        Query query = new Query();
        query.addCriteria(where(gitApplicationMetadata + "." + fieldName(QApplication.application.gitApplicationMetadata.defaultApplicationId)).is(defaultApplicationId));
        query.addCriteria(where(fieldName(QApplication.application.deleted)).ne(true));
        query.equals(where("this." + gitApplicationMetadata + "." + fieldName(QApplication.application.gitApplicationMetadata.branchName))
                .equals("this." +gitApplicationMetadata + "." + fieldName(QApplication.application.gitApplicationMetadata.defaultBranchName)));

        return mongoOperations.findOne(query,Application.class);
    }

    @Override
    public Mono<UpdateResult> setAppTheme(String applicationId, String editModeThemeId, String publishedModeThemeId, AclPermission aclPermission) {
        Update updateObj = new Update();
        if(StringUtils.hasLength(editModeThemeId)) {
            updateObj = updateObj.set(fieldName(QApplication.application.editModeThemeId), editModeThemeId);
        }
        if(StringUtils.hasLength(publishedModeThemeId)) {
            updateObj = updateObj.set(fieldName(QApplication.application.publishedModeThemeId), publishedModeThemeId);
        }

        return this.updateById(applicationId, updateObj, aclPermission);
    }
}

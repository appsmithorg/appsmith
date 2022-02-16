package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
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

    @Autowired
    public CustomApplicationRepositoryCEImpl(@NonNull ReactiveMongoOperations mongoOperations,
                                             @NonNull MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    protected Criteria getIdCriteria(Object id) {
        return where(fieldName(QApplication.application.id)).is(id);
    }

    @Override
    public Mono<Application> findByIdAndOrganizationId(String id, String orgId, AclPermission permission) {
        Criteria orgIdCriteria = where(fieldName(QApplication.application.organizationId)).is(orgId);
        Criteria idCriteria = getIdCriteria(id);

        return queryOne(List.of(idCriteria, orgIdCriteria), permission);
    }

    @Override
    public Mono<Application> findByName(String name, AclPermission permission) {
        Criteria nameCriteria = where(fieldName(QApplication.application.name)).is(name);
        return queryOne(List.of(nameCriteria), permission);
    }

    @Override
    public Flux<Application> findByOrganizationId(String orgId, AclPermission permission) {
        Criteria orgIdCriteria = where(fieldName(QApplication.application.organizationId)).is(orgId);
        return queryAll(List.of(orgIdCriteria), permission);
    }

    @Override
    public Flux<Application> findByMultipleOrganizationIds(Set<String> orgIds, AclPermission permission) {
        Criteria orgIdsCriteria = where(fieldName(QApplication.application.organizationId)).in(orgIds);
        return queryAll(List.of(orgIdsCriteria), permission);
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
    public Flux<Application> getApplicationByGitDefaultApplicationId(String defaultApplicationId) {
        String gitApplicationMetadata = fieldName(QApplication.application.gitApplicationMetadata);

        Criteria applicationIdCriteria = where(gitApplicationMetadata + "." + fieldName(QApplication.application.gitApplicationMetadata.defaultApplicationId)).is(defaultApplicationId);
        Criteria deletionCriteria = where(fieldName(QApplication.application.deleted)).ne(true);
        return queryAll(List.of(applicationIdCriteria, deletionCriteria), AclPermission.MANAGE_APPLICATIONS);
    }

    /**
     * Returns a list of application ids which are under the organization with provided organizationId
     *
     * @param organizationId organization id
     * @return list of String
     */
    @Override
    public Mono<List<String>> getAllApplicationId(String organizationId) {
        Query query = new Query();
        query.addCriteria(where(fieldName(QApplication.application.organizationId)).is(organizationId));
        query.fields().include(fieldName(QApplication.application.id));
        return mongoOperations.find(query, Application.class)
                .map(BaseDomain::getId)
                .collectList();
    }

    @Override
    public Mono<Long> countByOrganizationId(String organizationId) {
        Criteria orgIdCriteria = where(fieldName(QApplication.application.organizationId)).is(organizationId);
        return this.count(List.of(orgIdCriteria));
    }

    @Override
    public Mono<Long> getGitConnectedApplicationWithPrivateRepoCount(String organizationId) {
        String gitApplicationMetadata = fieldName(QApplication.application.gitApplicationMetadata);
        Query query = new Query();
        query.addCriteria(where(fieldName(QApplication.application.organizationId)).is(organizationId));
        query.addCriteria(where(gitApplicationMetadata + "." + fieldName(QApplication.application.gitApplicationMetadata.isRepoPrivate)).is(Boolean.TRUE));
        query.addCriteria(notDeleted());
        return mongoOperations.count(query, Application.class);
    }

    @Override
    public Flux<Application> getGitConnectedApplicationByOrganizationId(String organizationId) {
        String gitApplicationMetadata = fieldName(QApplication.application.gitApplicationMetadata);
        // isRepoPrivate and gitAuth will be stored only with default application which ensures we will have only single
        // application per repo
        Criteria repoCriteria = where(gitApplicationMetadata + "." + fieldName(QApplication.application.gitApplicationMetadata.isRepoPrivate)).exists(Boolean.TRUE);
        Criteria gitAuthCriteria = where(gitApplicationMetadata + "." + fieldName(QApplication.application.gitApplicationMetadata.gitAuth)).exists(Boolean.TRUE);
        Criteria organizationIdCriteria = where(fieldName(QApplication.application.organizationId)).is(organizationId);
        return queryAll(List.of(organizationIdCriteria, repoCriteria, gitAuthCriteria), AclPermission.MANAGE_APPLICATIONS);
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

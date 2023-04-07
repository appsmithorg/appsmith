package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.QBranchAwareDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.QActionCollection;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomActionCollectionRepositoryCEImpl extends BaseAppsmithRepositoryImpl<ActionCollection>
        implements CustomActionCollectionRepositoryCE {

    public CustomActionCollectionRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }


    @Override
    @Deprecated
    public Flux<ActionCollection> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort) {

        Criteria applicationCriteria = where(fieldName(QActionCollection.actionCollection.applicationId)).is(applicationId);

        return queryAll(List.of(applicationCriteria), aclPermission, sort);
    }

    @Override
    public Flux<ActionCollection> findByApplicationId(String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort) {

        Criteria applicationCriteria = where(fieldName(QActionCollection.actionCollection.applicationId)).is(applicationId);

        return queryAll(List.of(applicationCriteria), aclPermission, sort);
    }

    @Override
    public Flux<ActionCollection> findByApplicationIdAndViewMode(String applicationId, boolean viewMode, AclPermission aclPermission) {

        List<Criteria> criteria = new ArrayList<>();

        Criteria applicationCriterion = where(fieldName(QActionCollection.actionCollection.applicationId)).is(applicationId);
        criteria.add(applicationCriterion);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriterion = where(fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + fieldName(QActionCollection.actionCollection.unpublishedCollection.deletedAt)).is(null);
            criteria.add(deletedCriterion);
        }

        return queryAll(criteria, aclPermission);

    }

    @Override
    public Flux<ActionCollection> findAllActionCollectionsByNamePageIdsViewModeAndBranch(String name, List<String> pageIds, boolean viewMode, String branchName, AclPermission aclPermission, Sort sort) {
        /**
         * TODO : This function is called by get(params) to get all actions by params and hence
         * only covers criteria of few fields like page id, name, etc. Make this generic to cover
         * all possible fields
         */

        List<Criteria> criteriaList = new ArrayList<>();

        if (!StringUtils.isEmpty(branchName)) {
            criteriaList.add(where(FieldName.DEFAULT_RESOURCES + "." + FieldName.BRANCH_NAME).is(branchName));
        }

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QActionCollection.actionCollection.publishedCollection) + "." + fieldName(QActionCollection.actionCollection.publishedCollection.name)).is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QActionCollection.actionCollection.publishedCollection) + "." + fieldName(QActionCollection.actionCollection.publishedCollection.pageId)).in(pageIds);
                criteriaList.add(pageCriteria);
            }
        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + fieldName(QActionCollection.actionCollection.unpublishedCollection.name)).is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + fieldName(QActionCollection.actionCollection.unpublishedCollection.pageId)).in(pageIds);
                criteriaList.add(pageCriteria);
            }

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria = where(fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + fieldName(QActionCollection.actionCollection.unpublishedCollection.deletedAt)).is(null);
            criteriaList.add(deletedCriteria);
        }

        return queryAll(criteriaList, aclPermission, sort);
    }

    @Override
    public Flux<ActionCollection> findByPageId(String pageId, AclPermission aclPermission) {
        String unpublishedPage = fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + fieldName(QActionCollection.actionCollection.unpublishedCollection.pageId);
        String publishedPage = fieldName(QActionCollection.actionCollection.publishedCollection) + "." + fieldName(QActionCollection.actionCollection.publishedCollection.pageId);

        Criteria pageCriteria = new Criteria().orOperator(
                where(unpublishedPage).is(pageId),
                where(publishedPage).is(pageId)
        );

        return queryAll(List.of(pageCriteria), aclPermission);
    }

    @Override
    public Flux<ActionCollection> findByPageId(String pageId) {
        return this.findByPageId(pageId, null);
    }

    @Override
    public Mono<ActionCollection> findByBranchNameAndDefaultCollectionId(String branchName, String defaultCollectionId, AclPermission permission) {
        final String defaultResources = fieldName(QActionCollection.actionCollection.defaultResources);
        Criteria defaultCollectionIdCriteria = where(defaultResources + "." + FieldName.COLLECTION_ID).is(defaultCollectionId);
        Criteria branchCriteria = where(defaultResources + "." + FieldName.BRANCH_NAME).is(branchName);
        return queryOne(List.of(defaultCollectionIdCriteria, branchCriteria), permission);
    }

    @Override
    public Mono<ActionCollection> findByGitSyncIdAndDefaultApplicationId(String defaultApplicationId, String gitSyncId, AclPermission permission) {
        return findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, Optional.ofNullable(permission));
    }

    @Override
    public Mono<ActionCollection> findByGitSyncIdAndDefaultApplicationId(String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission) {
        final String defaultResources = fieldName(QBranchAwareDomain.branchAwareDomain.defaultResources);
        Criteria defaultAppIdCriteria = where(defaultResources + "." + FieldName.APPLICATION_ID).is(defaultApplicationId);
        Criteria gitSyncIdCriteria = where(FieldName.GIT_SYNC_ID).is(gitSyncId);
        return queryFirst(List.of(defaultAppIdCriteria, gitSyncIdCriteria), permission);
    }
    
    @Override
    public Flux<ActionCollection> findByListOfPageIds(List<String> pageIds, AclPermission permission) {
        Criteria pageIdCriteria = where(
                fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." +
                        fieldName(QActionCollection.actionCollection.unpublishedCollection.pageId)).in(pageIds);
        return queryAll(List.of(pageIdCriteria), permission);
    }

    @Override
    public Flux<ActionCollection> findByListOfPageIds(List<String> pageIds, Optional<AclPermission> permission) {
        Criteria pageIdCriteria = where(
                fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." +
                        fieldName(QActionCollection.actionCollection.unpublishedCollection.pageId)).in(pageIds);
        return queryAll(List.of(pageIdCriteria), permission);
    }
}

package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.dtos.ActionCollectionDTO;
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

    public CustomActionCollectionRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    @Deprecated
    public Flux<ActionCollection> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort) {

        Criteria applicationCriteria =
                where(ActionCollection.Fields.applicationId).is(applicationId);

        return queryBuilder()
                .criteria(applicationCriteria)
                .permission(aclPermission)
                .sort(sort)
                .all();
    }

    @Override
    public Flux<ActionCollection> findByApplicationId(
            String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort) {

        List<Criteria> criteria = new ArrayList<>();

        Criteria applicationCriteria = Criteria.where(FieldName.APPLICATION_ID).is(applicationId);
        criteria.add(applicationCriteria);

        Criteria deletedCriteria =
                where(ActionCollection.Fields.unpublishedCollection_deletedAt).is(null);
        criteria.add(deletedCriteria);

        return queryBuilder()
                .criteria(criteria)
                .permission(aclPermission.orElse(null))
                .sort(sort.orElse(null))
                .all();
    }

    protected List<Criteria> getCriteriaForFindByApplicationIdAndViewMode(String applicationId, boolean viewMode) {
        List<Criteria> criteria = new ArrayList<>();

        Criteria applicationCriterion =
                where(ActionCollection.Fields.applicationId).is(applicationId);
        criteria.add(applicationCriterion);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriterion = where(ActionCollection.Fields.unpublishedCollection_deletedAt)
                    .is(null);
            criteria.add(deletedCriterion);
        }
        return criteria;
    }

    @Override
    public Flux<ActionCollection> findByApplicationIdAndViewMode(
            String applicationId, boolean viewMode, AclPermission aclPermission) {

        List<Criteria> criteria = this.getCriteriaForFindByApplicationIdAndViewMode(applicationId, viewMode);

        return queryBuilder().criteria(criteria).permission(aclPermission).all();
    }

    protected List<Criteria> getCriteriaForFindAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(
            String branchName, boolean viewMode, String name, List<String> pageIds) {
        /**
         * TODO : This function is called by get(params) to get all actions by params and hence
         * only covers criteria of few fields like page id, name, etc. Make this generic to cover
         * all possible fields
         */
        List<Criteria> criteriaList = new ArrayList<>();

        if (!StringUtils.isEmpty(branchName)) {
            criteriaList.add(where(FieldName.DEFAULT_RESOURCES + "." + FieldName.BRANCH_NAME)
                    .is(branchName));
        }

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {

            if (name != null) {
                Criteria nameCriteria =
                        where(ActionCollection.Fields.publishedCollection_name).is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                String pageIdFieldPath = String.join(
                        ".",
                        ActionCollection.Fields.publishedCollection,
                        ActionCollectionDTO.Fields.defaultResources,
                        DefaultResources.Fields.pageId);
                Criteria pageCriteria = where(pageIdFieldPath).in(pageIds);
                criteriaList.add(pageCriteria);
            }
        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                Criteria nameCriteria = where(ActionCollection.Fields.unpublishedCollection_name)
                        .is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                String pageIdFieldPath = String.join(
                        ".",
                        ActionCollection.Fields.unpublishedCollection,
                        ActionCollectionDTO.Fields.defaultResources,
                        DefaultResources.Fields.pageId);
                Criteria pageCriteria = where(pageIdFieldPath).in(pageIds);
                criteriaList.add(pageCriteria);
            }

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria = where(ActionCollection.Fields.unpublishedCollection_deletedAt)
                    .is(null);
            criteriaList.add(deletedCriteria);
        }
        return criteriaList;
    }

    @Override
    public Flux<ActionCollection> findAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(
            String name,
            List<String> pageIds,
            boolean viewMode,
            String branchName,
            AclPermission aclPermission,
            Sort sort) {
        List<Criteria> criteriaList = this.getCriteriaForFindAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(
                branchName, viewMode, name, pageIds);

        return queryBuilder()
                .criteria(criteriaList)
                .permission(aclPermission)
                .sort(sort)
                .all();
    }

    @Override
    public Flux<ActionCollection> findByPageId(String pageId, AclPermission aclPermission) {
        String unpublishedPage = ActionCollection.Fields.unpublishedCollection_pageId;
        String publishedPage = ActionCollection.Fields.publishedCollection_pageId;

        Criteria pageCriteria = new Criteria()
                .orOperator(
                        where(unpublishedPage).is(pageId), where(publishedPage).is(pageId));

        return queryBuilder().criteria(pageCriteria).permission(aclPermission).all();
    }

    @Override
    public Flux<ActionCollection> findByPageId(String pageId) {
        return this.findByPageId(pageId, null);
    }

    @Override
    public Mono<ActionCollection> findByBranchNameAndDefaultCollectionId(
            String branchName, String defaultCollectionId, AclPermission permission) {
        final String defaultResources = ActionCollection.Fields.defaultResources;
        Criteria defaultCollectionIdCriteria =
                where(defaultResources + "." + FieldName.COLLECTION_ID).is(defaultCollectionId);
        Criteria branchCriteria =
                where(defaultResources + "." + FieldName.BRANCH_NAME).is(branchName);
        return queryBuilder()
                .criteria(defaultCollectionIdCriteria, branchCriteria)
                .permission(permission)
                .one();
    }

    @Override
    public Mono<ActionCollection> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, AclPermission permission) {
        return findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, Optional.ofNullable(permission));
    }

    @Override
    public Mono<ActionCollection> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission) {
        final String defaultResources = BranchAwareDomain.Fields.defaultResources;
        Criteria defaultAppIdCriteria =
                where(defaultResources + "." + FieldName.APPLICATION_ID).is(defaultApplicationId);
        Criteria gitSyncIdCriteria = where(FieldName.GIT_SYNC_ID).is(gitSyncId);
        return queryBuilder()
                .criteria(defaultAppIdCriteria, gitSyncIdCriteria)
                .permission(permission.orElse(null))
                .first();
    }

    @Override
    public Flux<ActionCollection> findByDefaultApplicationId(
            String defaultApplicationId, Optional<AclPermission> permission) {
        List<Criteria> criteria = new ArrayList<>();

        final String defaultResources = BranchAwareDomain.Fields.defaultResources;
        Criteria defaultAppIdCriteria =
                where(defaultResources + "." + FieldName.APPLICATION_ID).is(defaultApplicationId);
        criteria.add(defaultAppIdCriteria);

        Criteria deletedCriteria =
                where(ActionCollection.Fields.unpublishedCollection_deletedAt).is(null);
        criteria.add(deletedCriteria);

        return queryBuilder()
                .criteria(criteria)
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    public Flux<ActionCollection> findByPageIds(List<String> pageIds, AclPermission permission) {
        Criteria pageIdCriteria =
                where(ActionCollection.Fields.unpublishedCollection_pageId).in(pageIds);
        return queryBuilder().criteria(pageIdCriteria).permission(permission).all();
    }

    @Override
    public Flux<ActionCollection> findByPageIds(List<String> pageIds, Optional<AclPermission> permission) {
        Criteria pageIdCriteria =
                where(ActionCollection.Fields.unpublishedCollection_pageId).in(pageIds);
        return queryBuilder()
                .criteria(pageIdCriteria)
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    public Flux<ActionCollection> findAllByApplicationIds(List<String> applicationIds, List<String> includeFields) {

        Criteria applicationCriteria = Criteria.where(FieldName.APPLICATION_ID).in(applicationIds);

        return queryBuilder()
                .criteria(applicationCriteria)
                .fields(includeFields)
                .all();
    }

    @Override
    public Flux<ActionCollection> findAllUnpublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission) {
        String contextIdPath = ActionCollection.Fields.unpublishedCollection_pageId;
        String contextTypePath = ActionCollection.Fields.unpublishedCollection_contextType;
        Criteria contextIdAndContextTypeCriteria =
                where(contextIdPath).is(contextId).and(contextTypePath).is(contextType);
        return queryBuilder()
                .criteria(contextIdAndContextTypeCriteria)
                .permission(permission)
                .all();
    }

    @Override
    public Flux<ActionCollection> findAllPublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission) {
        String contextIdPath = ActionCollection.Fields.publishedCollection_pageId;
        String contextTypePath = ActionCollection.Fields.publishedCollection_contextType;
        Criteria contextIdAndContextTypeCriteria =
                where(contextIdPath).is(contextId).and(contextTypePath).is(contextType);
        return queryBuilder()
                .criteria(contextIdAndContextTypeCriteria)
                .permission(permission)
                .all();
    }

    @Override
    public Flux<ActionCollection> findByPageIdAndViewMode(String pageId, boolean viewMode, AclPermission permission) {
        List<Criteria> criteria = new ArrayList<>();

        Criteria pageCriterion;

        // Fetch published action collections
        if (Boolean.TRUE.equals(viewMode)) {
            pageCriterion =
                    where(ActionCollection.Fields.publishedCollection_pageId).is(pageId);
            criteria.add(pageCriterion);
        }
        // Fetch unpublished action collections
        else {
            pageCriterion =
                    where(ActionCollection.Fields.unpublishedCollection_pageId).is(pageId);
            criteria.add(pageCriterion);

            // In case an action collection has been deleted in edit mode, but still exists in deployed mode,
            // ActionCollection object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria = where(ActionCollection.Fields.unpublishedCollection_deletedAt)
                    .is(null);
            criteria.add(deletedCriteria);
        }
        return queryBuilder().criteria(criteria).permission(permission).all();
    }
}

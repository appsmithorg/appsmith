package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.QActionCollection;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.appsmith.server.helpers.ce.bridge.Bridge.bridge;
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
    public List<ActionCollection> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort) {
        return queryBuilder()
                .criteria(bridge().equal(fieldName(QActionCollection.actionCollection.applicationId), applicationId))
                .permission(aclPermission)
                .sort(sort)
                .all();
    }

    @Override
    public List<ActionCollection> findByApplicationId(
            String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort) {

        Criteria applicationCriteria = where(fieldName(QActionCollection.actionCollection.applicationId))
                .is(applicationId);

        return queryBuilder()
                .criteria(applicationCriteria)
                .permission(aclPermission.orElse(null))
                .sort(sort.orElse(null))
                .all();
    }

    protected List<Criteria> getCriteriaForFindByApplicationIdAndViewMode(String applicationId, boolean viewMode) {
        List<Criteria> criteria = new ArrayList<>();

        Criteria applicationCriterion = where(fieldName(QActionCollection.actionCollection.applicationId))
                .is(applicationId);
        criteria.add(applicationCriterion);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriterion = where(
                            fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + "deletedAt")
                    .is(null);
            criteria.add(deletedCriterion);
        }
        return criteria;
    }

    @Override
    public List<ActionCollection> findByApplicationIdAndViewMode(
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
                Criteria nameCriteria = where(
                                fieldName(QActionCollection.actionCollection.publishedCollection) + "." + "name")
                        .is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                String pageIdFieldPath = String.format(
                        "%s.%s.%s",
                        fieldName(QActionCollection.actionCollection.publishedCollection),
                        "defaultResources",
                        "pageId");
                Criteria pageCriteria = where(pageIdFieldPath).in(pageIds);
                criteriaList.add(pageCriteria);
            }
        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                Criteria nameCriteria = where(
                                fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + "name")
                        .is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                String pageIdFieldPath = String.format(
                        "%s.%s.%s",
                        fieldName(QActionCollection.actionCollection.unpublishedCollection),
                        "defaultResources",
                        "pageId");
                Criteria pageCriteria = where(pageIdFieldPath).in(pageIds);
                criteriaList.add(pageCriteria);
            }

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria = where(
                            fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + "deletedAt")
                    .is(null);
            criteriaList.add(deletedCriteria);
        }
        return criteriaList;
    }

    @Override
    public List<ActionCollection> findAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(
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
    public List<ActionCollection> findByPageId(String pageId, AclPermission aclPermission) {
        String unpublishedPage = "unpublishedCollection" + "." + "pageId";
        String publishedPage = "publishedCollection" + "." + "pageId";

        Criteria pageCriteria = new Criteria()
                .orOperator(
                        where(unpublishedPage).is(pageId), where(publishedPage).is(pageId));

        return queryBuilder().criteria(pageCriteria).permission(aclPermission).all();
    }

    @Override
    public List<ActionCollection> findByPageId(String pageId) {
        return this.findByPageId(pageId, null);
    }

    @Override
    public Optional<ActionCollection> findByBranchNameAndDefaultCollectionId(
            String branchName, String defaultCollectionId, AclPermission permission) {
        final String defaultResources = fieldName(QActionCollection.actionCollection.defaultResources);
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
    public Optional<ActionCollection> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, AclPermission permission) {
        return findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, Optional.ofNullable(permission));
    }

    @Override
    public Optional<ActionCollection> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission) {
        final String defaultResources = fieldName(QActionCollection.actionCollection.defaultResources);
        Criteria defaultAppIdCriteria =
                where(defaultResources + "." + FieldName.APPLICATION_ID).is(defaultApplicationId);
        Criteria gitSyncIdCriteria = where(FieldName.GIT_SYNC_ID).is(gitSyncId);
        return queryBuilder()
                .criteria(defaultAppIdCriteria, gitSyncIdCriteria)
                .permission(permission.orElse(null))
                .first();
    }

    @Override
    public List<ActionCollection> findByDefaultApplicationId(
            String defaultApplicationId, Optional<AclPermission> permission) {
        final String defaultResources = fieldName(QActionCollection.actionCollection.defaultResources);
        return queryBuilder()
                .criteria(bridge().equal(defaultResources + "." + FieldName.APPLICATION_ID, defaultApplicationId))
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    public List<ActionCollection> findByPageIds(List<String> pageIds, AclPermission permission) {
        return queryBuilder()
                .criteria(bridge().in(
                                fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + "pageId",
                                pageIds))
                .permission(permission)
                .all();
    }

    @Override
    public List<ActionCollection> findByPageIds(List<String> pageIds, Optional<AclPermission> permission) {
        return findByPageIds(pageIds, permission.orElse(null));
    }

    @Override
    public List<ActionCollection> findAllByApplicationIds(List<String> applicationIds, List<String> includeFields) {
        return queryBuilder()
                .criteria(bridge().in(FieldName.APPLICATION_ID, applicationIds))
                .fields(includeFields)
                .all();
    }

    @Override
    public List<ActionCollection> findAllUnpublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission) {
        String contextIdPath = "unpublishedCollection" + "." + "pageId";
        String contextTypePath = "unpublishedCollection" + "." + "contextType";
        Criteria contextIdAndContextTypeCriteria =
                where(contextIdPath).is(contextId).and(contextTypePath).is(contextType);
        return queryBuilder()
                .criteria(contextIdAndContextTypeCriteria)
                .permission(permission)
                .all();
    }

    @Override
    public List<ActionCollection> findAllPublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission) {
        String contextIdPath = "publishedCollection" + "." + "pageId";
        String contextTypePath = "publishedCollection" + "." + "contextType";
        Criteria contextIdAndContextTypeCriteria =
                where(contextIdPath).is(contextId).and(contextTypePath).is(contextType);
        return queryBuilder()
                .criteria(contextIdAndContextTypeCriteria)
                .permission(permission)
                .all();
    }

    @Override
    public List<ActionCollection> findByPageIdAndViewMode(String pageId, boolean viewMode, AclPermission permission) {
        Bridge<? extends BaseDomain> spec;

        // Fetch published action collections
        if (Boolean.TRUE.equals(viewMode)) {
            spec = bridge().equal("publishedCollection.pageId", pageId);
        }
        // Fetch unpublished action collections
        else {
            spec = bridge().equal("unpublishedCollection.pageId", pageId)
                    // In case an action collection has been deleted in edit mode, but still exists in deployed mode,
                    // ActionCollection object
                    // would exist. To handle this, only fetch non-deleted actions
                    .isNull("unpublishedCollection.deletedAt");
        }
        return queryBuilder().criteria(spec).permission(permission).all();
    }
}

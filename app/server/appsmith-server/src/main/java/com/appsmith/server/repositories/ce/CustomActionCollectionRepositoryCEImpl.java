package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

import static com.appsmith.external.helpers.StringUtils.dotted;

public class CustomActionCollectionRepositoryCEImpl extends BaseAppsmithRepositoryImpl<ActionCollection>
        implements CustomActionCollectionRepositoryCE {

    @Override
    @Deprecated
    public List<ActionCollection> findByApplicationId(
            String applicationId, Sort sort, AclPermission permission, User currentUser) {
        final BridgeQuery<ActionCollection> bridgeQuery =
                Bridge.equal(ActionCollection.Fields.applicationId, applicationId);

        return queryBuilder()
                .criteria(bridgeQuery)
                .permission(permission, currentUser)
                .sort(sort)
                .all();
    }

    @Override
    public List<ActionCollection> findByApplicationId(
            String applicationId, Optional<Sort> sort, Optional<AclPermission> permission, User currentUser) {

        final BridgeQuery<ActionCollection> bridgeQuery = Bridge.<ActionCollection>equal(
                        ActionCollection.Fields.applicationId, applicationId)
                .isNull(ActionCollection.Fields.unpublishedCollection_deletedAt);

        return queryBuilder()
                .criteria(bridgeQuery)
                .permission(permission.orElse(null), currentUser)
                .sort(sort.orElse(null))
                .all();
    }

    protected BridgeQuery<ActionCollection> getBridgeQueryForFindByApplicationIdAndViewMode(
            String applicationId, boolean viewMode) {
        final BridgeQuery<ActionCollection> bridgeQuery =
                Bridge.equal(ActionCollection.Fields.applicationId, applicationId);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            bridgeQuery.isNull(ActionCollection.Fields.unpublishedCollection_deletedAt);
        }

        return bridgeQuery;
    }

    @Override
    public List<ActionCollection> findByApplicationIdAndViewMode(
            String applicationId, boolean viewMode, AclPermission permission, User currentUser) {
        BridgeQuery<ActionCollection> bridgeQuery =
                getBridgeQueryForFindByApplicationIdAndViewMode(applicationId, viewMode);

        return queryBuilder()
                .criteria(bridgeQuery)
                .permission(permission, currentUser)
                .all();
    }

    /**
     * Keeping it here temporarily till EE file is migrated because EE file uses it. It will be removed as part of the
     * EE PR.
     */
    protected BridgeQuery<ActionCollection>
            getBridgeQueryForFindAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(
                    String branchName, boolean viewMode, String name, List<String> pageIds) {
        /**
         * TODO : This function is called by get(params) to get all actions by params and hence
         * only covers criteria of few fields like page id, name, etc. Make this generic to cover
         * all possible fields
         */
        BridgeQuery<ActionCollection> bridgeQuery = Bridge.query();
        if (!StringUtils.isEmpty(branchName)) {
            bridgeQuery.equal(ActionCollection.Fields.defaultResources_branchName, branchName);
        }

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {

            if (name != null) {
                bridgeQuery.equal(ActionCollection.Fields.publishedCollection_name, name);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                String pageIdFieldPath = dotted(
                        ActionCollection.Fields.publishedCollection,
                        ActionCollectionDTO.Fields.defaultResources,
                        DefaultResources.Fields.pageId);
                bridgeQuery.in(pageIdFieldPath, pageIds);
            }
        }
        // Fetch unpublished actions
        else {
            if (name != null) {
                bridgeQuery.equal(ActionCollection.Fields.unpublishedCollection_name, name);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                String pageIdFieldPath = dotted(
                        ActionCollection.Fields.unpublishedCollection,
                        ActionCollectionDTO.Fields.defaultResources,
                        DefaultResources.Fields.pageId);
                bridgeQuery.in(pageIdFieldPath, pageIds);
            }

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            bridgeQuery.isNull(ActionCollection.Fields.unpublishedCollection_deletedAt);
        }

        return bridgeQuery;
    }

    @Override
    public List<ActionCollection> findAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(
            String name,
            List<String> pageIds,
            boolean viewMode,
            String branchName,
            Sort sort,
            AclPermission permission,
            User currentUser) {
        BridgeQuery<ActionCollection> criteriaList =
                this.getBridgeQueryForFindAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(
                        branchName, viewMode, name, pageIds);

        return queryBuilder()
                .criteria(criteriaList)
                .permission(permission, currentUser)
                .sort(sort)
                .all();
    }

    @Override
    public List<ActionCollection> findByPageId(String pageId, AclPermission permission, User currentUser) {
        String unpublishedPage = ActionCollection.Fields.unpublishedCollection_pageId;
        String publishedPage = ActionCollection.Fields.publishedCollection_pageId;

        BridgeQuery<ActionCollection> bridgeQuery =
                Bridge.or(Bridge.equal(unpublishedPage, pageId), Bridge.equal(publishedPage, pageId));

        return queryBuilder()
                .criteria(bridgeQuery)
                .permission(permission, currentUser)
                .all();
    }

    @Override
    public List<ActionCollection> findByPageId(String pageId) {
        return this.findByPageId(pageId, null, null);
    }

    @Override
    public Optional<ActionCollection> findByBranchNameAndDefaultCollectionId(
            String branchName, String defaultCollectionId, AclPermission permission, User currentUser) {
        final BridgeQuery<ActionCollection> bq = Bridge.<ActionCollection>equal(
                        ActionCollection.Fields.defaultResources_collectionId, defaultCollectionId)
                .equal(ActionCollection.Fields.defaultResources_branchName, branchName);

        return queryBuilder().criteria(bq).permission(permission, currentUser).one();
    }

    @Override
    public List<ActionCollection> findByDefaultApplicationId(
            String defaultApplicationId, AclPermission permission, User currentUser) {
        BridgeQuery<ActionCollection> query = Bridge.<ActionCollection>equal(
                        BranchAwareDomain.Fields.defaultResources_applicationId, defaultApplicationId)
                .isNull(ActionCollection.Fields.unpublishedCollection_deletedAt);

        return queryBuilder()
                .criteria(query)
                .permission(permission, currentUser)
                .all();
    }

    @Override
    public List<ActionCollection> findByPageIds(List<String> pageIds, AclPermission permission, User currentUser) {
        BridgeQuery<ActionCollection> pageIdCriteria =
                Bridge.in(ActionCollection.Fields.unpublishedCollection_pageId, pageIds);
        return queryBuilder()
                .criteria(pageIdCriteria)
                .permission(permission, currentUser)
                .all();
    }

    @Override
    public List<ActionCollection> findAllByApplicationIds(List<String> applicationIds, List<String> includeFields) {
        BridgeQuery<ActionCollection> applicationCriteria = Bridge.in(FieldName.APPLICATION_ID, applicationIds);
        return queryBuilder()
                .criteria(Bridge.in(FieldName.APPLICATION_ID, applicationIds))
                .fields(includeFields)
                .all();
    }

    @Override
    public List<ActionCollection> findAllUnpublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, User currentUser) {
        String contextIdPath = ActionCollection.Fields.unpublishedCollection_pageId;
        String contextTypePath = ActionCollection.Fields.unpublishedCollection_contextType;
        BridgeQuery<ActionCollection> contextIdAndContextTypeCriteria =
                Bridge.<ActionCollection>equal(contextIdPath, contextId).equal(contextTypePath, contextType);
        return queryBuilder()
                .criteria(contextIdAndContextTypeCriteria)
                .permission(permission, currentUser)
                .all();
    }

    @Override
    public List<ActionCollection> findAllPublishedActionCollectionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, User currentUser) {
        String contextIdPath = ActionCollection.Fields.publishedCollection_pageId;
        String contextTypePath = ActionCollection.Fields.publishedCollection_contextType;
        BridgeQuery<ActionCollection> contextIdAndContextTypeCriteria =
                Bridge.<ActionCollection>equal(contextIdPath, contextId).equal(contextTypePath, contextType);
        return queryBuilder()
                .criteria(contextIdAndContextTypeCriteria)
                .permission(permission, currentUser)
                .all();
    }

    @Override
    public List<ActionCollection> findByPageIdAndViewMode(
            String pageId, boolean viewMode, AclPermission permission, User currentUser) {
        final BridgeQuery<ActionCollection> query = Bridge.query();

        if (Boolean.TRUE.equals(viewMode)) {
            // Fetch published action collections
            query.equal(ActionCollection.Fields.publishedCollection_pageId, pageId);

        } else {
            // Fetch unpublished action collections
            query.equal(ActionCollection.Fields.unpublishedCollection_pageId, pageId);

            // In case an action collection has been deleted in edit mode, but still exists in deployed mode,
            // ActionCollection object
            // would exist. To handle this, only fetch non-deleted actions
            query.isNull(ActionCollection.Fields.unpublishedCollection_deletedAt);
        }

        return queryBuilder()
                .criteria(query)
                .permission(permission, currentUser)
                .all();
    }
}

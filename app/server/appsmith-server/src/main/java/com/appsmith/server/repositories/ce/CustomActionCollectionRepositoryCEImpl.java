package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Optional;

public class CustomActionCollectionRepositoryCEImpl extends BaseAppsmithRepositoryImpl<ActionCollection>
        implements CustomActionCollectionRepositoryCE {

    @Override
    @Deprecated
    public Flux<ActionCollection> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort) {
        final BridgeQuery<ActionCollection> bridgeQuery =
                Bridge.equal(ActionCollection.Fields.applicationId, applicationId);

        return queryBuilder()
                .criteria(bridgeQuery)
                .permission(aclPermission)
                .sort(sort)
                .all();
    }

    @Override
    public Flux<ActionCollection> findByApplicationId(
            String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort) {

        final BridgeQuery<ActionCollection> bridgeQuery = Bridge.<ActionCollection>equal(
                        ActionCollection.Fields.applicationId, applicationId)
                .isNull(ActionCollection.Fields.unpublishedCollection_deletedAt);

        return queryBuilder()
                .criteria(bridgeQuery)
                .permission(aclPermission.orElse(null))
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
    public Flux<ActionCollection> findNonComposedByApplicationIdAndViewMode(
            String applicationId, boolean viewMode, AclPermission aclPermission) {
        BridgeQuery<ActionCollection> bridgeQuery =
                getBridgeQueryForFindByApplicationIdAndViewMode(applicationId, viewMode);

        return queryBuilder().criteria(bridgeQuery).permission(aclPermission).all();
    }

    @Override
    public Flux<ActionCollection> findByPageId(String pageId, AclPermission aclPermission) {
        String unpublishedPage = ActionCollection.Fields.unpublishedCollection_pageId;
        String publishedPage = ActionCollection.Fields.publishedCollection_pageId;

        BridgeQuery<ActionCollection> bridgeQuery =
                Bridge.or(Bridge.equal(unpublishedPage, pageId), Bridge.equal(publishedPage, pageId));

        return queryBuilder().criteria(bridgeQuery).permission(aclPermission).all();
    }

    @Override
    public Flux<ActionCollection> findByPageId(String pageId) {
        return this.findByPageId(pageId, null);
    }

    @Override
    public Flux<ActionCollection> findByPageIds(List<String> pageIds, AclPermission permission) {
        BridgeQuery<ActionCollection> pageIdCriteria =
                Bridge.in(ActionCollection.Fields.unpublishedCollection_pageId, pageIds);
        return queryBuilder().criteria(pageIdCriteria).permission(permission).all();
    }

    @Override
    public Flux<ActionCollection> findAllByApplicationIds(List<String> applicationIds, List<String> includeFields) {
        BridgeQuery<ActionCollection> applicationCriteria = Bridge.in(FieldName.APPLICATION_ID, applicationIds);
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
        BridgeQuery<ActionCollection> contextIdAndContextTypeCriteria =
                Bridge.<ActionCollection>equal(contextIdPath, contextId).equal(contextTypePath, contextType);
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
        BridgeQuery<ActionCollection> contextIdAndContextTypeCriteria =
                Bridge.<ActionCollection>equal(contextIdPath, contextId).equal(contextTypePath, contextType);
        return queryBuilder()
                .criteria(contextIdAndContextTypeCriteria)
                .permission(permission)
                .all();
    }

    @Override
    public Flux<ActionCollection> findByPageIdAndViewMode(String pageId, boolean viewMode, AclPermission permission) {
        final BridgeQuery<ActionCollection> query = getActionCollectionsByPageIdAndViewModeQuery(pageId, viewMode);

        return queryBuilder().criteria(query).permission(permission).all();
    }

    protected BridgeQuery<ActionCollection> getActionCollectionsByPageIdAndViewModeQuery(
            String pageId, boolean viewMode) {
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
        return query;
    }

    @Override
    public Flux<ActionCollection> findAllNonComposedByPageIdAndViewMode(
            String pageId, boolean viewMode, AclPermission permission) {
        return this.findByPageIdAndViewMode(pageId, viewMode, permission);
    }

    @Override
    public Flux<ActionCollection> findByApplicationId(String applicationId) {
        final BridgeQuery<ActionCollection> q = Bridge.equal(ActionCollection.Fields.applicationId, applicationId);
        return queryBuilder().criteria(q).all();
    }
}

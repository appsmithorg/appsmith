package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Modifying;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Slf4j
@RequiredArgsConstructor
public class CustomNewActionRepositoryCEImpl extends BaseAppsmithRepositoryImpl<NewAction>
        implements CustomNewActionRepositoryCE {

    @Override
    public List<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission) {
        return queryBuilder()
                .criteria(getCriterionForFindByApplicationId(applicationId))
                .permission(aclPermission)
                .all();
    }

    @Override
    public List<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission, Optional<Sort> sort) {
        return queryBuilder()
                .criteria(getCriterionForFindByApplicationId(applicationId)
                        .isNull(NewAction.Fields.unpublishedAction_deletedAt))
                .permission(aclPermission)
                .sort(sort.orElse(null))
                .all();
    }

    @Override
    public Optional<NewAction> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission aclPermission) {
        final BridgeQuery<NewAction> q = Bridge.<NewAction>equal(NewAction.Fields.unpublishedAction_name, name)
                .equal(NewAction.Fields.unpublishedAction_pageId, pageId)
                // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
                // would exist. To handle this, only fetch non-deleted actions
                .isNull(NewAction.Fields.unpublishedAction_deletedAt);

        return queryBuilder().criteria(q).permission(aclPermission).one();
    }

    @Override
    public List<NewAction> findByPageId(String pageId, AclPermission aclPermission) {
        return queryBuilder()
                .criteria(Bridge.or(
                        Bridge.equal(NewAction.Fields.unpublishedAction_pageId, pageId),
                        Bridge.equal(NewAction.Fields.publishedAction_pageId, pageId)))
                .permission(aclPermission)
                .all();
    }

    @Override
    public List<NewAction> findByPageId(String pageId) {
        return this.findByPageId(pageId, null);
    }

    @Override
    public List<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission aclPermission) {
        final BridgeQuery<NewAction> q;

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {
            q = Bridge.equal(NewAction.Fields.publishedAction_pageId, pageId);
        }
        // Fetch unpublished actions
        else {
            q = Bridge.equal(NewAction.Fields.unpublishedAction_pageId, pageId);

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            q.isNull(NewAction.Fields.unpublishedAction_deletedAt);
        }
        return queryBuilder().criteria(q).permission(aclPermission).all();
    }

    @Override
    public List<NewAction> findAllActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort) {
        return queryBuilder()
                .criteria(getCriteriaForFindAllActionsByNameAndPageIdsAndViewMode(name, pageIds, viewMode))
                .permission(aclPermission)
                .sort(sort)
                .all();
    }

    protected BridgeQuery<NewAction> getCriteriaForFindAllActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode) {
        final BridgeQuery<NewAction> q = Bridge.query();

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {

            if (name != null) {
                q.equal(NewAction.Fields.publishedAction_name, name);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                q.in(NewAction.Fields.publishedAction_pageId, pageIds);
            }
        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                q.equal(NewAction.Fields.unpublishedAction_name, name);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                q.in(NewAction.Fields.unpublishedAction_pageId, pageIds);
            }

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            q.isNull(NewAction.Fields.unpublishedAction_deletedAt);
        }

        return q;
    }

    @Override
    public List<NewAction> findUnpublishedActionsByNameInAndPageId(
            Set<String> names, String pageId, AclPermission permission) {
        BridgeQuery<NewAction> q = Bridge.equal(NewAction.Fields.unpublishedAction_pageId, pageId);

        if (names != null) {
            q.and(Bridge.or(
                    Bridge.in(NewAction.Fields.unpublishedAction_name, names),
                    Bridge.in(NewAction.Fields.unpublishedAction_fullyQualifiedName, names)));
        }

        // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would
        // exist. To handle this, only fetch non-deleted actions
        q.isNull(NewAction.Fields.unpublishedAction_deletedAt);

        return queryBuilder().criteria(q).permission(permission).all();
    }

    @Override
    public List<NewAction> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(
            String pageId, AclPermission permission) {
        BridgeQuery<NewAction> q = Bridge.<NewAction>isTrue(NewAction.Fields.unpublishedAction_executeOnLoad)
                .isTrue(NewAction.Fields.unpublishedAction_userSetOnLoad)
                .equal(NewAction.Fields.unpublishedAction_pageId, pageId)
                // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
                // would exist. To handle this, only fetch non-deleted actions
                .isNull(NewAction.Fields.unpublishedAction_deletedAt);

        return queryBuilder().criteria(q).permission(permission).all();
    }

    @Override
    public List<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort) {
        return queryBuilder()
                .criteria(getCriterionForFindByApplicationId(applicationId))
                .permission(aclPermission)
                .sort(sort)
                .all();
    }

    protected BridgeQuery<NewAction> getCriterionForFindByApplicationId(String applicationId) {
        return Bridge.equal(NewAction.Fields.applicationId, applicationId);
    }

    @Override
    public List<NewAction> findByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission aclPermission) {
        return queryBuilder()
                .criteria(getCriteriaForFindByApplicationIdAndViewMode(applicationId, viewMode))
                .permission(aclPermission)
                .all();
    }

    protected BridgeQuery<NewAction> getCriteriaForFindByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode) {
        final BridgeQuery<NewAction> q = getCriterionForFindByApplicationId(applicationId);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            q.isNull(NewAction.Fields.unpublishedAction_deletedAt);
        }

        return q;
    }

    @Override
    public Optional<Long> countByDatasourceId(String datasourceId) {
        BridgeQuery<NewAction> q = Bridge.or(
                Bridge.equal(NewAction.Fields.unpublishedAction_datasource_id, datasourceId),
                Bridge.equal(NewAction.Fields.publishedAction_datasource_id, datasourceId));

        return queryBuilder().criteria(q).count();
    }

    @Override
    public Optional<NewAction> findByBranchNameAndDefaultActionId(
            String branchName, String defaultActionId, Boolean viewMode, AclPermission permission) {
        final BridgeQuery<NewAction> q = Bridge.<NewAction>equal(
                        NewAction.Fields.defaultResources_actionId, defaultActionId)
                .equal(NewAction.Fields.defaultResources_branchName, branchName);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            q.isNull(NewAction.Fields.unpublishedAction_deletedAt);
        }

        return queryBuilder().criteria(q).permission(permission).one();
    }

    @Override
    public List<NewAction> findByPageIds(List<String> pageIds, AclPermission permission) {
        return queryBuilder()
                .criteria(Bridge.in(NewAction.Fields.unpublishedAction_pageId, pageIds))
                .permission(permission)
                .all();
    }

    @Override
    public List<NewAction> findNonJsActionsByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission aclPermission) {
        return queryBuilder()
                .criteria(getCriteriaForFindNonJsActionsByApplicationIdAndViewMode(applicationId, viewMode))
                .permission(aclPermission)
                .all();
    }

    protected BridgeQuery<NewAction> getCriteriaForFindNonJsActionsByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode) {
        final BridgeQuery<NewAction> q =
                getCriterionForFindByApplicationId(applicationId).notEqual(NewAction.Fields.pluginType, PluginType.JS);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            q.isNull(NewAction.Fields.unpublishedAction_deletedAt);
        }

        return q;
    }

    @Override
    public List<NewAction> findAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort) {
        return queryBuilder()
                .criteria(getCriteriaForFindAllNonJsActionsByNameAndPageIdsAndViewMode(name, pageIds, viewMode))
                .permission(aclPermission)
                .sort(sort)
                .all();
    }

    protected BridgeQuery<NewAction> getCriteriaForFindAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode) {
        final BridgeQuery<NewAction> q = Bridge.notEqual(NewAction.Fields.pluginType, PluginType.JS);

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {

            if (name != null) {
                q.equal(NewAction.Fields.publishedAction_name, name);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                q.in(NewAction.Fields.publishedAction_pageId, pageIds);
            }

        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                q.equal(NewAction.Fields.unpublishedAction_name, name);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                q.in(NewAction.Fields.unpublishedAction_pageId, pageIds);
            }

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            q.isNull(NewAction.Fields.unpublishedAction_deletedAt);
        }

        return q;
    }

    @Override
    public List<NewAction> findByDefaultApplicationId(String defaultApplicationId, AclPermission permission) {
        final String defaultResources = BranchAwareDomain.Fields.defaultResources;
        return queryBuilder()
                .criteria(Bridge.equal(NewAction.Fields.defaultResources_applicationId, defaultApplicationId)
                        .isNull(NewAction.Fields.unpublishedAction_deletedAt))
                .permission(permission)
                .all();
    }

    @Override
    @Modifying
    @Transactional
    public Optional<Void> publishActions(String applicationId, AclPermission permission) {
        return copyUnpublishedActionToPublishedAction(getCriterionForFindByApplicationId(applicationId), permission);
    }

    protected Optional<Void> copyUnpublishedActionToPublishedAction(
            BridgeQuery<NewAction> criteria, AclPermission permission) {
        queryBuilder()
                .permission(permission)
                .criteria(criteria)
                .updateAll(Bridge.update()
                        .setToValueFromField(NewAction.Fields.publishedAction, NewAction.Fields.unpublishedAction));
        return Optional.empty();
    }

    @Override
    @Modifying
    @Transactional
    public Optional<Integer> archiveDeletedUnpublishedActions(String applicationId, AclPermission permission) {
        final BridgeQuery<NewAction> q = getCriterionForFindByApplicationId(applicationId)
                .isNotNull(NewAction.Fields.unpublishedAction_deletedAt);
        int count = queryBuilder()
                // .spec(Bridge.equal(NewAction.Fields.applicationId,
                // applicationId).notEqual(unpublishedDeletedAtFieldName, null))
                .criteria(q /*(root, cq, cb) -> cb.and(
                        cb.equal(root.get(NewAction.Fields.applicationId), applicationId),
                        cb.isNotNull(cb.function(
                                "jsonb_extract_path_text",
                                String.class,
                                root.get(NewAction.Fields.unpublishedAction),
                                cb.literal(FieldName.DELETED_AT))))*/)
                .permission(permission)
                .updateAll(Bridge.update().set(NewAction.Fields.deletedAt, Instant.now()));

        return Optional.of(count);
    }

    @Override
    public List<NewAction> findAllByApplicationIdsWithoutPermission(
            List<String> applicationIds, List<String> includeFields) {
        return queryBuilder()
                .criteria(Bridge.in(NewAction.Fields.applicationId, applicationIds))
                .fields(includeFields)
                .all();
    }

    @Override
    public List<NewAction> findAllByCollectionIds(
            List<String> collectionIds, boolean viewMode, AclPermission aclPermission) {
        String collectionIdPath;
        if (viewMode) {
            collectionIdPath = NewAction.Fields.publishedAction_collectionId;
        } else {
            collectionIdPath = NewAction.Fields.unpublishedAction_collectionId;
        }
        BridgeQuery<NewAction> q = Bridge.in(collectionIdPath, collectionIds);
        return queryBuilder().criteria(q).permission(aclPermission).all();
    }

    @Override
    public List<NewAction> findAllUnpublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        String contextIdPath = NewAction.Fields.unpublishedAction_pageId;
        String contextTypePath = NewAction.Fields.unpublishedAction_contextType;
        final BridgeQuery<NewAction> q = Bridge.<NewAction>or(
                        Bridge.equal(contextTypePath, contextType), Bridge.isNull(contextTypePath))
                .equal(contextIdPath, contextId);

        if (!includeJs) {
            q.notEqual(NewAction.Fields.pluginType, PluginType.JS);
        }

        return queryBuilder().criteria(q).permission(permission).all();
    }

    @Override
    public List<NewAction> findAllPublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        String contextIdPath = NewAction.Fields.publishedAction_pageId;
        String contextTypePath = NewAction.Fields.publishedAction_contextType;
        final BridgeQuery<NewAction> q =
                Bridge.<NewAction>equal(contextIdPath, contextId).equal(contextTypePath, contextType);

        if (includeJs) {
            q.equal(NewAction.Fields.pluginType, PluginType.JS);
        } else {
            q.notEqual(NewAction.Fields.pluginType, PluginType.JS);
        }

        return queryBuilder().criteria(q).permission(permission).all();
    }
}

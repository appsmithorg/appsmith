package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import io.micrometer.observation.ObservationRegistry;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Modifying;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.StreamSupport;

import static com.appsmith.external.models.PluginType.getPluginTypes;

@Slf4j
@RequiredArgsConstructor
public class CustomNewActionRepositoryCEImpl extends BaseAppsmithRepositoryImpl<NewAction>
        implements CustomNewActionRepositoryCE {

    private final ObservationRegistry observationRegistry;

    @Override
    public List<NewAction> findByApplicationId(
            String applicationId, AclPermission permission, User currentUser, EntityManager entityManager) {
        return queryBuilder()
                .criteria(getCriterionForFindByApplicationId(applicationId))
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .all()
        /*.name(VIEW_MODE_FETCH_ACTIONS_FROM_DB_QUERY)
        .tap(Micrometer.observation(observationRegistry))*/ ;
    }

    @Override
    public List<NewAction> findByApplicationId(
            String applicationId,
            Optional<AclPermission> permission,
            User currentUser,
            Optional<Sort> sort,
            EntityManager entityManager) {
        return queryBuilder()
                .criteria(getCriterionForFindByApplicationId(applicationId)
                        .isNull(NewAction.Fields.unpublishedAction_deletedAt))
                .permission(permission.orElse(null), currentUser)
                .sort(sort.orElse(null))
                .entityManager(entityManager)
                .all();
    }

    @Override
    public Optional<NewAction> findByUnpublishedNameAndPageId(
            String name, String pageId, AclPermission permission, User currentUser, EntityManager entityManager) {
        final BridgeQuery<NewAction> q = Bridge.<NewAction>equal(NewAction.Fields.unpublishedAction_name, name)
                .equal(NewAction.Fields.unpublishedAction_pageId, pageId)
                // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
                // would exist. To handle this, only fetch non-deleted actions
                .isNull(NewAction.Fields.unpublishedAction_deletedAt);

        return queryBuilder()
                .criteria(q)
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .one();
    }

    @Override
    public List<NewAction> findByPageId(
            String pageId, AclPermission permission, User currentUser, EntityManager entityManager) {
        return queryBuilder()
                .criteria(Bridge.or(
                        Bridge.equal(NewAction.Fields.unpublishedAction_pageId, pageId),
                        Bridge.equal(NewAction.Fields.publishedAction_pageId, pageId)))
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .all();
    }

    @Override
    public List<NewAction> findByPageId(
            String pageId, Optional<AclPermission> permission, User currentUser, EntityManager entityManager) {
        return findByPageId(pageId, permission.orElse(null), currentUser, entityManager);
    }

    @Override
    public List<NewAction> findByPageId(String pageId, EntityManager entityManager) {
        return this.findByPageId(pageId, Optional.empty(), null, entityManager);
    }

    @Override
    public List<NewAction> findByPageIdAndViewMode(
            String pageId, Boolean viewMode, AclPermission permission, User currentUser, EntityManager entityManager) {
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
        return queryBuilder()
                .criteria(q)
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .all();
    }

    @Override
    public List<NewAction> findAllActionsByNameAndPageIdsAndViewMode(
            String name,
            List<String> pageIds,
            Boolean viewMode,
            AclPermission permission,
            User currentUser,
            Sort sort,
            EntityManager entityManager) {
        return queryBuilder()
                .criteria(getCriteriaForFindAllActionsByNameAndPageIdsAndViewMode(name, pageIds, viewMode))
                .permission(permission, currentUser)
                .sort(sort)
                .entityManager(entityManager)
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
            Set<String> names, String pageId, AclPermission permission, User currentUser, EntityManager entityManager) {
        BridgeQuery<NewAction> q = Bridge.equal(NewAction.Fields.unpublishedAction_pageId, pageId);

        if (names != null) {
            q.and(Bridge.or(
                    Bridge.in(NewAction.Fields.unpublishedAction_name, names),
                    Bridge.in(NewAction.Fields.unpublishedAction_fullyQualifiedName, names)));
        }

        // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would
        // exist. To handle this, only fetch non-deleted actions
        q.isNull(NewAction.Fields.unpublishedAction_deletedAt);

        return queryBuilder()
                .criteria(q)
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .all();
    }

    @Override
    public List<NewAction> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(
            String pageId, AclPermission permission, User currentUser, EntityManager entityManager) {
        BridgeQuery<NewAction> q = Bridge.<NewAction>isTrue(NewAction.Fields.unpublishedAction_executeOnLoad)
                .isTrue(NewAction.Fields.unpublishedAction_userSetOnLoad)
                .equal(NewAction.Fields.unpublishedAction_pageId, pageId)
                // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
                // would exist. To handle this, only fetch non-deleted actions
                .isNull(NewAction.Fields.unpublishedAction_deletedAt);

        return queryBuilder()
                .criteria(q)
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .all();
    }

    @Override
    public List<NewAction> findByApplicationId(
            String applicationId, AclPermission permission, User currentUser, Sort sort, EntityManager entityManager) {
        return queryBuilder()
                .criteria(getCriterionForFindByApplicationId(applicationId))
                .permission(permission, currentUser)
                .sort(sort)
                .entityManager(entityManager)
                .all();
    }

    protected BridgeQuery<NewAction> getCriterionForFindByApplicationId(String applicationId) {
        return Bridge.equal(NewAction.Fields.applicationId, applicationId);
    }

    public List<NewAction> findPublishedActionsByAppIdAndExcludedPluginType(
            String applicationId,
            List<String> excludedPluginTypes,
            AclPermission permission,
            User currentUser,
            Sort sort,
            EntityManager entityManager) {
        return queryBuilder()
                .criteria(getCriterionForFindPublishedActionsByAppIdAndExcludedPluginType(
                        applicationId, excludedPluginTypes))
                .permission(permission, currentUser)
                .sort(sort)
                .entityManager(entityManager)
                .all();
    }

    protected BridgeQuery<NewAction> getCriterionForFindPublishedActionsByAppIdAndExcludedPluginType(
            String applicationId, List<String> excludedPluginTypes) {
        final BridgeQuery<NewAction> q = getCriterionForFindByApplicationId(applicationId);
        q.and(Bridge.or(
                Bridge.isNull(NewAction.Fields.pluginType),
                Bridge.enumNotIn(NewAction.Fields.pluginType, getPluginTypes(excludedPluginTypes))));

        q.isNotNull(NewAction.Fields.publishedAction_pageId);
        return q;
    }

    @Override
    public List<NewAction> findPublishedActionsByPageIdAndExcludedPluginType(
            String pageId,
            List<String> excludedPluginTypes,
            AclPermission permission,
            User currentUser,
            Sort sort,
            EntityManager entityManager) {
        return queryBuilder()
                .criteria(getCriterionForFindPublishedActionsByPageIdAndExcludedPluginType(pageId, excludedPluginTypes))
                .permission(permission, currentUser)
                .sort(sort)
                .entityManager(entityManager)
                .all();
    }

    protected BridgeQuery<NewAction> getCriterionForFindPublishedActionsByPageIdAndExcludedPluginType(
            String pageId, List<String> excludedPluginTypes) {
        final BridgeQuery<NewAction> q = Bridge.equal(NewAction.Fields.publishedAction_pageId, pageId);
        q.and(Bridge.or(
                Bridge.enumNotIn(NewAction.Fields.pluginType, getPluginTypes(excludedPluginTypes)),
                Bridge.isNull(NewAction.Fields.pluginType)));

        return q;
    }

    @Override
    public List<NewAction> findByApplicationIdAndViewMode(
            String applicationId,
            Boolean viewMode,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager) {
        return queryBuilder()
                .criteria(getCriteriaForFindByApplicationIdAndViewMode(applicationId, viewMode))
                .permission(permission, currentUser)
                .entityManager(entityManager)
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
    public Optional<Long> countByDatasourceId(String datasourceId, EntityManager entityManager) {
        BridgeQuery<NewAction> q = Bridge.or(
                Bridge.equal(NewAction.Fields.unpublishedAction_datasource_id, datasourceId),
                Bridge.equal(NewAction.Fields.publishedAction_datasource_id, datasourceId));

        return queryBuilder().criteria(q).entityManager(entityManager).count();
    }

    @Override
    public Optional<NewAction> findByBranchNameAndBaseActionId(
            String branchName,
            String baseActionId,
            Boolean viewMode,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager) {
        final BridgeQuery<NewAction> q = Bridge.<NewAction>equal(NewAction.Fields.baseId, baseActionId)
                .equal(NewAction.Fields.branchName, branchName);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            q.isNull(NewAction.Fields.unpublishedAction_deletedAt);
        }

        return queryBuilder()
                .criteria(q)
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .one();
    }

    @Override
    public List<NewAction> findByPageIds(
            List<String> pageIds, AclPermission permission, User currentUser, EntityManager entityManager) {
        return queryBuilder()
                .criteria(Bridge.in(NewAction.Fields.unpublishedAction_pageId, pageIds))
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .all();
    }

    @Override
    @Deprecated
    public List<NewAction> findByPageIds(
            List<String> pageIds, Optional<AclPermission> permission, User currentUser, EntityManager entityManager) {
        return findByPageIds(pageIds, permission.orElse(null), currentUser, entityManager);
    }

    @Override
    public List<NewAction> findNonJsActionsByApplicationIdAndViewMode(
            String applicationId,
            Boolean viewMode,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager) {
        return queryBuilder()
                .criteria(getCriteriaForFindNonJsActionsByApplicationIdAndViewMode(applicationId, viewMode))
                .permission(permission, currentUser)
                .entityManager(entityManager)
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
            String name,
            List<String> pageIds,
            Boolean viewMode,
            AclPermission permission,
            User currentUser,
            Sort sort,
            EntityManager entityManager) {
        return queryBuilder()
                .criteria(getCriteriaForFindAllNonJsActionsByNameAndPageIdsAndViewMode(name, pageIds, viewMode))
                .permission(permission, currentUser)
                .sort(sort)
                .entityManager(entityManager)
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
    @Modifying
    @Transactional
    public Optional<Void> publishActions(
            String applicationId, AclPermission permission, User currentUser, EntityManager entityManager) {
        return copyUnpublishedActionToPublishedAction(
                getCriterionForFindByApplicationId(applicationId), permission, currentUser, entityManager);
    }

    protected Optional<Void> copyUnpublishedActionToPublishedAction(
            BridgeQuery<NewAction> criteria, AclPermission permission, User currentUser, EntityManager entityManager) {
        queryBuilder()
                .permission(permission, currentUser)
                .criteria(criteria)
                .entityManager(entityManager)
                .updateAll(Bridge.update()
                        .setToValueFromField(NewAction.Fields.publishedAction, NewAction.Fields.unpublishedAction));
        return Optional.empty();
    }

    @Override
    @Modifying
    @Transactional
    public Optional<Integer> archiveDeletedUnpublishedActions(
            String applicationId, AclPermission permission, User currentUser, EntityManager entityManager) {
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
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .updateAll(Bridge.update().set(NewAction.Fields.deletedAt, Instant.now()));

        return Optional.of(count);
    }

    @Override
    public List<NewAction> findAllByApplicationIdsWithoutPermission(
            List<String> applicationIds, List<String> includeFields, EntityManager entityManager) {
        return queryBuilder()
                .criteria(Bridge.in(NewAction.Fields.applicationId, applicationIds))
                .fields(includeFields)
                .entityManager(entityManager)
                .all();
    }

    @Override
    public List<NewAction> findAllByCollectionIds(
            List<String> collectionIds,
            boolean viewMode,
            AclPermission permission,
            User currentUser,
            EntityManager entityManager) {
        String collectionIdPath;
        if (viewMode) {
            collectionIdPath = NewAction.Fields.publishedAction_collectionId;
        } else {
            collectionIdPath = NewAction.Fields.unpublishedAction_collectionId;
        }
        BridgeQuery<NewAction> q = Bridge.in(collectionIdPath, collectionIds);
        return queryBuilder()
                .criteria(q)
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .all();
    }

    @Override
    public List<NewAction> findAllUnpublishedActionsByContextIdAndContextType(
            String contextId,
            CreatorContextType contextType,
            AclPermission permission,
            User currentUser,
            boolean includeJs,
            EntityManager entityManager) {
        String contextIdPath = NewAction.Fields.unpublishedAction_pageId;
        String contextTypePath = NewAction.Fields.unpublishedAction_contextType;
        final BridgeQuery<NewAction> q = Bridge.<NewAction>or(
                        Bridge.equal(contextTypePath, contextType), Bridge.isNull(contextTypePath))
                .equal(contextIdPath, contextId);

        if (!includeJs) {
            q.notEqual(NewAction.Fields.pluginType, PluginType.JS);
        }

        return queryBuilder()
                .criteria(q)
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .all();
    }

    @Override
    public List<NewAction> findAllPublishedActionsByContextIdAndContextType(
            String contextId,
            CreatorContextType contextType,
            AclPermission permission,
            User currentUser,
            boolean includeJs,
            EntityManager entityManager) {
        String contextIdPath = NewAction.Fields.publishedAction_pageId;
        String contextTypePath = NewAction.Fields.publishedAction_contextType;
        final BridgeQuery<NewAction> q =
                Bridge.<NewAction>equal(contextIdPath, contextId).equal(contextTypePath, contextType);

        if (includeJs) {
            q.equal(NewAction.Fields.pluginType, PluginType.JS);
        } else {
            q.notEqual(NewAction.Fields.pluginType, PluginType.JS);
        }

        return queryBuilder()
                .criteria(q)
                .permission(permission, currentUser)
                .entityManager(entityManager)
                .all();
    }

    @Override
    public List<NewAction> findAllByApplicationIds(
            List<String> applicationIds, List<String> includedFields, EntityManager entityManager) {
        return queryBuilder()
                .criteria(Bridge.in(NewAction.Fields.applicationId, applicationIds))
                .fields(includedFields)
                .entityManager(entityManager)
                .all();
    }

    @Override
    public List<NewAction> findByApplicationId(String applicationId, EntityManager entityManager) {
        return queryBuilder()
                .criteria(getCriterionForFindByApplicationId(applicationId))
                .entityManager(entityManager)
                .all();
    }

    @Override
    public List<NewAction> findAllByIdIn(Collection<String> ids, EntityManager entityManager) {
        return queryBuilder()
                .criteria(Bridge.in(NewAction.Fields.id, ids))
                .entityManager(entityManager)
                .all();
    }

    @Override
    public List<NewAction> findByApplicationId(String applicationId) {
        return queryBuilder()
                .criteria(Bridge.equal(NewAction.Fields.applicationId, applicationId))
                .all();
    }

    @Override
    public List<NewAction> findAllByIdIn(Iterable<String> ids) {
        List<String> idList = StreamSupport.stream(ids.spliterator(), false).toList();
        return queryBuilder().criteria(Bridge.in(NewAction.Fields.id, idList)).all();
    }

    @Override
    public Optional<Long> countByDeletedAtNull() {
        return queryBuilder()
                .criteria(Bridge.exists(NewAction.Fields.deletedAt))
                .count();
    }
}

package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.PluginTypeAndCountDTO;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.aggregation.Fields;
import org.springframework.data.mongodb.core.aggregation.GroupOperation;
import org.springframework.data.mongodb.core.aggregation.MatchOperation;
import org.springframework.data.mongodb.core.aggregation.ProjectionOperation;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.group;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.match;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.newAggregation;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.project;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
@RequiredArgsConstructor
public class CustomNewActionRepositoryCEImpl extends BaseAppsmithRepositoryImpl<NewAction>
        implements CustomNewActionRepositoryCE {

    private final ReactiveMongoOperations mongoOperations;

    private final ObservationRegistry observationRegistry;

    @Override
    public Flux<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission) {
        return queryBuilder()
                .criteria(getCriterionForFindByApplicationId(applicationId))
                .permission(aclPermission)
                .all();
    }

    @Override
    public Flux<NewAction> findByApplicationId(
            String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort) {
        return queryBuilder()
                .criteria(getCriterionForFindByApplicationId(applicationId)
                        .isNull(NewAction.Fields.unpublishedAction_deletedAt))
                .permission(aclPermission.orElse(null))
                .sort(sort.orElse(null))
                .all();
    }

    @Override
    public Mono<NewAction> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission aclPermission) {
        final BridgeQuery<NewAction> q = Bridge.<NewAction>equal(NewAction.Fields.unpublishedAction_name, name)
                .equal(NewAction.Fields.unpublishedAction_pageId, pageId)
                // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
                // would exist. To handle this, only fetch non-deleted actions
                .isNull(NewAction.Fields.unpublishedAction_deletedAt);

        return queryBuilder().criteria(q).permission(aclPermission).one();
    }

    @Override
    public Flux<NewAction> findByPageId(String pageId, AclPermission aclPermission) {
        return queryBuilder()
                .criteria(Bridge.or(
                        Bridge.equal(NewAction.Fields.unpublishedAction_pageId, pageId),
                        Bridge.equal(NewAction.Fields.publishedAction_pageId, pageId)))
                .permission(aclPermission)
                .all();
    }

    @Override
    public Flux<NewAction> findByPageId(String pageId, Optional<AclPermission> aclPermission) {
        return findByPageId(pageId, aclPermission.orElse(null));
    }

    @Override
    public Flux<NewAction> findByPageId(String pageId) {
        return this.findByPageId(pageId, Optional.empty());
    }

    @Override
    public Flux<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission aclPermission) {
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
    public Flux<NewAction> findAllActionsByNameAndPageIdsAndViewMode(
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
    public Flux<NewAction> findUnpublishedActionsByNameInAndPageId(
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
    public Flux<NewAction> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(
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
    public Flux<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort) {
        return queryBuilder()
                .criteria(getCriterionForFindByApplicationId(applicationId))
                .permission(aclPermission)
                .sort(sort)
                .all();
    }

    protected BridgeQuery<NewAction> getCriterionForFindByApplicationId(String applicationId) {
        return Bridge.equal(NewAction.Fields.applicationId, applicationId);
    }

    public Flux<NewAction> findPublishedActionsByAppIdAndExcludedPluginType(
            String applicationId, List<String> excludedPluginTypes, AclPermission aclPermission, Sort sort) {
        return queryBuilder()
                .criteria(getCriterionForFindPublishedActionsByAppIdAndExcludedPluginType(
                        applicationId, excludedPluginTypes))
                .permission(aclPermission)
                .sort(sort)
                .all();
    }

    protected BridgeQuery<NewAction> getCriterionForFindPublishedActionsByAppIdAndExcludedPluginType(
            String applicationId, List<String> excludedPluginTypes) {
        final BridgeQuery<NewAction> q = getCriterionForFindByApplicationId(applicationId);
        q.and(Bridge.or(
                Bridge.notIn(NewAction.Fields.pluginType, excludedPluginTypes),
                Bridge.isNull(NewAction.Fields.pluginType)));

        q.isNotNull(NewAction.Fields.publishedAction_pageId);
        return q;
    }

    @Override
    public Flux<NewAction> findPublishedActionsByPageIdAndExcludedPluginType(
            String pageId, List<String> excludedPluginTypes, AclPermission aclPermission, Sort sort) {
        return queryBuilder()
                .criteria(getCriterionForFindPublishedActionsByPageIdAndExcludedPluginType(pageId, excludedPluginTypes))
                .permission(aclPermission)
                .sort(sort)
                .all();
    }

    protected BridgeQuery<NewAction> getCriterionForFindPublishedActionsByPageIdAndExcludedPluginType(
            String pageId, List<String> excludedPluginTypes) {
        final BridgeQuery<NewAction> q = Bridge.equal(NewAction.Fields.publishedAction_pageId, pageId);
        q.and(Bridge.or(
                Bridge.notIn(NewAction.Fields.pluginType, excludedPluginTypes),
                Bridge.isNull(NewAction.Fields.pluginType)));

        return q;
    }

    @Override
    public Flux<NewAction> findByApplicationIdAndViewMode(
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
    public Mono<Long> countByDatasourceId(String datasourceId) {
        BridgeQuery<NewAction> q = Bridge.or(
                Bridge.equal(NewAction.Fields.unpublishedAction + ".datasource._id", new ObjectId(datasourceId)),
                Bridge.equal(NewAction.Fields.publishedAction + ".datasource._id", new ObjectId(datasourceId)));

        return queryBuilder().criteria(q).count();
    }

    @Override
    public Mono<NewAction> findByBranchNameAndBaseActionId(
            String branchName, String baseActionId, Boolean viewMode, AclPermission permission) {
        final BridgeQuery<NewAction> q = Bridge.<NewAction>equal(NewAction.Fields.baseId, baseActionId)
                .equal(NewAction.Fields.branchName, branchName);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            q.isNull(NewAction.Fields.unpublishedAction_deletedAt);
        }

        return queryBuilder().criteria(q).permission(permission).one();
    }

    @Override
    public Flux<NewAction> findByPageIds(List<String> pageIds, AclPermission permission) {
        return queryBuilder()
                .criteria(Bridge.in(NewAction.Fields.unpublishedAction_pageId, pageIds))
                .permission(permission)
                .all();
    }

    @Override
    @Deprecated
    public Flux<NewAction> findByPageIds(List<String> pageIds, Optional<AclPermission> permission) {
        return findByPageIds(pageIds, permission.orElse(null));
    }

    @Override
    public Flux<NewAction> findNonJsActionsByApplicationIdAndViewMode(
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
    public Flux<NewAction> findAllNonJsActionsByNameAndPageIdsAndViewMode(
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
    public Mono<Void> publishActions(String applicationId, AclPermission permission) {
        return copyUnpublishedActionToPublishedAction(getCriterionForFindByApplicationId(applicationId), permission);
    }

    protected Mono<Void> copyUnpublishedActionToPublishedAction(
            BridgeQuery<NewAction> criteria, AclPermission permission) {
        Mono<Set<String>> permissionGroupsMono = getCurrentUserPermissionGroupsIfRequired(permission);

        return permissionGroupsMono
                .flatMapMany(permissionGroups -> {
                    AggregationOperation matchAggregationWithPermission;
                    if (permission == null) {
                        matchAggregationWithPermission = Aggregation.match(new Criteria().andOperator(notDeleted()));
                    } else {
                        matchAggregationWithPermission = Aggregation.match(
                                new Criteria().andOperator(notDeleted(), userAcl(permissionGroups, permission)));
                    }
                    AggregationOperation matchAggregation = Aggregation.match(criteria);
                    AggregationOperation wholeProjection = Aggregation.project(NewAction.class);
                    AggregationOperation addFieldsOperation = Aggregation.addFields()
                            .addField(NewAction.Fields.publishedAction)
                            .withValueOf(Fields.field(NewAction.Fields.unpublishedAction))
                            .build();
                    Aggregation combinedAggregation = Aggregation.newAggregation(
                            matchAggregation, matchAggregationWithPermission, wholeProjection, addFieldsOperation);
                    return mongoOperations.aggregate(combinedAggregation, NewAction.class, NewAction.class);
                })
                .collectList()
                .flatMap(this::bulkUpdate);
    }

    @Override
    public Mono<Integer> archiveDeletedUnpublishedActions(String applicationId, AclPermission permission) {
        final BridgeQuery<NewAction> q = getCriterionForFindByApplicationId(applicationId)
                .isNotNull(NewAction.Fields.unpublishedAction_deletedAt);

        BridgeUpdate update = Bridge.update();
        update.set(NewAction.Fields.deleted, true);
        update.set(NewAction.Fields.deletedAt, Instant.now());
        return queryBuilder().criteria(q).permission(permission).updateAll(update);
    }

    @Override
    public Flux<PluginTypeAndCountDTO> countActionsByPluginType(String applicationId) {
        GroupOperation countByPluginType =
                group(NewAction.Fields.pluginType).count().as("count");
        MatchOperation filterStates =
                match(where(NewAction.Fields.applicationId).is(applicationId).andOperator(notDeleted()));
        ProjectionOperation projectionOperation = project("count").and("_id").as("pluginType");
        Aggregation aggregation = newAggregation(filterStates, countByPluginType, projectionOperation);
        return mongoOperations.aggregate(
                aggregation, mongoOperations.getCollectionName(NewAction.class), PluginTypeAndCountDTO.class);
    }

    @Override
    public Flux<NewAction> findAllByApplicationIdsWithoutPermission(
            List<String> applicationIds, List<String> includeFields) {
        return queryBuilder()
                .criteria(Bridge.in(NewAction.Fields.applicationId, applicationIds))
                .fields(includeFields)
                .all();
    }

    @Override
    public Flux<NewAction> findAllByCollectionIds(
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
    public Flux<NewAction> findAllUnpublishedActionsByContextIdAndContextType(
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
    public Flux<NewAction> findAllPublishedActionsByContextIdAndContextType(
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

    @Override
    public Flux<NewAction> findAllByApplicationIds(List<String> applicationIds, List<String> includedFields) {
        return queryBuilder()
                .criteria(Bridge.in(NewAction.Fields.applicationId, applicationIds))
                .fields(includedFields)
                .all();
    }
}

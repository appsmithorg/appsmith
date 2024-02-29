package com.appsmith.server.repositories;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.repositories.ce.CustomNewActionRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.aggregation.Fields;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomNewActionRepositoryImpl extends CustomNewActionRepositoryCEImpl
        implements CustomNewActionRepository {
    private final MongoTemplate mongoTemplate;

    public CustomNewActionRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            MongoTemplate mongoTemplate) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper, mongoTemplate);
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Flux<NewAction> findAllByModuleIds(List<String> moduleIds, Optional<AclPermission> permission) {
        Criteria moduleIdCriteria = Criteria.where(completeFieldName(QNewAction.newAction.unpublishedAction.moduleId))
                .in(moduleIds);
        return queryBuilder()
                .criteria(moduleIdCriteria)
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    public Flux<NewAction> findAllUncomposedNonJSActionsByApplicationIds(
            List<String> applicationIds, List<String> includeFields) {
        Criteria applicationCriteria =
                Criteria.where(NewAction.Fields.applicationId).in(applicationIds);
        // Query only the non-JS actions as the JS actions are stored in the actionCollection collection
        Criteria nonJsActionCriteria =
                Criteria.where(NewAction.Fields.pluginType).ne(PluginType.JS);

        Criteria notComposedCriteria =
                Criteria.where(NewAction.Fields.rootModuleInstanceId).exists(false);

        return queryBuilder()
                .criteria(applicationCriteria, nonJsActionCriteria, notComposedCriteria)
                .fields(includeFields)
                .all();
    }

    @Override
    public Flux<NewAction> findAllByActionCollectionIdWithoutPermissions(
            List<String> collectionIds, List<String> includeFields) {
        String actionCollectionCriteriaQueryString = NewAction.Fields.unpublishedAction + "."
                + fieldName(QNewAction.newAction.unpublishedAction.collectionId);
        Criteria actionCollectionCriteria =
                Criteria.where(actionCollectionCriteriaQueryString).in(collectionIds);
        return queryBuilder()
                .criteria(actionCollectionCriteria)
                .fields(includeFields)
                .all();
    }

    @Override
    public Flux<NewAction> findAllNonJSActionsByModuleId(String moduleId) {
        List<Criteria> criteria = new ArrayList<>();

        String moduleIdPath =
                NewAction.Fields.unpublishedAction + "." + fieldName(QNewAction.newAction.unpublishedAction.moduleId);
        Criteria moduleIdCriteria = Criteria.where(moduleIdPath).is(moduleId);

        Criteria nonJsTypeCriteria = where(NewAction.Fields.pluginType).ne(PluginType.JS);

        criteria.add(moduleIdCriteria);
        criteria.add(nonJsTypeCriteria);
        return queryBuilder().criteria(criteria).all();
    }

    @Override
    public Mono<NewAction> findPublicActionByModuleId(String moduleId, ResourceModes resourceMode) {
        List<Criteria> criteria = new ArrayList<>();

        String moduleIdPath;
        if (resourceMode == ResourceModes.EDIT) {
            moduleIdPath = NewAction.Fields.unpublishedAction + "."
                    + fieldName(QNewAction.newAction.unpublishedAction.moduleId);
        } else {
            moduleIdPath =
                    NewAction.Fields.publishedAction + "." + fieldName(QNewAction.newAction.unpublishedAction.moduleId);
        }
        Criteria moduleIdCriteria = Criteria.where(moduleIdPath).is(moduleId);

        Criteria nonJsTypeCriteria = where(NewAction.Fields.pluginType).ne(PluginType.JS);

        Criteria isPublicCriteria = where(NewAction.Fields.isPublic).is(Boolean.TRUE);

        criteria.add(moduleIdCriteria);
        criteria.add(nonJsTypeCriteria);
        criteria.add(isPublicCriteria);
        return queryBuilder().criteria(criteria).one();
    }

    @Override
    public Flux<NewAction> findAllByRootModuleInstanceId(
            String rootModuleInstanceId,
            List<String> projectionFields,
            Optional<AclPermission> permission,
            boolean includeJs) {
        List<Criteria> criteria = new ArrayList<>();

        String moduleInstanceIdPath = NewAction.Fields.moduleInstanceId;
        Criteria moduleInstanceIdCriteria = Criteria.where(moduleInstanceIdPath).is(rootModuleInstanceId);

        if (!includeJs) {
            Criteria nonJsTypeCriteria = where(NewAction.Fields.pluginType).ne(PluginType.JS);
            criteria.add(nonJsTypeCriteria);
        }

        criteria.add(moduleInstanceIdCriteria);

        return queryBuilder()
                .criteria(criteria)
                .fields(projectionFields)
                .permission(permission.orElse(null))
                .all();
    }

    public Flux<NewAction> findUnpublishedActionsByModuleIdAndExecuteOnLoadSetByUserTrue(
            String moduleId, AclPermission permission) {
        List<Criteria> criteriaList = new ArrayList<>();

        Criteria executeOnLoadCriteria = where(NewAction.Fields.unpublishedAction + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.executeOnLoad))
                .is(Boolean.TRUE);
        criteriaList.add(executeOnLoadCriteria);

        Criteria setByUserCriteria = where(NewAction.Fields.unpublishedAction + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.userSetOnLoad))
                .is(Boolean.TRUE);
        criteriaList.add(setByUserCriteria);

        Criteria pageCriteria = where(NewAction.Fields.unpublishedAction + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.pageId))
                .is(moduleId);
        criteriaList.add(pageCriteria);

        // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would
        // exist. To handle this, only fetch non-deleted actions
        Criteria deletedCriteria = where(NewAction.Fields.unpublishedAction + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.deletedAt))
                .is(null);
        criteriaList.add(deletedCriteria);

        return queryBuilder().criteria(criteriaList).permission(permission).all();
    }

    @Override
    public Flux<NewAction> findByWorkflowId(
            String workflowId,
            Optional<AclPermission> aclPermission,
            Optional<List<String>> includeFields,
            Boolean includeJs) {
        return this.findByWorkflowIds(List.of(workflowId), aclPermission, includeFields, includeJs);
    }

    @Override
    public Flux<NewAction> findByWorkflowIds(
            List<String> workflowIds,
            Optional<AclPermission> aclPermission,
            Optional<List<String>> includeFields,
            Boolean includeJs) {
        List<Criteria> criteria = new ArrayList<>();
        Criteria workflowCriteria = Criteria.where(NewAction.Fields.workflowId).in(workflowIds);
        criteria.add(workflowCriteria);
        if (!includeJs) {
            Criteria nonJsTypeCriteria = where(NewAction.Fields.pluginType).ne(PluginType.JS);
            criteria.add(nonJsTypeCriteria);
        }

        return queryBuilder()
                .criteria(criteria)
                .fields(includeFields.orElse(null))
                .permission(aclPermission.orElse(null))
                .all();
    }

    @Override
    public Mono<Void> archiveDeletedUnpublishedActionsForWorkflows(String workflowId, AclPermission aclPermission) {
        Criteria workflowIdCriteria = where(NewAction.Fields.workflowId).is(workflowId);
        String unpublishedDeletedAtFieldName = String.format(
                "%s.%s",
                NewAction.Fields.unpublishedAction, fieldName(QNewAction.newAction.unpublishedAction.deletedAt));
        Criteria deletedFromUnpublishedCriteria =
                where(unpublishedDeletedAtFieldName).ne(null);

        Update update = new Update();
        update.set(FieldName.DELETED, true);
        update.set(FieldName.DELETED_AT, Instant.now());
        return queryBuilder()
                .criteria(workflowIdCriteria, deletedFromUnpublishedCriteria)
                .permission(aclPermission)
                .updateAll(update)
                .then();
    }

    @Override
    public Mono<Void> publishActionsForWorkflows(String workflowId, AclPermission aclPermission) {
        Criteria workflowIdCriteria = where(NewAction.Fields.workflowId).is(workflowId);

        return copyUnpublishedActionToPublishedActionForActions(aclPermission, workflowIdCriteria);
    }

    @Override
    public Flux<NewAction> findPublicActionsByModuleInstanceId(
            String moduleInstanceId, Optional<AclPermission> permission) {
        Criteria publicActionInModuleInstanceCriteria = Criteria.where(NewAction.Fields.moduleInstanceId)
                .is(moduleInstanceId)
                .and((NewAction.Fields.isPublic))
                .is(Boolean.TRUE);

        return queryBuilder()
                .criteria(publicActionInModuleInstanceCriteria)
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    public Flux<NewAction> findAllByCollectionIds(
            List<String> collectionIds, List<String> includeFields, boolean viewMode) {
        String collectionIdPath;
        if (viewMode) {
            collectionIdPath = completeFieldName(QNewAction.newAction.publishedAction.collectionId);
        } else {
            collectionIdPath = completeFieldName(QNewAction.newAction.unpublishedAction.collectionId);
        }
        List<Criteria> criteria = new ArrayList<>();
        Criteria collectionIdCriterion = where(collectionIdPath).in(collectionIds);
        criteria.add(collectionIdCriterion);
        return queryBuilder().criteria(criteria).fields(includeFields).all();
    }

    @Override
    public Flux<NewAction> findAllModuleInstanceEntitiesByContextAndViewMode(
            String contextId,
            CreatorContextType contextType,
            Optional<AclPermission> optionalPermission,
            boolean viewMode,
            boolean includeJs) {
        List<Criteria> criteria = new ArrayList<>();
        criteria.add(getModuleInstanceExistenceCriterion());
        String contextIdPath;
        String contextTypePath;
        if (viewMode) {
            contextTypePath = completeFieldName(QNewAction.newAction.publishedAction.contextType);
            switch (contextType) {
                case MODULE -> contextIdPath = completeFieldName(QNewAction.newAction.publishedAction.moduleId);
                default -> contextIdPath = completeFieldName(QNewAction.newAction.publishedAction.pageId);
            }
        } else {
            contextTypePath = completeFieldName(QNewAction.newAction.unpublishedAction.contextType);
            switch (contextType) {
                case MODULE -> contextIdPath = completeFieldName(QNewAction.newAction.unpublishedAction.moduleId);
                default -> contextIdPath = completeFieldName(QNewAction.newAction.unpublishedAction.pageId);
            }
        }
        Criteria contextIdAndContextTypeCriterion =
                where(contextIdPath).is(contextId).and(contextTypePath).is(contextType);
        criteria.add(contextIdAndContextTypeCriterion);

        Criteria jsInclusionOrExclusionCriteria;
        if (includeJs) {
            jsInclusionOrExclusionCriteria = where(NewAction.Fields.pluginType).is(PluginType.JS);
        } else {
            jsInclusionOrExclusionCriteria = where(NewAction.Fields.pluginType).ne(PluginType.JS);
        }
        criteria.add(jsInclusionOrExclusionCriteria);

        return queryBuilder()
                .criteria(criteria)
                .permission(optionalPermission.orElse(null))
                .all();
    }

    @Override
    public Flux<NewAction> findAllUnpublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        if (null == contextType || contextType == CreatorContextType.PAGE) {
            return super.findAllUnpublishedActionsByContextIdAndContextType(
                    contextId, contextType, permission, includeJs);
        }
        List<Criteria> criteriaList = new ArrayList<>();
        String contextIdPath;
        switch (contextType) {
            case WORKFLOW -> contextIdPath = NewAction.Fields.workflowId;
            case MODULE -> contextIdPath = completeFieldName(QNewAction.newAction.unpublishedAction.moduleId);
            default -> contextIdPath = completeFieldName(QNewAction.newAction.unpublishedAction.moduleId);
        }
        String contextTypePath = completeFieldName(QNewAction.newAction.unpublishedAction.contextType);
        Criteria contextIdAndContextTypeCriteria =
                where(contextIdPath).is(contextId).and(contextTypePath).is(contextType);

        criteriaList.add(contextIdAndContextTypeCriteria);

        if (!includeJs) {
            Criteria jsInclusionOrExclusionCriteria =
                    where(NewAction.Fields.pluginType).ne(PluginType.JS);
            criteriaList.add(jsInclusionOrExclusionCriteria);
        }

        return queryBuilder().criteria(criteriaList).permission(permission).all();
    }

    @Override
    public Flux<NewAction> findAllPublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        if (null == contextType || contextType == CreatorContextType.PAGE) {
            return super.findAllPublishedActionsByContextIdAndContextType(
                    contextId, contextType, permission, includeJs);
        }
        List<Criteria> criteriaList = new ArrayList<>();
        String contextIdPath;
        switch (contextType) {
            case WORKFLOW -> contextIdPath = NewAction.Fields.workflowId;
            case MODULE -> contextIdPath = completeFieldName(QNewAction.newAction.publishedAction.moduleId);
            default -> contextIdPath = completeFieldName(QNewAction.newAction.publishedAction.moduleId);
        }
        String contextTypePath = completeFieldName(QNewAction.newAction.publishedAction.contextType);
        Criteria contextIdAndContextTypeCriteria = new Criteria();

        contextIdAndContextTypeCriteria.andOperator(
                Criteria.where(contextIdPath).is(contextId),
                Criteria.where(contextTypePath).is(contextType));

        criteriaList.add(contextIdAndContextTypeCriteria);

        Criteria jsInclusionOrExclusionCriteria = new Criteria();
        if (!includeJs) {
            jsInclusionOrExclusionCriteria = where(NewAction.Fields.pluginType).ne(PluginType.JS);
        }

        criteriaList.add(jsInclusionOrExclusionCriteria);

        return queryBuilder().criteria(criteriaList).permission(permission).all();
    }

    @Override
    public Flux<NewAction> findNonJsActionsByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission aclPermission) {
        List<Criteria> criteria =
                super.getCriteriaForFindNonJsActionsByApplicationIdAndViewMode(applicationId, viewMode);

        criteria.add(getModuleInstanceNonExistenceCriterion());

        return queryBuilder().criteria(criteria).permission(aclPermission).all();
    }

    private Criteria getModuleInstanceNonExistenceCriterion() {
        return where(NewAction.Fields.rootModuleInstanceId).exists(false);
    }

    private Criteria getModuleInstanceExistenceCriterion() {
        return where(NewAction.Fields.rootModuleInstanceId).exists(true);
    }

    @Override
    public Flux<NewAction> findByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission aclPermission) {

        List<Criteria> criteria = super.getCriteriaForFindByApplicationIdAndViewMode(applicationId, viewMode);

        criteria.add(getModuleInstanceNonExistenceCriterion());

        return queryBuilder().criteria(criteria).permission(aclPermission).all();
    }

    @Override
    public Flux<NewAction> findAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort) {
        List<Criteria> criteria =
                super.getCriteriaForFindAllNonJsActionsByNameAndPageIdsAndViewMode(name, pageIds, viewMode);

        criteria.add(getModuleInstanceNonExistenceCriterion());

        return queryBuilder()
                .criteria(criteria)
                .permission(aclPermission)
                .sort(sort)
                .all();
    }

    @Override
    public Flux<NewAction> findAllActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort) {
        List<Criteria> criteria =
                super.getCriteriaForFindAllActionsByNameAndPageIdsAndViewMode(name, pageIds, viewMode);

        criteria.add(getModuleInstanceNonExistenceCriterion());

        return queryBuilder()
                .criteria(criteria)
                .permission(aclPermission)
                .sort(sort)
                .all();
    }

    @Override
    public Flux<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort) {

        List<Criteria> criteria = new ArrayList<>();
        Criteria applicationIdCriterion = super.getCriterionForFindByApplicationId(applicationId);

        criteria.add(applicationIdCriterion);
        criteria.add(getModuleInstanceNonExistenceCriterion());

        return queryBuilder()
                .criteria(criteria)
                .permission(aclPermission)
                .sort(sort)
                .all();
    }

    @Override
    public Mono<Void> archiveDeletedUnpublishedActionsForCollection(
            String actionCollectionId, AclPermission aclPermission) {
        Criteria collectionIdCriteria = where(completeFieldName(QNewAction.newAction.unpublishedAction.collectionId))
                .is(actionCollectionId);
        String unpublishedDeletedAtFieldName = String.format(
                "%s.%s",
                NewAction.Fields.unpublishedAction, fieldName(QNewAction.newAction.unpublishedAction.deletedAt));
        Criteria deletedFromUnpublishedCriteria =
                where(unpublishedDeletedAtFieldName).ne(null);

        Update update = new Update();
        update.set(FieldName.DELETED, true);
        update.set(FieldName.DELETED_AT, Instant.now());
        return queryBuilder()
                .criteria(collectionIdCriteria, deletedFromUnpublishedCriteria)
                .permission(aclPermission)
                .updateAll(update)
                .then();
    }

    @Override
    public Mono<Void> publishActionsForCollection(String actionCollectionId, AclPermission aclPermission) {
        Criteria collectionIdCriteria = where(completeFieldName(QNewAction.newAction.unpublishedAction.collectionId))
                .is(actionCollectionId);

        return copyUnpublishedActionToPublishedActionForActions(aclPermission, collectionIdCriteria);
    }

    private Mono<Void> copyUnpublishedActionToPublishedActionForActions(
            AclPermission aclPermission, Criteria collectionIdCriteria) {
        Mono<Set<String>> permissionGroupsMono =
                getCurrentUserPermissionGroupsIfRequired(Optional.ofNullable(aclPermission));

        return permissionGroupsMono
                .flatMap(permissionGroups -> Mono.fromCallable(() -> {
                            AggregationOperation matchAggregationWithPermission;
                            if (aclPermission == null) {
                                matchAggregationWithPermission =
                                        Aggregation.match(new Criteria().andOperator(notDeleted()));
                            } else {
                                matchAggregationWithPermission = Aggregation.match(new Criteria()
                                        .andOperator(notDeleted(), userAcl(permissionGroups, aclPermission)));
                            }
                            AggregationOperation matchAggregation = Aggregation.match(collectionIdCriteria);
                            AggregationOperation wholeProjection = Aggregation.project(NewAction.class);
                            AggregationOperation addFieldsOperation = Aggregation.addFields()
                                    .addField(NewAction.Fields.publishedAction)
                                    .withValueOf(Fields.field(NewAction.Fields.unpublishedAction))
                                    .build();
                            Aggregation combinedAggregation = Aggregation.newAggregation(
                                    matchAggregation,
                                    matchAggregationWithPermission,
                                    wholeProjection,
                                    addFieldsOperation);
                            return mongoTemplate.aggregate(combinedAggregation, NewAction.class, NewAction.class);
                        })
                        .subscribeOn(Schedulers.boundedElastic()))
                .flatMap(updatedResults -> bulkUpdate(updatedResults.getMappedResults()));
    }
}

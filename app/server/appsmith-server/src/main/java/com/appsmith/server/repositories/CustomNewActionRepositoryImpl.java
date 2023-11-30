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
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomNewActionRepositoryImpl extends CustomNewActionRepositoryCEImpl
        implements CustomNewActionRepository {

    public CustomNewActionRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            MongoTemplate mongoTemplate) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper, mongoTemplate);
    }

    @Override
    public Flux<NewAction> findAllNonJSActionsByApplicationIds(
            List<String> applicationIds, List<String> includeFields) {
        Criteria applicationCriteria = Criteria.where(FieldName.APPLICATION_ID).in(applicationIds);
        // Query only the non-JS actions as the JS actions are stored in the actionCollection collection
        Criteria nonJsActionCriteria =
                Criteria.where(fieldName(QNewAction.newAction.pluginType)).ne(PluginType.JS);
        return queryAll(List.of(applicationCriteria, nonJsActionCriteria), includeFields, null, null, NO_RECORD_LIMIT);
    }

    @Override
    public Flux<NewAction> findAllByActionCollectionIdWithoutPermissions(
            List<String> collectionIds, List<String> includeFields) {
        String actionCollectionCriteriaQueryString = fieldName(QNewAction.newAction.unpublishedAction) + "."
                + fieldName(QNewAction.newAction.unpublishedAction.collectionId);
        Criteria actionCollectionCriteria =
                Criteria.where(actionCollectionCriteriaQueryString).in(collectionIds);
        return queryAll(List.of(actionCollectionCriteria), includeFields, null, null);
    }

    @Override
    public Flux<NewAction> findAllNonJSActionsByModuleId(String moduleId) {
        List<Criteria> criteria = new ArrayList<>();

        String moduleIdPath = fieldName(QNewAction.newAction.unpublishedAction) + "."
                + fieldName(QNewAction.newAction.unpublishedAction.moduleId);
        Criteria moduleIdCriteria = Criteria.where(moduleIdPath).is(moduleId);

        Criteria nonJsTypeCriteria =
                where(fieldName(QNewAction.newAction.pluginType)).ne(PluginType.JS);

        criteria.add(moduleIdCriteria);
        criteria.add(nonJsTypeCriteria);
        return queryAll(criteria, Optional.empty());
    }

    @Override
    public Mono<NewAction> findPublicActionByModuleId(String moduleId, ResourceModes resourceMode) {
        List<Criteria> criteria = new ArrayList<>();

        String moduleIdPath;
        if (resourceMode == ResourceModes.EDIT) {
            moduleIdPath = fieldName(QNewAction.newAction.unpublishedAction) + "."
                    + fieldName(QNewAction.newAction.unpublishedAction.moduleId);
        } else {
            moduleIdPath = fieldName(QNewAction.newAction.publishedAction) + "."
                    + fieldName(QNewAction.newAction.unpublishedAction.moduleId);
        }
        Criteria moduleIdCriteria = Criteria.where(moduleIdPath).is(moduleId);

        Criteria nonJsTypeCriteria =
                where(fieldName(QNewAction.newAction.pluginType)).ne(PluginType.JS);

        Criteria isPublicCriteria =
                where(fieldName(QNewAction.newAction.isPublic)).is(Boolean.TRUE);

        criteria.add(moduleIdCriteria);
        criteria.add(nonJsTypeCriteria);
        criteria.add(isPublicCriteria);
        return queryOne(criteria);
    }

    @Override
    public Flux<NewAction> findAllByRootModuleInstanceId(
            String rootModuleInstanceId, Optional<AclPermission> permission, boolean includeJs) {
        List<Criteria> criteria = new ArrayList<>();

        String moduleInstanceIdPath = fieldName(QNewAction.newAction.moduleInstanceId);
        Criteria moduleInstanceIdCriteria = Criteria.where(moduleInstanceIdPath).is(rootModuleInstanceId);

        if (!includeJs) {
            Criteria nonJsTypeCriteria =
                    where(fieldName(QNewAction.newAction.pluginType)).ne(PluginType.JS);
            criteria.add(nonJsTypeCriteria);
        }

        criteria.add(moduleInstanceIdCriteria);

        return queryAll(criteria, permission);
    }

    public Flux<NewAction> findUnpublishedActionsByModuleIdAndExecuteOnLoadSetByUserTrue(
            String moduleId, AclPermission permission) {
        List<Criteria> criteriaList = new ArrayList<>();

        Criteria executeOnLoadCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.executeOnLoad))
                .is(Boolean.TRUE);
        criteriaList.add(executeOnLoadCriteria);

        Criteria setByUserCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.userSetOnLoad))
                .is(Boolean.TRUE);
        criteriaList.add(setByUserCriteria);

        Criteria pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.pageId))
                .is(moduleId);
        criteriaList.add(pageCriteria);

        // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would
        // exist. To handle this, only fetch non-deleted actions
        Criteria deletedCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.deletedAt))
                .is(null);
        criteriaList.add(deletedCriteria);

        return queryAll(criteriaList, permission);
    }

    @Override
    public Flux<NewAction> findAllUnpublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        if (contextType == CreatorContextType.PAGE) {
            return super.findAllUnpublishedActionsByContextIdAndContextType(
                    contextId, contextType, permission, includeJs);
        }
        List<Criteria> criteriaList = new ArrayList<>();

        String contextIdPath = fieldName(QNewAction.newAction.unpublishedAction) + "."
                + fieldName(QNewAction.newAction.unpublishedAction.moduleId);
        String contextTypePath = fieldName(QNewAction.newAction.unpublishedAction) + "."
                + fieldName(QNewAction.newAction.unpublishedAction.contextType);
        Criteria contextIdAndContextTypeCriteria =
                where(contextIdPath).is(contextId).and(contextTypePath).is(contextType);

        criteriaList.add(contextIdAndContextTypeCriteria);

        Criteria jsInclusionOrExclusionCriteria;
        if (includeJs) {
            jsInclusionOrExclusionCriteria =
                    where(fieldName(QNewAction.newAction.pluginType)).is(PluginType.JS);
        } else {
            jsInclusionOrExclusionCriteria =
                    where(fieldName(QNewAction.newAction.pluginType)).ne(PluginType.JS);
        }

        criteriaList.add(jsInclusionOrExclusionCriteria);

        return queryAll(List.of(contextIdAndContextTypeCriteria), Optional.of(permission));
    }

    @Override
    public Flux<NewAction> findAllPublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        if (contextType == CreatorContextType.PAGE) {
            return super.findAllPublishedActionsByContextIdAndContextType(
                    contextId, contextType, permission, includeJs);
        }
        List<Criteria> criteriaList = new ArrayList<>();
        String contextIdPath = fieldName(QNewAction.newAction.publishedAction) + "."
                + fieldName(QNewAction.newAction.publishedAction.moduleId);
        String contextTypePath = fieldName(QNewAction.newAction.publishedAction) + "."
                + fieldName(QNewAction.newAction.publishedAction.contextType);
        Criteria contextIdAndContextTypeCriteria =
                where(contextIdPath).is(contextId).and(contextTypePath).is(contextType);

        criteriaList.add(contextIdAndContextTypeCriteria);

        Criteria jsInclusionOrExclusionCriteria;
        if (includeJs) {
            jsInclusionOrExclusionCriteria =
                    where(fieldName(QNewAction.newAction.pluginType)).is(PluginType.JS);
        } else {
            jsInclusionOrExclusionCriteria =
                    where(fieldName(QNewAction.newAction.pluginType)).ne(PluginType.JS);
        }

        criteriaList.add(jsInclusionOrExclusionCriteria);

        return queryAll(List.of(contextIdAndContextTypeCriteria), Optional.of(permission));
    }

    @Override
    public Flux<NewAction> findByWorkflowId(String workflowId, Optional<AclPermission> aclPermission) {
        String unpublishedAction = fieldName(QNewAction.newAction.unpublishedAction) + "."
                + fieldName(QNewAction.newAction.unpublishedAction.workflowId);
        String publishedAction = fieldName(QNewAction.newAction.publishedAction) + "."
                + fieldName(QNewAction.newAction.publishedAction.workflowId);

        Criteria workflowCriteria = new Criteria()
                .orOperator(
                        where(unpublishedAction).is(workflowId),
                        where(publishedAction).is(workflowId));

        return queryAll(List.of(workflowCriteria), aclPermission);
    }

    @Override
    public Flux<NewAction> findNonJsActionsByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission aclPermission) {
        List<Criteria> criteria = new ArrayList<>();

        Criteria applicationCriterion =
                where(fieldName(QNewAction.newAction.applicationId)).is(applicationId);
        criteria.add(applicationCriterion);

        Criteria nonModuleInstanceActionCriterion = getNonModuleInstanceActionCriterion();
        criteria.add(nonModuleInstanceActionCriterion);

        Criteria nonJsTypeCriteria =
                where(fieldName(QNewAction.newAction.pluginType)).ne(PluginType.JS);
        criteria.add(nonJsTypeCriteria);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriterion = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                            + fieldName(QNewAction.newAction.unpublishedAction.deletedAt))
                    .is(null);
            criteria.add(deletedCriterion);
        }

        return queryAll(criteria, aclPermission);
    }

    private static Criteria getNonModuleInstanceActionCriterion() {
        return where(fieldName(QNewAction.newAction.moduleInstanceId)).exists(false);
    }

    @Override
    public Flux<NewAction> findByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission aclPermission) {

        List<Criteria> criteria = new ArrayList<>();

        Criteria applicationCriterion =
                where(fieldName(QNewAction.newAction.applicationId)).is(applicationId);
        criteria.add(applicationCriterion);

        Criteria nonModuleInstanceActionCriterion = getNonModuleInstanceActionCriterion();
        criteria.add(nonModuleInstanceActionCriterion);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriterion = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                            + fieldName(QNewAction.newAction.unpublishedAction.deletedAt))
                    .is(null);
            criteria.add(deletedCriterion);
        }

        return queryAll(criteria, aclPermission);
    }

    @Override
    public Flux<NewAction> findAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort) {
        List<Criteria> criteria = new ArrayList<>();

        Criteria nonJsTypeCriteria =
                where(fieldName(QNewAction.newAction.pluginType)).ne(PluginType.JS);
        criteria.add(nonJsTypeCriteria);

        Criteria nonModuleInstanceActionCriterion = getNonModuleInstanceActionCriterion();
        criteria.add(nonModuleInstanceActionCriterion);

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QNewAction.newAction.publishedAction) + "."
                                + fieldName(QNewAction.newAction.publishedAction.name))
                        .is(name);
                criteria.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QNewAction.newAction.publishedAction) + "."
                                + fieldName(QNewAction.newAction.publishedAction.pageId))
                        .in(pageIds);
                criteria.add(pageCriteria);
            }

        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                                + fieldName(QNewAction.newAction.unpublishedAction.name))
                        .is(name);
                criteria.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                                + fieldName(QNewAction.newAction.unpublishedAction.pageId))
                        .in(pageIds);
                criteria.add(pageCriteria);
            }

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                            + fieldName(QNewAction.newAction.unpublishedAction.deletedAt))
                    .is(null);
            criteria.add(deletedCriteria);
        }

        return queryAll(criteria, aclPermission, sort);
    }

    @Override
    public Flux<NewAction> findAllActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort) {
        /**
         * TODO : This function is called by get(params) to get all actions by params and hence
         * only covers criteria of few fields like page id, name, etc. Make this generic to cover
         * all possible fields
         */
        List<Criteria> criteria = new ArrayList<>();
        Criteria nonModuleInstanceActionCriterion = getNonModuleInstanceActionCriterion();
        criteria.add(nonModuleInstanceActionCriterion);

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QNewAction.newAction.publishedAction) + "."
                                + fieldName(QNewAction.newAction.publishedAction.name))
                        .is(name);
                criteria.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QNewAction.newAction.publishedAction) + "."
                                + fieldName(QNewAction.newAction.publishedAction.pageId))
                        .in(pageIds);
                criteria.add(pageCriteria);
            }
        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                                + fieldName(QNewAction.newAction.unpublishedAction.name))
                        .is(name);
                criteria.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                                + fieldName(QNewAction.newAction.unpublishedAction.pageId))
                        .in(pageIds);
                criteria.add(pageCriteria);
            }

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                            + fieldName(QNewAction.newAction.unpublishedAction.deletedAt))
                    .is(null);
            criteria.add(deletedCriteria);
        }

        return queryAll(criteria, aclPermission, sort);
    }

    @Override
    public Flux<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort) {

        List<Criteria> criteria = new ArrayList<>();
        Criteria applicationCriteria =
                where(fieldName(QNewAction.newAction.applicationId)).is(applicationId);

        Criteria nonModuleInstanceActionCriterion = getNonModuleInstanceActionCriterion();
        criteria.add(nonModuleInstanceActionCriterion);

        return queryAll(List.of(applicationCriteria), aclPermission, sort);
    }
}

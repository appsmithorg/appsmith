package com.appsmith.server.repositories;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.repositories.ce.CustomNewActionRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
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
    public Mono<NewAction> findPublicActionByModuleId(String moduleId) {
        List<Criteria> criteria = new ArrayList<>();

        String moduleIdPath = fieldName(QNewAction.newAction.unpublishedAction) + "."
                + fieldName(QNewAction.newAction.unpublishedAction.moduleId);
        Criteria moduleIdCriteria = Criteria.where(moduleIdPath).is(moduleId);

        Criteria nonJsTypeCriteria =
                where(fieldName(QNewAction.newAction.pluginType)).ne(PluginType.JS);

        Criteria isPublicCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.isPublic))
                .is(Boolean.TRUE);

        criteria.add(moduleIdCriteria);
        criteria.add(nonJsTypeCriteria);
        criteria.add(isPublicCriteria);
        return queryOne(criteria);
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
}

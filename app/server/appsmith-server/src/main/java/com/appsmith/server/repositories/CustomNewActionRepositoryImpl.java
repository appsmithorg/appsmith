package com.appsmith.server.repositories;

import com.appsmith.external.models.PluginType;
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

import java.util.List;

import static com.appsmith.server.constants.Constraint.NO_RECORD_LIMIT;

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
    public Flux<NewAction> findAllByApplicationIdsWithoutPermission(
            List<String> applicationIds, List<String> includeFields) {
        Criteria applicationCriteria = Criteria.where(FieldName.APPLICATION_ID).in(applicationIds);
        return queryAll(List.of(applicationCriteria), includeFields, null, null, NO_RECORD_LIMIT);
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
}

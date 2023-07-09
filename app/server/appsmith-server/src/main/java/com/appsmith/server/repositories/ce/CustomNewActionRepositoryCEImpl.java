package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.QActionConfiguration;
import com.appsmith.external.models.QBranchAwareDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.model.UpdateOneModel;
import com.mongodb.client.model.WriteModel;
import com.mongodb.client.result.InsertManyResult;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public class CustomNewActionRepositoryCEImpl extends BaseAppsmithRepositoryImpl<NewAction>
        implements CustomNewActionRepositoryCE {

    public CustomNewActionRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission) {
        Criteria applicationIdCriteria =
                where(fieldName(QNewAction.newAction.applicationId)).is(applicationId);
        return queryAll(List.of(applicationIdCriteria), aclPermission);
    }

    @Override
    public Flux<NewAction> findByApplicationId(
            String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort) {
        Criteria applicationIdCriteria =
                where(fieldName(QNewAction.newAction.applicationId)).is(applicationId);
        return queryAll(List.of(applicationIdCriteria), aclPermission, sort);
    }

    @Override
    public Mono<NewAction> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission aclPermission) {
        Criteria nameCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.name))
                .is(name);
        Criteria pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.pageId))
                .is(pageId);
        // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would
        // exist. To handle this, only fetch non-deleted actions
        Criteria deletedCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.deletedAt))
                .is(null);

        return queryOne(List.of(nameCriteria, pageCriteria, deletedCriteria), aclPermission);
    }

    @Override
    public Flux<NewAction> findByPageId(String pageId, AclPermission aclPermission) {
        String unpublishedPage = fieldName(QNewAction.newAction.unpublishedAction) + "."
                + fieldName(QNewAction.newAction.unpublishedAction.pageId);
        String publishedPage = fieldName(QNewAction.newAction.publishedAction) + "."
                + fieldName(QNewAction.newAction.publishedAction.pageId);

        Criteria pageCriteria = new Criteria()
                .orOperator(
                        where(unpublishedPage).is(pageId), where(publishedPage).is(pageId));

        return queryAll(List.of(pageCriteria), aclPermission);
    }

    @Override
    public Flux<NewAction> findByPageId(String pageId, Optional<AclPermission> aclPermission) {
        String unpublishedPage = fieldName(QNewAction.newAction.unpublishedAction) + "."
                + fieldName(QNewAction.newAction.unpublishedAction.pageId);
        String publishedPage = fieldName(QNewAction.newAction.publishedAction) + "."
                + fieldName(QNewAction.newAction.publishedAction.pageId);

        Criteria pageCriteria = new Criteria()
                .orOperator(
                        where(unpublishedPage).is(pageId), where(publishedPage).is(pageId));

        return queryAll(List.of(pageCriteria), aclPermission);
    }

    @Override
    public Flux<NewAction> findByPageId(String pageId) {
        return this.findByPageId(pageId, Optional.empty());
    }

    @Override
    public Flux<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission aclPermission) {

        List<Criteria> criteria = new ArrayList<>();

        Criteria pageCriterion;

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {
            pageCriterion = where(fieldName(QNewAction.newAction.publishedAction) + "."
                            + fieldName(QNewAction.newAction.publishedAction.pageId))
                    .is(pageId);
            criteria.add(pageCriterion);
        }
        // Fetch unpublished actions
        else {
            pageCriterion = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                            + fieldName(QNewAction.newAction.unpublishedAction.pageId))
                    .is(pageId);
            criteria.add(pageCriterion);

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                            + fieldName(QNewAction.newAction.unpublishedAction.deletedAt))
                    .is(null);
            criteria.add(deletedCriteria);
        }
        return queryAll(criteria, aclPermission);
    }

    @Override
    public Flux<NewAction> findUnpublishedActionsForRestApiOnLoad(
            Set<String> names, String pageId, String httpMethod, Boolean userSetOnLoad, AclPermission aclPermission) {
        Criteria namesCriteria = where(fieldName(QNewAction.newAction.unpublishedAction)
                        + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.name))
                .in(names);

        Criteria pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction)
                        + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.pageId))
                .is(pageId);

        Criteria userSetOnLoadCriteria = where(fieldName(QNewAction.newAction.unpublishedAction)
                        + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.userSetOnLoad))
                .is(userSetOnLoad);

        String httpMethodQueryKey = fieldName(QNewAction.newAction.unpublishedAction)
                + "."
                + fieldName(QNewAction.newAction.unpublishedAction.actionConfiguration)
                + "."
                + fieldName(QActionConfiguration.actionConfiguration.httpMethod);

        Criteria httpMethodCriteria = where(httpMethodQueryKey).is(httpMethod);
        List<Criteria> criterias = List.of(namesCriteria, pageCriteria, httpMethodCriteria, userSetOnLoadCriteria);

        return queryAll(criterias, aclPermission);
    }

    @Override
    public Flux<NewAction> findAllActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort) {
        /**
         * TODO : This function is called by get(params) to get all actions by params and hence
         * only covers criteria of few fields like page id, name, etc. Make this generic to cover
         * all possible fields
         */
        List<Criteria> criteriaList = new ArrayList<>();

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QNewAction.newAction.publishedAction) + "."
                                + fieldName(QNewAction.newAction.publishedAction.name))
                        .is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QNewAction.newAction.publishedAction) + "."
                                + fieldName(QNewAction.newAction.publishedAction.pageId))
                        .in(pageIds);
                criteriaList.add(pageCriteria);
            }
        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                                + fieldName(QNewAction.newAction.unpublishedAction.name))
                        .is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                                + fieldName(QNewAction.newAction.unpublishedAction.pageId))
                        .in(pageIds);
                criteriaList.add(pageCriteria);
            }

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                            + fieldName(QNewAction.newAction.unpublishedAction.deletedAt))
                    .is(null);
            criteriaList.add(deletedCriteria);
        }

        return queryAll(criteriaList, aclPermission, sort);
    }

    @Override
    public Flux<NewAction> findUnpublishedActionsByNameInAndPageIdAndExecuteOnLoadTrue(
            Set<String> names, String pageId, AclPermission permission) {
        List<Criteria> criteriaList = new ArrayList<>();
        if (names != null) {
            Criteria namesCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                            + fieldName(QNewAction.newAction.unpublishedAction.name))
                    .in(names);
            criteriaList.add(namesCriteria);
        }
        Criteria pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.pageId))
                .is(pageId);
        criteriaList.add(pageCriteria);

        Criteria executeOnLoadCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.executeOnLoad))
                .is(Boolean.TRUE);
        criteriaList.add(executeOnLoadCriteria);

        // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would
        // exist. To handle this, only fetch non-deleted actions
        Criteria deletedCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.deletedAt))
                .is(null);
        criteriaList.add(deletedCriteria);

        return queryAll(criteriaList, permission);
    }

    @Override
    public Flux<NewAction> findUnpublishedActionsByNameInAndPageId(
            Set<String> names, String pageId, AclPermission permission) {
        List<Criteria> criteriaList = new ArrayList<>();

        if (names != null) {
            Criteria namesCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                            + fieldName(QNewAction.newAction.unpublishedAction.name))
                    .in(names);
            Criteria fullyQualifiedNamesCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                            + fieldName(QNewAction.newAction.unpublishedAction.fullyQualifiedName))
                    .in(names);
            criteriaList.add(new Criteria().orOperator(namesCriteria, fullyQualifiedNamesCriteria));
        }
        Criteria pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.pageId))
                .is(pageId);
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
    public Flux<NewAction> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(
            String pageId, AclPermission permission) {
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
                .is(pageId);
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
    public Flux<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort) {

        Criteria applicationCriteria =
                where(fieldName(QNewAction.newAction.applicationId)).is(applicationId);

        return queryAll(List.of(applicationCriteria), aclPermission, sort);
    }

    @Override
    public Flux<NewAction> findByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission aclPermission) {

        List<Criteria> criteria = new ArrayList<>();

        Criteria applicationCriterion =
                where(fieldName(QNewAction.newAction.applicationId)).is(applicationId);
        criteria.add(applicationCriterion);

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
    public Mono<Long> countByDatasourceId(String datasourceId) {
        Criteria unpublishedDatasourceCriteria = where(
                        fieldName(QNewAction.newAction.unpublishedAction) + ".datasource._id")
                .is(new ObjectId(datasourceId));
        Criteria publishedDatasourceCriteria = where(
                        fieldName(QNewAction.newAction.publishedAction) + ".datasource._id")
                .is(new ObjectId(datasourceId));

        Criteria datasourceCriteria = where(FieldName.DELETED_AT)
                .is(null)
                .orOperator(unpublishedDatasourceCriteria, publishedDatasourceCriteria);

        Query query = new Query();
        query.addCriteria(datasourceCriteria);

        return mongoOperations.count(query, NewAction.class);
    }

    @Override
    public Mono<NewAction> findByBranchNameAndDefaultActionId(
            String branchName, String defaultActionId, AclPermission permission) {
        final String defaultResources = fieldName(QNewAction.newAction.defaultResources);
        Criteria defaultActionIdCriteria =
                where(defaultResources + "." + FieldName.ACTION_ID).is(defaultActionId);
        Criteria branchCriteria =
                where(defaultResources + "." + FieldName.BRANCH_NAME).is(branchName);
        return queryOne(List.of(defaultActionIdCriteria, branchCriteria), permission);
    }

    @Override
    public Mono<NewAction> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, AclPermission permission) {
        return findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, Optional.ofNullable(permission));
    }

    @Override
    public Mono<NewAction> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission) {
        final String defaultResources = fieldName(QBranchAwareDomain.branchAwareDomain.defaultResources);
        Criteria defaultAppIdCriteria =
                where(defaultResources + "." + FieldName.APPLICATION_ID).is(defaultApplicationId);
        Criteria gitSyncIdCriteria = where(FieldName.GIT_SYNC_ID).is(gitSyncId);
        return queryFirst(List.of(defaultAppIdCriteria, gitSyncIdCriteria), permission);
    }

    @Override
    public Flux<NewAction> findByListOfPageIds(List<String> pageIds, AclPermission permission) {

        Criteria pageIdCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.pageId))
                .in(pageIds);

        return queryAll(List.of(pageIdCriteria), permission);
    }

    @Override
    public Flux<NewAction> findByListOfPageIds(List<String> pageIds, Optional<AclPermission> permission) {
        Criteria pageIdCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                        + fieldName(QNewAction.newAction.unpublishedAction.pageId))
                .in(pageIds);

        return queryAll(List.of(pageIdCriteria), permission);
    }

    @Override
    public Flux<NewAction> findNonJsActionsByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission aclPermission) {
        List<Criteria> criteria = new ArrayList<>();

        Criteria applicationCriterion =
                where(fieldName(QNewAction.newAction.applicationId)).is(applicationId);
        criteria.add(applicationCriterion);

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

    @Override
    public Flux<NewAction> findAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort) {
        List<Criteria> criteriaList = new ArrayList<>();

        Criteria nonJsTypeCriteria =
                where(fieldName(QNewAction.newAction.pluginType)).ne(PluginType.JS);
        criteriaList.add(nonJsTypeCriteria);

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QNewAction.newAction.publishedAction) + "."
                                + fieldName(QNewAction.newAction.publishedAction.name))
                        .is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QNewAction.newAction.publishedAction) + "."
                                + fieldName(QNewAction.newAction.publishedAction.pageId))
                        .in(pageIds);
                criteriaList.add(pageCriteria);
            }

        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                                + fieldName(QNewAction.newAction.unpublishedAction.name))
                        .is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                                + fieldName(QNewAction.newAction.unpublishedAction.pageId))
                        .in(pageIds);
                criteriaList.add(pageCriteria);
            }

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "."
                            + fieldName(QNewAction.newAction.unpublishedAction.deletedAt))
                    .is(null);
            criteriaList.add(deletedCriteria);
        }

        return queryAll(criteriaList, aclPermission, sort);
    }

    /**
     * This method uses the mongodb bulk operation to save a list of new actions. When calling this method, please note
     * the following points:
     * 1. All of them will be written to database in a single DB operation.
     * 2. The list of new actions returned are same as the ones passed in the method.
     * 3. If you pass an action without ID, the ID will be generated by the database but the returned action
     * will not have the ID.
     * 4. All the auto generated fields e.g. createdAt, updatedAt should be set by the caller.
     * They'll not be generated in the bulk write.
     * 5. No constraint validation will be performed on the new actions.
     * @param newActions List of actions that'll be saved in bulk
     * @return List of actions that were passed in the method
     */
    @Override
    public Mono<List<InsertManyResult>> bulkInsert(List<NewAction> newActions) {
        if (CollectionUtils.isEmpty(newActions)) {
            return Mono.just(Collections.emptyList());
        }
        // convert the list of new actions to a list of DBObjects
        List<Document> dbObjects = newActions.stream()
                .map(newAction -> {
                    Document document = new Document();
                    mongoOperations.getConverter().write(newAction, document);
                    return document;
                })
                .collect(Collectors.toList());

        return mongoOperations
                .getCollection(mongoOperations.getCollectionName(NewAction.class))
                .flatMapMany(documentMongoCollection -> documentMongoCollection.insertMany(dbObjects))
                .collectList();
    }

    @Override
    public Mono<List<BulkWriteResult>> bulkUpdate(List<NewAction> newActions) {
        if (CollectionUtils.isEmpty(newActions)) {
            return Mono.just(Collections.emptyList());
        }

        // convert the list of new actions to a list of DBObjects
        List<WriteModel<Document>> dbObjects = newActions.stream()
                .map(newAction -> {
                    assert newAction.getId() != null;
                    Document document = new Document();
                    mongoOperations.getConverter().write(newAction, document);
                    document.remove("_id");
                    return (WriteModel<Document>) new UpdateOneModel<Document>(
                            new Document("_id", new ObjectId(newAction.getId())), new Document("$set", document));
                })
                .collect(Collectors.toList());

        return mongoOperations
                .getCollection(mongoOperations.getCollectionName(NewAction.class))
                .flatMapMany(documentMongoCollection -> documentMongoCollection.bulkWrite(dbObjects))
                .collectList();
    }

    @Override
    public Flux<NewAction> findByDefaultApplicationId(String defaultApplicationId, Optional<AclPermission> permission) {
        final String defaultResources = fieldName(QBranchAwareDomain.branchAwareDomain.defaultResources);
        Criteria defaultAppIdCriteria =
                where(defaultResources + "." + FieldName.APPLICATION_ID).is(defaultApplicationId);
        return queryAll(List.of(defaultAppIdCriteria), permission);
    }
}

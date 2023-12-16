package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.dtos.PluginTypeAndCountDTO;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.result.InsertManyResult;
import com.mongodb.client.result.UpdateResult;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.GroupOperation;
import org.springframework.data.mongodb.core.aggregation.MatchOperation;
import org.springframework.data.mongodb.core.aggregation.ProjectionOperation;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.util.CollectionUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.group;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.match;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.newAggregation;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.project;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public class CustomNewActionRepositoryCEImpl extends BaseAppsmithRepositoryImpl<NewAction>
        implements CustomNewActionRepositoryCE {

    private final MongoTemplate mongoTemplate;

    public CustomNewActionRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper,
            MongoTemplate mongoTemplate) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public List<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission) {
        Criteria applicationIdCriteria = this.getCriterionForFindByApplicationId(applicationId);
        return queryAll(List.of(applicationIdCriteria), aclPermission);
    }

    @Override
    public List<NewAction> findByApplicationId(
            String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort) {
        Criteria applicationIdCriteria = this.getCriterionForFindByApplicationId(applicationId);
        return queryAll(List.of(applicationIdCriteria), aclPermission, sort);
    }

    @Override
    public Optional<NewAction> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission aclPermission) {
        Criteria nameCriteria = where("unpublishedAction" + "." + "name").is(name);
        Criteria pageCriteria = where("unpublishedAction" + "." + "pageId").is(pageId);
        // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would
        // exist. To handle this, only fetch non-deleted actions
        Criteria deletedCriteria =
                where("unpublishedAction" + "." + "deletedAt").is(null);

        return queryOne(List.of(nameCriteria, pageCriteria, deletedCriteria), aclPermission);
    }

    @Override
    public List<NewAction> findByPageId(String pageId, AclPermission aclPermission) {
        return Collections.emptyList(); /*
        String unpublishedPage = "unpublishedAction" + "."
                + "pageId";
        String publishedPage = "publishedAction" + "."
                + "pageId";

        Criteria pageCriteria = new Criteria()
                .orOperator(
                        where(unpublishedPage).is(pageId), where(publishedPage).is(pageId));

        return queryAll(List.of(pageCriteria), aclPermission);*/
    }

    @Override
    public List<NewAction> findByPageId(String pageId, Optional<AclPermission> aclPermission) {
        String unpublishedPage = "unpublishedAction" + "." + "pageId";
        String publishedPage = "publishedAction" + "." + "pageId";

        Criteria pageCriteria = new Criteria()
                .orOperator(
                        where(unpublishedPage).is(pageId), where(publishedPage).is(pageId));

        return queryAll(List.of(pageCriteria), aclPermission);
    }

    @Override
    public List<NewAction> findByPageId(String pageId) {
        return this.findByPageId(pageId, Optional.empty());
    }

    @Override
    public List<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission aclPermission) {
        return Collections.emptyList(); /*

        List<Criteria> criteria = new ArrayList<>();

        Criteria pageCriterion;

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {
            pageCriterion = where("publishedAction" + "."
                            + "pageId")
                    .is(pageId);
            criteria.add(pageCriterion);
        }
        // Fetch unpublished actions
        else {
            pageCriterion = where("unpublishedAction" + "."
                            + "pageId")
                    .is(pageId);
            criteria.add(pageCriterion);

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria = where("unpublishedAction" + "."
                            + "deletedAt")
                    .is(null);
            criteria.add(deletedCriteria);
        }
        return queryAll(criteria, aclPermission);*/
    }

    @Override
    public List<NewAction> findUnpublishedActionsForRestApiOnLoad(
            Set<String> names, String pageId, String httpMethod, Boolean userSetOnLoad, AclPermission aclPermission) {
        return Collections.emptyList(); /*
        Criteria namesCriteria = where("unpublishedAction"
                        + "."
                        + "name")
                .in(names);

        Criteria pageCriteria = where("unpublishedAction"
                        + "."
                        + "pageId")
                .is(pageId);

        Criteria userSetOnLoadCriteria = where("unpublishedAction"
                        + "."
                        + "userSetOnLoad")
                .is(userSetOnLoad);

        String httpMethodQueryKey = "unpublishedAction"
                + "."
                + "actionConfiguration"
                + "."
                + "httpMethod";

        Criteria httpMethodCriteria = where(httpMethodQueryKey).is(httpMethod);
        List<Criteria> criterias = List.of(namesCriteria, pageCriteria, httpMethodCriteria, userSetOnLoadCriteria);

        return queryAll(criterias, aclPermission);*/
    }

    @Override
    public List<NewAction> findAllActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort) {
        List<Criteria> criteriaList =
                this.getCriteriaForFindAllActionsByNameAndPageIdsAndViewMode(name, pageIds, viewMode);

        return queryAll(criteriaList, aclPermission, sort);
    }

    protected List<Criteria> getCriteriaForFindAllActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode) {
        /**
         * TODO : This function is called by get(params) to get all actions by params and hence
         * only covers criteria of few fields like page id, name, etc. Make this generic to cover
         * all possible fields
         */
        List<Criteria> criteriaList = new ArrayList<>();

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {

            if (name != null) {
                Criteria nameCriteria = where("publishedAction" + "." + "name").is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria =
                        where("publishedAction" + "." + "pageId").in(pageIds);
                criteriaList.add(pageCriteria);
            }
        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                Criteria nameCriteria =
                        where("unpublishedAction" + "." + "name").is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria =
                        where("unpublishedAction" + "." + "pageId").in(pageIds);
                criteriaList.add(pageCriteria);
            }

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria =
                    where("unpublishedAction" + "." + "deletedAt").is(null);
            criteriaList.add(deletedCriteria);
        }
        return criteriaList;
    }

    @Override
    public List<NewAction> findUnpublishedActionsByNameInAndPageIdAndExecuteOnLoadTrue(
            Set<String> names, String pageId, AclPermission permission) {
        return Collections.emptyList(); /*
        List<Criteria> criteriaList = new ArrayList<>();
        if (names != null) {
            Criteria namesCriteria = where("unpublishedAction" + "."
                            + "name")
                    .in(names);
            criteriaList.add(namesCriteria);
        }
        Criteria pageCriteria = where("unpublishedAction" + "."
                        + "pageId")
                .is(pageId);
        criteriaList.add(pageCriteria);

        Criteria executeOnLoadCriteria = where("unpublishedAction" + "."
                        + "executeOnLoad")
                .is(Boolean.TRUE);
        criteriaList.add(executeOnLoadCriteria);

        // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would
        // exist. To handle this, only fetch non-deleted actions
        Criteria deletedCriteria = where("unpublishedAction" + "."
                        + "deletedAt")
                .is(null);
        criteriaList.add(deletedCriteria);

        return queryAll(criteriaList, permission);*/
    }

    @Override
    public List<NewAction> findUnpublishedActionsByNameInAndPageId(
            Set<String> names, String pageId, AclPermission permission) {
        return Collections.emptyList(); /*
        List<Criteria> criteriaList = new ArrayList<>();

        if (names != null) {
            Criteria namesCriteria = where("unpublishedAction" + "."
                            + "name")
                    .in(names);
            Criteria fullyQualifiedNamesCriteria = where("unpublishedAction" + "."
                            + "fullyQualifiedName")
                    .in(names);
            criteriaList.add(new Criteria().orOperator(namesCriteria, fullyQualifiedNamesCriteria));
        }
        Criteria pageCriteria = where("unpublishedAction" + "."
                        + "pageId")
                .is(pageId);
        criteriaList.add(pageCriteria);

        // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would
        // exist. To handle this, only fetch non-deleted actions
        Criteria deletedCriteria = where("unpublishedAction" + "."
                        + "deletedAt")
                .is(null);
        criteriaList.add(deletedCriteria);

        return queryAll(criteriaList, permission);*/
    }

    @Override
    public List<NewAction> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(
            String pageId, AclPermission permission) {
        return Collections.emptyList(); /*
        List<Criteria> criteriaList = new ArrayList<>();

        Criteria executeOnLoadCriteria = where("unpublishedAction" + "."
                        + "executeOnLoad")
                .is(Boolean.TRUE);
        criteriaList.add(executeOnLoadCriteria);

        Criteria setByUserCriteria = where("unpublishedAction" + "."
                        + "userSetOnLoad")
                .is(Boolean.TRUE);
        criteriaList.add(setByUserCriteria);

        Criteria pageCriteria = where("unpublishedAction" + "."
                        + "pageId")
                .is(pageId);
        criteriaList.add(pageCriteria);

        // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would
        // exist. To handle this, only fetch non-deleted actions
        Criteria deletedCriteria = where("unpublishedAction" + "."
                        + "deletedAt")
                .is(null);
        criteriaList.add(deletedCriteria);

        return queryAll(criteriaList, permission);*/
    }

    @Override
    public List<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort) {
        return Collections.emptyList(); /*

        Criteria applicationCriteria = this.getCriterionForFindByApplicationId(applicationId);

        return queryAll(List.of(applicationCriteria), aclPermission, sort);*/
    }

    protected Criteria getCriterionForFindByApplicationId(String applicationId) {
        Criteria applicationCriteria =
                where(fieldName(QNewAction.newAction.applicationId)).is(applicationId);
        return applicationCriteria;
    }

    @Override
    public List<NewAction> findByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission aclPermission) {
        return Collections.emptyList(); /*

        List<Criteria> criteria = this.getCriteriaForFindByApplicationIdAndViewMode(applicationId, viewMode);

        return queryAll(criteria, aclPermission);*/
    }

    protected List<Criteria> getCriteriaForFindByApplicationIdAndViewMode(String applicationId, Boolean viewMode) {
        return Collections.emptyList(); /*
        List<Criteria> criteria = new ArrayList<>();


        criteria.add(applicationCriterion);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriterion = where("unpublishedAction" + "."
                            + "deletedAt")
                    .is(null);
            criteria.add(deletedCriterion);
        }*/
    }

    @Override
    public Optional<Long> countByDatasourceId(String datasourceId) {
        return Optional.empty(); /*
        Criteria unpublishedDatasourceCriteria =
                where("unpublishedAction" + ".datasource._id").is(new ObjectId(datasourceId));
        Criteria publishedDatasourceCriteria =
                where("publishedAction" + ".datasource._id").is(new ObjectId(datasourceId));

        Criteria datasourceCriteria =
                notDeleted().orOperator(unpublishedDatasourceCriteria, publishedDatasourceCriteria);

        Query query = new Query();
        query.addCriteria(datasourceCriteria);

        return mongoOperations.count(query, NewAction.class);*/
    }

    @Override
    public Optional<NewAction> findByBranchNameAndDefaultActionId(
            String branchName, String defaultActionId, AclPermission permission) {
        final String defaultResources = "defaultResources";
        Criteria defaultActionIdCriteria =
                where(defaultResources + "." + FieldName.ACTION_ID).is(defaultActionId);
        Criteria branchCriteria =
                where(defaultResources + "." + FieldName.BRANCH_NAME).is(branchName);
        return queryOne(List.of(defaultActionIdCriteria, branchCriteria), permission);
    }

    @Override
    public Optional<NewAction> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, AclPermission permission) {
        return findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, Optional.ofNullable(permission));
    }

    @Override
    public Optional<NewAction> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission) {
        final String defaultResources = "defaultResources";
        Criteria defaultAppIdCriteria =
                where(defaultResources + "." + FieldName.APPLICATION_ID).is(defaultApplicationId);
        Criteria gitSyncIdCriteria = where(FieldName.GIT_SYNC_ID).is(gitSyncId);
        return queryFirst(List.of(defaultAppIdCriteria, gitSyncIdCriteria), permission);
    }

    @Override
    public List<NewAction> findByPageIds(List<String> pageIds, AclPermission permission) {

        Criteria pageIdCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "." + "pageId")
                .in(pageIds);

        return queryAll(List.of(pageIdCriteria), permission);
    }

    @Override
    public List<NewAction> findByPageIds(List<String> pageIds, Optional<AclPermission> permission) {
        Criteria pageIdCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "." + "pageId")
                .in(pageIds);

        return queryAll(List.of(pageIdCriteria), permission);
    }

    @Override
    public List<NewAction> findNonJsActionsByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission aclPermission) {
        return Collections.emptyList(); /*

        criteria.add(applicationCriterion);

        Criteria nonJsTypeCriteria =
                where("pluginType").ne(PluginType.JS);
        criteria.add(nonJsTypeCriteria);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriterion = where("unpublishedAction" + "."
                            + "deletedAt")
                    .is(null);
            criteria.add(deletedCriterion);
        }*/
    }

    @Override
    public List<NewAction> findAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort) {
        return Collections.emptyList(); /*

        List<Criteria> criteriaList = new ArrayList<>();

        Criteria nonJsTypeCriteria =
                where("pluginType").ne(PluginType.JS);
        criteriaList.add(nonJsTypeCriteria);

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {

            if (name != null) {
                Criteria nameCriteria = where("publishedAction" + "."
                                + "name")
                        .is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where("publishedAction" + "."
                                + "pageId")
                        .in(pageIds);
                criteriaList.add(pageCriteria);
            }

        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                Criteria nameCriteria = where("unpublishedAction" + "."
                                + "name")
                        .is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where("unpublishedAction" + "."
                                + "pageId")
                        .in(pageIds);
                criteriaList.add(pageCriteria);
            }

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria = where("unpublishedAction" + "."
                            + "deletedAt")
                    .is(null);
            criteriaList.add(deletedCriteria);
        }*/
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
    public Optional<List<InsertManyResult>> bulkInsert(List<NewAction> newActions) {
        if (CollectionUtils.isEmpty(newActions)) {
            return Optional.empty();
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
                .collectList()
                .blockOptional();
    }

    @Override
    public Optional<List<BulkWriteResult>> bulkUpdate(List<NewAction> newActions) {
        return Optional.empty(); /*
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
                .collectList();*/
    }

    @Override
    public List<NewAction> findByDefaultApplicationId(String defaultApplicationId, Optional<AclPermission> permission) {
        final String defaultResources = "defaultResources";
        Criteria defaultAppIdCriteria =
                where(defaultResources + "." + FieldName.APPLICATION_ID).is(defaultApplicationId);
        return queryAll(List.of(defaultAppIdCriteria), permission);
    }

    @Override
    public Optional<List<BulkWriteResult>> publishActions(String applicationId, AclPermission permission) {
        return Optional.empty(); /*
        Criteria applicationIdCriteria = this.getCriterionForFindByApplicationId(applicationId);


        Optional<Set<String>> permissionGroupsMono =
                Optional.of(getCurrentUserPermissionGroupsIfRequired(Optional.ofNullable(permission)));

        return permissionGroupsMono
                .flatMap(permissionGroups -> {
                    return Mono.fromCallable(() -> {
                                AggregationOperation matchAggregationWithPermission = null;
                                if (permission == null) {
                                    matchAggregationWithPermission =
                                            Aggregation.match(new Criteria().andOperator(notDeleted()));
                                } else {
                                    matchAggregationWithPermission = Aggregation.match(new Criteria()
                                            .andOperator(notDeleted(), userAcl(permissionGroups, permission)));
                                }
                                AggregationOperation matchAggregation = Aggregation.match(applicationIdCriteria);
                                AggregationOperation wholeProjection = Aggregation.project(NewAction.class);
                                AggregationOperation addFieldsOperation = Aggregation.addFields()
                                        .addField("publishedAction")
                                        .withValueOf(Fields.field("unpublishedAction"))
                                        .build();
                                Aggregation combinedAggregation = Aggregation.newAggregation(
                                        matchAggregation,
                                        matchAggregationWithPermission,
                                        wholeProjection,
                                        addFieldsOperation);
                                return mongoTemplate.aggregate(combinedAggregation, NewAction.class, NewAction.class);
                            })
                            .subscribeOn(Schedulers.boundedElastic());
                })
                .flatMap(updatedResults -> bulkUpdate(updatedResults.getMappedResults()));*/
    }

    @Override
    public Optional<UpdateResult> archiveDeletedUnpublishedActions(String applicationId, AclPermission permission) {
        Criteria applicationIdCriteria = this.getCriterionForFindByApplicationId(applicationId);
        String unpublishedDeletedAtFieldName =
                String.format("%s.%s", fieldName(QNewAction.newAction.unpublishedAction), "deletedAt");
        Criteria deletedFromUnpublishedCriteria =
                where(unpublishedDeletedAtFieldName).ne(null);

        Update update = new Update();
        update.set(FieldName.DELETED, true);
        update.set(FieldName.DELETED_AT, Instant.now());
        return updateByCriteria(List.of(applicationIdCriteria, deletedFromUnpublishedCriteria), update, permission)
                .blockOptional();
    }

    @Override
    public List<PluginTypeAndCountDTO> countActionsByPluginType(String applicationId) {
        GroupOperation countByPluginType = group("pluginType").count().as("count");
        MatchOperation filterStates =
                match(where("applicationId").is(applicationId).and("deleted").ne(Boolean.TRUE));
        ProjectionOperation projectionOperation = project("count").and("_id").as("pluginType");
        Aggregation aggregation = newAggregation(filterStates, countByPluginType, projectionOperation);
        return mongoOperations
                .aggregate(aggregation, mongoOperations.getCollectionName(NewAction.class), PluginTypeAndCountDTO.class)
                .collectList()
                .block();
    }

    @Override
    public List<NewAction> findAllByApplicationIdsWithoutPermission(
            List<String> applicationIds, List<String> includeFields) {
        Criteria applicationCriteria = Criteria.where(FieldName.APPLICATION_ID).in(applicationIds);
        return queryAll(List.of(applicationCriteria), includeFields, null, null, NO_RECORD_LIMIT);
    }

    @Override
    public List<NewAction> findAllUnpublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        List<Criteria> criteriaList = new ArrayList<>();

        String contextIdPath = "unpublishedAction" + "." + "pageId";
        String contextTypePath = "unpublishedAction" + "." + "contextType";
        Criteria contextIdAndContextTypeCriteria =
                where(contextIdPath).is(contextId).and(contextTypePath).is(contextType);

        criteriaList.add(contextIdAndContextTypeCriteria);

        Criteria jsInclusionOrExclusionCriteria;
        if (includeJs) {
            jsInclusionOrExclusionCriteria = where("pluginType").is(PluginType.JS);
        } else {
            jsInclusionOrExclusionCriteria = where("pluginType").ne(PluginType.JS);
        }

        criteriaList.add(jsInclusionOrExclusionCriteria);

        return queryAll(List.of(contextIdAndContextTypeCriteria), Optional.of(permission));
    }

    @Override
    public List<NewAction> findAllPublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        List<Criteria> criteriaList = new ArrayList<>();
        String contextIdPath = "publishedAction" + "." + "pageId";
        String contextTypePath = "publishedAction" + "." + "contextType";
        Criteria contextIdAndContextTypeCriteria =
                where(contextIdPath).is(contextId).and(contextTypePath).is(contextType);

        criteriaList.add(contextIdAndContextTypeCriteria);

        Criteria jsInclusionOrExclusionCriteria;
        if (includeJs) {
            jsInclusionOrExclusionCriteria = where("pluginType").is(PluginType.JS);
        } else {
            jsInclusionOrExclusionCriteria = where("pluginType").ne(PluginType.JS);
        }

        criteriaList.add(jsInclusionOrExclusionCriteria);

        return queryAll(List.of(contextIdAndContextTypeCriteria), Optional.of(permission));
    }
}

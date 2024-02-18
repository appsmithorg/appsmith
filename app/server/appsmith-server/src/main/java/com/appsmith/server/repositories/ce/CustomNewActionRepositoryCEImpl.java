package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.QActionConfiguration;
import com.appsmith.external.models.QBranchAwareDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.QAction;
import com.appsmith.server.dtos.PluginTypeAndCountDTO;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.mongodb.client.result.UpdateResult;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.aggregation.Fields;
import org.springframework.data.mongodb.core.aggregation.GroupOperation;
import org.springframework.data.mongodb.core.aggregation.MatchOperation;
import org.springframework.data.mongodb.core.aggregation.ProjectionOperation;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.group;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.match;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.newAggregation;
import static org.springframework.data.mongodb.core.aggregation.Aggregation.project;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public class CustomNewActionRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Action>
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
    public Flux<Action> findByApplicationId(String applicationId, AclPermission aclPermission) {
        Criteria applicationIdCriteria = this.getCriterionForFindByApplicationId(applicationId);
        return queryBuilder()
                .criteria(applicationIdCriteria)
                .permission(aclPermission)
                .all();
    }

    @Override
    public Flux<Action> findByApplicationId(
            String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort) {
        Criteria applicationIdCriteria = this.getCriterionForFindByApplicationId(applicationId);
        return queryBuilder()
                .criteria(applicationIdCriteria)
                .permission(aclPermission.orElse(null))
                .sort(sort.orElse(null))
                .all();
    }

    @Override
    public Mono<Action> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission aclPermission) {
        Criteria nameCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                        + fieldName(QAction.action.unpublishedAction.name))
                .is(name);
        Criteria pageCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                        + fieldName(QAction.action.unpublishedAction.pageId))
                .is(pageId);
        // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would
        // exist. To handle this, only fetch non-deleted actions
        Criteria deletedCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                        + fieldName(QAction.action.unpublishedAction.deletedAt))
                .is(null);

        return queryBuilder()
                .criteria(nameCriteria, pageCriteria, deletedCriteria)
                .permission(aclPermission)
                .one();
    }

    @Override
    public Flux<Action> findByPageId(String pageId, AclPermission aclPermission) {
        String unpublishedPage =
                fieldName(QAction.action.unpublishedAction) + "." + fieldName(QAction.action.unpublishedAction.pageId);
        String publishedPage =
                fieldName(QAction.action.publishedAction) + "." + fieldName(QAction.action.publishedAction.pageId);

        Criteria pageCriteria = new Criteria()
                .orOperator(
                        where(unpublishedPage).is(pageId), where(publishedPage).is(pageId));

        return queryBuilder().criteria(pageCriteria).permission(aclPermission).all();
    }

    @Override
    public Flux<Action> findByPageId(String pageId, Optional<AclPermission> aclPermission) {
        String unpublishedPage =
                fieldName(QAction.action.unpublishedAction) + "." + fieldName(QAction.action.unpublishedAction.pageId);
        String publishedPage =
                fieldName(QAction.action.publishedAction) + "." + fieldName(QAction.action.publishedAction.pageId);

        Criteria pageCriteria = new Criteria()
                .orOperator(
                        where(unpublishedPage).is(pageId), where(publishedPage).is(pageId));

        return queryBuilder()
                .criteria(pageCriteria)
                .permission(aclPermission.orElse(null))
                .all();
    }

    @Override
    public Flux<Action> findByPageId(String pageId) {
        return this.findByPageId(pageId, Optional.empty());
    }

    @Override
    public Flux<Action> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission aclPermission) {

        List<Criteria> criteria = new ArrayList<>();

        Criteria pageCriterion;

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {
            pageCriterion = where(fieldName(QAction.action.publishedAction) + "."
                            + fieldName(QAction.action.publishedAction.pageId))
                    .is(pageId);
            criteria.add(pageCriterion);
        }
        // Fetch unpublished actions
        else {
            pageCriterion = where(fieldName(QAction.action.unpublishedAction) + "."
                            + fieldName(QAction.action.unpublishedAction.pageId))
                    .is(pageId);
            criteria.add(pageCriterion);

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                            + fieldName(QAction.action.unpublishedAction.deletedAt))
                    .is(null);
            criteria.add(deletedCriteria);
        }
        return queryBuilder().criteria(criteria).permission(aclPermission).all();
    }

    @Override
    public Flux<Action> findUnpublishedActionsForRestApiOnLoad(
            Set<String> names, String pageId, String httpMethod, Boolean userSetOnLoad, AclPermission aclPermission) {
        Criteria namesCriteria = where(fieldName(QAction.action.unpublishedAction)
                        + "."
                        + fieldName(QAction.action.unpublishedAction.name))
                .in(names);

        Criteria pageCriteria = where(fieldName(QAction.action.unpublishedAction)
                        + "."
                        + fieldName(QAction.action.unpublishedAction.pageId))
                .is(pageId);

        Criteria userSetOnLoadCriteria = where(fieldName(QAction.action.unpublishedAction)
                        + "."
                        + fieldName(QAction.action.unpublishedAction.userSetOnLoad))
                .is(userSetOnLoad);

        String httpMethodQueryKey = fieldName(QAction.action.unpublishedAction)
                + "."
                + fieldName(QAction.action.unpublishedAction.actionConfiguration)
                + "."
                + fieldName(QActionConfiguration.actionConfiguration.httpMethod);

        Criteria httpMethodCriteria = where(httpMethodQueryKey).is(httpMethod);
        List<Criteria> criterias = List.of(namesCriteria, pageCriteria, httpMethodCriteria, userSetOnLoadCriteria);

        return queryBuilder().criteria(criterias).permission(aclPermission).all();
    }

    @Override
    public Flux<Action> findAllActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort) {
        List<Criteria> criteriaList =
                this.getCriteriaForFindAllActionsByNameAndPageIdsAndViewMode(name, pageIds, viewMode);

        return queryBuilder()
                .criteria(criteriaList)
                .permission(aclPermission)
                .sort(sort)
                .all();
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
                Criteria nameCriteria = where(fieldName(QAction.action.publishedAction) + "."
                                + fieldName(QAction.action.publishedAction.name))
                        .is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QAction.action.publishedAction) + "."
                                + fieldName(QAction.action.publishedAction.pageId))
                        .in(pageIds);
                criteriaList.add(pageCriteria);
            }
        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                                + fieldName(QAction.action.unpublishedAction.name))
                        .is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                                + fieldName(QAction.action.unpublishedAction.pageId))
                        .in(pageIds);
                criteriaList.add(pageCriteria);
            }

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                            + fieldName(QAction.action.unpublishedAction.deletedAt))
                    .is(null);
            criteriaList.add(deletedCriteria);
        }
        return criteriaList;
    }

    @Override
    public Flux<Action> findUnpublishedActionsByNameInAndPageIdAndExecuteOnLoadTrue(
            Set<String> names, String pageId, AclPermission permission) {
        List<Criteria> criteriaList = new ArrayList<>();
        if (names != null) {
            Criteria namesCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                            + fieldName(QAction.action.unpublishedAction.name))
                    .in(names);
            criteriaList.add(namesCriteria);
        }
        Criteria pageCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                        + fieldName(QAction.action.unpublishedAction.pageId))
                .is(pageId);
        criteriaList.add(pageCriteria);

        Criteria executeOnLoadCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                        + fieldName(QAction.action.unpublishedAction.executeOnLoad))
                .is(Boolean.TRUE);
        criteriaList.add(executeOnLoadCriteria);

        // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would
        // exist. To handle this, only fetch non-deleted actions
        Criteria deletedCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                        + fieldName(QAction.action.unpublishedAction.deletedAt))
                .is(null);
        criteriaList.add(deletedCriteria);

        return queryBuilder().criteria(criteriaList).permission(permission).all();
    }

    @Override
    public Flux<Action> findUnpublishedActionsByNameInAndPageId(
            Set<String> names, String pageId, AclPermission permission) {
        List<Criteria> criteriaList = new ArrayList<>();

        if (names != null) {
            Criteria namesCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                            + fieldName(QAction.action.unpublishedAction.name))
                    .in(names);
            Criteria fullyQualifiedNamesCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                            + fieldName(QAction.action.unpublishedAction.fullyQualifiedName))
                    .in(names);
            criteriaList.add(new Criteria().orOperator(namesCriteria, fullyQualifiedNamesCriteria));
        }
        Criteria pageCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                        + fieldName(QAction.action.unpublishedAction.pageId))
                .is(pageId);
        criteriaList.add(pageCriteria);

        // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would
        // exist. To handle this, only fetch non-deleted actions
        Criteria deletedCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                        + fieldName(QAction.action.unpublishedAction.deletedAt))
                .is(null);
        criteriaList.add(deletedCriteria);

        return queryBuilder().criteria(criteriaList).permission(permission).all();
    }

    @Override
    public Flux<Action> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(
            String pageId, AclPermission permission) {
        List<Criteria> criteriaList = new ArrayList<>();

        Criteria executeOnLoadCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                        + fieldName(QAction.action.unpublishedAction.executeOnLoad))
                .is(Boolean.TRUE);
        criteriaList.add(executeOnLoadCriteria);

        Criteria setByUserCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                        + fieldName(QAction.action.unpublishedAction.userSetOnLoad))
                .is(Boolean.TRUE);
        criteriaList.add(setByUserCriteria);

        Criteria pageCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                        + fieldName(QAction.action.unpublishedAction.pageId))
                .is(pageId);
        criteriaList.add(pageCriteria);

        // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would
        // exist. To handle this, only fetch non-deleted actions
        Criteria deletedCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                        + fieldName(QAction.action.unpublishedAction.deletedAt))
                .is(null);
        criteriaList.add(deletedCriteria);

        return queryBuilder().criteria(criteriaList).permission(permission).all();
    }

    @Override
    public Flux<Action> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort) {

        Criteria applicationCriteria = this.getCriterionForFindByApplicationId(applicationId);

        return queryBuilder()
                .criteria(applicationCriteria)
                .permission(aclPermission)
                .sort(sort)
                .all();
    }

    protected Criteria getCriterionForFindByApplicationId(String applicationId) {
        Criteria applicationCriteria =
                where(fieldName(QAction.action.applicationId)).is(applicationId);
        return applicationCriteria;
    }

    @Override
    public Flux<Action> findByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission aclPermission) {

        List<Criteria> criteria = this.getCriteriaForFindByApplicationIdAndViewMode(applicationId, viewMode);

        return queryBuilder().criteria(criteria).permission(aclPermission).all();
    }

    protected List<Criteria> getCriteriaForFindByApplicationIdAndViewMode(String applicationId, Boolean viewMode) {
        List<Criteria> criteria = new ArrayList<>();

        Criteria applicationCriterion = this.getCriterionForFindByApplicationId(applicationId);
        criteria.add(applicationCriterion);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriterion = where(fieldName(QAction.action.unpublishedAction) + "."
                            + fieldName(QAction.action.unpublishedAction.deletedAt))
                    .is(null);
            criteria.add(deletedCriterion);
        }
        return criteria;
    }

    @Override
    public Mono<Long> countByDatasourceId(String datasourceId) {
        Criteria unpublishedDatasourceCriteria = where(fieldName(QAction.action.unpublishedAction) + ".datasource._id")
                .is(new ObjectId(datasourceId));
        Criteria publishedDatasourceCriteria = where(fieldName(QAction.action.publishedAction) + ".datasource._id")
                .is(new ObjectId(datasourceId));

        Criteria datasourceCriteria =
                notDeleted().orOperator(unpublishedDatasourceCriteria, publishedDatasourceCriteria);

        Query query = new Query();
        query.addCriteria(datasourceCriteria);

        return mongoOperations.count(query, Action.class);
    }

    @Override
    public Mono<Action> findByBranchNameAndDefaultActionId(
            String branchName, String defaultActionId, AclPermission permission) {
        final String defaultResources = fieldName(QAction.action.defaultResources);
        Criteria defaultActionIdCriteria =
                where(defaultResources + "." + FieldName.ACTION_ID).is(defaultActionId);
        Criteria branchCriteria =
                where(defaultResources + "." + FieldName.BRANCH_NAME).is(branchName);
        return queryBuilder()
                .criteria(defaultActionIdCriteria, branchCriteria)
                .permission(permission)
                .one();
    }

    @Override
    public Mono<Action> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, AclPermission permission) {
        return findByGitSyncIdAndDefaultApplicationId(defaultApplicationId, gitSyncId, Optional.ofNullable(permission));
    }

    @Override
    public Mono<Action> findByGitSyncIdAndDefaultApplicationId(
            String defaultApplicationId, String gitSyncId, Optional<AclPermission> permission) {
        final String defaultResources = fieldName(QBranchAwareDomain.branchAwareDomain.defaultResources);
        Criteria defaultAppIdCriteria =
                where(defaultResources + "." + FieldName.APPLICATION_ID).is(defaultApplicationId);
        Criteria gitSyncIdCriteria = where(FieldName.GIT_SYNC_ID).is(gitSyncId);
        return queryBuilder()
                .criteria(defaultAppIdCriteria, gitSyncIdCriteria)
                .permission(permission.orElse(null))
                .first();
    }

    @Override
    public Flux<Action> findByPageIds(List<String> pageIds, AclPermission permission) {

        Criteria pageIdCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                        + fieldName(QAction.action.unpublishedAction.pageId))
                .in(pageIds);

        return queryBuilder().criteria(pageIdCriteria).permission(permission).all();
    }

    @Override
    public Flux<Action> findByPageIds(List<String> pageIds, Optional<AclPermission> permission) {
        Criteria pageIdCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                        + fieldName(QAction.action.unpublishedAction.pageId))
                .in(pageIds);

        return queryBuilder()
                .criteria(pageIdCriteria)
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    public Flux<Action> findNonJsActionsByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission aclPermission) {
        List<Criteria> criteria =
                this.getCriteriaForFindNonJsActionsByApplicationIdAndViewMode(applicationId, viewMode);

        return queryBuilder().criteria(criteria).permission(aclPermission).all();
    }

    protected List<Criteria> getCriteriaForFindNonJsActionsByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode) {
        List<Criteria> criteria = new ArrayList<>();

        Criteria applicationCriterion = this.getCriterionForFindByApplicationId(applicationId);
        criteria.add(applicationCriterion);

        Criteria nonJsTypeCriteria = where(fieldName(QAction.action.pluginType)).ne(PluginType.JS);
        criteria.add(nonJsTypeCriteria);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriterion = where(fieldName(QAction.action.unpublishedAction) + "."
                            + fieldName(QAction.action.unpublishedAction.deletedAt))
                    .is(null);
            criteria.add(deletedCriterion);
        }
        return criteria;
    }

    @Override
    public Flux<Action> findAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort) {
        List<Criteria> criteriaList =
                this.getCriteriaForFindAllNonJsActionsByNameAndPageIdsAndViewMode(name, pageIds, viewMode);

        return queryBuilder()
                .criteria(criteriaList)
                .permission(aclPermission)
                .sort(sort)
                .all();
    }

    protected List<Criteria> getCriteriaForFindAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode) {
        List<Criteria> criteriaList = new ArrayList<>();

        Criteria nonJsTypeCriteria = where(fieldName(QAction.action.pluginType)).ne(PluginType.JS);
        criteriaList.add(nonJsTypeCriteria);

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QAction.action.publishedAction) + "."
                                + fieldName(QAction.action.publishedAction.name))
                        .is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QAction.action.publishedAction) + "."
                                + fieldName(QAction.action.publishedAction.pageId))
                        .in(pageIds);
                criteriaList.add(pageCriteria);
            }

        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                                + fieldName(QAction.action.unpublishedAction.name))
                        .is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                                + fieldName(QAction.action.unpublishedAction.pageId))
                        .in(pageIds);
                criteriaList.add(pageCriteria);
            }

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria = where(fieldName(QAction.action.unpublishedAction) + "."
                            + fieldName(QAction.action.unpublishedAction.deletedAt))
                    .is(null);
            criteriaList.add(deletedCriteria);
        }
        return criteriaList;
    }

    @Override
    public Flux<Action> findByDefaultApplicationId(String defaultApplicationId, Optional<AclPermission> permission) {
        final String defaultResources = fieldName(QBranchAwareDomain.branchAwareDomain.defaultResources);
        Criteria defaultAppIdCriteria =
                where(defaultResources + "." + FieldName.APPLICATION_ID).is(defaultApplicationId);
        return queryBuilder()
                .criteria(defaultAppIdCriteria)
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    public Mono<Void> publishActions(String applicationId, AclPermission permission) {
        Criteria applicationIdCriteria = this.getCriterionForFindByApplicationId(applicationId);

        Mono<Set<String>> permissionGroupsMono =
                getCurrentUserPermissionGroupsIfRequired(Optional.ofNullable(permission));

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
                                AggregationOperation wholeProjection = Aggregation.project(Action.class);
                                AggregationOperation addFieldsOperation = Aggregation.addFields()
                                        .addField(fieldName(QAction.action.publishedAction))
                                        .withValueOf(Fields.field(fieldName(QAction.action.unpublishedAction)))
                                        .build();
                                Aggregation combinedAggregation = Aggregation.newAggregation(
                                        matchAggregation,
                                        matchAggregationWithPermission,
                                        wholeProjection,
                                        addFieldsOperation);
                                return mongoTemplate.aggregate(combinedAggregation, Action.class, Action.class);
                            })
                            .subscribeOn(Schedulers.boundedElastic());
                })
                .flatMap(updatedResults -> bulkUpdate(updatedResults.getMappedResults()));
    }

    @Override
    public Mono<UpdateResult> archiveDeletedUnpublishedActions(String applicationId, AclPermission permission) {
        Criteria applicationIdCriteria = this.getCriterionForFindByApplicationId(applicationId);
        String unpublishedDeletedAtFieldName = String.format(
                "%s.%s",
                fieldName(QAction.action.unpublishedAction), fieldName(QAction.action.unpublishedAction.deletedAt));
        Criteria deletedFromUnpublishedCriteria =
                where(unpublishedDeletedAtFieldName).ne(null);

        Update update = new Update();
        update.set(FieldName.DELETED, true);
        update.set(FieldName.DELETED_AT, Instant.now());
        return queryBuilder()
                .criteria(applicationIdCriteria, deletedFromUnpublishedCriteria)
                .permission(permission)
                .updateAll(update);
    }

    @Override
    public Flux<PluginTypeAndCountDTO> countActionsByPluginType(String applicationId) {
        GroupOperation countByPluginType =
                group(fieldName(QAction.action.pluginType)).count().as("count");
        MatchOperation filterStates = match(
                where(fieldName(QAction.action.applicationId)).is(applicationId).andOperator(notDeleted()));
        ProjectionOperation projectionOperation = project("count").and("_id").as("pluginType");
        Aggregation aggregation = newAggregation(filterStates, countByPluginType, projectionOperation);
        return mongoOperations.aggregate(
                aggregation, mongoOperations.getCollectionName(Action.class), PluginTypeAndCountDTO.class);
    }

    @Override
    public Flux<Action> findAllByApplicationIdsWithoutPermission(
            List<String> applicationIds, List<String> includeFields) {
        Criteria applicationCriteria = Criteria.where(FieldName.APPLICATION_ID).in(applicationIds);
        return queryBuilder()
                .criteria(applicationCriteria)
                .fields(includeFields)
                .all();
    }

    @Override
    public Flux<Action> findAllUnpublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        List<Criteria> criteriaList = new ArrayList<>();

        String contextIdPath = completeFieldName(QAction.action.unpublishedAction.pageId);
        String contextTypePath = completeFieldName(QAction.action.unpublishedAction.contextType);
        Criteria contextTypeCriterion = new Criteria()
                .orOperator(
                        where(contextTypePath).is(contextType),
                        where(contextTypePath).isNull());
        Criteria contextIdAndContextTypeCriteria =
                where(contextIdPath).is(contextId).andOperator(contextTypeCriterion);

        criteriaList.add(contextIdAndContextTypeCriteria);

        if (!includeJs) {
            Criteria jsInclusionOrExclusionCriteria =
                    where(fieldName(QAction.action.pluginType)).ne(PluginType.JS);
            criteriaList.add(jsInclusionOrExclusionCriteria);
        }

        return queryBuilder().criteria(criteriaList).permission(permission).all();
    }

    @Override
    public Flux<Action> findAllPublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        List<Criteria> criteriaList = new ArrayList<>();
        String contextIdPath = completeFieldName(QAction.action.publishedAction.pageId);
        String contextTypePath = completeFieldName(QAction.action.publishedAction.contextType);
        Criteria contextIdAndContextTypeCriteria =
                where(contextIdPath).is(contextId).and(contextTypePath).is(contextType);

        criteriaList.add(contextIdAndContextTypeCriteria);

        Criteria jsInclusionOrExclusionCriteria;
        if (includeJs) {
            jsInclusionOrExclusionCriteria =
                    where(fieldName(QAction.action.pluginType)).is(PluginType.JS);
        } else {
            jsInclusionOrExclusionCriteria =
                    where(fieldName(QAction.action.pluginType)).ne(PluginType.JS);
        }

        criteriaList.add(jsInclusionOrExclusionCriteria);

        return queryBuilder().criteria(criteriaList).permission(permission).all();
    }
}

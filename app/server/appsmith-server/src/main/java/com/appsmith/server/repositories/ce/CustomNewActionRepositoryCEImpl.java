package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.QNewAction;
import com.appsmith.server.dtos.PluginTypeAndCountDTO;
import com.appsmith.server.helpers.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.result.UpdateResult;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.GroupOperation;
import org.springframework.data.mongodb.core.aggregation.MatchOperation;
import org.springframework.data.mongodb.core.aggregation.ProjectionOperation;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

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
        return queryBuilder()
                .criteria(applicationIdCriteria)
                .permission(aclPermission)
                .all();
    }

    @Override
    public List<NewAction> findByApplicationId(
            String applicationId, Optional<AclPermission> aclPermission, Optional<Sort> sort) {
        Criteria applicationIdCriteria = this.getCriterionForFindByApplicationId(applicationId);
        return queryBuilder()
                .criteria(applicationIdCriteria)
                .permission(aclPermission.orElse(null))
                .sort(sort.orElse(null))
                .all();
    }

    @Override
    public Optional<NewAction> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission aclPermission) {
        Criteria nameCriteria = where("unpublishedAction" + "." + "name").is(name);
        Criteria pageCriteria = where("unpublishedAction" + "." + "pageId").is(pageId);
        // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would
        // exist. To handle this, only fetch non-deleted actions
        Criteria deletedCriteria =
                where("unpublishedAction" + "." + "deletedAt").is(null);

        return queryBuilder()
                .criteria(nameCriteria, pageCriteria, deletedCriteria)
                .permission(aclPermission)
                .one();
    }

    @Override
    public List<NewAction> findByPageId(String pageId, AclPermission aclPermission) {
        throw new ex.Marker("findByPageId"); /*
        String unpublishedPage = "unpublishedAction" + "."
                + "pageId";
        String publishedPage = "publishedAction" + "."
                + "pageId";

        Criteria pageCriteria = new Criteria()
                .orOperator(
                        where(unpublishedPage).is(pageId), where(publishedPage).is(pageId));

        return queryBuilder().criteria(pageCriteria).permission(aclPermission).all();*/
    }

    @Override
    public List<NewAction> findByPageId(String pageId, Optional<AclPermission> aclPermission) {
        String unpublishedPage = "unpublishedAction" + "." + "pageId";
        String publishedPage = "publishedAction" + "." + "pageId";

        Criteria pageCriteria = new Criteria()
                .orOperator(
                        where(unpublishedPage).is(pageId), where(publishedPage).is(pageId));

        return queryBuilder()
                .criteria(pageCriteria)
                .permission(aclPermission.orElse(null))
                .all();
    }

    @Override
    public List<NewAction> findByPageId(String pageId) {
        return this.findByPageId(pageId, Optional.empty());
    }

    @Override
    public List<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission aclPermission) {
        throw new ex.Marker("findByPageIdAndViewMode"); /*

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
        return queryBuilder().criteria(criteria).permission(aclPermission).all();*/
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

        return queryBuilder().criteria(criterias).permission(aclPermission).all();*/
    }

    @Override
    public List<NewAction> findAllActionsByNameAndPageIdsAndViewMode(
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

        return queryBuilder().criteria(criteriaList).permission(permission).all();*/
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

        return queryBuilder().criteria(criteriaList).permission(permission).all();*/
    }

    @Override
    public List<NewAction> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(
            String pageId, AclPermission permission) {
        throw new ex.Marker("findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue"); /*
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

        return queryBuilder().criteria(criteriaList).permission(permission).all();*/
    }

    @Override
    public List<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort) {
        throw new ex.Marker("findByApplicationId"); /*

        Criteria applicationCriteria = this.getCriterionForFindByApplicationId(applicationId);

        return queryBuilder()
                .criteria(applicationCriteria)
                .permission(aclPermission)
                .sort(sort)
                .all();*/
    }

    protected Criteria getCriterionForFindByApplicationId(String applicationId) {
        Criteria applicationCriteria =
                where(fieldName(QNewAction.newAction.applicationId)).is(applicationId);
        return applicationCriteria;
    }

    @Override
    public List<NewAction> findByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission aclPermission) {
        throw new ex.Marker("findByApplicationIdAndViewMode"); /*

        List<Criteria> criteria = this.getCriteriaForFindByApplicationIdAndViewMode(applicationId, viewMode);

        return queryBuilder().criteria(criteria).permission(aclPermission).all();*/
    }

    protected List<Criteria> getCriteriaForFindByApplicationIdAndViewMode(String applicationId, Boolean viewMode) {
        throw new ex.Marker("getCriteriaForFindByApplicationIdAndViewMode"); /*
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
        throw new ex.Marker("countByDatasourceId"); /*
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
        return queryBuilder()
                .criteria(defaultActionIdCriteria, branchCriteria)
                .permission(permission)
                .one();
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
        return queryBuilder()
                .criteria(defaultAppIdCriteria, gitSyncIdCriteria)
                .permission(permission.orElse(null))
                .first();
    }

    @Override
    public List<NewAction> findByPageIds(List<String> pageIds, AclPermission permission) {

        Criteria pageIdCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "." + "pageId")
                .in(pageIds);

        return queryBuilder().criteria(pageIdCriteria).permission(permission).all();
    }

    @Override
    public List<NewAction> findByPageIds(List<String> pageIds, Optional<AclPermission> permission) {
        Criteria pageIdCriteria = where(fieldName(QNewAction.newAction.unpublishedAction) + "." + "pageId")
                .in(pageIds);

        return queryBuilder()
                .criteria(pageIdCriteria)
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    public List<NewAction> findNonJsActionsByApplicationIdAndViewMode(
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

        Criteria nonJsTypeCriteria =
                where(fieldName(QNewAction.newAction.pluginType)).ne(PluginType.JS);
        criteria.add(nonJsTypeCriteria);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriterion = where(
                            fieldName(QNewAction.newAction.unpublishedAction) + "." + FieldName.DELETED_AT)
                    .is(null);
            criteria.add(deletedCriterion);
        }
        return criteria;
    }

    @Override
    public List<NewAction> findAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort) {
        return Collections.emptyList(); /*

        return queryBuilder()
                .criteria(criteriaList)
                .permission(aclPermission)
                .sort(sort)
                .all();*/
    }

    protected List<Criteria> getCriteriaForFindAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode) {
        List<Criteria> criteriaList = new ArrayList<>();

        Criteria nonJsTypeCriteria = where("pluginType").ne(PluginType.JS);
        criteriaList.add(nonJsTypeCriteria);

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
    public List<NewAction> findByDefaultApplicationId(String defaultApplicationId, Optional<AclPermission> permission) {
        final String defaultResources = "defaultResources";
        Criteria defaultAppIdCriteria =
                where(defaultResources + "." + FieldName.APPLICATION_ID).is(defaultApplicationId);
        return queryBuilder()
                .criteria(defaultAppIdCriteria)
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    @Modifying
    @Transactional
    public Optional<List<BulkWriteResult>> publishActions(String applicationId, AclPermission permission) {
        /*
        var em = getEntityManager();
        var cb = em.getCriteriaBuilder();
        var cu = cb.createCriteriaUpdate(genericDomain);
        var root = cu.from(genericDomain);

        cu.where(cb.equal(root.get(fieldName(QNewAction.newAction.applicationId)), applicationId));
        cu.<Object>set(
                root.get(fieldName(QNewAction.newAction.publishedAction)),
                root.get(fieldName(QNewAction.newAction.unpublishedAction)));
        int count = em.createQuery(cu).executeUpdate(); // */

        // *
        int count = queryBuilder()
                .permission(permission)
                .spec(Bridge.conditioner().equal(fieldName(QNewAction.newAction.applicationId), applicationId))
                .update(Bridge.update()
                        .set(QNewAction.newAction.publishedAction, QNewAction.newAction.unpublishedAction)); // */

        return Optional.of(List.of(BulkWriteResult.unacknowledged())); // */

        /*
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
                            .subscribeOn(Schedulers.boundedElastic())
                            .blockOptional();
                })
                .flatMap(updatedResults -> bulkUpdate(updatedResults.getMappedResults()));//*/
    }

    @Override
    @Modifying
    @Transactional
    public Optional<UpdateResult> archiveDeletedUnpublishedActions(String applicationId, AclPermission permission) {
        int count = queryBuilder()
                // .spec(Bridge.conditioner().equal(fieldName(QNewAction.newAction.applicationId),
                // applicationId).notEqual(unpublishedDeletedAtFieldName, null))
                .spec((root, cq, cb) -> cb.and(
                        cb.equal(root.get(fieldName(QNewAction.newAction.applicationId)), applicationId),
                        cb.isNotNull(cb.function(
                                "jsonb_extract_path_text",
                                String.class,
                                root.get(fieldName(QNewAction.newAction.unpublishedAction)),
                                cb.literal(FieldName.DELETED_AT)))))
                .permission(permission)
                .update(Bridge.update().set(QNewAction.newAction.deletedAt, Instant.now()));

        return Optional.of(UpdateResult.acknowledged(count, (long) count, null));
    }

    @Override
    public List<PluginTypeAndCountDTO> countActionsByPluginType(String applicationId) {
        GroupOperation countByPluginType =
                group(fieldName(QNewAction.newAction.pluginType)).count().as("count");
        MatchOperation filterStates = match(where(fieldName(QNewAction.newAction.applicationId))
                .is(applicationId)
                .andOperator(notDeleted()));
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
        return queryBuilder()
                .criteria(applicationCriteria)
                .fields(includeFields)
                .all();
    }

    @Override
    public List<NewAction> findAllUnpublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        List<Criteria> criteriaList = new ArrayList<>();

        String contextIdPath = "unpublishedAction" + "." + "pageId";
        String contextTypePath = "unpublishedAction" + "." + "contextType";
        Criteria contextTypeCriterion = new Criteria()
                .orOperator(
                        where(contextTypePath).is(contextType),
                        where(contextTypePath).isNull());
        Criteria contextIdAndContextTypeCriteria =
                where(contextIdPath).is(contextId).andOperator(contextTypeCriterion);

        criteriaList.add(contextIdAndContextTypeCriteria);

        if (!includeJs) {
            Criteria jsInclusionOrExclusionCriteria = where("pluginType").ne(PluginType.JS);
            criteriaList.add(jsInclusionOrExclusionCriteria);
        }

        return queryBuilder()
                .criteria(criteriaList)
                .permission(Optional.ofNullable(permission).orElse(null))
                .all();
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

        return queryBuilder()
                .criteria(criteriaList)
                .permission(Optional.ofNullable(permission).orElse(null))
                .all();
    }
}

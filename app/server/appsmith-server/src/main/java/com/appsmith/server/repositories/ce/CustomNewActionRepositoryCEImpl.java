package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.BranchAwareDomain;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

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
    public List<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission) {
        return queryBuilder()
                .criteria(Bridge.equal(NewAction.Fields.applicationId, applicationId))
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
        Criteria nameCriteria = where(NewAction.Fields.unpublishedAction_name).is(name);
        Criteria pageCriteria = where(NewAction.Fields.unpublishedAction_pageId).is(pageId);
        // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would
        // exist. To handle this, only fetch non-deleted actions
        Criteria deletedCriteria =
                where(NewAction.Fields.unpublishedAction_deletedAt).is(null);

        return queryBuilder()
                .criteria(nameCriteria, pageCriteria, deletedCriteria)
                .permission(aclPermission)
                .one();
    }

    @Override
    public List<NewAction> findByPageId(String pageId, AclPermission aclPermission) {
        String unpublishedPage = NewAction.Fields.unpublishedAction_pageId;
        String publishedPage = NewAction.Fields.publishedAction_pageId;

        Criteria pageCriteria = new Criteria()
                .orOperator(
                        where(unpublishedPage).is(pageId), where(publishedPage).is(pageId));

        return queryBuilder().criteria(pageCriteria).permission(aclPermission).all();
    }

    @Override
    public List<NewAction> findByPageId(String pageId, Optional<AclPermission> aclPermission) {
        String unpublishedPage = NewAction.Fields.unpublishedAction_pageId;
        String publishedPage = NewAction.Fields.publishedAction_pageId;

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
        BridgeQuery<? extends BaseDomain> pageCriterion;

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {
            pageCriterion = Bridge.equal(NewAction.Fields.publishedAction_pageId, pageId);
        }
        // Fetch unpublished actions
        else {
            pageCriterion = Bridge.query()
                    .equal(NewAction.Fields.unpublishedAction_pageId, pageId)
                    // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction
                    // object
                    // would exist. To handle this, only fetch non-deleted actions
                    .isNull(NewAction.Fields.unpublishedAction_deletedAt);
        }
        return queryBuilder().criteria(pageCriterion).permission(aclPermission).all();
    }

    @Override
    public List<NewAction> findUnpublishedActionsForRestApiOnLoad(
            Set<String> names, String pageId, String httpMethod, Boolean userSetOnLoad, AclPermission aclPermission) {
        Criteria namesCriteria = where(NewAction.Fields.unpublishedAction_name).in(names);

        Criteria pageCriteria = where(NewAction.Fields.unpublishedAction_pageId).is(pageId);

        Criteria userSetOnLoadCriteria =
                where(NewAction.Fields.unpublishedAction_userSetOnLoad).is(userSetOnLoad);

        String httpMethodQueryKey = NewAction.Fields.unpublishedAction_actionConfiguration_httpMethod;

        Criteria httpMethodCriteria = where(httpMethodQueryKey).is(httpMethod);
        List<Criteria> criterias = List.of(namesCriteria, pageCriteria, httpMethodCriteria, userSetOnLoadCriteria);

        return queryBuilder().criteria(criterias).permission(aclPermission).all(); // */
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
                Criteria nameCriteria =
                        where(NewAction.Fields.publishedAction_name).is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria =
                        where(NewAction.Fields.publishedAction_pageId).in(pageIds);
                criteriaList.add(pageCriteria);
            }
        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                Criteria nameCriteria =
                        where(NewAction.Fields.unpublishedAction_name).is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria =
                        where(NewAction.Fields.unpublishedAction_pageId).in(pageIds);
                criteriaList.add(pageCriteria);
            }

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria =
                    where(NewAction.Fields.unpublishedAction_deletedAt).is(null);
            criteriaList.add(deletedCriteria);
        }
        return criteriaList;
    }

    @Override
    public List<NewAction> findUnpublishedActionsByNameInAndPageIdAndExecuteOnLoadTrue(
            Set<String> names, String pageId, AclPermission permission) {
        throw new ex.Marker("an emptyList"); /*
        List<Criteria> criteriaList = new ArrayList<>();
        if (names != null) {
            Criteria namesCriteria =
                    where(NewAction.Fields.unpublishedAction_name).in(names);
            criteriaList.add(namesCriteria);
        }
        Criteria pageCriteria = where(NewAction.Fields.unpublishedAction_pageId).is(pageId);
        criteriaList.add(pageCriteria);

        Criteria executeOnLoadCriteria =
                where(NewAction.Fields.unpublishedAction_executeOnLoad).is(Boolean.TRUE);
        criteriaList.add(executeOnLoadCriteria);

        // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would
        // exist. To handle this, only fetch non-deleted actions
        Criteria deletedCriteria =
                where(NewAction.Fields.unpublishedAction_deletedAt).is(null);
        criteriaList.add(deletedCriteria);

        return queryBuilder().criteria(criteriaList).permission(permission).all(); //*/
    }

    @Override
    public List<NewAction> findUnpublishedActionsByNameInAndPageId(
            Set<String> names, String pageId, AclPermission permission) {
        throw new ex.Marker("an emptyList"); /*
        List<Criteria> criteriaList = new ArrayList<>();

        if (names != null) {
            Criteria namesCriteria =
                    where(NewAction.Fields.unpublishedAction_name).in(names);
            Criteria fullyQualifiedNamesCriteria =
                    where(NewAction.Fields.unpublishedAction_fullyQualifiedName).in(names);
            criteriaList.add(new Criteria().orOperator(namesCriteria, fullyQualifiedNamesCriteria));
        }
        Criteria pageCriteria = where(NewAction.Fields.unpublishedAction_pageId).is(pageId);
        criteriaList.add(pageCriteria);

        // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would
        // exist. To handle this, only fetch non-deleted actions
        Criteria deletedCriteria =
                where(NewAction.Fields.unpublishedAction_deletedAt).is(null);
        criteriaList.add(deletedCriteria);

        return queryBuilder().criteria(criteriaList).permission(permission).all(); //*/
    }

    @Override
    public List<NewAction> findUnpublishedActionsByPageIdAndExecuteOnLoadSetByUserTrue(
            String pageId, AclPermission permission) {
        return queryBuilder()
                .criteria(Bridge.query()
                        .equal(NewAction.Fields.unpublishedAction_pageId, pageId)
                        .isTrue(NewAction.Fields.unpublishedAction_executeOnLoad)
                        .isTrue(NewAction.Fields.unpublishedAction_userSetOnLoad)
                        .isNull(NewAction.Fields.unpublishedAction_deletedAt))
                .permission(permission)
                .all();
    }

    @Override
    public List<NewAction> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort) {
        throw new ex.Marker("findByApplicationId"); /*

        Criteria applicationCriteria = this.getCriterionForFindByApplicationId(applicationId);

        return queryBuilder()
                .criteria(applicationCriteria)
                .permission(aclPermission)
                .sort(sort)
                .all(); //*/
    }

    protected Criteria getCriterionForFindByApplicationId(String applicationId) {
        Criteria applicationCriteria = where(NewAction.Fields.applicationId).is(applicationId);
        return applicationCriteria;
    }

    @Override
    public List<NewAction> findByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission aclPermission) {
        throw new ex.Marker("findByApplicationIdAndViewMode"); /*

        List<Criteria> criteria = this.getCriteriaForFindByApplicationIdAndViewMode(applicationId, viewMode);

        return queryBuilder().criteria(criteria).permission(aclPermission).all(); //*/
    }

    protected List<Criteria> getCriteriaForFindByApplicationIdAndViewMode(String applicationId, Boolean viewMode) {
        throw new ex.Marker("getCriteriaForFindByApplicationIdAndViewMode"); /*
        List<Criteria> criteria = new ArrayList<>();


        criteria.add(applicationCriterion);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriterion =
                    where(NewAction.Fields.unpublishedAction_deletedAt).is(null);
            criteria.add(deletedCriterion);
        }*/
    }

    @Override
    public Optional<NewAction> findByBranchNameAndDefaultActionId(
            String branchName, String defaultActionId, AclPermission permission) {
        final String defaultResources = NewAction.Fields.defaultResources;
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
        final String defaultResources = BranchAwareDomain.Fields.defaultResources;
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
        return queryBuilder()
                .criteria(Bridge.in(NewAction.Fields.unpublishedAction_pageId, pageIds))
                .permission(permission)
                .all();
    }

    @Override
    public List<NewAction> findByPageIds(List<String> pageIds, Optional<AclPermission> permission) {
        return findByPageIds(pageIds, permission.orElse(null));
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

        Criteria nonJsTypeCriteria = where(NewAction.Fields.pluginType).ne(PluginType.JS);
        criteria.add(nonJsTypeCriteria);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriterion =
                    where(NewAction.Fields.unpublishedAction_deletedAt).is(null);
            criteria.add(deletedCriterion);
        }
        return criteria;
    }

    @Override
    public List<NewAction> findAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission, Sort sort) {
        throw new ex.Marker("an emptyList"); /*

        return queryBuilder()
                .criteria(criteriaList)
                .permission(aclPermission)
                .sort(sort)
                .all(); //*/
    }

    protected List<Criteria> getCriteriaForFindAllNonJsActionsByNameAndPageIdsAndViewMode(
            String name, List<String> pageIds, Boolean viewMode) {
        List<Criteria> criteriaList = new ArrayList<>();

        Criteria nonJsTypeCriteria = where(NewAction.Fields.pluginType).ne(PluginType.JS);
        criteriaList.add(nonJsTypeCriteria);

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {

            if (name != null) {
                Criteria nameCriteria =
                        where(NewAction.Fields.publishedAction_name).is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria =
                        where(NewAction.Fields.publishedAction_pageId).in(pageIds);
                criteriaList.add(pageCriteria);
            }

        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                Criteria nameCriteria =
                        where(NewAction.Fields.unpublishedAction_name).is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria =
                        where(NewAction.Fields.unpublishedAction_pageId).in(pageIds);
                criteriaList.add(pageCriteria);
            }

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria =
                    where(NewAction.Fields.unpublishedAction_deletedAt).is(null);
            criteriaList.add(deletedCriteria);
        }
        return criteriaList;
    }

    @Override
    public List<NewAction> findByDefaultApplicationId(String defaultApplicationId, Optional<AclPermission> permission) {
        final String defaultResources = BranchAwareDomain.Fields.defaultResources;
        return queryBuilder()
                .criteria(Bridge.equal(defaultResources + "." + FieldName.APPLICATION_ID, defaultApplicationId))
                .permission(permission.orElse(null))
                .all();
    }

    @Override
    @Modifying
    @Transactional
    public Optional<Void> publishActions(String applicationId, AclPermission permission) {
        /*
        var em = getEntityManager();
        var cb = em.getCriteriaBuilder();
        var cu = cb.createCriteriaUpdate(genericDomain);
        var root = cu.from(genericDomain);

        cu.where(cb.equal(root.get(NewAction.Fields.applicationId), applicationId));
        cu.<Object>set(
                root.get(fieldName(NewAction.Fields.publishedAction),
                root.get(fieldName(NewAction.Fields.unpublishedAction));
        int count = em.createQuery(cu).executeUpdate(); // */

        // *
        int count = queryBuilder()
                .permission(permission)
                .criteria(Bridge.equal(NewAction.Fields.applicationId, applicationId))
                .updateAll(Bridge.update()
                        .setToValueFromField(NewAction.Fields.publishedAction, NewAction.Fields.unpublishedAction));

        return Optional.empty();

        /*
        Criteria applicationIdCriteria = this.getCriterionForFindByApplicationId(applicationId);
        return copyUnpublishedActionToPublishedAction(applicationIdCriteria, permission); //*/
    }

    /*
    protected Mono<Void> copyUnpublishedActionToPublishedAction(Criteria criteria, AclPermission permission) {
        Mono<Set<String>> permissionGroupsMono =
                getCurrentUserPermissionGroupsIfRequired(Optional.ofNullable(permission));

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
    }//*/

    @Override
    @Modifying
    @Transactional
    public Optional<Integer> archiveDeletedUnpublishedActions(String applicationId, AclPermission permission) {
        String unpublishedDeletedAtFieldName = NewAction.Fields.unpublishedAction_deletedAt;
        int count = queryBuilder()
                // .spec(Bridge.equal(NewAction.Fields.applicationId,
                // applicationId).notEqual(unpublishedDeletedAtFieldName, null))
                .criteria((root, cq, cb) -> cb.and(
                        cb.equal(root.get(NewAction.Fields.applicationId), applicationId),
                        cb.isNotNull(cb.function(
                                "jsonb_extract_path_text",
                                String.class,
                                root.get(NewAction.Fields.unpublishedAction),
                                cb.literal(FieldName.DELETED_AT)))))
                .permission(permission)
                .updateAll(Bridge.update().set(NewAction.Fields.deletedAt, Instant.now()));

        return Optional.of(count);
    }

    @Override
    public List<NewAction> findAllByApplicationIdsWithoutPermission(
            List<String> applicationIds, List<String> includeFields) {
        return queryBuilder()
                .criteria(Bridge.in(NewAction.Fields.applicationId, applicationIds))
                .fields(includeFields)
                .all();
    }

    @Override
    public List<NewAction> findAllUnpublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        List<Criteria> criteriaList = new ArrayList<>();

        String contextIdPath = NewAction.Fields.unpublishedAction_pageId;
        String contextTypePath = NewAction.Fields.unpublishedAction_contextType;
        Criteria contextTypeCriterion = new Criteria()
                .orOperator(
                        where(contextTypePath).is(contextType),
                        where(contextTypePath).isNull());
        Criteria contextIdAndContextTypeCriteria =
                where(contextIdPath).is(contextId).andOperator(contextTypeCriterion);

        criteriaList.add(contextIdAndContextTypeCriteria);

        if (!includeJs) {
            Criteria jsInclusionOrExclusionCriteria =
                    where(NewAction.Fields.pluginType).ne(PluginType.JS);
            criteriaList.add(jsInclusionOrExclusionCriteria);
        }

        return queryBuilder().criteria(criteriaList).permission(permission).all();
    }

    @Override
    public List<NewAction> findAllPublishedActionsByContextIdAndContextType(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean includeJs) {
        List<Criteria> criteriaList = new ArrayList<>();
        String contextIdPath = NewAction.Fields.publishedAction_pageId;
        String contextTypePath = NewAction.Fields.publishedAction_contextType;
        Criteria contextIdAndContextTypeCriteria =
                where(contextIdPath).is(contextId).and(contextTypePath).is(contextType);

        criteriaList.add(contextIdAndContextTypeCriteria);

        Criteria jsInclusionOrExclusionCriteria;
        if (includeJs) {
            jsInclusionOrExclusionCriteria = where(NewAction.Fields.pluginType).is(PluginType.JS);
        } else {
            jsInclusionOrExclusionCriteria = where(NewAction.Fields.pluginType).ne(PluginType.JS);
        }

        criteriaList.add(jsInclusionOrExclusionCriteria);

        return queryBuilder().criteria(criteriaList).permission(permission).all();
    }
}

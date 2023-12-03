package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.QActionCollection;
import com.appsmith.server.repositories.ce.CustomActionCollectionRepositoryCEImpl;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
public class CustomActionCollectionRepositoryImpl extends CustomActionCollectionRepositoryCEImpl
        implements CustomActionCollectionRepository {

    public CustomActionCollectionRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<ActionCollection> findAllByModuleIds(List<String> moduleIds, Optional<AclPermission> permission) {
        Criteria moduleIdCriteria = Criteria.where(
                        fieldName(QActionCollection.actionCollection.unpublishedCollection.moduleId))
                .in(moduleIds);
        return queryAll(List.of(moduleIdCriteria), permission);
    }

    @Override
    public Flux<ActionCollection> findAllByRootModuleInstanceIds(
            List<String> moduleInstanceIds, Optional<AclPermission> permission) {
        Criteria rootModuleInstanceIdCriterion = Criteria.where(
                        fieldName(QActionCollection.actionCollection.rootModuleInstanceId))
                .in(moduleInstanceIds);
        return queryAll(List.of(rootModuleInstanceIdCriterion), permission);
    }

    @Override
    public Flux<ActionCollection> findByApplicationIdAndViewMode(
            String applicationId, boolean viewMode, AclPermission aclPermission) {

        List<Criteria> criteria = new ArrayList<>();

        Criteria applicationCriterion = where(fieldName(QActionCollection.actionCollection.applicationId))
                .is(applicationId);
        criteria.add(applicationCriterion);

        Criteria nonModuleInstanceCollectionCriterion = getNonModuleInstanceCollectionCriterion();
        criteria.add(nonModuleInstanceCollectionCriterion);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriterion = where(fieldName(QActionCollection.actionCollection.unpublishedCollection) + "."
                            + fieldName(QActionCollection.actionCollection.unpublishedCollection.deletedAt))
                    .is(null);
            criteria.add(deletedCriterion);
        }

        return queryAll(criteria, aclPermission);
    }

    @Override
    public Flux<ActionCollection> findAllActionCollectionsByNameDefaultPageIdsViewModeAndBranch(
            String name,
            List<String> pageIds,
            boolean viewMode,
            String branchName,
            AclPermission aclPermission,
            Sort sort) {
        /**
         * TODO : This function is called by get(params) to get all actions by params and hence
         * only covers criteria of few fields like page id, name, etc. Make this generic to cover
         * all possible fields
         */
        List<Criteria> criteria = new ArrayList<>();

        Criteria nonModuleInstanceCollectionCriterion = getNonModuleInstanceCollectionCriterion();
        criteria.add(nonModuleInstanceCollectionCriterion);

        if (!StringUtils.isEmpty(branchName)) {
            criteria.add(where(FieldName.DEFAULT_RESOURCES + "." + FieldName.BRANCH_NAME)
                    .is(branchName));
        }

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QActionCollection.actionCollection.publishedCollection) + "."
                                + fieldName(QActionCollection.actionCollection.publishedCollection.name))
                        .is(name);
                criteria.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                String pageIdFieldPath = String.format(
                    "%s.%s.%s",
                    fieldName(QActionCollection.actionCollection.publishedCollection),
                    fieldName(QActionCollection.actionCollection.publishedCollection.defaultResources),
                    fieldName(QActionCollection.actionCollection.publishedCollection.pageId));
                Criteria pageCriteria = where(pageIdFieldPath).in(pageIds);
                criteria.add(pageCriteria);
            }
        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QActionCollection.actionCollection.unpublishedCollection) + "."
                                + fieldName(QActionCollection.actionCollection.unpublishedCollection.name))
                        .is(name);
                criteria.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                String pageIdFieldPath = String.format(
                    "%s.%s.%s",
                    fieldName(QActionCollection.actionCollection.unpublishedCollection),
                    fieldName(QActionCollection.actionCollection.unpublishedCollection.defaultResources),
                    fieldName(QActionCollection.actionCollection.unpublishedCollection.pageId));
                Criteria pageCriteria = where(pageIdFieldPath).in(pageIds);
                criteria.add(pageCriteria);
            }

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object
            // would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria = where(fieldName(QActionCollection.actionCollection.unpublishedCollection) + "."
                            + fieldName(QActionCollection.actionCollection.unpublishedCollection.deletedAt))
                    .is(null);
            criteria.add(deletedCriteria);
        }

        return queryAll(criteria, aclPermission, sort);
    }

    private static Criteria getNonModuleInstanceCollectionCriterion() {
        Criteria nonModuleInstanceCollectionCriterion = where(
                        fieldName(QActionCollection.actionCollection.moduleInstanceId))
                .exists(false);
        return nonModuleInstanceCollectionCriterion;
    }
}

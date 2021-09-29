package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.QActionCollection;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomActionCollectionRepositoryImpl extends BaseAppsmithRepositoryImpl<ActionCollection> implements CustomActionCollectionRepository {
    public CustomActionCollectionRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }


    @Override
    public Flux<ActionCollection> findByApplicationId(String applicationId, AclPermission aclPermission, Sort sort) {

        Criteria applicationCriteria = where(fieldName(QActionCollection.actionCollection.applicationId)).is(applicationId);

        return queryAll(List.of(applicationCriteria), aclPermission, sort);
    }

    @Override
    public Flux<ActionCollection> findByApplicationIdAndViewMode(String applicationId, boolean viewMode, AclPermission aclPermission) {

        List<Criteria> criteria = new ArrayList<>();

        Criteria applicationCriterion = where(fieldName(QActionCollection.actionCollection.applicationId)).is(applicationId);
        criteria.add(applicationCriterion);

        if (Boolean.FALSE.equals(viewMode)) {
            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriterion = where(fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + fieldName(QActionCollection.actionCollection.unpublishedCollection.deletedAt)).is(null);
            criteria.add(deletedCriterion);
        }

        return queryAll(criteria, aclPermission);

    }

    @Override
    public Flux<ActionCollection> findAllActionCollectionsByNameAndPageIdsAndViewMode(String name, List<String> pageIds, boolean viewMode, AclPermission aclPermission, Sort sort) {
        /**
         * TODO : This function is called by get(params) to get all actions by params and hence
         * only covers criteria of few fields like page id, name, etc. Make this generic to cover
         * all possible fields
         */

        List<Criteria> criteriaList = new ArrayList<>();

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QActionCollection.actionCollection.publishedCollection) + "." + fieldName(QActionCollection.actionCollection.publishedCollection.name)).is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QActionCollection.actionCollection.publishedCollection) + "." + fieldName(QActionCollection.actionCollection.publishedCollection.pageId)).in(pageIds);
                criteriaList.add(pageCriteria);
            }
        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + fieldName(QActionCollection.actionCollection.unpublishedCollection.name)).is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + fieldName(QActionCollection.actionCollection.unpublishedCollection.pageId)).in(pageIds);
                criteriaList.add(pageCriteria);
            }

            // In case an action has been deleted in edit mode, but still exists in deployed mode, NewAction object would exist. To handle this, only fetch non-deleted actions
            Criteria deletedCriteria = where(fieldName(QActionCollection.actionCollection.unpublishedCollection) + "." + fieldName(QActionCollection.actionCollection.unpublishedCollection.deletedAt)).is(null);
            criteriaList.add(deletedCriteria);
        }

        return queryAll(criteriaList, aclPermission, sort);
    }
}

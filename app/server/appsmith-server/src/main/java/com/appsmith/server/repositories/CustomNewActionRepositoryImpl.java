package com.appsmith.server.repositories;

import com.appsmith.external.models.QActionConfiguration;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.QAction;
import com.appsmith.server.domains.QNewAction;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
public class CustomNewActionRepositoryImpl extends BaseAppsmithRepositoryImpl<NewAction>
        implements CustomNewActionRepository {

    public CustomNewActionRepositoryImpl(ReactiveMongoOperations mongoOperations,
                                         MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Mono<NewAction> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission aclPermission) {
        Criteria nameCriteria = where(fieldName(QNewAction.newAction.unpublishedAction.name)).is(name);
        Criteria pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction.pageId)).is(pageId);

        return queryOne(List.of(nameCriteria, pageCriteria), aclPermission);
    }

    @Override
    public Flux<NewAction> findByPageId(String pageId, AclPermission aclPermission) {
        Criteria unpublishedPageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction.pageId)).is(pageId);
        Criteria publishedPageCriteria = where(fieldName(QNewAction.newAction.publishedAction.pageId)).is(pageId);

        Criteria pageCriteria = new Criteria().orOperator(unpublishedPageCriteria, publishedPageCriteria);

        return queryAll(List.of(pageCriteria), aclPermission);
    }

    @Override
    public Flux<NewAction> findUnpublishedActionsByNameInAndPageIdAndActionConfiguration_HttpMethod(Set<String> names,
                                                                                                    String pageId,
                                                                                                    String httpMethod,
                                                                                                    AclPermission aclPermission) {
        Criteria namesCriteria = where(fieldName(QNewAction.newAction.unpublishedAction.name)).in(names);
        Criteria pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction.pageId)).is(pageId);
        String httpMethodQueryKey = fieldName(QNewAction.newAction.unpublishedAction.actionConfiguration)
                + "."
                + fieldName(QActionConfiguration.actionConfiguration.httpMethod);
        Criteria httpMethodCriteria = where(httpMethodQueryKey).is(httpMethod);
        List<Criteria> criterias = List.of(namesCriteria, pageCriteria, httpMethodCriteria);

        return queryAll(criterias, aclPermission);
    }

    @Override
    public Flux<NewAction> findAllActionsByNameAndPageIdsAndViewMode(String name, List<String> pageIds, Boolean viewMode, AclPermission aclPermission,
                                                                     Sort sort) {
        /**
         * TODO : This function is called by get(params) to get all actions by params and hence
         * only covers criteria of few fields like page id, name, etc. Make this generic to cover
         * all possible fields
         */

        List<Criteria> criteriaList = new ArrayList<>();

        // Fetch published actions
        if (Boolean.TRUE.equals(viewMode)) {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QNewAction.newAction.publishedAction.name)).is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QNewAction.newAction.publishedAction.pageId)).in(pageIds);
                criteriaList.add(pageCriteria);
            }
        }
        // Fetch unpublished actions
        else {

            if (name != null) {
                Criteria nameCriteria = where(fieldName(QNewAction.newAction.unpublishedAction.name)).is(name);
                criteriaList.add(nameCriteria);
            }

            if (pageIds != null && !pageIds.isEmpty()) {
                Criteria pageCriteria = where(fieldName(QNewAction.newAction.unpublishedAction.pageId)).in(pageIds);
                criteriaList.add(pageCriteria);
            }
        }

        return queryAll(criteriaList, aclPermission, sort);
    }
}

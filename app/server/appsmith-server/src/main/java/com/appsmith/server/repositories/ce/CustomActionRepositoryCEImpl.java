package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.QActionConfiguration;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.QAction;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomActionRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Action> implements CustomActionRepositoryCE {

    public CustomActionRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Mono<Action> findByNameAndPageId(String name, String pageId, AclPermission aclPermission) {
        Criteria nameCriteria = where(fieldName(QAction.action.name)).is(name);
        Criteria pageCriteria = where(fieldName(QAction.action.pageId)).is(pageId);

        return queryOne(List.of(nameCriteria, pageCriteria), aclPermission);
    }

    @Override
    public Flux<Action> findByPageId(String pageId, AclPermission aclPermission) {
        Criteria pageCriteria = where(fieldName(QAction.action.pageId)).is(pageId);
        return queryAll(List.of(pageCriteria), aclPermission);
    }

    @Override
    public Flux<Action> findActionsByNameInAndPageIdAndActionConfiguration_HttpMethod(Set<String> names,
                                                                                      String pageId,
                                                                                      String httpMethod,
                                                                                      AclPermission aclPermission) {
        Criteria namesCriteria = where(fieldName(QAction.action.name)).in(names);
        Criteria pageCriteria = where(fieldName(QAction.action.pageId)).is(pageId);
        String httpMethodQueryKey = fieldName(QAction.action.actionConfiguration)
                + "."
                + fieldName(QActionConfiguration.actionConfiguration.httpMethod);
        Criteria httpMethodCriteria = where(httpMethodQueryKey).is(httpMethod);
        List<Criteria> criterias = List.of(namesCriteria, pageCriteria, httpMethodCriteria);

        return queryAll(criterias, aclPermission);
    }

    @Override
    public Flux<Action> findAllActionsByNameAndPageIds(String name, List<String> pageIds, AclPermission aclPermission,
                                                       Sort sort) {
        /**
         * TODO : This function is called by get(params) to get all actions by params and hence
         * only covers criteria of few fields like page id, name, etc. Make this generic to cover
         * all possible fields
         */

        List<Criteria> criteriaList = new ArrayList<>();

        if (name != null) {
            Criteria nameCriteria = where(fieldName(QAction.action.name)).is(name);
            criteriaList.add(nameCriteria);
        }

        if (pageIds != null && !pageIds.isEmpty()) {
            Criteria pageCriteria = where(fieldName(QAction.action.pageId)).in(pageIds);
            criteriaList.add(pageCriteria);
        }

        return queryAll(criteriaList, aclPermission, sort);
    }
}

package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Action;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomActionRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Action>
        implements CustomActionRepositoryCE {

    public CustomActionRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Optional<Action> findByNameAndPageId(String name, String pageId, AclPermission aclPermission) {
        Criteria nameCriteria = where("name").is(name);
        Criteria pageCriteria = where("pageId").is(pageId);

        return queryOne(List.of(nameCriteria, pageCriteria), aclPermission);
    }

    @Override
    public List<Action> findByPageId(String pageId, AclPermission aclPermission) {
        return Collections.emptyList(); /*
        Criteria pageCriteria = where("pageId").is(pageId);
        return queryAll(List.of(pageCriteria), aclPermission);*/
    }

    @Override
    public List<Action> findActionsByNameInAndPageIdAndActionConfiguration_HttpMethod(
            Set<String> names, String pageId, String httpMethod, AclPermission aclPermission) {
        return Collections.emptyList(); /*
        Criteria namesCriteria = where("name").in(names);
        Criteria pageCriteria = where("pageId").is(pageId);
        String httpMethodQueryKey = "actionConfiguration"
                + "."
                + "httpMethod";
        Criteria httpMethodCriteria = where(httpMethodQueryKey).is(httpMethod);
        List<Criteria> criterias = List.of(namesCriteria, pageCriteria, httpMethodCriteria);

        return queryAll(criterias, aclPermission);*/
    }

    @Override
    public List<Action> findAllActionsByNameAndPageIds(
            String name, List<String> pageIds, AclPermission aclPermission, Sort sort) {
        return Collections.emptyList(); /*
        /**
         * TODO : This function is called by get(params) to get all actions by params and hence
         * only covers criteria of few fields like page id, name, etc. Make this generic to cover
         * all possible fields
         * /
        List<Criteria> criteriaList = new ArrayList<>();

        if (name != null) {
            Criteria nameCriteria = where("name").is(name);
            criteriaList.add(nameCriteria);
        }

        if (pageIds != null && !pageIds.isEmpty()) {
            Criteria pageCriteria = where("pageId").in(pageIds);
            criteriaList.add(pageCriteria);
        }

        return queryAll(criteriaList, aclPermission, sort);*/
    }
}

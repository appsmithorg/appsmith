package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.util.CollectionUtils;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;

@Slf4j
public abstract class BaseAppsmithRepositoryImpl<T extends BaseDomain> extends BaseAppsmithRepositoryCEImpl<T> {

    public BaseAppsmithRepositoryImpl(ReactiveMongoOperations mongoOperations,
                                      MongoConverter mongoConverter,
                                      CacheableRepositoryHelper cacheableRepositoryHelper) {

        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    public Flux<T> queryAllWithoutPermissions(List<Criteria> criterias,
                                              List<String> includeFields,
                                              Sort sort,
                                              int limit) {
        final ArrayList<Criteria> criteriaList = new ArrayList<>(criterias);
        Query query = new Query();
        if (!CollectionUtils.isEmpty(includeFields)) {
            for (String includeField : includeFields) {
                query.fields().include(includeField);
            }
        }

        if (limit != NO_RECORD_LIMIT) {
            query.limit(limit);
        }
        Criteria andCriteria = new Criteria();

        criteriaList.add(notDeleted());

        andCriteria.andOperator(criteriaList.toArray(new Criteria[0]));

        query.addCriteria(andCriteria);
        if (sort != null) {
            query.with(sort);
        }

        return mongoOperations.query(this.genericDomain)
                .matching(query)
                .all()
                .map(obj -> obj);
    }
}
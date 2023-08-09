package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl;
import com.mongodb.client.result.UpdateResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.UpdateDefinition;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

@Slf4j
public abstract class BaseAppsmithRepositoryImpl<T extends BaseDomain> extends BaseAppsmithRepositoryCEImpl<T> {

    public BaseAppsmithRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {

        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    public Mono<UpdateResult> updateByCriteriaWithoutPermission(
            List<Criteria> criteriaList, UpdateDefinition updateObj) {
        if (criteriaList == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "criteriaList"));
        }
        if (updateObj == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "updateObj"));
        }

        List<Criteria> allCriterias = new ArrayList<>(criteriaList);
        allCriterias.add(notDeleted());
        Query query = new Query(new Criteria().andOperator(allCriterias));
        return mongoOperations.updateMulti(query, updateObj, this.genericDomain);
    }
}

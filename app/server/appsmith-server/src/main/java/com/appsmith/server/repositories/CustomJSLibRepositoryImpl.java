package com.appsmith.server.repositories;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.QCustomJSLib;
import com.appsmith.server.repositories.ce.CustomJSLibRepositoryCE;
import com.appsmith.server.repositories.ce.CustomJSLibRepositoryCEImpl;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public class CustomJSLibRepositoryImpl extends CustomJSLibRepositoryCEImpl implements CustomJSLibRepositoryCE {
    public CustomJSLibRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Mono<CustomJSLib> findUniqueCustomJsLib(CustomJSLib customJSLib) {
        Criteria appOrPackageIdCriteria = new Criteria();

        if (customJSLib.getContextId() != null) {
            appOrPackageIdCriteria.andOperator(
                    Criteria.where(fieldName(QCustomJSLib.customJSLib.sourcePackageId))
                            .is(customJSLib.getSourcePackageId()),
                    Criteria.where(fieldName(QCustomJSLib.customJSLib.contextId))
                            .is(customJSLib.getContextId()),
                    Criteria.where(fieldName(QCustomJSLib.customJSLib.contextType))
                            .is(customJSLib.getContextType().name()));
        }

        Criteria criteria = new Criteria();
        criteria.andOperator(List.of(
                Criteria.where(fieldName(QCustomJSLib.customJSLib.uidString)).is(customJSLib.getUidString()),
                appOrPackageIdCriteria));

        return this.queryOne(List.of(criteria));
    }

    @Override
    public Flux<CustomJSLib> findCustomJsLibsInContext(
            Set<String> uidStrings, String contextId, CreatorContextType contextType) {
        Criteria contextCriteria = new Criteria();

        if (contextType != null) {
            contextCriteria.andOperator(
                    Criteria.where(fieldName(QCustomJSLib.customJSLib.contextId))
                            .is(contextId),
                    Criteria.where(fieldName(QCustomJSLib.customJSLib.contextType))
                            .is(contextType.name()));
        }

        Criteria uidStringsCriterion = new Criteria();
        Criteria isHiddenCriteria = new Criteria();
        isHiddenCriteria.orOperator(
                Criteria.where(fieldName(QCustomJSLib.customJSLib.isHidden)).exists(false),
                Criteria.where(fieldName(QCustomJSLib.customJSLib.isHidden)).is(false));

        uidStringsCriterion.andOperator(
                Criteria.where(fieldName(QCustomJSLib.customJSLib.uidString)).in(uidStrings), isHiddenCriteria);

        Criteria criteria = new Criteria();
        criteria.orOperator(uidStringsCriterion, contextCriteria);

        return this.queryAll(List.of(criteria), Optional.empty());
    }
}

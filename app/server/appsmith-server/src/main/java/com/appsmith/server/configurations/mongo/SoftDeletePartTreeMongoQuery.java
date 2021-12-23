package com.appsmith.server.configurations.mongo;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.repository.query.ConvertingParameterAccessor;
import org.springframework.data.mongodb.repository.query.ReactiveMongoQueryMethod;
import org.springframework.data.mongodb.repository.query.ReactivePartTreeMongoQuery;
import org.springframework.data.repository.query.ReactiveQueryMethodEvaluationContextProvider;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import reactor.core.publisher.Mono;

import java.lang.reflect.Method;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public class SoftDeletePartTreeMongoQuery extends ReactivePartTreeMongoQuery {
    private ReactivePartTreeMongoQuery reactivePartTreeQuery;
    private Method method;

    SoftDeletePartTreeMongoQuery(Method method, ReactivePartTreeMongoQuery reactivePartTreeMongoQuery,
                                 ReactiveMongoOperations mongoOperations,
                                 SpelExpressionParser expressionParser,
                                 ReactiveQueryMethodEvaluationContextProvider evaluationContextProvider) {
        super((ReactiveMongoQueryMethod) reactivePartTreeMongoQuery.getQueryMethod(),
                mongoOperations, expressionParser, evaluationContextProvider);
        this.reactivePartTreeQuery = reactivePartTreeMongoQuery;
        this.method = method;
    }

    @Override
    protected Mono<Query> createQuery(ConvertingParameterAccessor accessor) {
        Mono<Query> queryMono = super.createQuery(accessor);
        return withNotDeleted(queryMono);
    }

    @Override
    protected Mono<Query> createCountQuery(ConvertingParameterAccessor accessor) {
        Mono<Query> queryMono = super.createCountQuery(accessor);
        return withNotDeleted(queryMono);
    }

    private Mono<Query> withNotDeleted(Mono<Query> queryMono) {
        return queryMono.map(query -> {
            query.addCriteria(notDeleted());
            return query;
        });
    }

    private Criteria notDeleted() {
        return new Criteria().orOperator(
                where("deleted").exists(false),
                where("deleted").is(false)
        );
    }
}
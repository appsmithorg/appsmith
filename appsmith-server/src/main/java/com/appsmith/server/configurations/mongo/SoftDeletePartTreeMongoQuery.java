package com.appsmith.server.configurations.mongo;

import com.appsmith.server.services.AclPermission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.repository.query.ConvertingParameterAccessor;
import org.springframework.data.mongodb.repository.query.MongoQueryMethod;
import org.springframework.data.mongodb.repository.query.ReactiveMongoQueryMethod;
import org.springframework.data.mongodb.repository.query.ReactivePartTreeMongoQuery;
import org.springframework.data.repository.query.QueryMethodEvaluationContextProvider;
import org.springframework.expression.spel.standard.SpelExpressionParser;

import java.lang.reflect.Method;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public class SoftDeletePartTreeMongoQuery extends ReactivePartTreeMongoQuery {
    private ReactivePartTreeMongoQuery reactivePartTreeQuery;
    private Method method;

    SoftDeletePartTreeMongoQuery(Method method, ReactivePartTreeMongoQuery reactivePartTreeMongoQuery,
                                 ReactiveMongoOperations mongoOperations,
                                 SpelExpressionParser expressionParser,
                                 QueryMethodEvaluationContextProvider evaluationContextProvider) {
        super((ReactiveMongoQueryMethod) reactivePartTreeMongoQuery.getQueryMethod(),
                mongoOperations, expressionParser, evaluationContextProvider);
        this.reactivePartTreeQuery = reactivePartTreeMongoQuery;
        this.method = method;
    }

    @Override
    protected Query createQuery(ConvertingParameterAccessor accessor) {
        Query query = super.createQuery(accessor);
        return withNotDeleted(query);
    }

    @Override
    protected Query createCountQuery(ConvertingParameterAccessor accessor) {
        Query query = super.createCountQuery(accessor);
        return withNotDeleted(query);
    }

    private Query withNotDeleted(Query query) {
        return query.addCriteria(notDeleted());
    }

    private Criteria notDeleted() {
        return new Criteria().orOperator(
                where("deleted").exists(false),
                where("deleted").is(false)
        );
    }
}
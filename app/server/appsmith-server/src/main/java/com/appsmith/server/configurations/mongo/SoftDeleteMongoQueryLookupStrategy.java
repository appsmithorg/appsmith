package com.appsmith.server.configurations.mongo;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.repository.query.ReactivePartTreeMongoQuery;
import org.springframework.data.projection.ProjectionFactory;
import org.springframework.data.repository.core.NamedQueries;
import org.springframework.data.repository.core.RepositoryMetadata;
import org.springframework.data.repository.query.QueryLookupStrategy;
import org.springframework.data.repository.query.ReactiveQueryMethodEvaluationContextProvider;
import org.springframework.data.repository.query.RepositoryQuery;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;

import java.lang.reflect.Method;

/**
 * This class overrides the default implementation in
 * {@link org.springframework.data.mongodb.repository.support.ReactiveMongoRepositoryFactory#getQueryLookupStrategy}
 * This custom implementation adds the query parameter to filter out any records marked with delete=true in the database
 * <p>
 * Also refer to the custom Factory: {@link SoftDeleteMongoRepositoryFactory} and
 * custom FactoryBean: {@link SoftDeleteMongoRepositoryFactoryBean}. The annotation @EnableReactiveMongoRepositories in
 * {@link com.appsmith.server.configurations.CommonConfig} sets the Mongo factory bean to our custom bean instead of the default one
 */
@Slf4j
public class SoftDeleteMongoQueryLookupStrategy implements QueryLookupStrategy {
    private final QueryLookupStrategy strategy;
    private final ReactiveMongoOperations mongoOperations;
    private static final SpelExpressionParser EXPRESSION_PARSER = new SpelExpressionParser();
    ReactiveQueryMethodEvaluationContextProvider evaluationContextProvider = ReactiveQueryMethodEvaluationContextProvider.DEFAULT.DEFAULT;
    private ExpressionParser expressionParser = new SpelExpressionParser();

    public SoftDeleteMongoQueryLookupStrategy(QueryLookupStrategy strategy,
                                              ReactiveMongoOperations mongoOperations) {
        this.strategy = strategy;
        this.mongoOperations = mongoOperations;
    }

    @Override
    public RepositoryQuery resolveQuery(Method method, RepositoryMetadata metadata, ProjectionFactory factory,
                                        NamedQueries namedQueries) {
        RepositoryQuery repositoryQuery = strategy.resolveQuery(method, metadata, factory, namedQueries);

        // revert to the standard behavior if requested
        if (method.getAnnotation(CanSeeSoftDeletedRecords.class) != null) {
            return repositoryQuery;
        }

        if (!(repositoryQuery instanceof ReactivePartTreeMongoQuery)) {
            return repositoryQuery;
        }
        ReactivePartTreeMongoQuery partTreeQuery = (ReactivePartTreeMongoQuery) repositoryQuery;

        return new SoftDeletePartTreeMongoQuery(method, partTreeQuery, this.mongoOperations, EXPRESSION_PARSER, evaluationContextProvider);
    }

}

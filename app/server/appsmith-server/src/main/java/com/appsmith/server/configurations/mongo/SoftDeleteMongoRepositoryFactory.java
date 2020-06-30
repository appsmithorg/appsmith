package com.appsmith.server.configurations.mongo;

import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.repository.support.ReactiveMongoRepositoryFactory;
import org.springframework.data.repository.query.QueryLookupStrategy;
import org.springframework.data.repository.query.QueryMethodEvaluationContextProvider;

import java.util.Optional;

/**
 * This custom factory returns our custom QueryLookupStrategy so that we can filter out deleted records
 */
public class SoftDeleteMongoRepositoryFactory extends ReactiveMongoRepositoryFactory {
    private final ReactiveMongoOperations mongoOperations;

    public SoftDeleteMongoRepositoryFactory(ReactiveMongoOperations mongoOperations) {
        super(mongoOperations);
        this.mongoOperations = mongoOperations;
    }

    @Override
    protected Optional<QueryLookupStrategy> getQueryLookupStrategy(QueryLookupStrategy.Key key,
                                                                   QueryMethodEvaluationContextProvider evaluationContextProvider) {
        Optional<QueryLookupStrategy> optStrategy = super.getQueryLookupStrategy(key,
                evaluationContextProvider);
        return optStrategy.map(this::createSoftDeleteQueryLookupStrategy);
    }

    private SoftDeleteMongoQueryLookupStrategy createSoftDeleteQueryLookupStrategy(QueryLookupStrategy strategy) {
        return new SoftDeleteMongoQueryLookupStrategy(strategy, mongoOperations);
    }
}
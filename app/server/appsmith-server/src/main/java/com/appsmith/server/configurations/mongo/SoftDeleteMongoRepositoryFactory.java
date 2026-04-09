package com.appsmith.server.configurations.mongo;

import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.repository.support.ReactiveMongoRepositoryFactory;
import org.springframework.data.repository.query.QueryLookupStrategy;
import org.springframework.data.repository.query.ValueExpressionDelegate;

import java.util.Optional;

/**
 * This custom factory returns our custom QueryLookupStrategy so that we can filter out deleted records.
 *
 * <p>Note: Spring Data MongoDB 4.5+ changed the {@code getQueryLookupStrategy} signature from
 * {@code (Key, QueryMethodEvaluationContextProvider)} to {@code (Key, ValueExpressionDelegate)}.
 * {@link ReactiveMongoRepositoryFactory} overrides the new method directly, so we must override
 * the same new-signature method here for our soft-delete interception to take effect.
 */
public class SoftDeleteMongoRepositoryFactory extends ReactiveMongoRepositoryFactory {
    private final ReactiveMongoOperations mongoOperations;

    public SoftDeleteMongoRepositoryFactory(ReactiveMongoOperations mongoOperations) {
        super(mongoOperations);
        this.mongoOperations = mongoOperations;
    }

    @Override
    protected Optional<QueryLookupStrategy> getQueryLookupStrategy(
            QueryLookupStrategy.Key key, ValueExpressionDelegate valueExpressionDelegate) {
        Optional<QueryLookupStrategy> optStrategy = super.getQueryLookupStrategy(key, valueExpressionDelegate);
        return optStrategy.map(
                strategy -> new SoftDeleteMongoQueryLookupStrategy(strategy, mongoOperations, valueExpressionDelegate));
    }
}
